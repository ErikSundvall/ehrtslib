/**
 * Markdown Serialization Module
 *
 * Presets: **structural**, **compact**, **embedding**, **wikilink**.
 */

export { MarkdownSerializer } from './markdown_serializer.ts';
export { MarkdownDeserializer } from './markdown_deserializer.ts';

export {
  type MarkdownSerializationConfig,
  type MarkdownStyle,
  type DataValueRendering,
  type CodeRendering,
  DEFAULT_MARKDOWN_SERIALIZATION_CONFIG,
  STRUCTURAL_MARKDOWN_CONFIG,
  COMPACT_MARKDOWN_CONFIG,
  EMBEDDING_MARKDOWN_CONFIG,
  WIKILINK_MARKDOWN_CONFIG,
} from './markdown_config.ts';

export {
  type MarkdownDeserializationConfig,
  DEFAULT_MARKDOWN_DESERIALIZATION_CONFIG,
  STRUCTURAL_MARKDOWN_DIALECT,
} from './markdown_deserialize_config.ts';

export const MARKDOWN_CODEC_MATRIX = {
  rmInstances: ["COMPOSITION", "SECTION", "OBSERVATION", "EVALUATION", "ADMIN_ENTRY"] as const,
  requiresTemplateForLossless: true,
  losslessDialects: ["structural"] as const,
  outputOnlyPresets: ["compact", "embedding", "wikilink"] as const,
} as const;
