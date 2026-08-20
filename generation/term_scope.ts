/**
 * Archetype-scoped terminology for RM instance generation and Web Template names.
 *
 * Inlined / OPT-inlined archetype nodes carry `term_archetype_scope`
 * (set during flattening or OPT XML parse). `at0001` is local to an archetype,
 * so a flat `ontology.term_definitions` map keyed only on at-code is not a
 * reliable lookup: the last colliding code wins.
 */

import * as openehr_am from "../am/openehr_am.ts";
import type { TermBag, TermDefinitionTable } from "../am/util/ontology_merge.ts";
import { termCodeCandidates } from "./term_codes.ts";

export const TERM_ARCHETYPE_SCOPE_KEY = "term_archetype_scope";
export const TERM_NAME_FALLBACK_NODE_ID_KEY = "term_name_fallback_node_id";
/** Per-root term bag parsed from legacy OPT XML `<term_definitions>` on C_ARCHETYPE_ROOT. */
export const COMPONENT_TERM_DEFINITIONS_KEY = "opt_component_term_definitions";

export interface TermEntry {
  text?: string;
  description?: string;
}

export interface TermScopeMeta {
  term_archetype_scope?: string;
  term_name_fallback_node_id?: string;
  opt_component_term_definitions?: TermBag;
}

export interface OperationalTemplateWithTermScopes {
  archetype_term_definitions?: Record<string, TermDefinitionTable>;
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
export function lookupTermInBag(bag: TermBag, code?: string): string | undefined {
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

/** Language-sliced per-archetype term bags from `archetype_term_definitions`. */
export function archetypeTermBagsForLanguage(
  template: OperationalTemplateWithTermScopes,
  language: string,
): Record<string, TermBag> {
  const index = template.archetype_term_definitions ?? {};
  const out: Record<string, TermBag> = {};
  for (const [archId, table] of Object.entries(index)) {
    out[archId] = table[language] ?? table.en ??
      Object.values(table)[0] ?? {};
  }
  return out;
}

/**
 * Tag constraint nodes with `term_archetype_scope` and build
 * `archetype_term_definitions` from per-`C_ARCHETYPE_ROOT` OPT XML term bags.
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
  if (opt.definition) {
    walkTermScopes(opt.definition, undefined, language, index);
  }
  opt.archetype_term_definitions = index;
}

function walkTermScopes(
  obj: openehr_am.C_OBJECT,
  inheritedScope: string | undefined,
  language: string,
  index: Record<string, TermDefinitionTable>,
): void {
  let scope = inheritedScope;
  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT && obj.archetype_ref) {
    scope = obj.archetype_ref;
    const local = (obj as TermScopeMeta)[COMPONENT_TERM_DEFINITIONS_KEY];
    if (local && Object.keys(local).length) {
      index[scope] ??= {};
      index[scope][language] = {
        ...(index[scope][language] ?? {}),
        ...local,
      };
    }
  }
  if (scope) {
    (obj as TermScopeMeta)[TERM_ARCHETYPE_SCOPE_KEY] = scope;
  }
  if (obj instanceof openehr_am.C_COMPLEX_OBJECT) {
    for (const attr of obj.attributes ?? []) {
      const children = (attr as { children?: openehr_am.C_OBJECT[] }).children;
      if (!children) continue;
      for (const child of children) {
        walkTermScopes(child, scope, language, index);
      }
    }
  }
}

/** True for archetype at-codes (at0001), not template slot ids (at0.2). */
function isArchetypeLocalCode(code: string): boolean {
  if (/^at0\.\d/i.test(code)) return false;
  return /^at\d/i.test(code);
}

function isSpecialisedAtCode(code: string): boolean {
  return /^at\d{4,}\.\d+(?:\.\d+)*$/i.test(code);
}

function isTemplateSlotId(code: string): boolean {
  return /^at0\.\d/i.test(code);
}
