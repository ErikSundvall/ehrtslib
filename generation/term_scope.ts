/**
 * Archetype-scoped terminology for RM instance generation and Web Template names.
 *
 * Inlined / OPT-inlined archetype nodes carry `term_archetype_scope`
 * (set during flattening or OPT XML parse). `at0001` is local to an archetype,
 * so a flat `ontology.term_definitions` map keyed only on at-code is not a
 * reliable lookup: the last colliding code wins.
 *
 * Better `.t.json` nests are scoped by template id (`ChemoQ-fatigue`), not
 * only by archetype id. Several templates can specialise one archetype, so
 * `archetype_term_definitions` keeps a bag per template id (and per basename
 * used as `archetypeRef`). `term_name_fallback_node_id` on an inlined root
 * points at that template's concept code (`at0000` / `at0000.1`) when the
 * use-site id (`at0039.1`) is not itself in the bag.
 */

import * as openehr_am from "../am/openehr_am.ts";
import type {
  TermBag,
  TermDefinitionTable,
} from "../am/util/ontology_merge.ts";
import { languageCode, termCodeCandidates } from "./term_codes.ts";

export const TERM_ARCHETYPE_SCOPE_KEY = "term_archetype_scope";
export const TERM_NAME_FALLBACK_NODE_ID_KEY = "term_name_fallback_node_id";
/** Per-root term bag parsed from legacy OPT XML `<term_definitions>` on C_ARCHETYPE_ROOT. */
export const COMPONENT_TERM_DEFINITIONS_KEY = "opt_component_term_definitions";
/**
 * Term scope of one occurrence of an archetype whose OPT terms differ from
 * its first occurrence (two `SECTION.adhoc` roots with at0000 "Vital signs"
 * and "Calculated scales"): `<archetype id>#<n>`, n = 2, 3, …. Set on the
 * root and its descendants; {@link termScopeOf} prefers it.
 */
export const TERM_OCCURRENCE_SCOPE_KEY = "term_occurrence_scope";

export interface TermEntry {
  text?: string;
  description?: string;
}

export interface TermScopeMeta {
  term_archetype_scope?: string;
  term_name_fallback_node_id?: string;
  opt_component_term_definitions?: TermBag;
  term_occurrence_scope?: string;
}

export interface OperationalTemplateWithTermScopes {
  archetype_term_definitions?: Record<string, TermDefinitionTable>;
  /**
   * Term tables of archetype occurrences whose terms differ from the first
   * occurrence, keyed by {@link TERM_OCCURRENCE_SCOPE_KEY} (`<id>#<n>`).
   */
  occurrence_term_definitions?: Record<string, TermDefinitionTable>;
  definition?: openehr_am.C_COMPLEX_OBJECT;
  original_language?: unknown;
}

function termLabel(val: unknown): string | undefined {
  if (typeof val === "string" && val && val !== "[object Object]") return val;
  if (val && typeof val === "object") {
    const o = val as Record<string, unknown>;
    return termLabel(o.value) ?? termLabel(o.text) ?? termLabel(o["#text"]);
  }
  return undefined;
}

function termEntryFromRaw(
  raw: TermBag[string] | undefined,
): TermEntry | undefined {
  if (!raw) return undefined;
  const text = termLabel(raw.text);
  const description = termLabel(raw.description);
  if (!text && !description) return undefined;
  return { text, description };
}

/** Lookup a term entry in one terminology bag, including single-suffix matches. */
export function lookupTermEntryInBag(
  bag: TermBag,
  code?: string,
): TermEntry | undefined {
  if (!code) return undefined;

  for (const candidate of termCodeCandidates(code)) {
    const entry = termEntryFromRaw(bag[candidate]);
    if (entry?.text) return entry;
  }

  const bases = new Set(termCodeCandidates(code));
  for (const base of bases) {
    const dotted = Object.keys(bag)
      .filter((k) => k.startsWith(`${base}.`))
      .sort((a, b) => a.length - b.length);
    if (dotted.length === 1) {
      // History events (at0002) must not borrow a data child name (at0002.1).
      if (base === "at0002") continue;
      const entry = termEntryFromRaw(bag[dotted[0]]);
      if (entry?.text) return entry;
    }
  }

  return undefined;
}

/** Lookup a label in one terminology bag, including single-suffix matches (at0003 → at0003.1). */
export function lookupTermInBag(
  bag: TermBag,
  code?: string,
): string | undefined {
  return lookupTermEntryInBag(bag, code)?.text;
}

/** Exact-key lookup only; does not try normalised/base/dotted candidates. */
export function lookupExactTermEntryInBag(
  bag: TermBag,
  code?: string,
): TermEntry | undefined {
  if (!code) return undefined;
  return termEntryFromRaw(bag[code]);
}

export function lookupExactTermInBag(
  bag: TermBag,
  code?: string,
): string | undefined {
  return lookupExactTermEntryInBag(bag, code)?.text;
}

/** Resolve a term entry using optional archetype scope then template-level terms. */
export function resolveTermEntry(
  nodeId: string | undefined,
  nameFallbackNodeId: string | undefined,
  templateTerms: TermBag,
  archetypeTerms: Record<string, TermBag>,
  archetypeScope?: string,
): TermEntry | undefined {
  if (nodeId && isTemplateSlotId(nodeId)) {
    const slot = lookupExactTermEntryInBag(templateTerms, nodeId);
    if (slot?.text) return slot;
  }

  const codes = [nodeId, nameFallbackNodeId].filter(
    (c): c is string => typeof c === "string" && c.length > 0,
  );

  if (archetypeScope && archetypeTerms[archetypeScope]) {
    const scopedBag = archetypeTerms[archetypeScope];
    for (const code of codes) {
      const entry = lookupTermEntryInBag(scopedBag, code);
      if (entry?.text) return entry;
    }
    // Archetype-local at-codes must not fall back to flat merged template terms.
    // Specialised at-codes (at0089.1) are safer to recover by exact key than
    // base at-codes (at0001), which frequently collide across archetypes.
    for (const code of codes) {
      if (isSpecialisedAtCode(code)) {
        const entry = lookupExactTermEntryInBag(templateTerms, code);
        if (entry?.text) return entry;
      }
    }
    const localId = nodeId ?? nameFallbackNodeId;
    if (localId && isArchetypeLocalCode(localId)) return undefined;
  }

  for (const code of codes) {
    if (isTemplateSlotId(code)) {
      const entry = lookupExactTermEntryInBag(templateTerms, code);
      if (entry?.text) return entry;
      continue;
    }
    const entry = lookupTermEntryInBag(templateTerms, code);
    if (entry?.text) return entry;
  }

  return undefined;
}

/** Resolve a locatable label using optional archetype scope then template-level terms. */
export function resolveLocatableLabel(
  nodeId: string | undefined,
  nameFallbackNodeId: string | undefined,
  templateTerms: TermBag,
  archetypeTerms: Record<string, TermBag>,
  archetypeScope?: string,
): string | undefined {
  return resolveTermEntry(
    nodeId,
    nameFallbackNodeId,
    templateTerms,
    archetypeTerms,
    archetypeScope,
  )?.text;
}

/**
 * One language bag, with per-code fallback to `originalLanguage` when that
 * differs from `language`. A missing language still falls back to `en`, then
 * the first bag, matching the previous whole-bag lookup.
 */
export function selectTermBag(
  table: Record<string, TermBag> | undefined,
  language: string,
  originalLanguage?: string,
): TermBag {
  if (!table) return {};
  const primary = table[language];
  const fallbackLang = originalLanguage && originalLanguage !== language
    ? originalLanguage
    : undefined;
  const secondary = fallbackLang ? table[fallbackLang] : undefined;
  if (primary && secondary) return mergeTermBag(secondary, primary);
  if (primary) return primary;
  if (secondary) return secondary;
  if (table.en && Object.keys(table.en).length) return table.en;
  return Object.values(table).find((bag) => bag && Object.keys(bag).length) ??
    {};
}

/** `override` wins per code; `base` fills text or description the override lacks. */
function mergeTermBag(base: TermBag, override: TermBag): TermBag {
  const out: TermBag = { ...base };
  for (const [code, entry] of Object.entries(override)) {
    const prev = out[code];
    if (!prev) {
      out[code] = entry;
      continue;
    }
    out[code] = {
      text: entry.text ?? prev.text,
      description: entry.description ?? prev.description,
    };
  }
  return out;
}

/** Language-sliced per-archetype term bags from `archetype_term_definitions`. */
export function archetypeTermBagsForLanguage(
  template: OperationalTemplateWithTermScopes,
  language: string,
  originalLanguage?: string,
): Record<string, TermBag> {
  const index = termTablesByScope(template);
  const original = originalLanguage ?? languageCode(template.original_language);
  const out: Record<string, TermBag> = {};
  for (const [archId, table] of Object.entries(index)) {
    out[archId] = selectTermBag(table, language, original);
  }
  return out;
}

/**
 * Term tables by scope: archetype ids and occurrence scopes (`<id>#<n>`).
 * Look a node up with {@link termScopeOf}.
 */
export function termTablesByScope(
  template: OperationalTemplateWithTermScopes,
): Record<string, TermDefinitionTable> {
  return {
    ...(template.archetype_term_definitions ?? {}),
    ...(template.occurrence_term_definitions ?? {}),
  };
}

/** Term scope of a constraint node: its occurrence scope, else its archetype id. */
export function termScopeOf(obj: unknown): string | undefined {
  const meta = obj as TermScopeMeta | undefined;
  return meta?.[TERM_OCCURRENCE_SCOPE_KEY] ?? meta?.[TERM_ARCHETYPE_SCOPE_KEY];
}

/**
 * Tag constraint nodes with `term_archetype_scope` and build
 * `archetype_term_definitions` from per-`C_ARCHETYPE_ROOT` OPT XML term bags.
 * A later occurrence of an archetype whose OPT terms differ from the first
 * gets its own table in `occurrence_term_definitions` and an occurrence scope
 * ({@link TERM_OCCURRENCE_SCOPE_KEY}) on its nodes.
 *
 * Inline `<term_definitions>` on a `C_ARCHETYPE_ROOT` are the template's
 * original language. They are stored under that language. `language` is used
 * only when the template has no original language. Passing a display language
 * such as `"sv"` does not relabel the inline terms or overwrite a translation
 * already stored for that language.
 *
 * Safe to call on an OPT that already has a flattening-built index: existing
 * index entries are kept, and component bags overlay the same archetype id.
 */
export function applyOperationalTemplateTermScopes(
  opt: OperationalTemplateWithTermScopes,
  language = "en",
): void {
  const index: Record<string, TermDefinitionTable> = {
    ...(opt.archetype_term_definitions ?? {}),
  };
  const inlineLanguage = languageCode(opt.original_language) || language ||
    "en";
  const walk: TermScopeWalk = {
    language: inlineLanguage,
    index,
    occurrences: {},
    first: new Map(),
    counts: new Map(),
  };
  if (opt.definition) {
    walkTermScopes(opt.definition, undefined, undefined, walk);
  }
  opt.archetype_term_definitions = index;
  if (Object.keys(walk.occurrences).length) {
    opt.occurrence_term_definitions = walk.occurrences;
  } else {
    delete opt.occurrence_term_definitions;
  }
}

interface TermScopeWalk {
  language: string;
  index: Record<string, TermDefinitionTable>;
  occurrences: Record<string, TermDefinitionTable>;
  /** Archetype id → local bag of its first occurrence. */
  first: Map<string, TermBag>;
  counts: Map<string, number>;
}

/** Some code has another text in `b` than in `a`. */
function termsDiffer(a: TermBag, b: TermBag): boolean {
  return Object.entries(b).some(([code, entry]) =>
    a[code] !== undefined && termLabel(a[code]?.text) !== termLabel(entry?.text)
  );
}

function walkTermScopes(
  obj: openehr_am.C_OBJECT,
  inheritedScope: string | undefined,
  inheritedOccurrence: string | undefined,
  walk: TermScopeWalk,
): void {
  let scope = inheritedScope;
  let occurrence = inheritedOccurrence;
  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT && obj.archetype_ref) {
    scope = obj.archetype_ref;
    occurrence = undefined;
    const local = (obj as TermScopeMeta)[COMPONENT_TERM_DEFINITIONS_KEY];
    if (local && Object.keys(local).length) {
      const first = walk.first.get(scope);
      if (first && termsDiffer(first, local)) {
        // Same archetype, other terms: a scope of its own.
        const n = (walk.counts.get(scope) ?? 1) + 1;
        walk.counts.set(scope, n);
        occurrence = `${scope}#${n}`;
        walk.occurrences[occurrence] = {
          ...(walk.index[scope] ?? {}),
          [walk.language]: {
            ...(walk.index[scope]?.[walk.language] ?? {}),
            ...local,
          },
        };
      } else {
        if (!first) walk.first.set(scope, local);
        walk.index[scope] ??= {};
        walk.index[scope][walk.language] = {
          ...(walk.index[scope][walk.language] ?? {}),
          ...local,
        };
      }
    }
  }
  const meta = obj as TermScopeMeta;
  if (scope) meta[TERM_ARCHETYPE_SCOPE_KEY] = scope;
  if (occurrence) meta[TERM_OCCURRENCE_SCOPE_KEY] = occurrence;
  else delete meta[TERM_OCCURRENCE_SCOPE_KEY];
  if (obj instanceof openehr_am.C_COMPLEX_OBJECT) {
    for (const attr of obj.attributes ?? []) {
      const children = (attr as { children?: openehr_am.C_OBJECT[] }).children;
      if (!children) continue;
      for (const child of children) {
        walkTermScopes(child, scope, occurrence, walk);
      }
    }
  }
}

/** Archetype node or value code, in either ADL2 coding system (not a template slot id). */
function isArchetypeLocalCode(code: string): boolean {
  if (/^(?:at|id)0\.\d/i.test(code)) return false;
  return /^(?:at|id)\d/i.test(code);
}

function isSpecialisedAtCode(code: string): boolean {
  return /^at\d{4,}\.\d+(?:\.\d+)*$/i.test(code);
}

function isTemplateSlotId(code: string): boolean {
  return /^at0\.\d/i.test(code);
}
