/**
 * JSON Serialization Module
 * 
 * Main entry point for JSON serialization and deserialization of openEHR RM objects.
 * 
 * Two implementations are available:
 * 1. Clinical (simple, canonical only) - JsonClinicalSerializer/Deserializer
 * 2. Configurable (advanced, flexible) - JsonConfigurableSerializer/Deserializer
 * 
 * @example
 * ```typescript
 * import { JsonClinicalSerializer, JsonClinicalDeserializer } from './enhanced/serialization/json/mod.ts';
 * 
 * // Clinical: Canonical format only (fast, minimal)
 * const serializer = new JsonClinicalSerializer();
 * const json = serializer.serialize(composition);
 * 
 * const deserializer = new JsonClinicalDeserializer();
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

// Clinical classes (simple, canonical only)
export { JsonClinicalSerializer } from './json_clinical_serializer.ts';
export { JsonClinicalDeserializer } from './json_clinical_deserializer.ts';

// Configurable classes (advanced, flexible)
export { JsonConfigurableSerializer } from './json_configurable_serializer.ts';
export { JsonConfigurableDeserializer } from './json_configurable_deserializer.ts';

// Backward compatibility aliases (use JsonConfigurableSerializer/Deserializer)
export { JsonConfigurableSerializer as JsonSerializer } from './json_configurable_serializer.ts';
export { JsonConfigurableDeserializer as JsonDeserializer } from './json_configurable_deserializer.ts';

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
