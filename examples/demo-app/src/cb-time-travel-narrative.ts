import type { CbOperation } from "../../../contribution_builder/mod.ts";
import { diffRange } from "./cb-narrative-collab.ts";
import type { Field, FieldBinding } from "./contribution-demo.ts";
import { LONG_TEXT_FIELDS, type LongTextField } from "./contribution-demo.ts";
import { userAccentColor, userInitials } from "./cb-presence.ts";
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
  field: LongTextField,
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
  return [{
    id: `hist:${field}:${start}:${end}`,
    userId: op.replica,
    displayName: op.author.name,
    start: range.start,
    end: range.end,
    snippet,
    accent: userAccentColor(op.replica),
    initials: userInitials(op.author.name),
    opacity: 0.55,
  }];
}

export function isLongTextField(field: Field): field is LongTextField {
  return (LONG_TEXT_FIELDS as readonly string[]).includes(field);
}

export function lastOpForField(
  operations: readonly CbOperation[],
  fields: Record<Field, FieldBinding>,
  field: LongTextField,
  step: number,
  maxStep: number,
): CbOperation | undefined {
  if (!operations.length) return undefined;
  const idx = maxStep <= 0
    ? 0
    : Math.min(
      operations.length,
      Math.round((step / maxStep) * operations.length),
    );
  for (let i = Math.max(0, idx) - 1; i >= 0; i--) {
    const op = operations[i]!;
    if (fieldForOperation(op, fields) === field) return op;
  }
  return undefined;
}
