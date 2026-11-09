/**
 * Parse human-oriented value strings from Markdown/AsciiDoc back into plain RM values.
 */

import {
  isTerseCodePhraseString,
  isTerseDvCodedTextString,
  matchTerseCodePhrase,
  matchTerseDvCodedText,
} from "../terse_strings.ts";

const BRACKET_CODE_RE = /\[([^:\]]+)::([^\]]+)\]\s*$/;
const DV_QUANTITY_RE = /^(-?\d+(?:\.\d+)?)\s+(.+)$/;

export function parseCodePhraseDisplay(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (isTerseCodePhraseString(trimmed)) {
    const parts = matchTerseCodePhrase(trimmed);
    if (!parts) return null;
    return {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: parts.termId },
      code_string: parts.code,
    };
  }
  const m = trimmed.match(BRACKET_CODE_RE);
  if (m) {
    return {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: m[1] },
      code_string: m[2],
    };
  }
  return null;
}

export function parseDvCodedTextDisplay(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (isTerseDvCodedTextString(trimmed)) {
    const parts = matchTerseDvCodedText(trimmed);
    if (!parts) return null;
    return {
      _type: "DV_CODED_TEXT",
      value: parts.value,
      defining_code: {
        _type: "CODE_PHRASE",
        terminology_id: { _type: "TERMINOLOGY_ID", value: parts.termId },
        code_string: parts.code,
      },
    };
  }
  const codeIdx = trimmed.search(BRACKET_CODE_RE);
  if (codeIdx >= 0) {
    const valuePart = trimmed.slice(0, codeIdx).trim();
    const codeMatch = trimmed.slice(codeIdx).match(BRACKET_CODE_RE);
    if (codeMatch) {
      return {
        _type: "DV_CODED_TEXT",
        value: valuePart,
        defining_code: {
          _type: "CODE_PHRASE",
          terminology_id: { _type: "TERMINOLOGY_ID", value: codeMatch[1] },
          code_string: codeMatch[2],
        },
      };
    }
  }
  return null;
}

/**
 * Infer a data value plain object from a formatted display string (structural dialect).
 */
export function parseDataValueDisplay(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed || trimmed === "—") {
    return { _type: "DV_TEXT", value: "" };
  }

  if (trimmed === "true" || trimmed === "false") {
    return { _type: "DV_BOOLEAN", value: trimmed === "true" };
  }

  const coded = parseDvCodedTextDisplay(trimmed);
  if (coded) return coded;

  const qty = trimmed.match(DV_QUANTITY_RE);
  if (qty) {
    return {
      _type: "DV_QUANTITY",
      magnitude: Number(qty[1]),
      units: qty[2].trim(),
    };
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    return { _type: "DV_DATE_TIME", value: trimmed };
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { _type: "DV_DATE", value: trimmed };
  }
  if (/^\d{2}:\d{2}/.test(trimmed)) {
    return { _type: "DV_TIME", value: trimmed };
  }

  if (/^P[^\s]+|^PT/.test(trimmed)) {
    return { _type: "DV_DURATION", value: trimmed };
  }

  const cp = parseCodePhraseDisplay(trimmed);
  if (cp) return cp;

  return { _type: "DV_TEXT", value: trimmed };
}
