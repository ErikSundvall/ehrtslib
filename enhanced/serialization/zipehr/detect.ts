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
    if (k === "_" && typeof record[k] === "string" && isSymbolKey(record[k] as string)) {
      return true;
    }
    if (hasZipehrMarkers(record[k])) return true;
  }
  return false;
}

function hasCanonicalTypeMarker(obj: unknown): boolean {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return false;
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

  // Heuristic: emoji keys in raw text → zipehr
  if (/[\u{1F300}-\u{1FAFF}]/u.test(trimmed)) {
    const variant: ZipehrVariant = looksLikeYaml(trimmed) && !trimmed.startsWith("{")
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
  for (const candidate of attempts) {
    try {
      const parsed = parseYaml(candidate);
      if (parsed !== null && parsed !== undefined) return parsed;
    } catch {
      // try next
    }
    try {
      return JSON.parse(candidate);
    } catch {
      // try next
    }
  }
  throw new Error("Unable to parse ZipEHR input as YAML or JSON");
}

/** Quote non-ASCII / emoji keys so flow-style j-zipehr can be parsed as JSON. */
function quoteSymbolKeysForJson(text: string): string {
  return text.replace(
    /(^|[{\[,]\s*)([^\s"'{}\[\],:][^:]*?):/g,
    (match, prefix, key) => {
      const k = String(key).trim();
      if (!k || k.startsWith('"') || k.startsWith("'")) return match;
      if (/^[\w$-]+$/.test(k)) return match;
      return `${prefix}"${k}":`;
    },
  );
}
