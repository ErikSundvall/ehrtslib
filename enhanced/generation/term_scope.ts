/**
 * Archetype-scoped terminology for RM instance generation.
 * Inlined archetype nodes carry `term_archetype_scope` (set during flattening).
 */

import type { TermBag, TermDefinitionTable } from "../am/ontology_merge.ts";
import { termCodeCandidates } from "./term_codes.ts";

export const TERM_ARCHETYPE_SCOPE_KEY = "term_archetype_scope";
export const TERM_NAME_FALLBACK_NODE_ID_KEY = "term_name_fallback_node_id";

export interface TermScopeMeta {
  term_archetype_scope?: string;
  term_name_fallback_node_id?: string;
}

export interface OperationalTemplateWithTermScopes {
  archetype_term_definitions?: Record<string, TermDefinitionTable>;
}

function termLabel(val: unknown): string | undefined {
  if (typeof val === "string" && val && val !== "[object Object]") return val;
  if (val && typeof val === "object") {
    const o = val as Record<string, unknown>;
    return termLabel(o.value) ?? termLabel(o.text) ?? termLabel(o["#text"]);
  }
  return undefined;
}

/** Lookup a label in one terminology bag, including single-suffix matches (at0003 → at0003.1). */
export function lookupTermInBag(bag: TermBag, code?: string): string | undefined {
  if (!code) return undefined;

  for (const candidate of termCodeCandidates(code)) {
    const text = termLabel(bag[candidate]?.text);
    if (text) return text;
  }

  const bases = new Set(termCodeCandidates(code));
  for (const base of bases) {
    const dotted = Object.keys(bag)
      .filter((k) => k.startsWith(`${base}.`))
      .sort((a, b) => a.length - b.length);
    if (dotted.length === 1) {
      // History events (at0002) must not borrow a data child name (at0002.1).
      if (base === "at0002") continue;
      const text = termLabel(bag[dotted[0]]?.text);
      if (text) return text;
    }
  }

  return undefined;
}

/** Exact-key lookup only; does not try normalised/base/dotted candidates. */
export function lookupExactTermInBag(
  bag: TermBag,
  code?: string,
): string | undefined {
  if (!code) return undefined;
  return termLabel(bag[code]?.text);
}

/** Resolve a locatable label using optional archetype scope then template-level terms. */
export function resolveLocatableLabel(
  nodeId: string | undefined,
  nameFallbackNodeId: string | undefined,
  templateTerms: TermBag,
  archetypeTerms: Record<string, TermBag>,
  archetypeScope?: string,
): string | undefined {
  if (nodeId && isTemplateSlotId(nodeId)) {
    const slotLabel = lookupExactTermInBag(templateTerms, nodeId);
    if (slotLabel) return slotLabel;
  }

  const codes = [nodeId, nameFallbackNodeId].filter(
    (c): c is string => typeof c === "string" && c.length > 0,
  );

  if (archetypeScope && archetypeTerms[archetypeScope]) {
    const scopedBag = archetypeTerms[archetypeScope];
    for (const code of codes) {
      const text = lookupTermInBag(scopedBag, code);
      if (text) return text;
    }
    // Archetype-local at-codes must not fall back to flat merged template terms.
    // Specialised at-codes (at0089.1) are safer to recover by exact key than
    // base at-codes (at0001), which frequently collide across archetypes.
    for (const code of codes) {
      if (isSpecialisedAtCode(code)) {
        const text = lookupExactTermInBag(templateTerms, code);
        if (text) return text;
      }
    }
    const localId = nodeId ?? nameFallbackNodeId;
    if (localId && isArchetypeLocalCode(localId)) return undefined;
  }

  for (const code of codes) {
    if (isTemplateSlotId(code)) {
      const text = lookupExactTermInBag(templateTerms, code);
      if (text) return text;
      continue;
    }
    const text = lookupTermInBag(templateTerms, code);
    if (text) return text;
  }

  return undefined;
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
