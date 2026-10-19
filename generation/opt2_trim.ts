/**
 * Language filtering for OPERATIONAL_TEMPLATE before OPT2 export.
 *
 * Only removes non-selected languages from terminology, component terminologies,
 * description details, and annotation documentation bags. All other metadata is
 * left intact so output stays standards-compliant aside from language subsetting.
 */

import * as openehr_am from "../am/openehr_am.ts";
import { getAnnotationsDocumentation } from "../parser/aom_odin_sections.ts";
import type { OperationalTemplateWithTermScopes } from "./term_scope.ts";
import type { TermDefinitionTable } from "../am/util/ontology_merge.ts";

function languageSet(languages: string[]): Set<string> {
  return new Set(languages.map((l) => l.toLowerCase()));
}

function filterTermTable(
  table: TermDefinitionTable | undefined,
  keep: Set<string>,
): TermDefinitionTable | undefined {
  if (!table) return undefined;
  const out: TermDefinitionTable = {};
  for (const [lang, bag] of Object.entries(table)) {
    if (!keep.has(lang.toLowerCase())) continue;
    out[lang] = { ...bag };
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Return a deep copy of `opt` keeping only the given languages in term-related
 * and localized metadata bags.
 */
export function filterOperationalTemplateLanguages(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  languages: string[],
): openehr_am.OPERATIONAL_TEMPLATE {
  if (!languages.length) return structuredClone(opt) as openehr_am.OPERATIONAL_TEMPLATE;

  const keep = languageSet(languages);
  const cloned = structuredClone(opt) as openehr_am.OPERATIONAL_TEMPLATE;

  const ontologyBag = cloned.ontology as Record<string, unknown> | undefined;
  if (ontologyBag?.term_definitions) {
    const filtered = filterTermTable(
      ontologyBag.term_definitions as TermDefinitionTable,
      keep,
    );
    if (filtered) ontologyBag.term_definitions = filtered;
    else delete ontologyBag.term_definitions;
  }

  const scoped = cloned as OperationalTemplateWithTermScopes;
  if (scoped.archetype_term_definitions) {
    const index: Record<string, TermDefinitionTable> = {};
    for (const [archId, table] of Object.entries(scoped.archetype_term_definitions)) {
      const filtered = filterTermTable(table, keep);
      if (filtered) index[archId] = filtered;
    }
    scoped.archetype_term_definitions = Object.keys(index).length
      ? index
      : undefined;
  }

  const descBag = cloned.description as Record<string, unknown> | undefined;
  if (descBag?.details && typeof descBag.details === "object") {
    const details = descBag.details as Record<string, unknown>;
    descBag.details = Object.fromEntries(
      Object.entries(details).filter(([lang]) => keep.has(lang.toLowerCase())),
    );
    if (!Object.keys(descBag.details as object).length) {
      delete descBag.details;
    }
  }

  const doc = getAnnotationsDocumentation(cloned) as
    | Record<string, Record<string, Record<string, string>>>
    | undefined;
  if (doc) {
    const filtered: Record<string, Record<string, Record<string, string>>> = {};
    for (const [lang, paths] of Object.entries(doc)) {
      if (keep.has(lang.toLowerCase())) filtered[lang] = paths;
    }
    if (Object.keys(filtered).length) {
      (cloned as { annotations?: { documentation?: unknown } }).annotations = {
        documentation: filtered,
      };
    } else {
      (cloned as { annotations?: unknown }).annotations = undefined;
    }
  }

  return cloned;
}
