/**
 * Text sync (ADR 0013): optional base `rev` (#243) and code-point splices.
 * Compaction of text edits to one `set-value` per author and field happens in
 * `ContributionBuild` before the commit hash.
 */

import type { CbOperation, LogRev } from "./operation_log.ts";
import { operationRef } from "./operation_log.ts";
import type { RmJson } from "./operation_log.ts";

export interface TextField {
  draft: string;
  target: string;
  path: string;
}

const TEXT_TYPES = new Set(["DV_TEXT", "DV_PARSABLE"]);

/** A free-text write: `edit-text`, or `set-value` of a string / DV_TEXT / DV_PARSABLE. */
export function textFieldOf(op: CbOperation): TextField | undefined {
  if (op.type === "edit-text") {
    return { draft: op.draft, target: op.target, path: op.path };
  }
  if (op.type !== "set-value") return undefined;
  if (typeof op.value === "string") {
    return { draft: op.draft, target: op.target, path: op.path };
  }
  if (
    op.value && typeof op.value === "object" && !Array.isArray(op.value) &&
    typeof op.value._type === "string" && TEXT_TYPES.has(op.value._type)
  ) {
    return { draft: op.draft, target: op.target, path: op.path };
  }
  return undefined;
}

function touches(op: CbOperation, field: TextField): boolean {
  if (op.draft !== field.draft) return false;
  if (op.type === "import") return true;
  if (op.type === "remove-instance" && op.target === field.target) return true;
  if (
    (op.type === "set-value" || op.type === "edit-text") &&
    op.target === field.target && op.path === field.path
  ) {
    return true;
  }
  return false;
}

/**
 * True when `field` was written by an operation after `rev` in `prior`
 * (the log the caller had not seen). `rev` `"0"` is the start of the log.
 */
export function fieldChangedSince(
  prior: readonly CbOperation[],
  rev: LogRev,
  field: TextField,
): boolean {
  const at = rev === "0"
    ? -1
    : prior.findIndex((op) => operationRef(op) === rev);
  if (at < 0 && rev !== "0") return true;
  for (const op of prior.slice(at + 1)) {
    if (touches(op, field)) return true;
  }
  return false;
}

/**
 * Splice by Unicode code point. Returns the new string, or `undefined` when
 * `at` / `delete` falls outside the string.
 */
export function spliceCodePoints(
  value: string,
  at: number,
  del: number,
  insert: string,
): string | undefined {
  const points = [...value];
  if (!Number.isInteger(at) || at < 0 || at > points.length) return undefined;
  if (!Number.isInteger(del) || del < 0 || at + del > points.length) {
    return undefined;
  }
  points.splice(at, del, ...insert);
  return points.join("");
}

/** Group key for compaction: one `set-value` per author and field. */
export function textGroupKey(op: CbOperation): string | undefined {
  const field = textFieldOf(op);
  if (!field) return undefined;
  return `${field.draft}\n${field.target}\n${field.path}\n${op.author.id}`;
}

export function isTextEdit(op: CbOperation): boolean {
  return textFieldOf(op) !== undefined;
}

/** Value carried by a compacted text `set-value`. */
export type TextSnapshot = RmJson;
