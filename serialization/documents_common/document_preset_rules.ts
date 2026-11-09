/**
 * Shared RM simplification policies for Markdown / AsciiDoc document presets.
 * Formatting differs per codec; these flags define which RM surface is kept or dropped.
 */

import type { MarkdownSerializationConfig } from "../markdown/markdown_config.ts";
import type { AsciidocSerializationConfig } from "../asciidoc/asciidoc_config.ts";
import {
  COMPACT_MARKDOWN_CONFIG,
  EMBEDDING_MARKDOWN_CONFIG,
  STRUCTURAL_MARKDOWN_CONFIG,
  WIKILINK_MARKDOWN_CONFIG,
} from "../markdown/markdown_config.ts";
import {
  COMPACT_ASCIIDOC_CONFIG,
  EMBEDDING_ASCIIDOC_CONFIG,
  STRUCTURAL_ASCIIDOC_CONFIG,
  WIKILINK_ASCIIDOC_CONFIG,
} from "../asciidoc/asciidoc_config.ts";

export const DOCUMENT_PRESET_IDS = [
  "structural",
  "compact",
  "embedding",
  "wikilink",
] as const;

export type DocumentPresetId = (typeof DOCUMENT_PRESET_IDS)[number];

/** GitHub docs path (main branch). */
export const DOCUMENT_PRESET_DOC_PATH = "serialization/documents-presets.md";

export const DOCUMENT_PRESET_DOC_GITHUB_BASE =
  `https://github.com/ErikSundvall/ehrtslib/blob/main/${DOCUMENT_PRESET_DOC_PATH}`;

/** Stable section anchors in `documents-presets.md` (GitHub heading slugs). */
export const DOCUMENT_PRESET_DOC_ANCHORS = [
  "structural",
  "compact",
  "embedding",
  "wikilink",
  "rm-simplification-rules",
] as const;

export type DocumentPresetDocAnchor =
  (typeof DOCUMENT_PRESET_DOC_ANCHORS)[number];

export function documentPresetDocUrl(
  anchor: DocumentPresetDocAnchor | DocumentPresetId,
): string {
  return `${DOCUMENT_PRESET_DOC_GITHUB_BASE}#${anchor}`;
}

export type TerminologyCodePolicy =
  | "inline_bracket"
  | "wikilink_term"
  | "urn_link"
  | "hidden";

/** How ELEMENT values are laid out (syntax differs per codec). */
export type DataValueLayoutPolicy =
  | "list"
  | "table_item_value_time"
  | "inline_key_value"
  | "definition_list";

export interface DocumentPresetRmPolicy {
  roundTrip: boolean;
  /** ENTRY language/encoding/subject once at composition; per-entry only if different. */
  dedupeEntryMetadata: boolean;
  omitSingleEventTitles: boolean;
  omitRedundantHistoryOrigin: boolean;
  archetypeNodeIds: boolean;
  rmTypeAnnotations: boolean;
  /** Lossy presets: no oe:meta / round-trip `_structure:` markers in visible output. */
  hiddenStructureMeta: boolean;
  /** Structural only: sparse oe:v1 value annotations. */
  sparseValueAnnotations: boolean;
  includeNullFlavour: boolean;
  includeEmptyFields: boolean;
  includeCompositionMetadata: boolean;
  terminologyCodes: TerminologyCodePolicy;
  dataValueLayout: DataValueLayoutPolicy;
  includeDocumentEnvelope: boolean;
  openehrUrnOnHeadings: boolean;
  terseCodedValues: boolean;
}

export const DOCUMENT_PRESET_RM_POLICIES: Record<
  DocumentPresetId,
  DocumentPresetRmPolicy
> = {
  structural: {
    roundTrip: true,
    dedupeEntryMetadata: true,
    omitSingleEventTitles: false,
    omitRedundantHistoryOrigin: false,
    archetypeNodeIds: true,
    rmTypeAnnotations: true,
    hiddenStructureMeta: false,
    sparseValueAnnotations: true,
    includeNullFlavour: true,
    includeEmptyFields: false,
    includeCompositionMetadata: true,
    terminologyCodes: "inline_bracket",
    dataValueLayout: "list",
    includeDocumentEnvelope: true,
    openehrUrnOnHeadings: false,
    terseCodedValues: true,
  },
  compact: {
    roundTrip: false,
    dedupeEntryMetadata: true,
    omitSingleEventTitles: true,
    omitRedundantHistoryOrigin: true,
    archetypeNodeIds: false,
    rmTypeAnnotations: false,
    hiddenStructureMeta: true,
    sparseValueAnnotations: false,
    includeNullFlavour: false,
    includeEmptyFields: false,
    includeCompositionMetadata: false,
    terminologyCodes: "wikilink_term",
    dataValueLayout: "table_item_value_time",
    includeDocumentEnvelope: true,
    openehrUrnOnHeadings: false,
    terseCodedValues: true,
  },
  embedding: {
    roundTrip: false,
    dedupeEntryMetadata: true,
    omitSingleEventTitles: true,
    omitRedundantHistoryOrigin: true,
    archetypeNodeIds: false,
    rmTypeAnnotations: false,
    hiddenStructureMeta: true,
    sparseValueAnnotations: false,
    includeNullFlavour: true,
    includeEmptyFields: false,
    includeCompositionMetadata: false,
    terminologyCodes: "hidden",
    dataValueLayout: "inline_key_value",
    includeDocumentEnvelope: false,
    openehrUrnOnHeadings: false,
    terseCodedValues: false,
  },
  wikilink: {
    roundTrip: false,
    dedupeEntryMetadata: true,
    omitSingleEventTitles: true,
    omitRedundantHistoryOrigin: true,
    archetypeNodeIds: true,
    rmTypeAnnotations: false,
    hiddenStructureMeta: true,
    sparseValueAnnotations: false,
    includeNullFlavour: false,
    includeEmptyFields: false,
    includeCompositionMetadata: false,
    terminologyCodes: "urn_link",
    dataValueLayout: "list",
    includeDocumentEnvelope: true,
    openehrUrnOnHeadings: true,
    terseCodedValues: true,
  },
};

const MARKDOWN_PRESET_CONFIGS: Record<
  DocumentPresetId,
  MarkdownSerializationConfig
> = {
  structural: STRUCTURAL_MARKDOWN_CONFIG,
  compact: COMPACT_MARKDOWN_CONFIG,
  embedding: EMBEDDING_MARKDOWN_CONFIG,
  wikilink: WIKILINK_MARKDOWN_CONFIG,
};

const ASCIIDOC_PRESET_CONFIGS: Record<
  DocumentPresetId,
  AsciidocSerializationConfig
> = {
  structural: STRUCTURAL_ASCIIDOC_CONFIG,
  compact: COMPACT_ASCIIDOC_CONFIG,
  embedding: EMBEDDING_ASCIIDOC_CONFIG,
  wikilink: WIKILINK_ASCIIDOC_CONFIG,
};

function configFlag<T>(v: T | undefined, d: T): T {
  return v !== undefined ? v : d;
}

/** Map shipped Markdown preset config to shared RM policy (for parity tests). */
export function rmPolicyFromMarkdownConfig(
  preset: DocumentPresetId,
): DocumentPresetRmPolicy {
  const policy = DOCUMENT_PRESET_RM_POLICIES[preset];
  const c = MARKDOWN_PRESET_CONFIGS[preset];
  const w = configFlag(
    c.includeRedundantEntryMetadata,
    false,
  );
  if (w !== !policy.dedupeEntryMetadata) {
    throw new Error(`Markdown ${preset}: dedupeEntryMetadata drift`);
  }
  if (configFlag(c.includeArchetypeNodeIds, false) !== policy.archetypeNodeIds) {
    throw new Error(`Markdown ${preset}: archetypeNodeIds drift`);
  }
  if (configFlag(c.includeTypeAnnotations, false) !== policy.rmTypeAnnotations) {
    throw new Error(`Markdown ${preset}: type annotations drift`);
  }
  if (configFlag(c.includeNullFlavour, false) !== policy.includeNullFlavour) {
    throw new Error(`Markdown ${preset}: null flavour drift`);
  }
  if (configFlag(c.includeEmptyFields, false) !== policy.includeEmptyFields) {
    throw new Error(`Markdown ${preset}: empty fields drift`);
  }
  if (
    configFlag(c.includeCompositionMetadata, false) !==
      policy.includeCompositionMetadata
  ) {
    throw new Error(`Markdown ${preset}: composition metadata drift`);
  }
  if (configFlag(c.useTerseFormat, true) !== policy.terseCodedValues) {
    throw new Error(`Markdown ${preset}: terse format drift`);
  }
  const envelope = preset !== "embedding";
  if (configFlag(c.includeFrontmatter, true) !== envelope) {
    throw new Error(`Markdown ${preset}: document envelope drift`);
  }
  const lossy = !policy.roundTrip;
  if (lossy !== (c.style !== "structural")) {
    throw new Error(`Markdown ${preset}: roundTrip/style drift`);
  }
  return policy;
}

/** Map shipped AsciiDoc preset config to shared RM policy (for parity tests). */
export function rmPolicyFromAsciidocConfig(
  preset: DocumentPresetId,
): DocumentPresetRmPolicy {
  const policy = DOCUMENT_PRESET_RM_POLICIES[preset];
  const c = ASCIIDOC_PRESET_CONFIGS[preset];
  if (
    configFlag(c.includeRedundantEntryMetadata, false) !==
      !policy.dedupeEntryMetadata
  ) {
    throw new Error(`AsciiDoc ${preset}: dedupeEntryMetadata drift`);
  }
  if (configFlag(c.includeArchetypeNodeIds, false) !== policy.archetypeNodeIds) {
    throw new Error(`AsciiDoc ${preset}: archetypeNodeIds drift`);
  }
  if (configFlag(c.includeTypeAnnotations, false) !== policy.rmTypeAnnotations) {
    throw new Error(`AsciiDoc ${preset}: type annotations drift`);
  }
  if (configFlag(c.includeNullFlavour, false) !== policy.includeNullFlavour) {
    throw new Error(`AsciiDoc ${preset}: null flavour drift`);
  }
  if (configFlag(c.includeEmptyFields, false) !== policy.includeEmptyFields) {
    throw new Error(`AsciiDoc ${preset}: empty fields drift`);
  }
  if (
    configFlag(c.includeCompositionMetadata, false) !==
      policy.includeCompositionMetadata
  ) {
    throw new Error(`AsciiDoc ${preset}: composition metadata drift`);
  }
  if (configFlag(c.useTerseFormat, true) !== policy.terseCodedValues) {
    throw new Error(`AsciiDoc ${preset}: terse format drift`);
  }
  const envelope = preset === "structural" || preset === "compact" ||
    preset === "wikilink";
  if (configFlag(c.includeHeader, false) !== envelope) {
    throw new Error(`AsciiDoc ${preset}: document envelope drift`);
  }
  const lossy = !policy.roundTrip;
  if (lossy !== (c.style !== "structural")) {
    throw new Error(`AsciiDoc ${preset}: roundTrip/style drift`);
  }
  return policy;
}

export function rmPoliciesAlignedForPreset(
  preset: DocumentPresetId,
): DocumentPresetRmPolicy {
  const md = rmPolicyFromMarkdownConfig(preset);
  const ad = rmPolicyFromAsciidocConfig(preset);
  if (JSON.stringify(md) !== JSON.stringify(ad)) {
    throw new Error(`RM policy mismatch for preset ${preset}`);
  }
  return md;
}
