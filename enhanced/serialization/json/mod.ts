/**
 * JSON Serialization Module
 * 
 * Main entry point for JSON serialization and deserialization of openEHR RM objects.
 * 
 * @example
 * ```typescript
 * import { JsonSerializer, JsonDeserializer } from './enhanced/serialization/json/mod.ts';
 * 
 * // Serialize
 * const serializer = new JsonSerializer();
 * const json = serializer.serialize(composition);
 * 
 * // Deserialize
 * const deserializer = new JsonDeserializer();
 * const obj = deserializer.deserialize(json);
 * ```
 */

export { JsonSerializer } from './json_serializer.ts';
export { JsonDeserializer } from './json_deserializer.ts';
export type {
  JsonSerializationConfig,
  JsonDeserializationConfig,
} from './json_config.ts';
export {
  DEFAULT_JSON_SERIALIZATION_CONFIG,
  DEFAULT_JSON_DESERIALIZATION_CONFIG,
  CANONICAL_JSON_CONFIG,
  COMPACT_JSON_CONFIG,
  HYBRID_JSON_CONFIG,
  INTERNAL_JSON_CONFIG,
} from './json_config.ts';
