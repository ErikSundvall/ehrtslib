/**
 * Terse Format Parsing and Serialization
 * 
 * This module provides parsing and serialization functions for openEHR's
 * "terse" format, which is a compact string representation of coded terms.
 * 
 * References:
 * - https://discourse.openehr.org/t/simplified-data-template-sdt-data-types/546
 * - https://openehr.atlassian.net/wiki/spaces/spec/pages/624361477/Simplified+Serial+Formats+-+Data+Types
 * 
 * Formats:
 * - CODE_PHRASE: "terminology::code" (simple format with terminology and code only)
 * - DV_CODED_TEXT: "terminology::code|value|" (trailing pipe distinguishes from CODE_PHRASE)
 */

import { TERMINOLOGY_ID } from "./openehr_base.ts";
import { CODE_PHRASE, DV_CODED_TEXT } from "./openehr_rm.ts";

/**
 * Parse terse CODE_PHRASE format.
 * 
 * Format: terminology::code
 * 
 * Examples:
 * - "ISO_639-1::en"
 * - "ISO_3166-1::GB"
 * - "openehr::433"
 * 
 * Note: If you need to include a preferred_term, use object initialization instead.
 * The terse format only supports terminology_id and code_string.
 * 
 * @param terse - The terse format string
 * @returns Parsed CODE_PHRASE or null if format is invalid
 * 
 * @example
 * ```typescript
 * const cp = parseTerseCodePhrase("ISO_639-1::en");
 * console.log(cp.code_string); // "en"
 * console.log(cp.terminology_id.value); // "ISO_639-1"
 * ```
 */
export function parseTerseCodePhrase(terse: string): CODE_PHRASE | null {
  if (!terse || typeof terse !== 'string') {
    return null;
  }

  // Regex: terminology::code (no pipes allowed - those are for DV_CODED_TEXT)
  // Pattern: one or more non-colon characters, then ::, then one or more non-pipe characters
  const match = terse.match(/^([^:]+)::([^|]+)$/);
  
  if (!match) {
    return null;  // Not terse format
  }
  
  const codePhrase = new CODE_PHRASE();
  
  // terminology_id (required)
  const termId = new TERMINOLOGY_ID();
  termId.value = match[1].trim();
  codePhrase.terminology_id = termId;
  
  // code_string (required)
  codePhrase.code_string = match[2].trim();
  
  return codePhrase;
}

/**
 * Serialize CODE_PHRASE to terse format.
 * 
 * @param codePhrase - The CODE_PHRASE to serialize
 * @returns Terse format string
 * 
 * @example
 * ```typescript
 * const cp = new CODE_PHRASE();
 * cp.terminology_id = new TERMINOLOGY_ID();
 * cp.terminology_id.value = "ISO_639-1";
 * cp.code_string = "en";
 * console.log(toTerseCodePhrase(cp)); // "ISO_639-1::en"
 * ```
 */
export function toTerseCodePhrase(codePhrase: CODE_PHRASE): string {
  const termId = codePhrase.terminology_id?.value || "";
  const code = codePhrase.code_string || "";
  
  return `${termId}::${code}`;
}

/**
 * Parse terse DV_CODED_TEXT format.
 * 
 * Format: terminology::code|value|
 * 
 * The trailing pipe distinguishes DV_CODED_TEXT from CODE_PHRASE.
 * 
 * Examples:
 * - "openehr::433|event|"
 * - "SNOMED-CT::12345|diabetes mellitus|"
 * - "local::at0001|Present|"
 * 
 * @param terse - The terse format string
 * @returns Parsed DV_CODED_TEXT or null if format is invalid
 * 
 * @example
 * ```typescript
 * const dct = parseTerseDvCodedText("openehr::433|event|");
 * console.log(dct.value); // "event"
 * console.log(dct.defining_code.code_string); // "433"
 * console.log(dct.defining_code.terminology_id.value); // "openehr"
 * ```
 */
export function parseTerseDvCodedText(terse: string): DV_CODED_TEXT | null {
  if (!terse || typeof terse !== 'string') {
    return null;
  }

  // Regex: terminology::code|value| (must end with pipe)
  // Pattern: non-colon chars, ::, non-pipe chars, |, any non-pipe chars (value cannot contain pipes), |
  const match = terse.match(/^([^:]+)::([^|]+)\|([^|]*)\|$/);
  
  if (!match) {
    return null;  // Not terse format
  }
  
  const codedText = new DV_CODED_TEXT();
  
  // value (the human-readable text)
  codedText.value = match[3];
  
  // defining_code
  const definingCode = new CODE_PHRASE();
  
  const termId = new TERMINOLOGY_ID();
  termId.value = match[1].trim();
  definingCode.terminology_id = termId;
  
  definingCode.code_string = match[2].trim();
  
  codedText.defining_code = definingCode;
  
  return codedText;
}

/**
 * Serialize DV_CODED_TEXT to terse format.
 * 
 * @param codedText - The DV_CODED_TEXT to serialize
 * @returns Terse format string
 * 
 * @example
 * ```typescript
 * const dct = new DV_CODED_TEXT();
 * dct.value = "event";
 * dct.defining_code = new CODE_PHRASE();
 * dct.defining_code.terminology_id = new TERMINOLOGY_ID();
 * dct.defining_code.terminology_id.value = "openehr";
 * dct.defining_code.code_string = "433";
 * console.log(toTerseDvCodedText(dct)); // "openehr::433|event|"
 * ```
 */
export function toTerseDvCodedText(codedText: DV_CODED_TEXT): string {
  const termId = codedText.defining_code?.terminology_id?.value || "";
  const code = codedText.defining_code?.code_string || "";
  const value = codedText.value || "";
  
  return `${termId}::${code}|${value}|`;
}

/**
 * Check if a string looks like it could be a terse CODE_PHRASE format.
 * This is a quick check that doesn't validate the content.
 * 
 * @param str - The string to check
 * @returns True if the string matches the pattern
 */
export function isTerseCodePhrase(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }
  return /^[^:]+::[^|]+$/.test(str);
}

/**
 * Check if a string looks like it could be a terse DV_CODED_TEXT format.
 * This is a quick check that doesn't validate the content.
 * 
 * @param str - The string to check
 * @returns True if the string matches the pattern
 */
export function isTerseDvCodedText(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }
  return /^[^:]+::[^|]+\|[^|]*\|$/.test(str);
}
