/**
 * JSON Serialization Module
 * 
 * Main entry point for JSON serialization and deserialization of openEHR RM objects.
 * 
 * Two implementations are available:
 * 1. Canonical (simple, canonical only) - JsonCanonicalSerializer/Deserializer
 * 2. Configurable (advanced, flexible) - JsonConfigurableSerializer/Deserializer
 * 
 * @example
 * ```typescript
 * import { JsonCanonicalSerializer, JsonCanonicalDeserializer } from './enhanced/serialization/json/mod.ts';
 * 
 * // Canonical: Canonical format only (fast, minimal)
 * const serializer = new JsonCanonicalSerializer();
 * const json = serializer.serialize(composition);
 * 
 * const deserializer = new JsonCanonicalDeserializer();
 * const obj = deserializer.deserialize(json);
 * ```
 * 
 * @example
 * ```typescript
 * import { JsonConfigurableSerializer, JsonConfigurableDeserializer } from './enhanced/serialization/json/mod.ts';
 * 
 * // Configurable: Advanced options
 * const serializer = new JsonConfigurableSerializer({ useTerseFormat: true });
 * const json = serializer.serialize(composition);
 * ```
 */

// Canonical classes (simple, canonical only)
export { JsonCanonicalSerializer } from './json_canonical_serializer.ts';
export { JsonCanonicalDeserializer } from './json_canonical_deserializer.ts';

// Configurable classes (advanced, flexible)
export { JsonConfigurableSerializer } from './json_configurable_serializer.ts';
export { JsonConfigurableDeserializer } from './json_configurable_deserializer.ts';

export type {
  JsonSerializationConfig,
  JsonDeserializationConfig,
} from './json_config.ts';
export {
  DEFAULT_JSON_SERIALIZATION_CONFIG,
  DEFAULT_JSON_DESERIALIZATION_CONFIG,
  CANONICAL_JSON_CONFIG,
  CANONICAL_JSON_DESERIALIZE_CONFIG,
  COMPACT_JSON_CONFIG,
  COMPACT_JSON_DESERIALIZE_CONFIG,
  HYBRID_JSON_CONFIG,
  HYBRID_JSON_DESERIALIZE_CONFIG,
  NON_STANDARD_VERY_COMPACT_JSON_CONFIG,
  NON_STANDARD_VERY_COMPACT_JSON_DESERIALIZE_CONFIG,
} from './json_config.ts';
