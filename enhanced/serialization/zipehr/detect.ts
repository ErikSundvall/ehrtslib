/**
 * Detect whether input is canonical openEHR or zipehr (`zipehr.json` / `zipehr.yaml` variants).
 */

import { parse as parseYaml } from "yaml";
// Detection needs to understand both emoji and ASCII lettercode symbol keys.
import {
  stripZipehrJsonSchemaProperty,
  stripZipehrYamlSchemaDirective,
} from "./schema.ts";
import { SYMBOL_TABLE_EMOJI_SYMBOLS, SYMBOL_TABLE_LETTER_SYMBOLS } from "./symbol_table.ts";

const LETTER_CLASS_TOKENS = new Set<string>([
  ...Object.values(SYMBOL_TABLE_LETTER_SYMBOLS),
  "PE",
  "IE",
]);

const KNOWN_ZIPEHR_SYMBOL_KEYS = new Set<string>([
  ...Object.values(SYMBOL_TABLE_EMOJI_SYMBOLS),
  ...Object.values(SYMBOL_TABLE_LETTER_SYMBOLS),
]);

export type ZipehrVariant = "zipehr.json" | "zipehr.yaml" | "zipehr.xhtml";

export type InputDetectionResult =
  | { kind: "canonical"; format: "json" | "yaml" | "xml" }
  | { kind: "zipehr"; variant: ZipehrVariant }
  | { kind: "unknown" };

function hasZipehrMarkers(obj: unknown): boolean {
  if (obj === null || typeof obj !== "object") return false;
  if (Array.isArray(obj)) return obj.some(hasZipehrMarkers);
  const record = obj as Record<string, unknown>;
  for (const k of Object.keys(record)) {
    if (KNOWN_ZIPEHR_SYMBOL_KEYS.has(k)) return true;
    if (
      k === "_" && typeof record[k] === "string" &&
      KNOWN_ZIPEHR_SYMBOL_KEYS.has(record[k] as string)
    ) {
      return true;
    }
    if (hasZipehrMarkers(record[k])) return true;
  }
  return false;
}

function hasCanonicalTypeMarker(obj: unknown): boolean {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(obj, "_type");
}

function looksLikeYaml(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return false;
  return /^[\w#>-]/.test(trimmed) || trimmed.includes(":\n") ||
    /^[\s]*[\w\p{Emoji}]/u.test(trimmed);
}

function looksLikeZipehrXhtml(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.startsWith("<")) return false;
  if (trimmed.includes('xmlns="http://www.w3.org/1999/xhtml"')) return true;
  if (trimmed.includes("xmlns='http://www.w3.org/1999/xhtml'")) return true;
  return /<div\b[^>]*\bclass="([A-Za-z]{1,3})"/.test(trimmed) &&
    [...trimmed.matchAll(/\bclass="([^"]+)"/g)]
      .some((match) => LETTER_CLASS_TOKENS.has(match[1]));
}

function looksLikeXml(text: string): boolean {
  return text.trim().startsWith("<");
}

/**
 * Auto-detect input format.
 * - `zipehr.json` is flow-style text (often parsed as YAML)
 * - `zipehr.yaml` is block/flow YAML with emoji keys
 */
export function detectInputFormat(text: string): InputDetectionResult {
  const { text: withoutYamlDirective } = stripZipehrYamlSchemaDirective(text);
  const trimmed = withoutYamlDirective.trim();
  if (!trimmed) return { kind: "unknown" };

  if (looksLikeXml(trimmed)) {
    if (looksLikeZipehrXhtml(trimmed)) {
      return { kind: "zipehr", variant: "zipehr.xhtml" };
    }
    return { kind: "canonical", format: "xml" };
  }

  // Strict JSON first, so JSON-looking `zipehr.json` never depends on the YAML parser.
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      const { obj } = stripZipehrJsonSchemaProperty(parsed);
      if (obj && typeof obj === "object") {
        if (hasZipehrMarkers(obj)) {
          return { kind: "zipehr", variant: "zipehr.json" };
        }
        if (hasCanonicalTypeMarker(obj)) {
          return { kind: "canonical", format: "json" };
        }
      }
    } catch {
      // fall through
    }
  }

  // Generated ZipEHR YAML uses a small YAML subset with block maps/sequences
  // and flow maps. Parse that before falling back to the full YAML package.
  if (looksLikeYaml(trimmed)) {
    try {
      const parsed = parseSimpleYamlSubset(trimmed);
      if (parsed && typeof parsed === "object") {
        if (hasZipehrMarkers(parsed)) {
          return { kind: "zipehr", variant: "zipehr.yaml" };
        }
        if (hasCanonicalTypeMarker(parsed)) {
          return { kind: "canonical", format: "yaml" };
        }
      }
    } catch {
      // fall through
    }
  }

  // Try YAML parse for inputs outside the simple subset.
  if (looksLikeYaml(trimmed) || trimmed.startsWith("{")) {
    try {
      const parsed = parseYaml(trimmed);
      if (parsed && typeof parsed === "object") {
        if (hasZipehrMarkers(parsed)) {
          const variant: ZipehrVariant = looksLikeYaml(trimmed) && !trimmed.startsWith("{")
            ? "zipehr.yaml"
            : "zipehr.json";
          return { kind: "zipehr", variant };
        }
        if (hasCanonicalTypeMarker(parsed)) {
          return {
            kind: "canonical",
            format: looksLikeYaml(trimmed) && !trimmed.startsWith("{")
              ? "yaml"
              : "json",
          };
        }
      }
    } catch {
      // fall through
    }
  }

  // Heuristic: symbol keys in raw text → zipehr. ZipEHR also uses
  // non-emoji symbols such as Ⓣ and Ⓐ for archetype details.
  if (/[^\x00-\x7F]/u.test(trimmed)) {
    const variant: ZipehrVariant = looksLikeYaml(trimmed) && !trimmed.startsWith("{")
      ? "zipehr.yaml"
      : "zipehr.json";
    return { kind: "zipehr", variant };
  }

  return { kind: "unknown" };
}

export type ZipehrParseResult = {
  parsed: unknown;
  hadDeclaration: boolean;
  declarationMismatch: boolean;
};

/** Parse zipehr input text to a plain object (YAML parser accepts flow-style `zipehr.json`). */
export function parseZipehrTextWithMeta(text: string): ZipehrParseResult {
  const yamlStripped = stripZipehrYamlSchemaDirective(text);
  const trimmed = yamlStripped.text.trim();
  let hadDeclaration = yamlStripped.hadDeclaration;
  let declarationMismatch = yamlStripped.declarationMismatch;

  const attempts = [
    trimmed,
    quoteSymbolKeysForJson(trimmed),
  ];
  let lastError: unknown;
  let firstYamlError: unknown;
  for (const candidate of attempts) {
    if (candidate.startsWith("{") || candidate.startsWith("[")) {
      try {
        const parsed = JSON.parse(candidate);
        const jsonStripped = stripZipehrJsonSchemaProperty(parsed);
        hadDeclaration ||= jsonStripped.hadDeclaration;
        declarationMismatch ||= jsonStripped.declarationMismatch;
        return {
          parsed: jsonStripped.obj,
          hadDeclaration,
          declarationMismatch,
        };
      } catch (error) {
        lastError = error;
        // try next
      }
    }
    try {
      const parsed = parseSimpleYamlSubset(candidate);
      const jsonStripped = stripZipehrJsonSchemaProperty(parsed);
      hadDeclaration ||= jsonStripped.hadDeclaration;
      declarationMismatch ||= jsonStripped.declarationMismatch;
      return {
        parsed: jsonStripped.obj,
        hadDeclaration,
        declarationMismatch,
      };
    } catch (error) {
      lastError = error;
      // try next
    }
    try {
      const parsed = parseYaml(candidate);
      if (parsed !== null && parsed !== undefined) {
        const jsonStripped = stripZipehrJsonSchemaProperty(parsed);
        hadDeclaration ||= jsonStripped.hadDeclaration;
        declarationMismatch ||= jsonStripped.declarationMismatch;
        return {
          parsed: jsonStripped.obj,
          hadDeclaration,
          declarationMismatch,
        };
      }
    } catch (error) {
      firstYamlError ??= error;
      lastError = error;
      // try next
    }
  }
  const reported = firstYamlError ?? lastError;
  const detail = reported instanceof Error ? `: ${reported.message}` : "";
  throw new Error(`Unable to parse ZipEHR input as YAML or JSON${detail}`);
}

export function parseZipehrText(text: string): unknown {
  return parseZipehrTextWithMeta(text).parsed;
}

/** Quote non-ASCII / emoji keys so flow-style `zipehr.json` can be parsed as JSON. */
function quoteSymbolKeysForJson(text: string): string {
  return text.replace(
    /(^|[{\[,]\s*|\n\s*)([^\s"'{}\[\],:][^:\n]*?):/g,
    (match, prefix, key) => {
      const k = String(key).trim();
      if (!k || k.startsWith('"') || k.startsWith("'")) return match;
      if (/^[\w$-]+$/.test(k)) return match;
      return `${prefix}"${k}":`;
    },
  );
}

type SimpleYamlLine = { indent: number; text: string };

function parseSimpleYamlSubset(text: string): unknown {
  const lines = text.split(/\r?\n/)
    .filter((line) => line.trim() !== "" && !line.trimStart().startsWith("#"))
    .map((line) => ({
      indent: line.match(/^ */)?.[0].length ?? 0,
      text: line.trim(),
    }));
  if (lines.length === 0) return {};
  const [value, index] = parseSimpleYamlBlock(lines, 0, lines[0].indent);
  if (index < lines.length) {
    throw new Error(`Unexpected YAML content: ${lines[index].text}`);
  }
  return value;
}

function parseSimpleYamlBlock(
  lines: SimpleYamlLine[],
  index: number,
  indent: number,
): [unknown, number] {
  if (lines[index]?.text.startsWith("- ")) {
    return parseSimpleYamlSeq(lines, index, indent);
  }
  return parseSimpleYamlMap(lines, index, indent);
}

function parseSimpleYamlMap(
  lines: SimpleYamlLine[],
  index: number,
  indent: number,
): [Record<string, unknown>, number] {
  const out: Record<string, unknown> = {};
  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) break;
    if (line.indent > indent) {
      throw new Error(`Unexpected indentation before: ${line.text}`);
    }
    if (line.text.startsWith("- ")) break;

    const [key, rest] = splitSimpleYamlPair(line.text);
    index++;
    if (rest === "") {
      if (index < lines.length && lines[index].indent > line.indent) {
        const parsed = parseSimpleYamlBlock(lines, index, lines[index].indent);
        out[key] = parsed[0];
        index = parsed[1];
      } else {
        out[key] = {};
      }
    } else {
      out[key] = parseSimpleYamlScalar(rest);
    }
  }
  return [out, index];
}

function parseSimpleYamlSeq(
  lines: SimpleYamlLine[],
  index: number,
  indent: number,
): [unknown[], number] {
  const out: unknown[] = [];
  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) break;
    if (line.indent !== indent || !line.text.startsWith("- ")) break;

    const itemText = line.text.slice(2).trim();
    index++;
    let item: unknown;
    if (itemText === "") {
      const parsed = parseSimpleYamlBlock(lines, index, lines[index].indent);
      item = parsed[0];
      index = parsed[1];
    } else if (looksLikeSimpleYamlPair(itemText)) {
      const [key, rest] = splitSimpleYamlPair(itemText);
      const obj: Record<string, unknown> = {};
      if (
        rest === "" && index < lines.length && lines[index].indent > line.indent
      ) {
        const parsed = parseSimpleYamlBlock(lines, index, lines[index].indent);
        obj[key] = parsed[0];
        index = parsed[1];
      } else {
        obj[key] = parseSimpleYamlScalar(rest);
      }
      if (index < lines.length && lines[index].indent > line.indent) {
        const parsed = parseSimpleYamlMap(lines, index, lines[index].indent);
        Object.assign(obj, parsed[0]);
        index = parsed[1];
      }
      item = obj;
    } else {
      item = parseSimpleYamlScalar(itemText);
    }
    out.push(item);
  }
  return [out, index];
}

function looksLikeSimpleYamlPair(text: string): boolean {
  return findSimpleYamlColon(text) >= 0;
}

function splitSimpleYamlPair(text: string): [string, string] {
  const colon = findSimpleYamlColon(text);
  if (colon < 0) throw new Error(`Expected YAML key/value pair: ${text}`);
  const key = parseSimpleYamlKey(text.slice(0, colon).trim());
  const rest = text.slice(colon + 1).trim();
  return [key, rest];
}

function findSimpleYamlColon(text: string): number {
  let quote: string | null = null;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if ((ch === `"` || ch === "'") && text[i - 1] !== "\\") {
      quote = quote === ch ? null : quote ?? ch;
    }
    if (quote === null) {
      if (ch === "{" || ch === "[") depth++;
      if (ch === "}" || ch === "]") depth--;
    }
    if (ch === ":" && quote === null && depth === 0) return i;
  }
  return -1;
}

function parseSimpleYamlKey(text: string): string {
  if (text.startsWith('"') || text.startsWith("'")) {
    return String(parseSimpleYamlScalar(text));
  }
  return text;
}

function parseSimpleYamlScalar(text: string): unknown {
  if (text === "") return "";
  if (text === "null" || text === "~") return null;
  if (text === "true") return true;
  if (text === "false") return false;
  if (text.startsWith("{") && text.endsWith("}")) {
    return parseSimpleFlowMap(text);
  }
  if (text.startsWith("[") && text.endsWith("]")) {
    return parseSimpleFlowSeq(text);
  }
  if (text.startsWith('"')) return JSON.parse(text);
  if (text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1).replace(/''/g, "'");
  }
  const numberValue = Number(text);
  if (text !== "" && Number.isFinite(numberValue) && /^[-+]?\d/.test(text)) {
    return numberValue;
  }
  return text;
}

function parseSimpleFlowMap(text: string): Record<string, unknown> {
  const inner = text.slice(1, -1).trim();
  if (inner === "") return {};

  const out: Record<string, unknown> = {};
  for (const part of splitSimpleFlowItems(inner)) {
    const colon = findSimpleYamlColon(part);
    if (colon < 0) throw new Error(`Expected flow map pair: ${part}`);
    const key = parseSimpleYamlKey(part.slice(0, colon).trim());
    const value = part.slice(colon + 1).trim();
    out[key] = parseSimpleYamlScalar(value);
  }
  return out;
}

function parseSimpleFlowSeq(text: string): unknown[] {
  const inner = text.slice(1, -1).trim();
  if (inner === "") return [];
  return splitSimpleFlowItems(inner).map(parseSimpleYamlScalar);
}

function splitSimpleFlowItems(text: string): string[] {
  const out: string[] = [];
  let quote: string | null = null;
  let depth = 0;
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if ((ch === `"` || ch === "'") && text[i - 1] !== "\\") {
      quote = quote === ch ? null : quote ?? ch;
      continue;
    }
    if (quote !== null) continue;
    if (ch === "{" || ch === "[") {
      depth++;
      continue;
    }
    if (ch === "}" || ch === "]") {
      depth--;
      continue;
    }
    if (ch === "," && depth === 0) {
      out.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }

  out.push(text.slice(start).trim());
  return out.filter((part) => part !== "");
}
