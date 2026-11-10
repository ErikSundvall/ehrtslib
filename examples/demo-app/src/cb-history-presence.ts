/** Derive field badges from operations visible at a history step (demo only). */
import type { CbOperation } from "../../../contribution_builder/mod.ts";
import {
  type Field,
  type FieldBinding,
} from "./contribution-demo.ts";
import {
  formatAbsolute,
  type FieldBadgeView,
  type PresenceBadge,
  userAccentColor,
  userInitials,
} from "./cb-presence.ts";

function fieldForOperation(
  op: CbOperation,
  fields: Record<Field, FieldBinding>,
): Field | undefined {
  if (op.type !== "set-value" && op.type !== "edit-text") return undefined;
  for (const [field, binding] of Object.entries(fields) as [Field, FieldBinding][]) {
    if (op.target === binding.target && op.path === binding.path) return field;
  }
  return undefined;
}

function opAtOrBeforeStep(
  operations: readonly CbOperation[],
  step: number,
  maxStep: number,
): readonly CbOperation[] {
  if (!operations.length || step >= maxStep) return operations;
  const idx = maxStep <= 0
    ? 0
    : Math.min(
      operations.length,
      Math.round((step / maxStep) * operations.length),
    );
  return operations.slice(0, Math.max(1, idx));
}

/** Last author per field among operations materialised at `step`. */
export function historicalBadgesForField(
  operations: readonly CbOperation[],
  fields: Record<Field, FieldBinding>,
  field: Field,
  step: number,
  maxStep: number,
  atMs: number,
): FieldBadgeView {
  const visible = opAtOrBeforeStep(operations, step, maxStep);
  let latest: { op: CbOperation; atMs: number } | undefined;
  for (const op of visible) {
    const mapped = fieldForOperation(op, fields);
    if (mapped !== field) continue;
    const stamp = Date.parse(op.timestamp);
    const when = Number.isFinite(stamp) ? stamp : atMs;
    if (!latest || when >= latest.atMs) latest = { op, atMs: when };
  }
  if (!latest) return { badges: [], overflow: 0 };
  const badge: PresenceBadge = {
    userId: latest.op.replica,
    displayName: latest.op.author.name,
    initials: userInitials(latest.op.author.name),
    accent: userAccentColor(latest.op.replica),
    kind: "recent-edit",
    activityAtMs: latest.atMs,
    opacity: 1,
    heavilyFaded: false,
    relative: "at this point",
    absolute: formatAbsolute(latest.atMs),
    changeSummary: latest.op.type === "set-value"
      ? String(latest.op.value)
      : latest.op.type === "edit-text"
      ? `+${latest.op.insert}`
      : undefined,
  };
  return { badges: [badge], overflow: 0 };
}
