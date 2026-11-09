/**
 * Demo links to GitHub document-preset documentation (main branch).
 */
export {
  DOCUMENT_PRESET_DOC_ANCHORS,
  DOCUMENT_PRESET_DOC_GITHUB_BASE,
  DOCUMENT_PRESET_IDS,
  documentPresetDocUrl,
  type DocumentPresetId,
} from "../../../serialization/documents_common/document_preset_rules.ts";

export const DOCUMENT_PRESET_SELECT_IDS = [
  "markdown-config-preset",
  "asciidoc-config-preset",
] as const;

export const DEMO_DOCUMENT_PRESET_OPTION_VALUES = [
  "structural",
  "compact",
  "embedding",
  "wikilink",
] as const;
