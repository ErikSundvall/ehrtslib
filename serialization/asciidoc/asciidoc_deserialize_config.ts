import type { openehr_am } from "../../am/openehr_am.ts";

export const LOSSLESS_ASCIIDOC_DIALECT = "lossless" as const;

export interface AsciidocDeserializationConfig {
  dialect?: typeof LOSSLESS_ASCIIDOC_DIALECT;
  validateAgainstTemplate?: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE;
}

export const DEFAULT_ASCIIDOC_DESERIALIZATION_CONFIG: Required<
  Omit<AsciidocDeserializationConfig, "validateAgainstTemplate">
> & Pick<AsciidocDeserializationConfig, "validateAgainstTemplate"> = {
  dialect: LOSSLESS_ASCIIDOC_DIALECT,
};
