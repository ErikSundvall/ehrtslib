/**
 * AsciiDoc Serialization Configuration
 *
 * Presets: **structural** (round-trip), **compact**, **embedding**, **wikilink** (output-only).
 * RM simplification policies: `documents_common/document_preset_rules.ts` · docs: `documents-presets.md`.
 */

export type AsciidocStyle = 'structural' | 'compact' | 'embedding';

export type AsciidocDataValueRendering = 'inline' | 'table' | 'list';

export type AsciidocCodeRendering = 'hidden' | 'inline_bracket' | 'macro' | 'footnote';

export type AsciidocNodeIdRendering = 'hidden' | 'comment' | 'attribute' | 'inline_comment';

export interface AsciidocSerializationConfig {
  style?: AsciidocStyle;
  includeHeader?: boolean;
  includeArchetypeNodeIds?: boolean;
  nodeIdRendering?: AsciidocNodeIdRendering;
  includeTypeAnnotations?: boolean;
  codeRendering?: AsciidocCodeRendering;
  dataValueRendering?: AsciidocDataValueRendering;
  useTerseFormat?: boolean;
  includeNullFlavour?: boolean;
  includeCompositionMetadata?: boolean;
  includeRedundantEntryMetadata?: boolean;
  maxHeadingDepth?: number;
  includeEmptyFields?: boolean;
  useOpenehrUrnLinks?: boolean;
}

export const DEFAULT_ASCIIDOC_SERIALIZATION_CONFIG: Required<AsciidocSerializationConfig> = {
  style: 'structural',
  includeHeader: true,
  includeArchetypeNodeIds: true,
  nodeIdRendering: 'comment',
  includeTypeAnnotations: true,
  codeRendering: 'inline_bracket',
  dataValueRendering: 'list',
  useTerseFormat: true,
  includeNullFlavour: true,
  includeCompositionMetadata: true,
  includeRedundantEntryMetadata: false,
  maxHeadingDepth: 5,
  includeEmptyFields: false,
  useOpenehrUrnLinks: true,
};

/** Round-trip with template (AsciidocDeserializer structural dialect). */
export const STRUCTURAL_ASCIIDOC_CONFIG: AsciidocSerializationConfig = {
  style: 'structural',
  includeHeader: true,
  includeArchetypeNodeIds: true,
  nodeIdRendering: 'comment',
  includeTypeAnnotations: true,
  codeRendering: 'inline_bracket',
  dataValueRendering: 'list',
  useTerseFormat: true,
  includeNullFlavour: true,
  includeCompositionMetadata: true,
  includeRedundantEntryMetadata: false,
  maxHeadingDepth: 5,
  includeEmptyFields: false,
  useOpenehrUrnLinks: false,
};

/**
 * Compact AsciiDoc (lossy).
 * Pipe tables with Item / Value / Time (implicit header); optional header attributes.
 */
export const COMPACT_ASCIIDOC_CONFIG: AsciidocSerializationConfig = {
  style: 'compact',
  includeHeader: true,
  includeArchetypeNodeIds: false,
  nodeIdRendering: 'hidden',
  includeTypeAnnotations: false,
  codeRendering: 'hidden',
  dataValueRendering: 'table',
  useTerseFormat: true,
  includeNullFlavour: false,
  includeCompositionMetadata: false,
  includeRedundantEntryMetadata: false,
  maxHeadingDepth: 4,
  includeEmptyFields: false,
  useOpenehrUrnLinks: false,
};

/** Output-only: minimal clinical text for embedding / RAG. */
export const EMBEDDING_ASCIIDOC_CONFIG: AsciidocSerializationConfig = {
  style: 'embedding',
  includeHeader: false,
  includeArchetypeNodeIds: false,
  nodeIdRendering: 'hidden',
  includeTypeAnnotations: false,
  codeRendering: 'hidden',
  dataValueRendering: 'inline',
  useTerseFormat: false,
  includeNullFlavour: true,
  includeCompositionMetadata: false,
  includeRedundantEntryMetadata: false,
  maxHeadingDepth: 4,
  includeEmptyFields: false,
  useOpenehrUrnLinks: false,
};

/** Output-only: URN links on headings (display-oriented compact variant). */
export const WIKILINK_ASCIIDOC_CONFIG: AsciidocSerializationConfig = {
  style: 'compact',
  includeHeader: true,
  includeArchetypeNodeIds: true,
  nodeIdRendering: 'comment',
  includeTypeAnnotations: false,
  codeRendering: 'inline_bracket',
  dataValueRendering: 'list',
  useTerseFormat: true,
  includeNullFlavour: false,
  includeCompositionMetadata: false,
  includeRedundantEntryMetadata: false,
  maxHeadingDepth: 4,
  includeEmptyFields: false,
  useOpenehrUrnLinks: true,
};
