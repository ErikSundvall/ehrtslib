/**
 * AsciiDoc Serialization Module
 * 
 * Provides AsciiDoc serializers for openEHR RM objects.
 * 
 * Two variants:
 * - **Compact**: Human-readable, lossy, suitable for documentation and display
 * - **Lossless**: Full round-trip capable (with template), preserves all structural info
 * 
 * @example
 * ```typescript
 * import { AsciidocSerializer, COMPACT_ASCIIDOC_CONFIG } from './mod.ts';
 * 
 * // Compact style (human readable)
 * const compact = new AsciidocSerializer(COMPACT_ASCIIDOC_CONFIG);
 * console.log(compact.serialize(composition));
 * 
 * // Lossless style (round-trip capable)
 * const lossless = new AsciidocSerializer(); // default
 * console.log(lossless.serialize(composition));
 * ```
 */

export { AsciidocSerializer } from './asciidoc_serializer.ts';

export {
  type AsciidocSerializationConfig,
  type AsciidocStyle,
  type AsciidocDataValueRendering,
  type AsciidocCodeRendering,
  type AsciidocNodeIdRendering,
  DEFAULT_ASCIIDOC_SERIALIZATION_CONFIG,
  COMPACT_ASCIIDOC_CONFIG,
  LOSSLESS_ASCIIDOC_CONFIG,
} from './asciidoc_config.ts';
