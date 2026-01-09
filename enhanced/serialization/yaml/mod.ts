/**
 * YAML Serialization Module
 * 
 * Main entry point for YAML serialization and deserialization of openEHR RM objects.
 * 
 * Note: YAML is not an official openEHR standard but provides excellent readability.
 * 
 * @example
 * ```typescript
 * import { YamlSerializer, YamlDeserializer } from './enhanced/serialization/yaml/mod.ts';
 * 
 * // Serialize
 * const serializer = new YamlSerializer();
 * const yaml = serializer.serialize(composition);
 * 
 * // Deserialize
 * const deserializer = new YamlDeserializer();
 * const obj = deserializer.deserialize(yaml);
 * ```
 */

export { YamlSerializer } from './yaml_serializer.ts';
export { YamlDeserializer } from './yaml_deserializer.ts';
export type {
  YamlSerializationConfig,
  YamlDeserializationConfig,
} from './yaml_config.ts';
export {
  DEFAULT_YAML_SERIALIZATION_CONFIG,
  DEFAULT_YAML_DESERIALIZATION_CONFIG,
  STANDARD_YAML_CONFIG,
  HYBRID_YAML_CONFIG,
  FLOW_YAML_CONFIG,
} from './yaml_config.ts';
