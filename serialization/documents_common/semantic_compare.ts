/**
 * Semantic comparison helpers for document codec round-trip tests.
 */

import { JsonCanonicalSerializer } from "../json/json_canonical_serializer.ts";
import { normalizeCompositionEntryDefaultsInPlace } from "./document_entry_defaults.ts";

function canonicalize(value: unknown): unknown {
  const serializer = new JsonCanonicalSerializer({ onNonRmValue: "pass" });
  const json = serializer.serialize(value);
  return JSON.parse(json);
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      out[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

function withCompositionEntryDefaults(root: unknown): unknown {
  if (!root || typeof root !== "object") return root;
  if ((root as Record<string, unknown>)._type !== "COMPOSITION") return root;
  const copy = structuredClone(root);
  normalizeCompositionEntryDefaultsInPlace(copy);
  return copy;
}

/**
 * Compare two RM trees after canonical JSON normalization (not byte-identical text).
 */
export function rmTreesSemanticallyEqual(a: unknown, b: unknown): boolean {
  const ca = sortKeysDeep(canonicalize(withCompositionEntryDefaults(a)));
  const cb = sortKeysDeep(canonicalize(withCompositionEntryDefaults(b)));
  return JSON.stringify(ca) === JSON.stringify(cb);
}
