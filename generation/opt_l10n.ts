/**
 * L10n annotation helpers for legacy OPT XML.
 *
 * OPT 1.4 stores one ontology block per archetype id, so renamed/repeated
 * occurrences cannot carry independent translations. Better Studio and related
 * tools use path annotations `L10n.{lang} = text` as a workaround
 * (see discourse.openehr.org/t/2760).
 */

import type * as openehr_am from "../am/openehr_am.ts";
import * as openehr_base from "../base/openehr_base.ts";
import { getAnnotationsDocumentation } from "../parser/aom_odin_sections.ts";
import { isGenericRmFallbackLabel } from "./term_scope.ts";

/** language → path → annotation key → value (RESOURCE_ANNOTATIONS.documentation). */
export type AnnotationDocumentation = Record<
  string,
  Record<string, Record<string, string>>
>;

/** OPT XML path annotations are language-less: path → key → value. */
export type OptPathAnnotationMap = Record<string, Record<string, string>>;

/** Matches Better/AD `L10n.sv`, `L10n.en`, … annotation keys. */
export const L10N_ANNOTATION_KEY = /^L10n\.(.+)$/i;

/** Language bag used when OPT XML has no language compartment for annotations. */
export const OPT_ANNOTATION_LANG = "_";

export function l10nAnnotationKey(language: string): string {
  return `L10n.${language}`;
}

export function languageFromL10nKey(key: string): string | undefined {
  const m = L10N_ANNOTATION_KEY.exec(key);
  return m?.[1]?.toLowerCase();
}

/** Extract `L10n.{lang}` entries as `{ lang: text }`. */
export function extractL10nNames(
  items: Record<string, string> | undefined,
): Record<string, string> {
  if (!items) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(items)) {
    const lang = languageFromL10nKey(key);
    if (lang && value) out[lang] = value;
  }
  return out;
}

/**
 * Strip the leading `[archetypeId]` segment used in OPT annotation paths so
 * they align with Web Template AQL paths (EHRbase OPTParser does the same).
 */
export function stripLeadingArchetypeId(path: string): string {
  if (!path) return path;
  if (path.startsWith("/")) return path;
  const slash = path.indexOf("/");
  if (slash < 0) return path.startsWith("[") ? "/" : path;
  return path.slice(slash);
}

/** Drop name predicates that OPT uses to disambiguate repeated nodes. */
export function stripNamePredicates(path: string): string {
  return path
    .replace(/\s+and\s+name\/value\s*=\s*'[^']*'/gi, "")
    .replace(/\s+and\s+name\/value\s*=\s*"[^"]*"/gi, "")
    .replace(/\s*,\s*'[^']*'/g, "")
    .replace(/\s*,\s*"[^"]*"/g, "");
}

export function normalizeAnnotationPath(path: string): string {
  const stripped = stripNamePredicates(stripLeadingArchetypeId(path.trim()));
  return stripped || "/";
}

interface ParsedAnnotationSegment {
  attr: string;
  nodeId?: string;
  nameValue?: string;
}

const ANNOTATION_PREDICATE_RE =
  /^\s*([^\s,]+)\s*(?:(?:,|\band\s+name\/value\s*=)\s*(['"])((?:(?!\2).)*)\2)?\s*$/is;

/**
 * Quote- and bracket-aware AQL / OPT annotation path splitter.
 * Keeps `/` inside `[...]` name predicates (e.g. `name/value='A/B'`) intact.
 */
function parseAnnotationPathSegments(path: string): ParsedAnnotationSegment[] {
  const stripped = stripLeadingArchetypeId(path.trim());
  if (!stripped || stripped === "/") return [];
  const parts: string[] = [];
  let buf = "";
  let depth = 0;
  let quote: string | null = null;
  for (const ch of stripped) {
    if (quote) {
      buf += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (depth > 0 && (ch === "'" || ch === '"')) quote = ch;
    else if (ch === "[") depth++;
    else if (ch === "]") depth = Math.max(0, depth - 1);
    else if (ch === "/" && depth === 0) {
      if (buf) parts.push(buf);
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf) parts.push(buf);

  const out: ParsedAnnotationSegment[] = [];
  for (const part of parts) {
    const m = /^([^[]+)(?:\[(.*)\])?$/s.exec(part);
    if (!m) continue;
    const seg: ParsedAnnotationSegment = { attr: m[1] };
    if (m[2] !== undefined) {
      const p = ANNOTATION_PREDICATE_RE.exec(m[2]);
      if (p) {
        seg.nodeId = p[1];
        if (p[3] !== undefined) seg.nameValue = p[3];
      } else {
        seg.nodeId = m[2].trim();
      }
    }
    out.push(seg);
  }
  return out;
}

/**
 * Flatten RESOURCE_ANNOTATIONS.documentation into a path → items map.
 * Keys keep name predicates (after stripping the leading archetype id) so
 * repeated occurrences stay distinct.
 */
export function flattenOptPathAnnotations(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): OptPathAnnotationMap {
  const doc = getAnnotationsDocumentation(opt) as
    | AnnotationDocumentation
    | undefined;
  if (!doc) return {};
  const out: OptPathAnnotationMap = {};
  for (const lang of Object.keys(doc)) {
    for (const [path, items] of Object.entries(doc[lang] ?? {})) {
      if (!path || !items) continue;
      const withRoot = stripLeadingArchetypeId(path);
      out[path] ??= {};
      Object.assign(out[path], items);
      if (withRoot !== path) {
        out[withRoot] ??= {};
        Object.assign(out[withRoot], items);
      }
    }
  }
  return out;
}

export interface AnnotationLookupOptions {
  /**
   * Additional candidate names for the target node (e.g. original-language
   * name or `fixedNameConstraint` value), used when `aqlPath` does not carry
   * an explicit leaf `name/value` predicate.
   */
  candidateNames?: ReadonlyArray<string | undefined>;
  /**
   * Optional ancestor node names aligned to the segments of `aqlPath`
   * (0-indexed after stripping any leading `[archetypeId]`). Each entry may be
   * a single name or multiple candidate names (e.g. fixed name + localised
   * names) to disambiguate repeated renamed ancestor archetypes.
   */
  ancestorNames?: ReadonlyArray<string | ReadonlyArray<string | undefined> | undefined>;
}

interface IndexedAnnotationEntry {
  key: string;
  segs: ParsedAnnotationSegment[];
}

const annotationIndexCache = new WeakMap<
  OptPathAnnotationMap,
  Map<string, IndexedAnnotationEntry[]>
>();

function getAnnotationBucketIndex(
  map: OptPathAnnotationMap,
): Map<string, IndexedAnnotationEntry[]> {
  let byNorm = annotationIndexCache.get(map);
  if (byNorm) return byNorm;
  byNorm = new Map();
  for (const key of Object.keys(map)) {
    const norm = normalizeAnnotationPath(key);
    const segs = parseAnnotationPathSegments(key);
    let list = byNorm.get(norm);
    if (!list) {
      list = [];
      byNorm.set(norm, list);
    }
    list.push({ key, segs });
  }
  annotationIndexCache.set(map, byNorm);
  return byNorm;
}

function normalizedNameSet(
  input: string | ReadonlyArray<string | undefined> | undefined,
): Set<string> {
  const out = new Set<string>();
  if (!input) return out;
  if (typeof input === "string") {
    const t = input.trim().toLowerCase();
    if (t) out.add(t);
    return out;
  }
  for (const item of input) {
    if (!item) continue;
    const t = item.trim().toLowerCase();
    if (t) out.add(t);
  }
  return out;
}

/**
 * Look up annotations for a Web Template / AQL path (optional node name and
 * ancestor/candidate disambiguation).
 *
 * Matches explicit `name/value` predicates already present on `aqlPath`
 * (regardless of the display-language `nodeName`), supports both
 * `[id and name/value='X']` and `[id, 'X']` spellings, and disambiguates
 * ancestor name predicates when `ancestorNames` are supplied while remaining
 * compatible when `aqlPath` omits non-colliding ancestor predicates.
 */
export function annotationsForAqlPath(
  map: OptPathAnnotationMap,
  aqlPath: string,
  nodeName?: string,
  options?: AnnotationLookupOptions,
): Record<string, string> | undefined {
  if (!aqlPath) return undefined;

  const norm = normalizeAnnotationPath(aqlPath);
  const index = getAnnotationBucketIndex(map);
  let bucket = index.get(norm);

  // If caller mutated `map` after initial indexing, refresh the cache once.
  const direct = map[aqlPath] ?? map[stripLeadingArchetypeId(aqlPath)];
  if (direct && (!bucket || !bucket.some((e) => map[e.key] === direct))) {
    annotationIndexCache.delete(map);
    bucket = getAnnotationBucketIndex(map).get(norm);
  }

  if (!bucket || bucket.length === 0) return undefined;

  const querySegs = parseAnnotationPathSegments(aqlPath);
  if (querySegs.length === 0) {
    for (const entry of bucket) {
      const items = map[entry.key];
      if (items && Object.keys(items).length) return { ...items };
    }
    return undefined;
  }

  const targetCandidateNames = normalizedNameSet([
    nodeName,
    ...(options?.candidateNames ?? []),
  ]);
  const ancestorNames = options?.ancestorNames;
  const len = querySegs.length;

  let bestScore = -1;
  let bestItems: Record<string, string> | undefined;

  for (const entry of bucket) {
    const items = map[entry.key];
    if (!items || Object.keys(items).length === 0) continue;
    const entrySegs = entry.segs;
    if (entrySegs.length !== len) continue;

    let score = 0;
    let rejected = false;

    for (let i = 0; i < len; i++) {
      const qPred = querySegs[i].nameValue?.trim().toLowerCase();
      const ePred = entrySegs[i].nameValue?.trim().toLowerCase();
      const isLast = i === len - 1;

      if (qPred) {
        if (ePred) {
          if (ePred === qPred) {
            score += isLast ? 1000 : 500;
          } else {
            rejected = true;
            break;
          }
        } else {
          score += isLast ? 1 : 2;
        }
      } else if (isLast) {
        if (ePred) {
          if (targetCandidateNames.size > 0) {
            if (targetCandidateNames.has(ePred)) {
              score += 800;
            } else {
              rejected = true;
              break;
            }
          } else {
            score += 10;
          }
        } else {
          score += 100;
        }
      } else {
        // Ancestor segment without an explicit predicate on the queried aqlPath.
        if (ePred) {
          const ancSet = normalizedNameSet(ancestorNames?.[i]);
          if (ancSet.size > 0) {
            if (ancSet.has(ePred)) {
              score += 400;
            } else {
              rejected = true;
              break;
            }
          } else {
            score += 5;
          }
        } else {
          score += 50;
        }
      }
    }

    if (!rejected && score > bestScore) {
      bestScore = score;
      bestItems = items;
    }
  }

  return bestItems ? { ...bestItems } : undefined;
}

/**
 * Merge L10n annotation values into localizedNames (annotations win on conflict
 * for the languages they define).
 */
export function applyL10nToLocalizedNames(
  localizedNames: Record<string, string> | undefined,
  annotationItems: Record<string, string> | undefined,
): Record<string, string> | undefined {
  const fromL10n = extractL10nNames(annotationItems);
  if (!Object.keys(fromL10n).length) return localizedNames;
  return { ...(localizedNames ?? {}), ...fromL10n };
}

export function ensureOptAnnotations(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  language = OPT_ANNOTATION_LANG,
): AnnotationDocumentation {
  let ann = (opt as { annotations?: openehr_base.RESOURCE_ANNOTATIONS })
    .annotations;
  if (!ann) {
    ann = new openehr_base.RESOURCE_ANNOTATIONS();
    (opt as { annotations?: openehr_base.RESOURCE_ANNOTATIONS }).annotations =
      ann;
  }
  const bag = ann as { documentation?: AnnotationDocumentation };
  bag.documentation ??= {};
  bag.documentation[language] ??= {};
  return bag.documentation;
}

/** Set a single path annotation (creates RESOURCE_ANNOTATIONS as needed). */
export function setOptPathAnnotation(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  path: string,
  key: string,
  value: string,
  language = OPT_ANNOTATION_LANG,
): void {
  const doc = ensureOptAnnotations(opt, language);
  doc[language] ??= {};
  doc[language][path] ??= {};
  doc[language][path][key] = value;
}

/** Replace all items for a path (used when parsing OPT XML annotations). */
export function setOptPathAnnotationItems(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  path: string,
  items: Record<string, string>,
  language = OPT_ANNOTATION_LANG,
): void {
  if (!Object.keys(items).length) return;
  const doc = ensureOptAnnotations(opt, language);
  doc[language] ??= {};
  doc[language][path] = { ...(doc[language][path] ?? {}), ...items };
}

/**
 * Build L10n.* annotation items from a localizedNames map.
 * Skips empty values. Optionally skips the primary language (name constraints /
 * term_definitions already cover that language in OPT).
 */
export function l10nItemsFromLocalizedNames(
  localizedNames: Record<string, string> | undefined,
  options?: { skipLanguages?: string[] },
): Record<string, string> {
  if (!localizedNames) return {};
  const skip = new Set(
    (options?.skipLanguages ?? []).map((l) => l.toLowerCase()),
  );
  const out: Record<string, string> = {};
  for (const [lang, text] of Object.entries(localizedNames)) {
    if (!text || skip.has(lang.toLowerCase())) continue;
    out[l10nAnnotationKey(lang)] = text;
  }
  return out;
}

export interface WebTemplateL10nNode {
  aqlPath?: string;
  rmType?: string;
  name?: string;
  localizedName?: string;
  localizedNames?: Record<string, string>;
  max?: number;
  inputs?: unknown[];
  children?: unknown[];
}

/**
 * Collect path → L10n items from a Web Template tree for OPT export.
 * Always emits L10n keys for every language present so repeated renamed
 * nodes keep translations that cannot live in component_ontologies.
 *
 * Skips prohibited (`max === 0`) nodes and never emits or overwrites clinical
 * labels with generic RM-type fallback names (`"element"`, `"cluster"`, ...).
 */
export function collectL10nAnnotationsFromWebTemplateTree(
  node: WebTemplateL10nNode,
  out: OptPathAnnotationMap = {},
  options?: { defaultLanguage?: string; parentRmType?: string },
): OptPathAnnotationMap {
  if (node.max === 0) return out;

  const rawPath = node.aqlPath?.trim();
  if (rawPath && rawPath !== "/") {
    const names: Record<string, string> = {};
    for (const [lang, text] of Object.entries(node.localizedNames ?? {})) {
      if (!text || isGenericRmFallbackLabel(text, node.rmType)) continue;
      names[lang] = text;
    }
    const defaultLang = options?.defaultLanguage;
    if (defaultLang && !names[defaultLang]) {
      const fallbackText = node.localizedName ?? node.name;
      if (fallbackText && !isGenericRmFallbackLabel(fallbackText, node.rmType)) {
        names[defaultLang] = fallbackText;
      }
    }

    const items = l10nItemsFromLocalizedNames(names);
    if (Object.keys(items).length) {
      // Keep name predicates: name-constrained siblings (two SECTION.adhoc)
      // share the predicate-free path. Strip trailing `/value` on collapsed
      // ELEMENT leaves so annotation paths align with OPT ELEMENT paths.
      let key = stripLeadingArchetypeId(rawPath);
      const isCollapsedElementLeaf = key.endsWith("/value") &&
        options?.parentRmType !== "ELEMENT" &&
        !node.children?.length;
      if (isCollapsedElementLeaf) {
        key = key.slice(0, -"/value".length) || "/";
      }
      out[key] = { ...(out[key] ?? {}), ...items };
    }
  }
  for (const child of node.children ?? []) {
    if (child && typeof child === "object") {
      collectL10nAnnotationsFromWebTemplateTree(
        child as WebTemplateL10nNode,
        out,
        {
          defaultLanguage: options?.defaultLanguage,
          parentRmType: node.rmType,
        },
      );
    }
  }
  return out;
}

/** Attach a path-annotation map onto an operational template. */
export function applyPathAnnotationsToOpt(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  map: OptPathAnnotationMap,
  language = OPT_ANNOTATION_LANG,
): void {
  for (const [path, items] of Object.entries(map)) {
    setOptPathAnnotationItems(opt, path, items, language);
  }
}

/**
 * Serialize path annotations for OPT XML (`<annotations path="...">`).
 * Prefers raw paths from documentation when present; otherwise normalized paths.
 */
export function optAnnotationsForXml(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): Array<{ path: string; items: Record<string, string> }> {
  const doc = getAnnotationsDocumentation(opt) as
    | AnnotationDocumentation
    | undefined;
  if (!doc) return [];

  // Prefer the OPT_ANNOTATION_LANG bag, else merge all bags by path.
  const preferred = doc[OPT_ANNOTATION_LANG];
  const byPath: OptPathAnnotationMap = {};
  if (preferred) {
    for (const [path, items] of Object.entries(preferred)) {
      byPath[path] = { ...items };
    }
  } else {
    for (const lang of Object.keys(doc)) {
      for (const [path, items] of Object.entries(doc[lang] ?? {})) {
        byPath[path] ??= {};
        Object.assign(byPath[path], items);
      }
    }
  }

  return Object.entries(byPath)
    .filter(([, items]) => Object.keys(items).length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, items]) => ({ path, items }));
}
