import {
  type CbOperation,
  operationRef,
} from "../../../contribution_builder/mod.ts";
import { diffRange } from "./cb-narrative-collab.ts";
import type { Field, FieldBinding } from "./contribution-demo.ts";
import {
  isCollabText,
  LONG_TEXT_FIELDS,
  type CollabTextField,
  type LongTextField,
} from "./contribution-demo.ts";
import { userInitials } from "./cb-presence.ts";
import { userAccentColor } from "./cb-user-colors.ts";
import { resolveHighlightRange } from "./cb-narrative-layout.ts";

export interface HistoricalTextHighlight {
  id: string;
  userId: string;
  displayName: string;
  start: number;
  end: number;
  snippet: string;
  accent: string;
  initials: string;
  opacity: number;
}

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

/** Highlights for long text at a scrubbed step (diff vs previous step text). */
export function historicalTextHighlights(
  field: CollabTextField,
  before: string,
  after: string,
  op: CbOperation | undefined,
): HistoricalTextHighlight[] {
  if (!op || before === after) return [];
  const { start, end } = diffRange(before, after);
  const snippet = after.slice(start, end);
  if (!snippet) return [];
  const range = resolveHighlightRange(after, start, snippet, end);
  if (!range) return [];
  const peerId = op.author.id || op.replica;
  return [{
    id: `hist:${field}:${start}:${end}`,
    userId: peerId,
    displayName: op.author.name,
    start: range.start,
    end: range.end,
    snippet,
    accent: userAccentColor(op.author.name),
    initials: userInitials(op.author.name),
    opacity: 0.55,
  }];
}

export function isLongTextField(field: Field): field is LongTextField {
  return (LONG_TEXT_FIELDS as readonly string[]).includes(field);
}

export function isCollabTextField(field: Field): field is CollabTextField {
  return isCollabText(field);
}

/** Op that appeared between two materialised steps for this long-text field. */
export function opNewAtStep(
  opsAtStep: readonly CbOperation[],
  opsAtPrev: readonly CbOperation[],
  fields: Record<Field, FieldBinding>,
  field: CollabTextField,
): CbOperation | undefined {
  const prev = new Set(opsAtPrev.map(operationRef));
  let hit: CbOperation | undefined;
  for (const op of opsAtStep) {
    if (prev.has(operationRef(op))) continue;
    if (fieldForOperation(op, fields) !== field) continue;
    hit = op;
  }
  return hit ?? lastOpForField(opsAtStep, fields, field);
}

/** Last materialised op that touched `field` (operation order in the log). */
export function lastOpForField(
  operations: readonly CbOperation[],
  fields: Record<Field, FieldBinding>,
  field: CollabTextField,
  preferReplica?: string,
): CbOperation | undefined {
  let last: CbOperation | undefined;
  let lastPreferred: CbOperation | undefined;
  for (const op of operations) {
    if (fieldForOperation(op, fields) !== field) continue;
    last = op;
    if (preferReplica && op.replica === preferReplica) lastPreferred = op;
  }
  return lastPreferred ?? last;
}
