/**
 * Serialization Module
 * 
 * Main entry point for all serialization formats (JSON, XML, YAML, Markdown).
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
 * import { JsonSerializer, YamlSerializer, MarkdownSerializer } from './enhanced/serialization/mod.ts';
 * ```
 */

// JSON exports
export {
  JsonCanonicalSerializer,
  JsonCanonicalDeserializer,
  JsonConfigurableSerializer,
  JsonConfigurableDeserializer,
  type JsonSerializationConfig,
  type JsonDeserializationConfig,
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
} from './json/mod.ts';

// YAML exports
export {
  YamlSerializer,
  YamlDeserializer,
  type YamlSerializationConfig,
  type YamlDeserializationConfig,
  DEFAULT_YAML_SERIALIZATION_CONFIG,
  DEFAULT_YAML_DESERIALIZATION_CONFIG,
  VERBOSE_YAML_CONFIG,
  HYBRID_YAML_CONFIG,
  FLOW_YAML_CONFIG,
} from './yaml/mod.ts';

// Markdown exports
export {
  MarkdownSerializer,
  type MarkdownSerializationConfig,
  type MarkdownStyle,
  type DataValueRendering,
  type CodeRendering,
  DEFAULT_MARKDOWN_SERIALIZATION_CONFIG,
  CLINICAL_MARKDOWN_CONFIG,
  STRUCTURAL_MARKDOWN_CONFIG,
  COMPACT_MARKDOWN_CONFIG,
  WIKILINK_MARKDOWN_CONFIG,
} from './markdown/mod.ts';

// AsciiDoc exports
export {
  AsciidocSerializer,
  type AsciidocSerializationConfig,
  type AsciidocStyle,
  type AsciidocDataValueRendering,
  type AsciidocCodeRendering,
  type AsciidocNodeIdRendering,
  DEFAULT_ASCIIDOC_SERIALIZATION_CONFIG,
  COMPACT_ASCIIDOC_CONFIG,
  LOSSLESS_ASCIIDOC_CONFIG,
} from './asciidoc/mod.ts';

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
