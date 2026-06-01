/**
 * AsciiDoc Serialization Configuration
 * 
 * Defines configuration options and presets for converting openEHR RM objects
 * to AsciiDoc representations.
 * 
 * Two main variants:
 * 1. Compact AsciiDoc - Human-readable, lossy, optimized for display
 * 2. Lossless AsciiDoc - Full round-trip capable (with template), preserves all structural info
 */

/**
 * AsciiDoc serialization style variants
 */
export type AsciidocStyle = 'compact' | 'lossless';

/**
 * How to render data values in AsciiDoc
 */
export type AsciidocDataValueRendering = 'inline' | 'table' | 'list';

/**
 * How to represent terminology codes in AsciiDoc
 */
export type AsciidocCodeRendering = 'hidden' | 'inline_bracket' | 'macro' | 'footnote';

/**
 * How to render archetype node IDs
 */
export type AsciidocNodeIdRendering = 'hidden' | 'comment' | 'attribute' | 'inline_comment';

/**
 * Configuration options for AsciiDoc serialization
 */
export interface AsciidocSerializationConfig {
  /**
   * The AsciiDoc style variant to use
   * - 'compact': Human-readable, lossy (good for display/documentation)
   * - 'lossless': Full round-trip capable with template
   * @default 'lossless'
   */
  style?: AsciidocStyle;

  /**
   * Include document header with metadata attributes
   * (uid, template_id, archetype_id, composer, dates, etc.)
   * @default true
   */
  includeHeader?: boolean;

  /**
   * Include archetype_node_id annotations
   * Required for lossless round-tripping
   * @default true for lossless, false for compact
   */
  includeArchetypeNodeIds?: boolean;

  /**
   * How to render archetype node IDs
   * - 'comment': AsciiDoc comments (// nodeId)
   * - 'attribute': Document attributes (:node-id-<name>: value)
   * - 'inline_comment': Inline role annotation [.node-id]
   * @default 'comment' for lossless, 'hidden' for compact
   */
  nodeIdRendering?: AsciidocNodeIdRendering;

  /**
   * Include _type annotations for polymorphic nodes
   * @default true for lossless, false for compact
   */
  includeTypeAnnotations?: boolean;

  /**
   * How to render terminology codes (SNOMED, ICD-10, local at-codes)
   * - 'hidden': don't show
   * - 'inline_bracket': [TERMINOLOGY::code]
   * - 'macro': term:TERMINOLOGY[code, display]
   * - 'footnote': footnote:[TERMINOLOGY::code]
   * @default 'inline_bracket' for lossless, 'hidden' for compact
   */
  codeRendering?: AsciidocCodeRendering;

  /**
   * How to render leaf data values (ELEMENTs)
   * @default 'list'
   */
  dataValueRendering?: AsciidocDataValueRendering;

  /**
   * Use terse format for CODE_PHRASE and DV_CODED_TEXT
   * @default true
   */
  useTerseFormat?: boolean;

  /**
   * Include null flavour information
   * @default true for lossless, false for compact
   */
  includeNullFlavour?: boolean;

  /**
   * Include composition-level language/territory/category
   * These can be inferred from template for round-tripping
   * @default true for lossless, false for compact
   */
  includeCompositionMetadata?: boolean;

  /**
   * Include entry-level language/encoding when same as composition
   * @default false (redundant when same as composition)
   */
  includeRedundantEntryMetadata?: boolean;

  /**
   * Max heading depth before switching to bold/list format
   * AsciiDoc supports levels 1-5 (= through =====)
   * @default 5
   */
  maxHeadingDepth?: number;

  /**
   * Include empty/unset fields
   * @default false
   */
  includeEmptyFields?: boolean;

  /**
   * Use openEHR URN-based cross-references for archetype links
   * e.g., <<urn:openehr:am:org.openehr::openEHR-EHR-OBSERVATION.blood_pressure.v2,Blood pressure>>
   * @default true for lossless, false for compact
   */
  useOpenehrUrnLinks?: boolean;
}

/**
 * Default AsciiDoc serialization configuration (lossless style)
 */
export const DEFAULT_ASCIIDOC_SERIALIZATION_CONFIG: Required<AsciidocSerializationConfig> = {
  style: 'lossless',
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

/**
 * Preset: Compact AsciiDoc (human-readable, lossy)
 * 
 * Optimized for display and documentation.
 * Compositions become readable clinical documents.
 * Terminology codes are hidden or minimally shown.
 * Not suitable for round-tripping without the original data.
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

/**
 * Preset: Lossless AsciiDoc (round-trip capable with template)
 * 
 * Preserves all structural information needed for round-tripping
 * when combined with the template. Uses AsciiDoc comments for
 * archetype_node_ids and type annotations.
 * 
 * Format guarantees:
 * - All node_ids preserved (as AsciiDoc comments)
 * - All data values with types preserved
 * - Deterministic ordering
 * - Can reconstruct canonical JSON given the template
 * - Uses openEHR URN cross-references for archetype identification
 */
export const LOSSLESS_ASCIIDOC_CONFIG: AsciidocSerializationConfig = {
  style: 'lossless',
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
