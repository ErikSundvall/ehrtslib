/**
 * Convert plain RM object trees (as produced by the FLAT/STRUCTURED
 * deserializers, with `_type` markers) into typed RM class instances via the
 * canonical JSON deserializer.
 *
 * The RM type registry must be populated first, e.g.:
 * ```ts
 * import * as rm from "../../openehr_rm.ts";
 * TypeRegistry.registerModule(rm);
 * ```
 */

import { JsonCanonicalDeserializer } from "../json/json_canonical_deserializer.ts";

/**
 * Instantiate typed RM classes for a plain `_type`-annotated object tree.
 */
export function toTypedRm<T = unknown>(plain: Record<string, unknown>): T {
  const deserializer = new JsonCanonicalDeserializer();
  return deserializer.deserialize(JSON.stringify(plain)) as T;
}
