/**
 * Sparse `oe:rm:v1` payloads: only RM fields not recoverable from visible text.
 */

import {
  compactRmObject,
  formatOeRmAnnotationAsciidoc,
  formatOeRmAnnotationMarkdown,
  parseOeRmAnnotationPayload,
} from "./oe_rm_annotation.ts";

export { parseOeRmAnnotationPayload };

function stableJson(v: unknown): string {
  return JSON.stringify(v);
}

/** Keys to compare when building a patch vs a partially-built object from visible text. */
export function rmPatchDiff(
  target: Record<string, unknown>,
  recovered: Record<string, unknown>,
): Record<string, unknown> | null {
  const patch: Record<string, unknown> = {};
  const type = target._type;
  if (typeof type === "string") patch._type = type;
  for (const [key, val] of Object.entries(target)) {
    if (key === "_type") continue;
    if (!(key in recovered) || stableJson(recovered[key]) !== stableJson(val)) {
      patch[key] = val;
    }
  }
  if (Object.keys(patch).length <= 1) return null;
  return compactRmObject(patch) as Record<string, unknown>;
}

export function mergeRmPatch(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (k === "_type" && out._type) continue;
    out[k] = v;
  }
  if (patch._type && !out._type) out._type = patch._type;
  return out;
}

export function mergeRmPatchPayload(
  base: Record<string, unknown>,
  payload: string | undefined,
): Record<string, unknown> {
  if (!payload) return base;
  try {
    const patch = parseOeRmAnnotationPayload(payload);
    return mergeRmPatch(base, patch);
  } catch {
    return base;
  }
}

export function formatSparseRmMarkdown(
  target: Record<string, unknown>,
  recovered: Record<string, unknown>,
): string {
  const patch = rmPatchDiff(target, recovered);
  if (!patch) return "";
  return formatOeRmAnnotationMarkdown(patch);
}

export function formatSparseRmAsciidoc(
  target: Record<string, unknown>,
  recovered: Record<string, unknown>,
): string {
  const patch = rmPatchDiff(target, recovered);
  if (!patch) return "";
  return formatOeRmAnnotationAsciidoc(patch);
}
