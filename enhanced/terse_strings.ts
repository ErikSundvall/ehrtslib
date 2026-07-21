/**
 * String-only terse CODE_PHRASE / DV_CODED_TEXT grammar.
 *
 * Pure parse/format helpers with no RM class dependency. Class-instance adapters
 * live in `terse_format.ts`; ZipEHR plain-object paths use these directly.
 *
 * Formats:
 * - CODE_PHRASE: `terminology::code`
 * - DV_CODED_TEXT: `terminology::code|value|` (trailing pipe required)
 */

export type TerseCodePhraseParts = {
  termId: string;
  code: string;
};

export type TerseDvCodedTextParts = TerseCodePhraseParts & {
  value: string;
};

const CODE_PHRASE_RE = /^([^:]+)::([^|]+)$/;
const DV_CODED_TEXT_RE = /^([^:]+)::([^|]+)\|([^|]*)\|$/;

/** True when `str` matches terse CODE_PHRASE shape (not DV_CODED_TEXT). */
export function isTerseCodePhraseString(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  return CODE_PHRASE_RE.test(str);
}

/** True when `str` matches terse DV_CODED_TEXT shape. */
export function isTerseDvCodedTextString(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  return DV_CODED_TEXT_RE.test(str);
}

/** Parse `terminology::code` into parts, or null. */
export function matchTerseCodePhrase(
  terse: string,
): TerseCodePhraseParts | null {
  if (!terse || typeof terse !== "string") return null;
  const match = terse.match(CODE_PHRASE_RE);
  if (!match) return null;
  return { termId: match[1].trim(), code: match[2].trim() };
}

/** Parse `terminology::code|value|` into parts, or null. */
export function matchTerseDvCodedText(
  terse: string,
): TerseDvCodedTextParts | null {
  if (!terse || typeof terse !== "string") return null;
  const match = terse.match(DV_CODED_TEXT_RE);
  if (!match) return null;
  return {
    termId: match[1].trim(),
    code: match[2].trim(),
    value: match[3],
  };
}

export function formatTerseCodePhrase(termId: string, code: string): string {
  return `${termId}::${code}`;
}

export function formatTerseDvCodedText(
  termId: string,
  code: string,
  value: string,
): string {
  return `${termId}::${code}|${value}|`;
}
