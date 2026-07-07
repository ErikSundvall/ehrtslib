/**
 * Detect whether input is canonical openEHR or zipehr (j/y variant).
 */

import { parse as parseYaml } from "yaml";
import { isSymbolKey } from "./shared.ts";

export type ZipehrVariant = "j-zipehr" | "y-zipehr";

export type InputDetectionResult =
  | { kind: "canonical"; format: "json" | "yaml" | "xml" }
  | { kind: "zipehr"; variant: ZipehrVariant }
  | { kind: "unknown" };

function hasZipehrMarkers(obj: unknown): boolean {
  if (obj === null || typeof obj !== "object") return false;
  if (Array.isArray(obj)) return obj.some(hasZipehrMarkers);
  const record = obj as Record<string, unknown>;
  for (const k of Object.keys(record)) {
    if (isSymbolKey(k)) return true;
    if (
      k === "_" && typeof record[k] === "string" &&
      isSymbolKey(record[k] as string)
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

function looksLikeXml(text: string): boolean {
  return text.trim().startsWith("<");
}

/**
 * Auto-detect input format. Zipehr j variant is flow-style text (often parsed as YAML);
 * y variant is block/flow YAML with emoji keys.
 */
export function detectInputFormat(text: string): InputDetectionResult {
  const trimmed = text.trim();
  if (!trimmed) return { kind: "unknown" };

  if (looksLikeXml(trimmed)) {
    return { kind: "canonical", format: "xml" };
  }

  // Try YAML parse first (handles both y-zipehr and flow-style j-zipehr)
  if (looksLikeYaml(trimmed) || trimmed.startsWith("{")) {
    try {
      const parsed = parseYaml(trimmed);
      if (parsed && typeof parsed === "object") {
        if (hasZipehrMarkers(parsed)) {
          const variant: ZipehrVariant = looksLikeYaml(trimmed) &&
              !trimmed.startsWith("{")
            ? "y-zipehr"
            : "j-zipehr";
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

  // Strict JSON
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") {
      if (hasZipehrMarkers(parsed)) {
        return { kind: "zipehr", variant: "j-zipehr" };
      }
      if (hasCanonicalTypeMarker(parsed)) {
        return { kind: "canonical", format: "json" };
      }
    }
  } catch {
    // fall through
  }

  // Heuristic: symbol keys in raw text → zipehr. ZipEHR also uses
  // non-emoji symbols such as Ⓣ and Ⓐ for archetype details.
  if (/[^\x00-\x7F]/u.test(trimmed)) {
    const variant: ZipehrVariant =
      looksLikeYaml(trimmed) && !trimmed.startsWith("{")
        ? "y-zipehr"
        : "j-zipehr";
    return { kind: "zipehr", variant };
  }

  return { kind: "unknown" };
}

/** Parse zipehr input text to a plain object (YAML parser accepts flow-style j-zipehr). */
export function parseZipehrText(text: string): unknown {
  const trimmed = text.trim();
  const attempts = [
    trimmed,
    quoteSymbolKeysForJson(trimmed),
  ];
  let lastError: unknown;
  let firstYamlError: unknown;
  for (const candidate of attempts) {
    try {
      const parsed = parseYaml(candidate);
      if (parsed !== null && parsed !== undefined) return parsed;
    } catch (error) {
      firstYamlError ??= error;
      lastError = error;
      // try next
    }
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
      // try next
    }
  }
  try {
    return parseSimpleYamlSubset(trimmed);
  } catch (error) {
    lastError = error;
  }
  const reported = firstYamlError ?? lastError;
  const detail = reported instanceof Error ? `: ${reported.message}` : "";
  throw new Error(`Unable to parse ZipEHR input as YAML or JSON${detail}`);
}

/** Quote non-ASCII / emoji keys so flow-style j-zipehr can be parsed as JSON. */
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
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if ((ch === `"` || ch === "'") && text[i - 1] !== "\\") {
      quote = quote === ch ? null : quote ?? ch;
    }
    if (ch === ":" && quote === null) return i;
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
