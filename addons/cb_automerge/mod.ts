/**
 * Automerge 3 multi-caller adapter (ADR 0013, #170).
 *
 * Optional add-on: not exported from `contribution_builder/mod.ts` or `mod.ts`.
 * The audit log stays `ehrtslib-cb-oplog` v1. Automerge binary is transport.
 *
 * Text sync level 1: `set-value` / `edit-text` require `rev`.
 * Native profile `automerge-3`: a free-text leaf can be an Automerge text
 * object. Concurrent splices merge in that object. Call
 * {@link recordNativeText} to write the merged string back as `set-value`,
 * so the operation log and the RM still agree.
 * Level 2 has the `edit-text` operation; transforming concurrent splices
 * (central-server OT) is not done here. Presence is not in this adapter.
 */

import * as Automerge from "@automerge/automerge";
import {
  type BuildContext,
  type CbOperation,
  type ConcurrentSkip,
  ContributionBuild,
  type OperationLogAdapter,
  operationRef,
  sortOperations,
} from "../../contribution_builder/mod.ts";

const NATIVE_PROFILE = "automerge-3";

export interface TextSyncAnnouncement {
  /** 1 whole value, 2 neutral splices, 3 native profile. */
  levels: Array<1 | 2 | 3>;
  profiles: string[];
  requireRev: boolean;
}

export const AUTOMERGE_ANNOUNCEMENT: TextSyncAnnouncement = {
  levels: [1, 2, 3],
  profiles: [NATIVE_PROFILE],
  requireRev: true,
};

interface AmLog {
  byId: { [id: string]: CbOperation };
  order: string[];
  /**
   * `draft\\ntarget\\npath` → collaborative text. A string assigned inside
   * `Automerge.change` is a text object (Automerge 3); `ImmutableString`
   * would not merge splices.
   */
  text: { [field: string]: string };
}

export function textFieldKey(
  draft: string,
  target: string,
  path: string,
): string {
  // Automerge treats `/` in a path component as a separator.
  return `${draft}~${target}~${path.replaceAll("/", ".")}`;
}

/** One replica's operation log, stored in an Automerge document. */
export class AutomergeOperationLogAdapter implements OperationLogAdapter {
  readonly requireRev = true;
  private doc: Automerge.Doc<AmLog>;

  constructor(doc?: Automerge.Doc<AmLog>) {
    this.doc = doc ?? Automerge.from<AmLog>({ byId: {}, order: [], text: {} });
  }

  static load(bytes: Uint8Array): AutomergeOperationLogAdapter {
    return new AutomergeOperationLogAdapter(
      Automerge.load<AmLog>(bytes),
    );
  }

  save(): Uint8Array {
    return Automerge.save(this.doc);
  }

  append(op: CbOperation): void {
    const id = operationRef(op);
    this.doc = Automerge.change(this.doc, (d) => {
      d.byId[id] = op;
      if (!d.order.includes(id)) d.order.push(id);
      if (op.type === "edit-text") {
        const key = textFieldKey(op.draft, op.target, op.path);
        if (typeof d.text[key] === "string") {
          spliceText(d, key, op.at, op.delete, op.insert);
        }
      }
    });
  }

  operations(): CbOperation[] {
    const values = Object.values(this.doc.byId).map((op) =>
      JSON.parse(JSON.stringify(op)) as CbOperation
    );
    return sortOperations(values);
  }

  replaceAll(ops: readonly CbOperation[]): void {
    let doc = Automerge.from<AmLog>({ byId: {}, order: [], text: {} });
    doc = Automerge.change(doc, (d) => {
      for (const op of ops) {
        const id = operationRef(op);
        d.byId[id] = op;
        d.order.push(id);
      }
    });
    // Keep native text; compaction does not change the live string.
    const previous = { ...this.doc.text };
    this.doc = Automerge.change(doc, (d) => {
      for (const [key, text] of Object.entries(previous)) {
        d.text[key] = String(text);
      }
    });
  }

  merge(other: AutomergeOperationLogAdapter): void {
    // Clone first: merging a document with itself aliases the WASM object.
    this.doc = Automerge.merge(
      Automerge.clone(this.doc),
      Automerge.clone(other.doc),
    );
  }

  /** Start a native text object at the current string (profile `automerge-3`). */
  seedText(draft: string, target: string, path: string, value: string): void {
    const key = textFieldKey(draft, target, path);
    this.doc = Automerge.change(this.doc, (d) => {
      d.text[key] = value;
    });
  }

  /** Merged native text, if this field was seeded. */
  nativeText(draft: string, target: string, path: string): string | undefined {
    const text = this.doc.text[textFieldKey(draft, target, path)];
    return text === undefined ? undefined : String(text);
  }
}

export interface MultiCaller {
  build: ContributionBuild;
  adapter: AutomergeOperationLogAdapter;
  announcement: TextSyncAnnouncement;
}

/** A build whose log is the Automerge adapter. `rev` is required. */
export function createMultiCaller(
  context: BuildContext,
  options: { buildId?: string; bytes?: Uint8Array } = {},
): MultiCaller {
  const adapter = options.bytes
    ? AutomergeOperationLogAdapter.load(options.bytes)
    : new AutomergeOperationLogAdapter();
  const build = ContributionBuild.create(context, adapter, {
    buildId: options.buildId,
    lenient: Boolean(options.bytes),
  });
  build.setRequireTextRev(true);
  return { build, adapter, announcement: AUTOMERGE_ANNOUNCEMENT };
}

/**
 * Merge `remote` into `local` and replay with the concurrent apply policy.
 * Returns the operations that were skipped.
 */
export function mergeCaller(
  local: MultiCaller,
  remote: AutomergeOperationLogAdapter,
): readonly ConcurrentSkip[] {
  local.adapter.merge(remote);
  return local.build.replayConcurrent();
}

/**
 * If native text for this field differs from the draft, append a `set-value`
 * of the merged string so the log and the RM match.
 */
export function recordNativeText(
  caller: MultiCaller,
  draftId: string,
  target: string,
  path: string,
): boolean {
  const merged = caller.adapter.nativeText(draftId, target, path);
  if (merged === undefined) return false;
  const current = readString(
    caller.build.toCanonicalJson(draftId),
    target,
    path,
  );
  if (current === merged) return false;
  caller.build.setValue(draftId, target, path, merged, {
    rev: caller.build.logRev(),
  });
  return true;
}

function spliceText(
  doc: Automerge.Doc<AmLog>,
  key: string,
  at: number,
  del: number,
  insert: string,
): void {
  const current = String(doc.text[key] ?? "");
  const start = utf16Index(current, at);
  const end = utf16Index(current, at + del);
  Automerge.splice(doc, ["text", key], start, end - start, insert);
}

function utf16Index(value: string, codePoints: number): number {
  let i = 0;
  let cp = 0;
  while (cp < codePoints && i < value.length) {
    const c = value.codePointAt(i)!;
    i += c > 0xffff ? 2 : 1;
    cp += 1;
  }
  return i;
}

function readString(
  root: unknown,
  target: string,
  path: string,
): string | undefined {
  const node = target === "root" ? root : findNode(root, target);
  if (!node || typeof node !== "object") return undefined;
  let cur: unknown = node;
  for (const seg of path.split("/")) {
    if (!seg) continue;
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return typeof cur === "string" ? cur : undefined;
}

function findNode(
  tree: unknown,
  key: string,
): Record<string, unknown> | undefined {
  if (!tree || typeof tree !== "object") return undefined;
  if (Array.isArray(tree)) {
    for (const item of tree) {
      const found = findNode(item, key);
      if (found) return found;
    }
    return undefined;
  }
  const rec = tree as Record<string, unknown>;
  const uid = (rec.uid as { value?: string } | undefined)?.value;
  if (uid === key || (uid && uid.endsWith(`::${key}`))) return rec;
  for (const value of Object.values(rec)) {
    const found = findNode(value, key);
    if (found) return found;
  }
  return undefined;
}
