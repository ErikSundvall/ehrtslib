/**
 * Markdown Serialization Configuration
 *
 * Presets: **structural** (round-trip), **compact**, **embedding**, **wikilink** (output-only).
 * RM simplification policies: `documents_common/document_preset_rules.ts` · docs: `documents-presets.md`.
 */

import { ArchetypeNodeIdLocation } from '../common/mod.ts';
export type { ArchetypeNodeIdLocation };

export type MarkdownStyle = 'structural' | 'compact' | 'embedding';

export type DataValueRendering = 'inline' | 'table' | 'list';

export type CodeRendering = 'hidden' | 'inline_bracket' | 'wikilink' | 'wikilink_urn' | 'footnote';

export interface MarkdownSerializationConfig {
  style?: MarkdownStyle;
  includeFrontmatter?: boolean;
  includeArchetypeNodeIds?: boolean;
  includeTypeAnnotations?: boolean;
  codeRendering?: CodeRendering;
  dataValueRendering?: DataValueRendering;
  useTerseFormat?: boolean;
  includeNullFlavour?: boolean;
  includeCompositionMetadata?: boolean;
  includeRedundantEntryMetadata?: boolean;
  maxHeadingDepth?: number;
  includeEmptyFields?: boolean;
  useTypeInference?: boolean;
  indent?: number;
  useOpenehrUrnWikilinks?: boolean;
  hideTypeAnnotationsForDisplay?: boolean;
}

export const DEFAULT_MARKDOWN_SERIALIZATION_CONFIG: Required<MarkdownSerializationConfig> = {
  style: 'structural',
  includeFrontmatter: true,
  includeArchetypeNodeIds: true,
  includeTypeAnnotations: true,
  codeRendering: 'inline_bracket',
  dataValueRendering: 'list',
  useTerseFormat: true,
  includeNullFlavour: true,
  includeCompositionMetadata: true,
  includeRedundantEntryMetadata: false,
  maxHeadingDepth: 4,
  includeEmptyFields: false,
  useTypeInference: true,
  indent: 2,
  useOpenehrUrnWikilinks: false,
  hideTypeAnnotationsForDisplay: false,
};

/** Round-trip with template (MarkdownDeserializer structural dialect). */
export const STRUCTURAL_MARKDOWN_CONFIG: MarkdownSerializationConfig = {
  style: 'structural',
  includeFrontmatter: true,
  includeArchetypeNodeIds: true,
  includeTypeAnnotations: true,
  codeRendering: 'inline_bracket',
  dataValueRendering: 'list',
  useTerseFormat: true,
  includeNullFlavour: true,
  includeCompositionMetadata: true,
  includeRedundantEntryMetadata: false,
  maxHeadingDepth: 4,
  includeEmptyFields: false,
  useTypeInference: true,
  indent: 2,
};

/**
 * Compact Markdown (lossy, human-readable).
 * GFM tables with Item / Value / Time, terminology wikilinks; optional front matter (demo toggle).
 */
export const COMPACT_MARKDOWN_CONFIG: MarkdownSerializationConfig = {
  style: 'compact',
  includeFrontmatter: true,
  includeArchetypeNodeIds: false,
  includeTypeAnnotations: false,
  codeRendering: 'wikilink',
  dataValueRendering: 'table',
  useTerseFormat: true,
  includeNullFlavour: false,
  includeCompositionMetadata: false,
  includeRedundantEntryMetadata: false,
  maxHeadingDepth: 3,
  includeEmptyFields: false,
  useTypeInference: true,
  indent: 2,
  useOpenehrUrnWikilinks: false,
  hideTypeAnnotationsForDisplay: false,
};

/** Output-only: minimal clinical text for embedding / RAG. */
export const EMBEDDING_MARKDOWN_CONFIG: MarkdownSerializationConfig = {
  style: 'embedding',
  includeFrontmatter: false,
  includeArchetypeNodeIds: false,
  includeTypeAnnotations: false,
  codeRendering: 'hidden',
  dataValueRendering: 'inline',
  useTerseFormat: false,
  includeNullFlavour: true,
  includeCompositionMetadata: false,
  includeRedundantEntryMetadata: false,
  maxHeadingDepth: 3,
  includeEmptyFields: false,
  useTypeInference: true,
  indent: 2,
  useOpenehrUrnWikilinks: false,
  hideTypeAnnotationsForDisplay: true,
};

/** Output-only: openEHR URN wikilinks on headings and coded text. */
export const WIKILINK_MARKDOWN_CONFIG: MarkdownSerializationConfig = {
  style: 'compact',
  includeFrontmatter: true,
  includeArchetypeNodeIds: true,
  includeTypeAnnotations: false,
  codeRendering: 'wikilink_urn',
  dataValueRendering: 'list',
  useTerseFormat: true,
  includeNullFlavour: false,
  includeCompositionMetadata: false,
  includeRedundantEntryMetadata: false,
  maxHeadingDepth: 4,
  includeEmptyFields: false,
  useTypeInference: true,
  indent: 2,
  useOpenehrUrnWikilinks: true,
  hideTypeAnnotationsForDisplay: true,
};
