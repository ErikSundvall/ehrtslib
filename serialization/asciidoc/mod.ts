/**
 * AsciiDoc Serialization Module
 *
 * Presets: **structural**, **compact**, **embedding**, **wikilink**.
 */

export { AsciidocSerializer } from './asciidoc_serializer.ts';
export { AsciidocDeserializer } from './asciidoc_deserializer.ts';

export {
  type AsciidocSerializationConfig,
  type AsciidocStyle,
  type AsciidocDataValueRendering,
  type AsciidocCodeRendering,
  type AsciidocNodeIdRendering,
  DEFAULT_ASCIIDOC_SERIALIZATION_CONFIG,
  STRUCTURAL_ASCIIDOC_CONFIG,
  COMPACT_ASCIIDOC_CONFIG,
  EMBEDDING_ASCIIDOC_CONFIG,
  WIKILINK_ASCIIDOC_CONFIG,
} from './asciidoc_config.ts';

export {
  type AsciidocDeserializationConfig,
  DEFAULT_ASCIIDOC_DESERIALIZATION_CONFIG,
  STRUCTURAL_ASCIIDOC_DIALECT,
} from './asciidoc_deserialize_config.ts';

export const ASCIIDOC_CODEC_MATRIX = {
  rmInstances: ["COMPOSITION", "SECTION", "OBSERVATION", "EVALUATION", "ADMIN_ENTRY"] as const,
  requiresTemplateForLossless: true,
  losslessDialects: ["structural"] as const,
  outputOnlyPresets: ["compact", "embedding", "wikilink"] as const,
} as const;
