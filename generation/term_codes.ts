/**
 * Archetype node id / at-code normalisation for terminology lookup.
 */

import { nodeIdToAtCode } from "../serialization/simplified/normalize.ts";

/** Candidate term codes to try for a template node id. */
export function termCodeCandidates(nodeId: string): string[] {
  const out = new Set<string>();
  out.add(nodeId);
  out.add(nodeIdToAtCode(nodeId));

  // Template slot ids (at0.2) are not archetype at-codes (at0002).
  const dotted = /^at(\d+)\.(\d+(?:\.\d+)*)$/i.exec(nodeId);
  if (dotted && dotted[1].length < 4) {
    const padded = dotted[1].padStart(4, "0");
    out.add(`at${padded}`);
    out.add(`at${padded}.${dotted[2]}`);
  }

  const base = nodeId.replace(/\.\d+(?:\.\d+)*$/, "");
  if (base !== nodeId) out.add(base);

  return [...out];
}

export function resolveTemplateLanguage(
  template: {
    original_language?: unknown;
    ontology?: { original_language?: { code_string?: string } };
    description?: {
      details?: Record<
        string,
        { language?: { codeString?: string; code_string?: string } }
      >;
    };
  },
  preferred?: string,
): string {
  if (preferred) return preferred;
  if (
    typeof template.original_language === "string" && template.original_language
  ) {
    return template.original_language;
  }
  const fromOntology = template.ontology?.original_language?.code_string;
  if (fromOntology) return fromOntology;
  const defs = (template.ontology as
    | { term_definitions?: Record<string, unknown> }
    | undefined)
    ?.term_definitions;
  if (defs) {
    const svCount = Object.keys(defs.sv ?? {}).length;
    const enCount = Object.keys(defs.en ?? {}).length;
    if (svCount > enCount && svCount > 0) return "sv";
    let bestLang = "en";
    let bestCount = -1;
    for (const [lang, table] of Object.entries(defs)) {
      const count = table && typeof table === "object"
        ? Object.keys(table).length
        : 0;
      if (count > bestCount) {
        bestCount = count;
        bestLang = lang;
      }
    }
    if (bestCount > 0) return bestLang;
  }
  const details = template.description?.details;
  if (details?.sv) return "sv";
  return "en";
}

type TemplateLanguageSource = {
  original_language?: unknown;
  ontology?: {
    original_language?: { code_string?: string };
    term_definitions?: Record<string, unknown>;
  };
  description?: { details?: Record<string, unknown> };
  /**
   * Per-archetype term tables. OPT 1.4 stores translations here
   * (`<ontology>` / `<component_ontologies>`), not only in the merged ontology.
   */
  archetype_term_definitions?: Record<
    string,
    Record<string, unknown> | undefined
  >;
};

/**
 * Language code as stored on a template: a plain string, `ISO_639-1::xx`
 * left intact when it is already a string, or a terminology-code object's
 * `code_string`. Codes are not rewritten or checked against ISO 639-1.
 */
export function languageCode(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  const rec = value as Record<string, unknown>;
  if ("code_string" in rec || "codeString" in rec) {
    return languageCode(rec.code_string ?? rec.codeString);
  }
  if ("value" in rec) return languageCode(rec.value);
  return undefined;
}

function templateOriginalLanguage(
  template: TemplateLanguageSource,
): string | undefined {
  return languageCode(template.original_language) ??
    languageCode(template.ontology?.original_language);
}

function addLanguage(
  langs: string[],
  seen: Set<string>,
  lang: string | undefined,
): void {
  if (!lang || seen.has(lang)) return;
  seen.add(lang);
  langs.push(lang);
}

function tableHasTerms(table: unknown): boolean {
  return !!table && typeof table === "object" &&
    Object.keys(table as object).length > 0;
}

/** Language codes present in operational template terminology. */
export function availableTemplateLanguages(
  template: TemplateLanguageSource,
): string[] {
  const original = templateOriginalLanguage(template);
  const ordered: string[] = [];
  const seen = new Set<string>();

  const defs = template.ontology?.term_definitions;
  if (defs) {
    for (const [lang, table] of Object.entries(defs)) {
      if (tableHasTerms(table)) addLanguage(ordered, seen, lang);
    }
  }

  // Archetype bags follow OPT document order (parser insertion order).
  const scoped = template.archetype_term_definitions;
  if (scoped) {
    for (const table of Object.values(scoped)) {
      if (!table || typeof table !== "object") continue;
      for (const [lang, bag] of Object.entries(table)) {
        if (tableHasTerms(bag)) addLanguage(ordered, seen, lang);
      }
    }
  }

  const details = template.description?.details;
  if (details) {
    for (const lang of Object.keys(details)) addLanguage(ordered, seen, lang);
  }

  if (original) {
    return [original, ...ordered.filter((lang) => lang !== original)];
  }
  return ordered;
}
