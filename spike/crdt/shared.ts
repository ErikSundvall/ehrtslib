/**
 * Shared helpers for the #170 CRDT spike. Not part of the published library.
 */
import {
  bindTemplate,
  type BoundTemplate,
  type BuildContext,
  ContributionBuild,
  type CbOperation,
} from "../../contribution_builder/mod.ts";
import {
  OPERATION_LOG_FORMAT,
  OPERATION_LOG_FORMAT_VERSION,
  type OperationLogDocument,
  type RmJson,
} from "../../contribution_builder/operation_log.ts";

const OPT14 = new URL("../../test_data/opt14/", import.meta.url);
const BP = "ehrbase_blood_pressure_simple.de.v0.opt";

let templateCache: BoundTemplate | undefined;
export async function bpTemplate(): Promise<BoundTemplate> {
  templateCache ??= await bindTemplate(
    await Deno.readTextFile(new URL(BP, OPT14)),
  );
  return templateCache;
}

/** Stable id for merge maps and total-order tie-breaks. */
export function opId(op: CbOperation): string {
  return `${op.replica}:${op.seq}`;
}

/**
 * Total order for replay after CRDT merge: timestamp, then replica, then seq.
 * (Same replica never reuses seq; cross-replica ties use replica lexicographic order.)
 */
export function compareOps(a: CbOperation, b: CbOperation): number {
  const ta = a.timestamp.localeCompare(b.timestamp);
  if (ta !== 0) return ta;
  const ra = a.replica.localeCompare(b.replica);
  if (ra !== 0) return ra;
  return a.seq - b.seq;
}

export function sortOps(ops: readonly CbOperation[]): CbOperation[] {
  return [...ops].sort(compareOps);
}

/** Drop duplicate `replica:seq` ids (CRDT list merge may repeat an id). */
export function dedupeOps(ops: readonly CbOperation[]): CbOperation[] {
  const seen = new Set<string>();
  const out: CbOperation[] = [];
  for (const op of ops) {
    const id = opId(op);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(op);
  }
  return out;
}

export interface ApplyOutcome {
  /** Operations that applied cleanly. */
  applied: CbOperation[];
  /**
   * Operations skipped during multi-user replay (proposed CRDT apply policy).
   * Structured like ADR 0009 conflicts but for concurrent apply, not CDR rebase.
   */
  skipped: Array<{
    operation: CbOperation;
    reason:
      | "target-removed"
      | "parent-removed"
      | "changed-by-peer"
      | "anchor-missing-appended"
      | "already-committed"
      | "apply-error";
    message: string;
  }>;
}

function logDoc(
  buildId: string,
  operations: CbOperation[],
): OperationLogDocument {
  return {
    format: OPERATION_LOG_FORMAT,
    formatVersion: OPERATION_LOG_FORMAT_VERSION,
    buildId,
    operations,
  };
}

/**
 * Proposed multi-user apply: never abort the whole replay; record skips.
 * Anchor-missing add-instance: retry without anchor (append at end of list).
 */
export function replayWithPolicy(
  buildId: string,
  ops: readonly CbOperation[],
  ctx: BuildContext,
): ApplyOutcome {
  const applied: CbOperation[] = [];
  const skipped: ApplyOutcome["skipped"] = [];
  const sorted = sortOps(dedupeOps(ops));
  let acc: CbOperation[] = [];

  for (const op of sorted) {
    try {
      ContributionBuild.fromLog(logDoc(buildId, [...acc, op]), ctx);
      acc = [...acc, op];
      applied.push(op);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (op.type === "add-instance" && message.includes("Anchor")) {
        const relaxed = {
          ...op,
          before: undefined,
          after: undefined,
        } as CbOperation;
        try {
          ContributionBuild.fromLog(logDoc(buildId, [...acc, relaxed]), ctx);
          acc = [...acc, relaxed];
          applied.push(relaxed);
          skipped.push({
            operation: op,
            reason: "anchor-missing-appended",
            message,
          });
          continue;
        } catch (err2) {
          const msg2 = err2 instanceof Error ? err2.message : String(err2);
          skipped.push({
            operation: op,
            reason: "parent-removed",
            message: msg2,
          });
          continue;
        }
      }
      let reason: ApplyOutcome["skipped"][0]["reason"] = "apply-error";
      if (message.includes("No node") || message.includes("not found")) {
        reason = "target-removed";
      } else if (message.includes("committed")) {
        reason = "already-committed";
      } else if (op.type === "set-value") {
        reason = "changed-by-peer";
      }
      skipped.push({ operation: op, reason, message });
    }
  }
  return { applied, skipped };
}

/** Minimal context for deterministic spike runs. */
export function spikeCtx(
  author = "spike-user",
  replica = "a",
): BuildContext {
  let seq = 0;
  return {
    author: { id: author, name: author },
    replica,
    now: () =>
      new Date(Date.UTC(2026, 9, 27, 12, 0, seq++)).toISOString(),
    uuid: () => `spike-uuid-${replica}-${seq}`,
  };
}

/** Spike-only stand-in for future `move-instance` (#171). */
export interface MoveInstanceSpikeOp {
  type: "move-instance";
  replica: string;
  seq: number;
  author: { id: string };
  timestamp: string;
  draft: string;
  target: string;
  parent: string;
  attribute: string;
  before?: string;
  after?: string;
}

export function describeMoveVsEdit(): string {
  return [
    "move-instance (not in core yet): concurrent move vs set-value on the same node",
    "→ replay order decides whether the value change applies to the node before it moves,",
    "  or is skipped when remove+reparent already detached the target (policy: skip + conflict).",
  ].join(" ");
}

/** Export a small RM fragment for add-instance demos. */
export function minimalQuantityValue(): RmJson {
  return {
    _type: "DV_QUANTITY",
    magnitude: 120,
    units: "mm[Hg]",
  };
}
