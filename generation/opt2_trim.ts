/**
 * In-memory pruning for OPERATIONAL_TEMPLATE before OPT2 export (LLM context).
 *
 * Applied as a separate step so default OPT2 output stays standards-compliant.
 */

import * as openehr_am from "../am/openehr_am.ts";
import * as openehr_base from "../base/openehr_base.ts";
import { getAnnotationsDocumentation } from "../parser/aom_odin_sections.ts";
import type { OperationalTemplateWithTermScopes } from "./term_scope.ts";
import type { TermDefinitionTable } from "../am/util/ontology_merge.ts";

export interface Opt2LlmTrimOptions {
  /** Keep only these language codes in terminology / component_terminologies. */
  languages?: string[];
  /** Drop term `description` fields (keep `text`). */
  stripTermDescriptions?: boolean;
  /** Omit the entire `description` section. */
  stripDescriptionSection?: boolean;
  /** Remove `copyright` from description when the section is kept. */
  stripCopyright?: boolean;
  /** Remove `original_author` from description when the section is kept. */
  stripAuthorship?: boolean;
  /** Omit `annotations` (path documentation / L10n). */
  stripAnnotations?: boolean;
  /** Omit root `terminology` when labels are inlined on cADL nodes. */
  omitTerminology?: boolean;
  /** Omit `component_terminologies` when labels are inlined on cADL nodes. */
  omitComponentTerminologies?: boolean;
  /**
   * When true, the serializer adds `-- label` comments on cADL nodes (does not
   * mutate the template; carried on {@link Opt2SerializeOptions}).
   */
  inlineTermLabels?: boolean;
}

export interface Opt2SerializeOptions {
  indent?: string;
  adlVersion?: string;
  rmRelease?: string;
  /** When set, {@link trimOperationalTemplateForLlm} runs on a clone before serialize. */
  llmTrim?: Opt2LlmTrimOptions;
}

function filterTermTable(
  table: TermDefinitionTable | undefined,
  langs: Set<string> | undefined,
  stripDescriptions: boolean,
): TermDefinitionTable | undefined {
  if (!table) return undefined;
  const out: TermDefinitionTable = {};
  for (const [lang, bag] of Object.entries(table)) {
    if (langs && !langs.has(lang)) continue;
    out[lang] = {};
    for (const [code, entry] of Object.entries(bag)) {
      out[lang][code] = stripDescriptions
        ? { text: entry.text }
        : { ...entry };
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function cloneOntology(
  ontology: openehr_am.ARCHETYPE_ONTOLOGY | undefined,
  langs: Set<string> | undefined,
  stripDescriptions: boolean,
  omit: boolean,
): openehr_am.ARCHETYPE_ONTOLOGY | undefined {
  if (!ontology || omit) return undefined;
  const bag = ontology as Record<string, unknown>;
  const termDefs = filterTermTable(
    bag.term_definitions as TermDefinitionTable | undefined,
    langs,
    stripDescriptions,
  );
  if (!termDefs) return undefined;
  const cloned = new openehr_am.ARCHETYPE_ONTOLOGY();
  (cloned as Record<string, unknown>).term_definitions = termDefs;
  if (bag.term_bindings) {
    (cloned as Record<string, unknown>).term_bindings = bag.term_bindings;
  }
  if (bag.value_sets) {
    (cloned as Record<string, unknown>).value_sets = bag.value_sets;
  }
  return cloned;
}

function trimDescription(
  desc: openehr_base.RESOURCE_DESCRIPTION | undefined,
  options: Opt2LlmTrimOptions,
): openehr_base.RESOURCE_DESCRIPTION | undefined {
  if (!desc || options.stripDescriptionSection) return undefined;
  const bag = desc as Record<string, unknown>;
  const out = new openehr_base.RESOURCE_DESCRIPTION();
  const outBag = out as Record<string, unknown>;
  if (!options.stripAuthorship && bag.original_author !== undefined) {
    outBag.original_author = structuredClone(bag.original_author);
  }
  if (bag.details !== undefined) {
    let details = structuredClone(bag.details) as Record<
      string,
      Record<string, unknown>
    >;
    if (options.languages?.length) {
      const keep = new Set(options.languages.map((l) => l.toLowerCase()));
      details = Object.fromEntries(
        Object.entries(details).filter(([lang]) => keep.has(lang.toLowerCase())),
      );
    }
    if (Object.keys(details).length) outBag.details = details;
  }
  if (desc.lifecycle_state) out.lifecycle_state = desc.lifecycle_state;
  if (!options.stripCopyright && bag.copyright !== undefined) {
    outBag.copyright = bag.copyright;
  }
  const hasContent = Object.keys(outBag).length > 0 || out.lifecycle_state;
  return hasContent ? out : undefined;
}

/**
 * Return a deep copy of `opt` with LLM-oriented metadata removed or filtered.
 */
export function trimOperationalTemplateForLlm(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  options: Opt2LlmTrimOptions,
): openehr_am.OPERATIONAL_TEMPLATE {
  const cloned = structuredClone(opt) as openehr_am.OPERATIONAL_TEMPLATE;
  const langs = options.languages?.length
    ? new Set(options.languages.map((l) => l.toLowerCase()))
    : undefined;

  cloned.description = trimDescription(cloned.description, options);

  cloned.ontology = cloneOntology(
    cloned.ontology,
    langs,
    options.stripTermDescriptions ?? false,
    options.omitTerminology ?? false,
  );

  const scoped = cloned as OperationalTemplateWithTermScopes;
  if (options.omitComponentTerminologies) {
    scoped.archetype_term_definitions = undefined;
  } else if (scoped.archetype_term_definitions) {
    const index: Record<string, TermDefinitionTable> = {};
    for (const [archId, table] of Object.entries(scoped.archetype_term_definitions)) {
      const filtered = filterTermTable(
        table,
        langs,
        options.stripTermDescriptions ?? false,
      );
      if (filtered) index[archId] = filtered;
    }
    scoped.archetype_term_definitions = Object.keys(index).length
      ? index
      : undefined;
  }

  if (options.stripAnnotations) {
    (cloned as { annotations?: unknown }).annotations = undefined;
  } else if (langs && getAnnotationsDocumentation(cloned)) {
    const doc = getAnnotationsDocumentation(cloned) as Record<
      string,
      Record<string, Record<string, string>>
    >;
    const filtered: Record<string, Record<string, Record<string, string>>> = {};
    for (const lang of Object.keys(doc)) {
      if (langs.has(lang.toLowerCase())) filtered[lang] = doc[lang];
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
