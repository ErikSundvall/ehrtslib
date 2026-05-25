/**
 * Serialize ODIN-shaped values (from AOM mapper) back to ADL2 ODIN text.
 */

import type { TermDefinitionTable } from "./odin_aom_mapper.ts";
import type { OdinObject, OdinValue } from "./odin_parser.ts";
import * as openehr_base from "../openehr_base.ts";

function escapeString(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function serializeOdinValue(value: OdinValue, indent: string, level: number): string {
  const pad = indent.repeat(level);
  if (value === null || value === undefined) {
    return "<>";
  }
  if (typeof value === "string") {
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
  const isKeyed = Object.keys(obj).every((k) => k.startsWith("[") || !k.includes("="));
  let out = "<\n";
  for (const [key, val] of Object.entries(obj)) {
    if (key.includes("[") || Object.keys(obj).length > 0 && typeof val === "object" && !Array.isArray(val)) {
      out += `${pad}${indent}[${escapeString(key)}] = ${serializeOdinValue(val, indent, level + 1).trimStart()}\n`;
    } else {
      out += `${pad}${indent}${key} = ${serializeOdinValue(val, indent, level + 1).trimStart()}\n`;
    }
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
): string {
  if (!lang?.code_string?.value) {
    return "";
  }
  const code = lang.terminology_id?.value
    ? `[${lang.terminology_id.value}::${lang.code_string.value}]`
    : escapeString(lang.code_string.value);
  return `language\n    original_language = <${code}>\n\n`;
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
  if (desc.lifecycle_state?.code_string?.value) {
    out += `    lifecycle_state = <${escapeString(desc.lifecycle_state.code_string.value)}>\n`;
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
