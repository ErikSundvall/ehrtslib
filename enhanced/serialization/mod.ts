/**
 * Serialization Module
 * 
 * Main entry point for all serialization formats (JSON, XML, YAML).
 * 
 * This module re-exports all serializers and related utilities.
 * You can import specific formats or use this module to access everything.
 * 
 * @example
 * ```typescript
 * // Import specific format
 * import { JsonSerializer } from './enhanced/serialization/json/mod.ts';
 * 
 * // Or import from main module
 * import { JsonSerializer, YamlSerializer } from './enhanced/serialization/mod.ts';
 * ```
 */

// JSON exports
export {
  JsonSerializer,
  JsonDeserializer,
  type JsonSerializationConfig,
  type JsonDeserializationConfig,
  DEFAULT_JSON_SERIALIZATION_CONFIG,
  DEFAULT_JSON_DESERIALIZATION_CONFIG,
  CANONICAL_JSON_CONFIG,
  COMPACT_JSON_CONFIG,
  HYBRID_JSON_CONFIG,
  INTERNAL_JSON_CONFIG,
} from './json/mod.ts';

// YAML exports
export {
  YamlSerializer,
  YamlDeserializer,
  type YamlSerializationConfig,
  type YamlDeserializationConfig,
  DEFAULT_YAML_SERIALIZATION_CONFIG,
  DEFAULT_YAML_DESERIALIZATION_CONFIG,
  STANDARD_YAML_CONFIG,
  COMPACT_YAML_CONFIG,
  HYBRID_YAML_CONFIG,
  FLOW_YAML_CONFIG,
} from './yaml/mod.ts';

// Common utilities
export {
  TypeRegistry,
  TypeInferenceEngine,
  HybridStyleFormatter,
  type HybridFormatterOptions,
  SerializationError,
  DeserializationError,
  TypeNotFoundError,
  InvalidFormatError,
} from './common/mod.ts';
