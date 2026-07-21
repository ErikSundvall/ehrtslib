/**
 * Terse Format Parsing and Serialization (RM class adapters)
 *
 * Wire grammar lives in `terse_strings.ts`. This module builds / reads
 * CODE_PHRASE and DV_CODED_TEXT class instances.
 *
 * References:
 * - https://discourse.openehr.org/t/simplified-data-template-sdt-data-types/546
 * - https://openehr.atlassian.net/wiki/spaces/spec/pages/624361477/Simplified+Serial+Formats+-+Data+Types
 */

import { TERMINOLOGY_ID } from "./openehr_base.ts";
import { CODE_PHRASE, DV_CODED_TEXT } from "./openehr_rm.ts";
import {
  formatTerseCodePhrase,
  formatTerseDvCodedText,
  isTerseCodePhraseString,
  isTerseDvCodedTextString,
  matchTerseCodePhrase,
  matchTerseDvCodedText,
} from "./terse_strings.ts";

export {
  formatTerseCodePhrase,
  formatTerseDvCodedText,
  isTerseCodePhraseString,
  isTerseDvCodedTextString,
  matchTerseCodePhrase,
  matchTerseDvCodedText,
} from "./terse_strings.ts";

/**
 * Parse terse CODE_PHRASE format (`terminology::code`).
 */
export function parseTerseCodePhrase(terse: string): CODE_PHRASE | null {
  const parts = matchTerseCodePhrase(terse);
  if (!parts) return null;

  const codePhrase = new CODE_PHRASE();
  const termId = new TERMINOLOGY_ID();
  termId.value = parts.termId;
  codePhrase.terminology_id = termId;
  codePhrase.code_string = parts.code;
  return codePhrase;
}

/** Serialize CODE_PHRASE to terse format. */
export function toTerseCodePhrase(codePhrase: CODE_PHRASE): string {
  const termId = codePhrase.terminology_id?.value || "";
  const code = codePhrase.code_string || "";
  return formatTerseCodePhrase(termId, code);
}

/**
 * Parse terse DV_CODED_TEXT format (`terminology::code|value|`).
 */
export function parseTerseDvCodedText(terse: string): DV_CODED_TEXT | null {
  const parts = matchTerseDvCodedText(terse);
  if (!parts) return null;

  const codedText = new DV_CODED_TEXT();
  codedText.value = parts.value;
  const definingCode = new CODE_PHRASE();
  const termId = new TERMINOLOGY_ID();
  termId.value = parts.termId;
  definingCode.terminology_id = termId;
  definingCode.code_string = parts.code;
  codedText.defining_code = definingCode;
  return codedText;
}

/** Serialize DV_CODED_TEXT to terse format. */
export function toTerseDvCodedText(codedText: DV_CODED_TEXT): string {
  const termId = codedText.defining_code?.terminology_id?.value || "";
  const code = codedText.defining_code?.code_string || "";
  const value = codedText.value || "";
  return formatTerseDvCodedText(termId, code, value);
}

/** Quick check for terse CODE_PHRASE shape. */
export function isTerseCodePhrase(str: string): boolean {
  return isTerseCodePhraseString(str);
}

/** Quick check for terse DV_CODED_TEXT shape. */
export function isTerseDvCodedText(str: string): boolean {
  return isTerseDvCodedTextString(str);
}
