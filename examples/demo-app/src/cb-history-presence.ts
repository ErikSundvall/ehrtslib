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

/**
 * Badges for one field at a materialised history step. `operations` must come
 * from {@link materializeAtStep} (not the live log). Shows the latest edit by
 * another replica (same rule as live presence: never the viewing clone).
 */
export function historicalBadgesForField(
  operations: readonly CbOperation[],
  fields: Record<Field, FieldBinding>,
  field: Field,
  viewerReplicaId: string,
  atMs: number,
): FieldBadgeView {
  let latest: { op: CbOperation; atMs: number } | undefined;
  for (const op of operations) {
    if (fieldForOperation(op, fields) !== field) continue;
    if (op.replica === viewerReplicaId) continue;
    const stamp = Date.parse(op.timestamp);
    const when = Number.isFinite(stamp) ? stamp : atMs;
    if (!latest || when >= latest.atMs) latest = { op, atMs: when };
  }
  if (!latest) return { badges: [], overflow: 0 };
  const peerId = latest.op.author.id || latest.op.replica;
  const badge: PresenceBadge = {
    userId: peerId,
    displayName: latest.op.author.name,
    initials: userInitials(latest.op.author.name),
    accent: userAccentColor(peerId),
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
