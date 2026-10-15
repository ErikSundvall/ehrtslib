/**
 * Serialize ODIN-shaped values (from AOM mapper) back to ADL2 / ADL 1.4 ODIN text.
 */

import type { TermDefinitionTable } from "./odin_aom_mapper.ts";
import type { OdinObject, OdinValue } from "./odin_parser.ts";
import * as openehr_base from "../base/openehr_base.ts";

function escapeString(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Terminology code phrase form, e.g. ISO_639-1::en → [ISO_639-1::en] */
function looksLikeTerminologyCode(s: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_.-]*::.+$/.test(s);
}

function codeStringOf(
  lang: openehr_base.Terminology_code | undefined,
): string | undefined {
  if (!lang) return undefined;
  // Getters return plain strings (not String wrappers).
  const code = lang.code_string;
  return typeof code === "string" && code ? code : undefined;
}

function terminologyIdOf(
  lang: openehr_base.Terminology_code | undefined,
): string | undefined {
  if (!lang) return undefined;
  const id = lang.terminology_id;
  return typeof id === "string" && id ? id : undefined;
}

function formatCodePhrase(
  lang: openehr_base.Terminology_code | undefined,
): string | undefined {
  const code = codeStringOf(lang);
  if (!code) return undefined;
  const tid = terminologyIdOf(lang);
  return tid ? `[${tid}::${code}]` : `[${code}]`;
}

function isPlainObject(value: OdinValue): value is OdinObject {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    (value as { _type?: string })._type !== "interval";
}

function shouldQuoteOdinKey(key: string, val: OdinValue, obj: OdinObject): boolean {
  if (key.startsWith("[") || key.includes("[")) return true;
  if (isPlainObject(val)) return true;
  // Hash maps of primitives (original_author, author, …) use ["name"] keys.
  const values = Object.values(obj);
  return values.length > 0 &&
    values.every((v) =>
      v === null || v === undefined ||
      typeof v === "string" || typeof v === "number" || typeof v === "boolean"
    );
}

export function serializeOdinValue(
  value: OdinValue,
  indent: string,
  level: number,
  keyHint?: string,
): string {
  const pad = indent.repeat(level);
  if (value === null || value === undefined) {
    return "<>";
  }
  if (typeof value === "string") {
    if (
      (keyHint === "language" || keyHint === "lifecycle_state") &&
      looksLikeTerminologyCode(value)
    ) {
      return `<[${value}]>`;
    }
    return `<${escapeString(value)}>`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return `<${String(value)}>`;
  }
  if (Array.isArray(value)) {
    const parts = value.map((v) => serializeOdinPrimitiveInline(v));
    return `<${parts.join(", ")}>`;
  }
  if (typeof value === "object" && (value as { _type?: string })._type === "interval") {
    return "<|...|>";
  }
  const obj = value as OdinObject;
  let out = "<\n";
  for (const [key, val] of Object.entries(obj)) {
    const keyText = shouldQuoteOdinKey(key, val, obj)
      ? `[${escapeString(key)}]`
      : key;
    out += `${pad}${indent}${keyText} = ${
      serializeOdinValue(val, indent, level + 1, key).trimStart()
    }\n`;
  }
  out += `${pad}>`;
  return out;
}

function serializeOdinPrimitiveInline(value: OdinValue): string {
  if (typeof value === "string") return escapeString(value);
  return String(value);
}

export function serializeLanguageSection(
  lang: openehr_base.Terminology_code | undefined,
  indent: string,
  translations?: OdinValue,
): string {
  const phrase = formatCodePhrase(lang);
  if (!phrase && translations === undefined) {
    return "";
  }
  let out = "language\n";
  if (phrase) {
    out += `    original_language = <${phrase}>\n`;
  }
  if (translations !== undefined) {
    out += `    translations = ${serializeOdinValue(translations, indent, 2)}\n`;
  }
  return out + "\n";
}

export function serializeDescriptionSection(
  desc: openehr_base.RESOURCE_DESCRIPTION | undefined,
  indent: string,
): string {
  if (!desc) {
    return "";
  }
  const bag = desc as Record<string, OdinValue>;
  let out = "description\n";
  if (bag.original_author !== undefined) {
    out += `    original_author = ${serializeOdinValue(bag.original_author, indent, 2)}\n`;
  }
  if (bag.details !== undefined) {
    out += `    details = ${serializeOdinValue(bag.details, indent, 2)}\n`;
  }
  const lifeCode = codeStringOf(desc.lifecycle_state);
  if (lifeCode) {
    const lifeTid = terminologyIdOf(desc.lifecycle_state);
    const life = lifeTid && !looksLikeTerminologyCode(lifeCode)
      ? `[${lifeTid}::${lifeCode}]`
      : looksLikeTerminologyCode(lifeCode)
      ? `[${lifeCode}]`
      : escapeString(lifeCode);
    out += `    lifecycle_state = <${life}>\n`;
  }
  return out + "\n";
}

export function serializeTerminologySection(
  ontology: Record<string, unknown> | undefined,
  indent: string,
): string {
  const table = ontology?.term_definitions as TermDefinitionTable | undefined;
  if (!table || Object.keys(table).length === 0) {
    return "";
  }
  const keyed: OdinObject = {};
  for (const [lang, terms] of Object.entries(table)) {
    keyed[lang] = Object.fromEntries(
      Object.entries(terms).map(([code, t]) => [
        code,
        {
          text: t.text ?? "",
          ...(t.description ? { description: t.description } : {}),
        },
      ]),
    );
  }
  return `terminology\n    term_definitions = ${serializeOdinValue(keyed, indent, 2)}\n`;
}

export function serializeAnnotationsSection(
  documentation: OdinObject | undefined,
  indent: string,
): string {
  if (!documentation || Object.keys(documentation).length === 0) {
    return "";
  }
  return `annotations\n    documentation = ${
    serializeOdinValue(documentation, indent, 2).trimStart()
  }\n\n`;
}

export function serializeRmOverlaySection(
  rmVisibility: OdinObject | undefined,
  indent: string,
): string {
  if (!rmVisibility || Object.keys(rmVisibility).length === 0) {
    return "";
  }
  return `rm_overlay\n    rm_visibility = ${
    serializeOdinValue(rmVisibility, indent, 2).trimStart()
  }\n\n`;
}
