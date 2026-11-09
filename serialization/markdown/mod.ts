/**
 * Markdown Serialization Module
 * 
 * Provides Markdown serializers for openEHR RM objects, optimized for
 * LLM context windows and human readability.
 * 
 * Three variants:
 * - **Clinical**: Maximum readability, suitable for clinical review (lossy)
 * - **Structural**: Lossless (with template), deterministic format for round-tripping
 * - **Compact**: Maximum token efficiency (lossy)
 * 
 * @example
 * ```typescript
 * import { MarkdownSerializer, CLINICAL_MARKDOWN_CONFIG } from './mod.ts';
 * 
 * // Clinical style (human readable)
 * const clinical = new MarkdownSerializer(CLINICAL_MARKDOWN_CONFIG);
 * console.log(clinical.serialize(composition));
 * 
 * // Structural style (lossless with template)
 * const structural = new MarkdownSerializer(); // default
 * console.log(structural.serialize(composition));
 * 
 * // Compact style (max token efficiency)
 * import { COMPACT_MARKDOWN_CONFIG } from './mod.ts';
 * const compact = new MarkdownSerializer(COMPACT_MARKDOWN_CONFIG);
 * console.log(compact.serialize(composition));
 * ```
 */

export { MarkdownSerializer } from './markdown_serializer.ts';
export { MarkdownDeserializer } from './markdown_deserializer.ts';

export {
  type MarkdownSerializationConfig,
  type MarkdownStyle,
  type DataValueRendering,
  type CodeRendering,
  DEFAULT_MARKDOWN_SERIALIZATION_CONFIG,
  CLINICAL_MARKDOWN_CONFIG,
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

/** Supported lossless / round-trippable RM representations for this codec. */
export const MARKDOWN_CODEC_MATRIX = {
  rmInstances: ["COMPOSITION", "SECTION", "OBSERVATION", "EVALUATION", "ADMIN_ENTRY"] as const,
  requiresTemplateForLossless: true,
  losslessDialects: ["structural"] as const,
  outputOnlyPresets: ["clinical", "compact", "embedding", "wikilink"] as const,
} as const;
