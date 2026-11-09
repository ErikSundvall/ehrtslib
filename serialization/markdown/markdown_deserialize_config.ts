/**
 * Markdown deserialization configuration (structural / lossless dialect).
 */

import type { openehr_am } from "../../am/openehr_am.ts";

export const STRUCTURAL_MARKDOWN_DIALECT = "structural" as const;

export interface MarkdownDeserializationConfig {
  /** Only `structural` is accepted for lossless parsing today. */
  dialect?: typeof STRUCTURAL_MARKDOWN_DIALECT;
  validateAgainstTemplate?: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE;
}

export const DEFAULT_MARKDOWN_DESERIALIZATION_CONFIG: Required<
  Omit<MarkdownDeserializationConfig, "validateAgainstTemplate">
> & Pick<MarkdownDeserializationConfig, "validateAgainstTemplate"> = {
  dialect: STRUCTURAL_MARKDOWN_DIALECT,
};
