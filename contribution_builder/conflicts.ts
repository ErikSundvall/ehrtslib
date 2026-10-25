/**
 * Conflict data for update-version (ADR 0009, #167).
 *
 * The contribution endpoint has no `If-Match` and no defined status for a
 * stale `preceding_version_uid` (servers answer 400, 409, 412 or 422), so the
 * check does not depend on the status code: after any failed commit the
 * caller re-reads the latest version of each versioned object, and when it no
 * longer is the draft's base version, {@link detectConflicts} replays the
 * draft's operations against it.
 *
 * Each operation's target is matched in the latest version by uid, else by
 * archetype path and position among siblings with that path (`path`, a guess
 * the caller should show for review), else not at all (`none`). An operation
 * conflicts when the latest version changed what it touches since the base;
 * the others are listed as clean. Resolving and retrying is up to the caller.
 */

import { upConvertFromAdl14, usesAdl14Codes } from "./adl14_downconvert.ts";
import type { ContributionBuild } from "./contribution_build.ts";
import { canonicalizeJson } from "./jcs.ts";
import { type CbOperation, type RmJson, ROOT_TARGET } from "./operation_log.ts";

export type ConflictMatch = "uid" | "path" | "none";

export type ConflictReason =
  /** They changed the value or subtree this operation touches. */
  | "changed-by-them"
  /** The target node is not in the latest version. */
  | "target-removed"
  /** add-instance: the parent (or the sibling anchor) is gone. */
  | "parent-removed";

export interface DraftConflict {
  operation: CbOperation;
  /** Short key (or uid) the operation targets; `root` for the COMPOSITION. */
  target: string;
  match: ConflictMatch;
  reason: ConflictReason;
  /** set-value: attribute path below the node. */
  path?: string;
  /** Value in the draft's base version. */
  base: RmJson | undefined;
  /** Value in the latest version. */
  theirs: RmJson | undefined;
  /** Value the operation sets (set-value, set-composer, add-instance). */
  ours?: RmJson;
}

export interface ConflictReport {
  draftId: string;
  baseVersionUid: string;
  latestVersionUid: string;
  /** Latest version, ADL2 codes, as compared. */
  latest: RmJson;
  conflicts: DraftConflict[];
  /** Operations that apply to the latest version unchanged. */
  clean: Array<{ operation: CbOperation; match: ConflictMatch }>;
  /** HTTP status of the failed commit, if any. A hint only. */
  statusHint?: number;
}

type Obj = Record<string, RmJson>;
const isObj = (v: unknown): v is Obj =>
  !!v && typeof v === "object" && !Array.isArray(v);

/**
 * Compare a modify draft with the latest stored version of its versioned
 * object. Returns `undefined` when the latest version is still the draft's
 * base (no concurrent change).
 */
export function detectConflicts(
  build: ContributionBuild,
  draftId: string,
  latestStored: unknown,
  options: { codes?: "adl14" | "adl2"; statusHint?: number } = {},
): ConflictReport | undefined {
  const info = build.getDraft(draftId);
  if (info.kind !== "modify" || !info.baseVersionUid) {
    throw new Error(`Draft ${draftId} is not an update-version draft`);
  }
  let latest = JSON.parse(JSON.stringify(latestStored)) as Obj;
  const latestVersionUid = isObj(latest.uid) ? String(latest.uid.value) : "";
  if (latestVersionUid === info.baseVersionUid) return undefined;
  const codes = options.codes ?? (usesAdl14Codes(latest) ? "adl14" : "adl2");
  if (codes === "adl14") latest = upConvertFromAdl14(latest) as Obj;
  delete latest.uid;
  delete latest.feeder_audit;

  const base = build.baseData(draftId) as Obj;
  const baseIndex = indexTree(base);
  const theirIndex = indexTree(latest);
  const ownKeys = new Set<string>(); // nodes this draft added
  const conflicts: DraftConflict[] = [];
  const clean: ConflictReport["clean"] = [];

  const match = (
    target: string,
  ): { node?: Obj; base?: Obj; match: ConflictMatch } => {
    if (target === ROOT_TARGET) return { node: latest, base, match: "uid" };
    const b = baseIndex.byKey.get(target);
    if (!b) return { match: "none" };
    const uid = uidOf(b.node);
    const byUid = uid ? theirIndex.byUid.get(uid) : undefined;
    if (byUid) return { node: byUid.node, base: b.node, match: "uid" };
    const candidates = theirIndex.byPath.get(b.path) ?? [];
    const guess = candidates[b.ordinal];
    return guess
      ? { node: guess.node, base: b.node, match: "path" }
      : { base: b.node, match: "none" };
  };

  const ops = build.exportLog().operations.filter((op) =>
    op.draft === draftId && op.type !== "open-version" &&
    op.type !== "record-commit"
  );
  for (const op of ops) {
    if (op.type === "add-instance") {
      for (const k of op.keys) ownKeys.add(k);
      const p = ownKeys.has(op.parent)
        ? { match: "uid" as const, node: {} }
        : match(op.parent);
      const anchor = op.before ?? op.after;
      const a = anchor && !ownKeys.has(anchor) ? match(anchor) : undefined;
      if (!p.node || (a && !a.node)) {
        conflicts.push({
          operation: op,
          target: op.parent,
          match: p.match,
          reason: "parent-removed",
          base: p.base ?? null,
          theirs: undefined,
          ours: op.instance,
        });
      } else clean.push({ operation: op, match: p.match });
      continue;
    }
    if (op.type === "set-composer") {
      const b = base.composer;
      const t = latest.composer;
      if (same(b, t)) clean.push({ operation: op, match: "uid" });
      else {
        conflicts.push({
          operation: op,
          target: ROOT_TARGET,
          match: "uid",
          reason: "changed-by-them",
          base: b,
          theirs: t,
          ours: op.composer,
        });
      }
      continue;
    }
    if (op.type === "set-value" || op.type === "remove-instance") {
      if (ownKeys.has(op.target)) {
        clean.push({ operation: op, match: "uid" });
        continue;
      }
      const m = match(op.target);
      if (op.type === "remove-instance") {
        if (!m.node || same(m.base, m.node)) {
          clean.push({ operation: op, match: m.match });
        } else {
          conflicts.push({
            operation: op,
            target: op.target,
            match: m.match,
            reason: "changed-by-them",
            base: m.base,
            theirs: m.node,
          });
        }
        continue;
      }
      if (!m.node) {
        conflicts.push({
          operation: op,
          target: op.target,
          match: m.match,
          reason: "target-removed",
          path: op.path,
          base: m.base ? at(m.base, op.path) : undefined,
          theirs: undefined,
          ours: op.value,
        });
        continue;
      }
      const b = m.base ? at(m.base, op.path) : undefined;
      const t = at(m.node, op.path);
      if (same(b, t)) clean.push({ operation: op, match: m.match });
      else {
        conflicts.push({
          operation: op,
          target: op.target,
          match: m.match,
          reason: "changed-by-them",
          path: op.path,
          base: b,
          theirs: t,
          ours: op.value,
        });
      }
      continue;
    }
    clean.push({ operation: op, match: "none" });
  }

  const report: ConflictReport = {
    draftId,
    baseVersionUid: info.baseVersionUid,
    latestVersionUid,
    latest,
    conflicts,
    clean,
  };
  if (options.statusHint !== undefined) report.statusHint = options.statusHint;
  return report;
}

interface Indexed {
  node: Obj;
  /** Archetype path: attribute names and node ids from the root. */
  path: string;
  /** Position among nodes with the same path. */
  ordinal: number;
}

function indexTree(root: Obj) {
  const byUid = new Map<string, Indexed>();
  const byKey = new Map<string, Indexed>();
  const byPath = new Map<string, Indexed[]>();
  const walk = (v: RmJson, path: string) => {
    if (Array.isArray(v)) return v.forEach((x) => walk(x, path));
    if (!isObj(v)) return;
    let here = path;
    if (v !== root && typeof v.archetype_node_id === "string") {
      here = `${path}[${v.archetype_node_id}]`;
      const list = byPath.get(here) ?? [];
      const entry = { node: v, path: here, ordinal: list.length };
      list.push(entry);
      byPath.set(here, list);
      const uid = uidOf(v);
      if (uid) {
        byUid.set(uid, entry);
        const i = uid.indexOf("::");
        byKey.set(i < 0 ? uid : uid.slice(i + 2), entry);
        byKey.set(uid, entry);
      }
    }
    for (const [k, x] of Object.entries(v)) {
      if (k === "uid" || k === "archetype_details" || k === "feeder_audit") {
        continue;
      }
      walk(x, `${here}/${k}`);
    }
  };
  walk(root, "");
  return { byUid, byKey, byPath };
}

function uidOf(n: Obj): string | undefined {
  return isObj(n.uid) && typeof n.uid.value === "string"
    ? n.uid.value
    : undefined;
}

function at(node: Obj, path: string): RmJson | undefined {
  let cur: RmJson | undefined = node;
  for (const seg of path.split("/").filter(Boolean)) {
    if (Array.isArray(cur)) {
      cur = /^\d+$/.test(seg) ? cur[Number(seg)] : undefined;
    } else cur = isObj(cur) ? cur[seg] : undefined;
    if (cur === undefined) return undefined;
  }
  return cur;
}

/** Equal as data. Ignores what a commit adds or a server drops on its own. */
function same(a: RmJson | undefined, b: RmJson | undefined): boolean {
  return canonicalizeJson(normalise(a)) === canonicalizeJson(normalise(b));
}

function normalise(v: RmJson | undefined): RmJson {
  if (v === undefined) return null;
  if (Array.isArray(v)) return v.map(normalise);
  if (!isObj(v)) return v;
  const out: Obj = {};
  for (const [k, x] of Object.entries(v)) {
    if (k === "archetype_details" || k === "feeder_audit") continue;
    if (k === "offset" && /_EVENT$/.test(String(v._type))) continue;
    out[k] = normalise(x);
  }
  return out;
}
