/**
 * Map parsed ODIN trees to AOM / BASE resource objects.
 */

import type { OdinObject, OdinValue } from "./odin_parser.ts";
import * as openehr_am from "../openehr_am.ts";
import * as openehr_base from "../openehr_base.ts";

export type TermDefinitionTable = Record<
  string,
  Record<string, { text?: string; description?: string }>
>;

function odinString(value: OdinValue): string | undefined {
  if (typeof value === "string") {
    return value.replace(/^["']|["']$/g, "");
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

function terminologyCodeFromAdlString(adlCode: string): openehr_base.Terminology_code {
  const tc = new openehr_base.Terminology_code();
  const parts = adlCode.split("::");
  if (parts.length >= 2) {
    tc.terminology_id = openehr_base.String.from(parts[0]);
    tc.code_string = openehr_base.String.from(parts.slice(1).join("::"));
  } else {
    tc.code_string = openehr_base.String.from(adlCode);
  }
  return tc;
}

export function mapOriginalLanguage(
  languageData: OdinObject,
): openehr_base.Terminology_code | undefined {
  const raw = languageData.original_language;
  if (raw === undefined) return undefined;
  let code: string | undefined;
  if (typeof raw === "string") {
    code = odinString(raw);
  } else if (Array.isArray(raw) && raw.length > 0) {
    code = odinString(raw[0]);
  }
  if (!code) return undefined;
  return terminologyCodeFromAdlString(code);
}

/**
 * Map description ODIN to RESOURCE_DESCRIPTION (dynamic fields where BMM uses undefined).
 */
export function mapDescription(
  descriptionData: OdinObject,
): openehr_base.RESOURCE_DESCRIPTION {
  const desc = new openehr_base.RESOURCE_DESCRIPTION();
  const bag = desc as Record<string, OdinValue | openehr_base.Terminology_code>;

  if (descriptionData.original_author !== undefined) {
    bag.original_author = descriptionData.original_author;
  }
  if (descriptionData.details !== undefined) {
    bag.details = descriptionData.details;
  }
  if (descriptionData.other_details !== undefined) {
    bag.other_details = descriptionData.other_details;
  }
  const lifecycle = odinString(descriptionData.lifecycle_state);
  if (lifecycle) {
    desc.lifecycle_state = terminologyCodeFromAdlString(lifecycle);
  }
  const copyright = odinString(descriptionData.copyright);
  if (copyright) {
    bag.copyright = copyright;
  }
  return desc;
}

export function mapTermDefinitions(
  termDefs: OdinValue,
): TermDefinitionTable {
  const table: TermDefinitionTable = {};
  if (!termDefs || typeof termDefs !== "object" || Array.isArray(termDefs)) {
    return table;
  }
  const byLang = termDefs as OdinObject;
  for (const [lang, terms] of Object.entries(byLang)) {
    if (!terms || typeof terms !== "object" || Array.isArray(terms)) continue;
    table[lang] = {};
    for (const [code, termObj] of Object.entries(terms as OdinObject)) {
      if (!termObj || typeof termObj !== "object" || Array.isArray(termObj)) {
        continue;
      }
      const t = termObj as OdinObject;
      table[lang][code] = {
        text: odinString(t.text),
        description: odinString(t.description),
      };
    }
  }
  return table;
}

export function applyTerminologyOdin(
  archetype: openehr_am.ARCHETYPE,
  terminologyData: OdinObject,
): openehr_am.ARCHETYPE_ONTOLOGY {
  const terminology = archetype.ontology ?? new openehr_am.ARCHETYPE_ONTOLOGY();
  const bag = terminology as Record<string, unknown>;

  if (terminologyData.term_definitions !== undefined) {
    bag.term_definitions = mapTermDefinitions(terminologyData.term_definitions);
  }
  if (terminologyData.term_bindings !== undefined) {
    bag.term_bindings = terminologyData.term_bindings;
  }
  if (terminologyData.value_sets !== undefined) {
    bag.value_sets = terminologyData.value_sets;
  }
  if (terminologyData.terminology_extracts !== undefined) {
    bag.terminology_extracts = terminologyData.terminology_extracts;
  }

  archetype.ontology = terminology;
  return terminology;
}

export function buildArchetypeTerms(
  table: TermDefinitionTable,
): openehr_am.ARCHETYPE_TERM[] {
  const terms: openehr_am.ARCHETYPE_TERM[] = [];
  for (const langTerms of Object.values(table)) {
    for (const [code, item] of Object.entries(langTerms)) {
      const term = new openehr_am.ARCHETYPE_TERM();
      term.code = code;
      const items: Record<string, string> = {};
      if (item.text) items.text = item.text;
      if (item.description) items.description = item.description;
      (term as { items: Record<string, string> }).items = items;
      terms.push(term);
    }
  }
  return terms;
}
