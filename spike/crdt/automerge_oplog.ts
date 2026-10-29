/**
 * Automerge prototype: operation log as id map + ordered id list (#170).
 */
import * as Automerge from "npm:@automerge/automerge@3.0.0";
import type { CbOperation } from "../../contribution_builder/operation_log.ts";
import { dedupeOps, opId } from "./shared.ts";

export interface AutomergeOpLog {
  /** `${replica}:${seq}` → operation payload */
  byId: Record<string, CbOperation>;
  /** Merge order for concurrent appends (Automerge list of ids). */
  order: string[];
}

export function emptyAutomergeLog(): AutomergeOpLog {
  return { byId: {}, order: [] };
}

export function initAutomergeDoc(): Automerge.Doc<AutomergeOpLog> {
  return Automerge.from(emptyAutomergeLog());
}

export function appendOp(
  doc: Automerge.Doc<AutomergeOpLog>,
  op: CbOperation,
): Automerge.Doc<AutomergeOpLog> {
  const id = opId(op);
  return Automerge.change(doc, (d) => {
    d.byId[id] = op;
    if (!d.order.includes(id)) {
      Automerge.splice(d, ["order"], d.order.length, 0, [id]);
    }
  });
}

/** Merge two replicas' docs (binary sync round-trip). */
export function mergeDocs(
  a: Automerge.Doc<AutomergeOpLog>,
  b: Automerge.Doc<AutomergeOpLog>,
): Automerge.Doc<AutomergeOpLog> {
  const merged = Automerge.merge(a, b);
  return merged;
}

export function opsFromDoc(doc: Automerge.Doc<AutomergeOpLog>): CbOperation[] {
  const ids = doc.order ?? [];
  const seen = new Set<string>();
  const out: CbOperation[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const op = doc.byId[id];
    if (op) {
      seen.add(id);
      out.push(op);
    }
  }
  for (const id of Object.keys(doc.byId)) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(doc.byId[id]!);
  }
  return dedupeOps(out);
}

export function saveBytes(doc: Automerge.Doc<AutomergeOpLog>): Uint8Array {
  return Automerge.save(doc);
}

export function loadBytes(bytes: Uint8Array): Automerge.Doc<AutomergeOpLog> {
  return Automerge.load<AutomergeOpLog>(bytes);
}
