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

const GENERIC_RM_FALLBACK_LABELS = new Set([
  "element",
  "cluster",
  "section",
  "composition",
  "observation",
  "evaluation",
  "instruction",
  "action",
  "admin_entry",
  "activity",
  "history",
  "event",
  "point_event",
  "interval_event",
  "item_tree",
  "item_list",
  "item_single",
  "item_table",
  "item_structure",
  "event_context",
  "ism_transition",
  "complex",
  "entry",
  "care_entry",
  "content_item",
  "data_structure",
]);

/**
 * True when `label` is a generic RM-type placeholder (such as `"element"`,
 * `"cluster"`, `"section"`, `"ELEMENT"`, `"dv_text"`) rather than a clinical
 * display label. Capitalised clinical terms like `"Action"` or `"Event"` return
 * `false`.
 */
export function isGenericRmFallbackLabel(
  label: string | undefined,
  rmType?: string,
): boolean {
  if (!label) return false;
  const trimmed = label.trim();
  if (!trimmed) return false;
  if (GENERIC_RM_FALLBACK_LABELS.has(trimmed)) return true;
  if (/^dv_[a-z_]+$/.test(trimmed)) return true;
  if (rmType) {
    const rm = rmType.trim();
    if (rm && (trimmed === rm || trimmed === rm.toLowerCase())) return true;
  }
  if (
    trimmed === trimmed.toUpperCase() &&
    GENERIC_RM_FALLBACK_LABELS.has(trimmed.toLowerCase())
  ) {
    return true;
  }
  return false;
}

const BETTER_OVERLAY_RE =
  /^((?:[^:]+::)?[^.]+\.)ovl-(.+?)(?:-\d+)?(\.v[\d.]+(?:-[^#]*)?)$/i;

/**
 * Derive candidate parent archetype scope keys for a Better `ovl-*` overlay
 * scope (e.g. `openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v2` →
 * `openEHR-EHR-OBSERVATION.blood_pressure.v2`, or another version of the same
 * base concept present in `availableScopes`).
 */
export function overlayParentScopes(
  scope: string,
  availableScopes?: Iterable<string>,
): string[] {
  const baseScope = scope.replace(/#.*$/, "");
  const m = BETTER_OVERLAY_RE.exec(baseScope);
  if (!m) return [];

  const [, prefix, concept, version] = m;
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (key: string) => {
    if (!key || key === baseScope || seen.has(key)) return;
    seen.add(key);
    out.push(key);
  };

  // 1. Exact version match (with and without optional namespace prefix).
  const exact = `${prefix}${concept}${version}`;
  add(exact);
  const nsIdx = prefix.indexOf("::");
  const barePrefix = nsIdx >= 0 ? prefix.slice(nsIdx + 2) : prefix;
  if (barePrefix !== prefix) add(`${barePrefix}${concept}${version}`);

  // 2. Fallback to any matching base-concept version present in `availableScopes`.
  if (availableScopes) {
    const conceptPrefixes = new Set([
      `${prefix}${concept}.v`.toLowerCase(),
      `${barePrefix}${concept}.v`.toLowerCase(),
    ]);
    const matching: string[] = [];
    for (const candidate of availableScopes) {
      if (candidate.includes("#")) continue;
      const lower = candidate.toLowerCase();
      if (lower.includes(".ovl-")) continue;
      for (const cp of conceptPrefixes) {
        if (lower.startsWith(cp)) {
          matching.push(candidate);
          break;
        }
      }
    }
    // Prefer higher versions deterministically when multiple versions exist.
    matching.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const key of matching) add(key);
  }

  return out;
}

/**
 * Ordered scope lookup chain for `scope`:
 * 1. `scope` itself (e.g. `openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v2#2`)
 * 2. Un-suffixed base scope if `scope` is an occurrence scope (`<id>#...`)
 * 3. Better `ovl-*` parent archetype scope(s) (exact version, then base concept)
 *
 * When `availableScopes` is provided, only keys present in `availableScopes`
 * are returned.
 */
export function resolveScopeChain(
  scope: string,
  availableScopes?: Iterable<string>,
): string[] {
  const available = availableScopes ? new Set(availableScopes) : undefined;
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (key: string) => {
    if (!key || seen.has(key)) return;
    if (available && !available.has(key)) return;
    seen.add(key);
    out.push(key);
  };

  add(scope);
  const hashIdx = scope.indexOf("#");
  if (hashIdx > 0) {
    add(scope.slice(0, hashIdx));
  }
  for (const parent of overlayParentScopes(scope, available)) {
    add(parent);
  }
  return out;
}

/**
 * Resolve a term entry using optional occurrence/archetype scope (including
 * Better `ovl-*` parent archetype fallback) then template-level terms.
 */
export function resolveTermEntry(
  nodeId: string | undefined,
  nameFallbackNodeId: string | undefined,
  templateTerms: TermBag,
  archetypeTerms: Record<string, TermBag>,
  archetypeScope?: string,
): TermEntry | undefined {
  const scopeChain = archetypeScope
    ? resolveScopeChain(archetypeScope, Object.keys(archetypeTerms))
    : [];

  if (nodeId && isTemplateSlotId(nodeId)) {
    // An exact entry (or specialized parent such as `at0.1.1` -> `at0.1` in
    // specialized archetypes like `CLUSTER.exam-uterus`) inside the node's own
    // scope wins over the flat template bag, without fuzzy-padding `at0.6` to
    // `at0000`/`at0006`. Better .t.json template slots fall back to exact
    // lookup in the flat template bag when absent from the archetype's own bag.
    const slotCodes = zeroPrefixCodeCandidates(nodeId);
    for (const scope of scopeChain) {
      for (const code of slotCodes) {
        const scopedSlot = lookupExactTermEntryInBag(archetypeTerms[scope], code);
        if (scopedSlot?.text) return scopedSlot;
      }
    }
    const slot = lookupExactTermEntryInBag(templateTerms, nodeId);
    if (slot?.text) return slot;
  }

  if (scopeChain.length > 0) {
    if (nameFallbackNodeId) {
      // On an inlined archetype/overlay root (e.g. SECTION[at0.6] or
      // CLUSTER[at0021.1] with fallback at0000.1), prefer the archetype/overlay
      // root concept (`nameFallbackNodeId`) before fuzzy-matching the parent
      // slot/use-site node id (`at0.6` -> `at0000` or `at0021.1` -> `at0021`).
      if (nodeId && isRootConceptCode(nodeId)) {
        for (const scope of scopeChain) {
          const exact = lookupExactTermEntryInBag(archetypeTerms[scope], nodeId);
          if (exact?.text) return exact;
        }
      }
      for (const scope of scopeChain) {
        const fallback = lookupTermEntryInBag(
          archetypeTerms[scope],
          nameFallbackNodeId,
        );
        if (fallback?.text) return fallback;
      }
      if (nodeId && !isTemplateSlotId(nodeId)) {
        for (const scope of scopeChain) {
          const entry = lookupTermEntryInBag(archetypeTerms[scope], nodeId);
          if (entry?.text) return entry;
        }
      }
    } else if (nodeId && !isTemplateSlotId(nodeId)) {
      for (const scope of scopeChain) {
        const entry = lookupTermEntryInBag(archetypeTerms[scope], nodeId);
        if (entry?.text) return entry;
      }
    }
    // Archetype-local at-codes must not fall back to flat merged template terms.
    // Specialised non-root at-codes (at0089.1) are safer to recover by exact key
    // than base at-codes (at0001) or root concept codes (at0000.1), which
    // collide across archetypes and the root template.
    if (nodeId && isSpecialisedAtCode(nodeId) && !isRootConceptCode(nodeId)) {
      const entry = lookupExactTermEntryInBag(templateTerms, nodeId);
      if (entry?.text) return entry;
    }
    const localId = nodeId ?? nameFallbackNodeId;
    if (localId && isArchetypeLocalCode(localId)) return undefined;
    if (nodeId && isTemplateSlotId(nodeId)) return undefined;
  }

  const codes = [nodeId, nameFallbackNodeId].filter(
    (c): c is string => typeof c === "string" && c.length > 0,
  );
  for (const code of codes) {
    if (isTemplateSlotId(code)) {
      for (const cand of zeroPrefixCodeCandidates(code)) {
        const entry = lookupExactTermEntryInBag(templateTerms, cand);
        if (entry?.text) return entry;
      }
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

function deepestRootConceptCode(
  table: TermDefinitionTable | undefined,
): string | undefined {
  if (!table) return undefined;
  const candidates = new Set<string>();
  for (const bag of Object.values(table)) {
    if (!bag) continue;
    for (const code of Object.keys(bag)) {
      if (isRootConceptCode(code)) candidates.add(code);
    }
  }
  if (!candidates.size) return undefined;
  // Prefer deepest specialization (e.g. at0000.1.1 > at0000.1 > at0000),
  // then deterministic ascending order.
  return [...candidates].sort((a, b) => {
    const depthDiff = b.split(".").length - a.split(".").length;
    if (depthDiff !== 0) return depthDiff;
    return a.localeCompare(b, undefined, { numeric: true });
  })[0];
}

function inferRootConceptFallbackCode(
  nodeId: string | undefined,
  table: TermDefinitionTable | undefined,
  allTables: Record<string, TermDefinitionTable>,
  scope: string,
): string | undefined {
  if (nodeId && isRootConceptCode(nodeId)) return undefined;
  const direct = deepestRootConceptCode(table);
  if (direct) return direct;
  for (const parentScope of overlayParentScopes(scope, Object.keys(allTables))) {
    const parentCode = deepestRootConceptCode(allTables[parentScope]);
    if (parentCode) return parentCode;
  }
  return undefined;
}

function walkTermScopes(
  obj: openehr_am.C_OBJECT,
  inheritedScope: string | undefined,
  inheritedOccurrence: string | undefined,
  walk: TermScopeWalk,
): void {
  let scope = inheritedScope;
  let occurrence = inheritedOccurrence;
  const meta = obj as TermScopeMeta;
  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT && obj.archetype_ref) {
    scope = obj.archetype_ref;
    occurrence = undefined;
    const local = meta[COMPONENT_TERM_DEFINITIONS_KEY];
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
    // When an OPT2 `use_archetype` / `C_ARCHETYPE_ROOT` carries a slot/use-site
    // node id (`at0.6`, `at0002.3`, `at0021.1`, `at0039.1`, `id0.1`), infer the
    // archetype/overlay root concept code (`at0000.1.1` / `at0000.1` / `at0000`
    // or `id1.1` / `id1`) from `component_terminologies` (#334).
    if (!meta[TERM_NAME_FALLBACK_NODE_ID_KEY]) {
      const activeTable = occurrence
        ? walk.occurrences[occurrence]
        : walk.index[scope];
      const inferred = inferRootConceptFallbackCode(
        obj.node_id,
        activeTable,
        walk.index,
        scope,
      );
      if (inferred) meta[TERM_NAME_FALLBACK_NODE_ID_KEY] = inferred;
    }
  }
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

const STANDARD_ARCHETYPE_HRID_RE =
  /^(?:[a-zA-Z0-9_.-]+::)?[a-zA-Z][a-zA-Z0-9_]*-[a-zA-Z][a-zA-Z0-9_]*-[A-Z][A-Z0-9_]*\.[a-zA-Z0-9_-]+\.v\d+(?:\.\d+)*(?:-[a-zA-Z0-9_.-]+)?$/;

/**
 * True when a `C_ARCHETYPE_ROOT`'s `archetype_ref` should be used as its AQL
 * path / Web Template `nodeId` / RM `archetype_node_id` (OPT 1.4 archetype
 * roots such as `openEHR-EHR-OBSERVATION.blood_pressure.v2` with root
 * `at0000`/`id1` node id, or Web Template roots whose `node_id === archetype_ref`).
 * Returns `false` for ADL2/Better `.t.json` slot-filled overlay roots (`ovl-*`),
 * nested template ids (`Care unit v2`, `ChemoQ-fatigue`), or roots carrying a
 * non-root slot node id (`at0.6`, `at0002.3`, `at0039.1`, `id2.1`), which keep
 * their slot `node_id` in paths while using `archetype_ref` for terminology scope.
 */
export function isPathArchetypeRef(
  obj: openehr_am.C_ARCHETYPE_ROOT,
): boolean {
  const ref = obj.archetype_ref?.trim();
  if (!ref) return false;
  if (obj.node_id === ref) return true;
  if (/\.ovl-/i.test(ref)) return false;
  if (!STANDARD_ARCHETYPE_HRID_RE.test(ref)) return false;
  if (obj.node_id && !isRootConceptCode(obj.node_id)) return false;
  return true;
}

/** Root concept code of an archetype or specialization (`at0000`, `at0000.1`, `id1`, `id1.1`). */
function isRootConceptCode(code: string): boolean {
  return /^(?:at0000|id1)(?:\.\d+)*$/i.test(code);
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
  return /^(?:at|id)0\.\d/i.test(code);
}

/**
 * Parent chain for zero-prefix codes (e.g. `at0.1.1` -> `["at0.1.1", "at0.1"]`,
 * `at0.6` -> `["at0.6"]`), stopping before bare `at0`/`id0`.
 */
function zeroPrefixCodeCandidates(code: string): string[] {
  const out = [code];
  let cur = code;
  while (cur.includes(".")) {
    const parent = cur.replace(/\.\d+$/, "");
    if (parent === cur || /^(?:at|id)0$/i.test(parent)) break;
    out.push(parent);
    cur = parent;
  }
  return out;
}
