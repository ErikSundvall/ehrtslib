/**
 * Markdown Serialization Configuration
 * 
 * Defines configuration options and presets for converting openEHR RM objects
 * to various Markdown representations optimized for LLM context windows.
 * 
 * Three main variants:
 * 1. Clinical Markdown - Maximum human readability, some information loss
 * 2. Structural Markdown - Lossless (with template), uses deterministic structure  
 * 3. Compact Markdown - Maximum token efficiency, minimal formatting
 */

import { ArchetypeNodeIdLocation } from '../common/mod.ts';
export type { ArchetypeNodeIdLocation };

/**
 * Markdown serialization style variants
 */
export type MarkdownStyle = 'clinical' | 'structural' | 'compact';

/**
 * How to render data values in markdown
 */
export type DataValueRendering = 'inline' | 'table' | 'list';

/**
 * How to represent terminology codes
 */
export type CodeRendering = 'hidden' | 'inline_bracket' | 'wikilink' | 'footnote';

/**
 * Configuration options for Markdown serialization
 */
export interface MarkdownSerializationConfig {
  /**
   * The markdown style variant to use
   * - 'clinical': Human-readable clinical document style
   * - 'structural': Lossless deterministic format (round-trippable with template)
   * - 'compact': Maximum token efficiency
   * @default 'structural'
   */
  style?: MarkdownStyle;

  /**
   * Include YAML frontmatter with composition metadata
   * (uid, template_id, archetype_id, composer, dates, etc.)
   * @default true
   */
  includeFrontmatter?: boolean;

  /**
   * Include archetype_node_id annotations
   * Required for lossless round-tripping
   * @default true for structural, false for clinical/compact
   */
  includeArchetypeNodeIds?: boolean;

  /**
   * Include _type annotations for polymorphic nodes
   * @default true for structural, false for clinical/compact
   */
  includeTypeAnnotations?: boolean;

  /**
   * How to render terminology codes (SNOMED, ICD-10, local at-codes)
   * @default 'inline_bracket' for structural, 'hidden' for compact
   */
  codeRendering?: CodeRendering;

  /**
   * How to render leaf data values (ELEMENTs)
   * @default 'list'
   */
  dataValueRendering?: DataValueRendering;

  /**
   * Use terse format for CODE_PHRASE and DV_CODED_TEXT
   * @default true
   */
  useTerseFormat?: boolean;

  /**
   * Include null flavour information
   * @default true for structural, false for compact
   */
  includeNullFlavour?: boolean;

  /**
   * Include composition-level language/territory/category
   * These can be inferred from template for round-tripping
   * @default true for structural, false for compact
   */
  includeCompositionMetadata?: boolean;

  /**
   * Include entry-level language/encoding when same as composition
   * @default false (redundant when same as composition)
   */
  includeRedundantEntryMetadata?: boolean;

  /**
   * Max heading depth before switching to bold/list format
   * @default 4
   */
  maxHeadingDepth?: number;

  /**
   * Include empty/unset fields
   * @default false
   */
  includeEmptyFields?: boolean;

  /**
   * Use type inference to omit type info when safe
   * @default true
   */
  useTypeInference?: boolean;

  /**
   * Indent size for nested lists (spaces)
   * @default 2
   */
  indent?: number;
}

/**
 * Default Markdown serialization configuration (structural style)
 */
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
};

/**
 * Preset: Clinical Markdown (human-readable, lossy)
 * 
 * Optimized for clinical review and human consumption.
 * Compositions become readable clinical documents.
 * Terminology codes are shown as wikilinks for reference.
 * Not suitable for round-tripping without the original data.
 */
export const CLINICAL_MARKDOWN_CONFIG: MarkdownSerializationConfig = {
  style: 'clinical',
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
};

/**
 * Preset: Structural Markdown (lossless with template)
 * 
 * Preserves all structural information needed for round-tripping
 * when combined with the template. Uses archetype_node_id annotations
 * as HTML comments and deterministic heading hierarchy.
 * 
 * Format guarantees:
 * - All node_ids preserved (as HTML comments or inline)
 * - All data values with types preserved
 * - Deterministic ordering
 * - Can reconstruct canonical JSON given the template
 */
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
 * Preset: Compact Markdown (maximum token efficiency)
 * 
 * Strips all structural overhead that can be reconstructed from context.
 * Only clinical content remains. Ideal for stuffing maximum patient data
 * into LLM context windows.
 * 
 * Typically retains only ~20-30% of canonical JSON token count.
 */
export const COMPACT_MARKDOWN_CONFIG: MarkdownSerializationConfig = {
  style: 'compact',
  includeFrontmatter: false,
  includeArchetypeNodeIds: false,
  includeTypeAnnotations: false,
  codeRendering: 'hidden',
  dataValueRendering: 'inline',
  useTerseFormat: true,
  includeNullFlavour: false,
  includeCompositionMetadata: false,
  includeRedundantEntryMetadata: false,
  maxHeadingDepth: 3,
  includeEmptyFields: false,
  useTypeInference: true,
  indent: 2,
};
