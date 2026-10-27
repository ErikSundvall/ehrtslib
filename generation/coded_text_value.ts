/**
 * Resolve DV_CODED_TEXT.value from defining_code and optional template labels.
 */

import { openehrCodeMeaning } from "../validation/rm_specification_validator.ts";

const INSTRUCTION_STATE_CODES = [
  "245",
  "524",
  "526",
  "527",
  "528",
  "529",
  "530",
  "531",
  "532",
  "533",
];

export type DefiningCodeLike = {
  code_string?: string;
  terminology_id?: { value?: string } | string;
};

export function terminologyIdValue(
  definingCode: DefiningCodeLike | undefined,
): string | undefined {
  const tid = definingCode?.terminology_id;
  if (typeof tid === "string") return tid;
  return tid?.value;
}

/**
 * English rubric for openEHR terminology codes; archetype/local label when
 * provided; otherwise the code string.
 */
export function resolveDvCodedTextValue(
  definingCode: DefiningCodeLike | undefined,
  options?: {
    /** Web Template / archetype list label for local codes. */
    templateLabel?: string;
    /** Archetype term text (composition language). */
    archetypeTerm?: string;
  },
): string {
  const code = definingCode?.code_string;
  if (!code) return "Generated coded value";
  const terminology = terminologyIdValue(definingCode);
  if (terminology === "openehr") {
    return openehrCodeMeaning(code) ?? code;
  }
  if (terminology === "local") {
    return options?.archetypeTerm ?? options?.templateLabel ?? code;
  }
  return options?.templateLabel ?? code;
}

/** Map ctx `action_ism_transition_current_state` text or code to an openEHR code. */
export function resolveInstructionStateCode(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^\d+$/.test(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  for (const code of INSTRUCTION_STATE_CODES) {
    if (openehrCodeMeaning(code)?.toLowerCase() === lower) return code;
  }
  return undefined;
}
