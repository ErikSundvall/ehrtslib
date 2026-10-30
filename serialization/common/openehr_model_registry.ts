/**
 * Register RM + BASE classes on {@link TypeRegistry} for canonical JSON (de)serialization.
 *
 * Clinical compositions embed BASE identification and terminology types (`TERMINOLOGY_ID`,
 * `OBJECT_VERSION_ID`, `ARCHETYPE_ID`, …) alongside RM classes. Registering only the RM
 * barrel leaves those `_type` values unresolved in strict mode.
 */

import { TypeRegistry } from "./type_registry.ts";
import * as rm from "../../rm/mod.ts";
import * as base from "../../base/mod.ts";
import { rmInitLate } from "../../base/rm_init_late.ts";

/** openEHR type names are uppercase with underscores (excludes helper exports like `registerType`). */
export const OPENEHR_TYPE_NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;

/**
 * Register all RM and BASE classes needed to deserialize canonical openEHR JSON.
 * Idempotent — safe to call before every deserialize; no-op after the first call until
 * {@link TypeRegistry.clear} resets registration state.
 */
export function registerOpenEhrModelTypes(): void {
  if (TypeRegistry.isOpenEhrModelTypesRegistered()) {
    return;
  }
  // RM first, then BASE — matches examples and lets BASE `CODE_PHRASE` win on collision.
  TypeRegistry.registerModule(rm as Record<string, unknown>, {
    typeNamePattern: OPENEHR_TYPE_NAME_PATTERN,
  });
  TypeRegistry.registerModule(base as Record<string, unknown>, {
    typeNamePattern: OPENEHR_TYPE_NAME_PATTERN,
  });
  TypeRegistry.markOpenEhrModelTypesRegistered();
}

/**
 * Collect every `_type` string in a JSON-like tree (for registry audits).
 */
export function collectTypeNamesFromJsonTree(
  value: unknown,
  out = new Set<string>(),
): Set<string> {
  if (value === null || value === undefined) {
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectTypeNamesFromJsonTree(item, out);
    }
    return out;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record._type === "string") {
      out.add(record._type);
    }
    for (const child of Object.values(record)) {
      collectTypeNamesFromJsonTree(child, out);
    }
  }
  return out;
}

// RM init coercion builds nested RM objects by type name (apply_rm_init.ts).
rmInitLate.registerModelTypes = registerOpenEhrModelTypes;
rmInitLate.ctorModules.push(rm as Record<string, unknown>, base as Record<string, unknown>);
