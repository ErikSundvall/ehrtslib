/**
 * L10n annotation helpers for legacy OPT XML.
 *
 * OPT 1.4 stores one ontology block per archetype id, so renamed/repeated
 * occurrences cannot carry independent translations. Better Studio and related
 * tools use path annotations `L10n.{lang} = text` as a workaround
 * (see discourse.openehr.org/t/2760).
 */

import * as openehr_am from "../am/openehr_am.ts";
import * as openehr_base from "../base/openehr_base.ts";
import { getAnnotationsDocumentation } from "../parser/aom_odin_sections.ts";

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
    .replace(/,'[^']*'/g, "")
    .replace(/,"[^"]*"/g, "");
}

export function normalizeAnnotationPath(path: string): string {
  return stripNamePredicates(stripLeadingArchetypeId(path.trim()));
}

/**
 * Flatten RESOURCE_ANNOTATIONS.documentation into a path → items map.
 * Keys keep name predicates (after stripping the leading archetype id) so
 * repeated occurrences stay distinct. A name-stripped fallback is added only
 * when that key is still free.
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
      out[withRoot] ??= {};
      Object.assign(out[withRoot], items);
      const norm = stripNamePredicates(withRoot);
      if (norm !== withRoot && !out[norm]) {
        out[norm] = { ...items };
      }
    }
  }
  return out;
}

/** Look up annotations for a Web Template / AQL path (optional node name). */
export function annotationsForAqlPath(
  map: OptPathAnnotationMap,
  aqlPath: string,
  nodeName?: string,
): Record<string, string> | undefined {
  if (!aqlPath) return undefined;

  const candidates: string[] = [aqlPath, stripLeadingArchetypeId(aqlPath)];
  if (nodeName) {
    // OPT-style name predicate on the last path segment.
    const named = aqlPath.replace(
      /\]$/,
      ` and name/value='${nodeName}']`,
    );
    if (named !== aqlPath) candidates.push(named, stripLeadingArchetypeId(named));
    // Ocean-style short name qualifier: [archetypeId,'Name']
    const shortNamed = aqlPath.replace(
      /\[([^\]]+)\]$/,
      `[$1,'${nodeName}']`,
    );
    if (shortNamed !== aqlPath) {
      candidates.push(shortNamed, stripLeadingArchetypeId(shortNamed));
    }
  }
  candidates.push(normalizeAnnotationPath(aqlPath));

  for (const key of candidates) {
    const items = map[key];
    if (items && Object.keys(items).length) return { ...items };
  }

  const norm = normalizeAnnotationPath(aqlPath);
  for (const [path, items] of Object.entries(map)) {
    if (normalizeAnnotationPath(path) !== norm) continue;
    if (nodeName) {
      const lower = path.toLowerCase();
      const n = nodeName.toLowerCase();
      if (
        lower.includes(`name/value='${n}'`) ||
        lower.includes(`,'${n}'`) ||
        lower.includes(`,"${n}"`)
      ) {
        return { ...items };
      }
      continue;
    }
    if (Object.keys(items).length) return { ...items };
  }
  return undefined;
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

/**
 * Collect path → L10n items from a Web Template tree for OPT export.
 * Always emits L10n keys for every language present so repeated renamed
 * nodes keep translations that cannot live in component_ontologies.
 */
export function collectL10nAnnotationsFromWebTemplateTree(
  node: {
    aqlPath?: string;
    localizedNames?: Record<string, string>;
    children?: unknown[];
  },
  out: OptPathAnnotationMap = {},
): OptPathAnnotationMap {
  const path = node.aqlPath;
  if (path && path !== "/") {
    const items = l10nItemsFromLocalizedNames(node.localizedNames);
    if (Object.keys(items).length) {
      const key = normalizeAnnotationPath(path);
      out[key] = { ...(out[key] ?? {}), ...items };
    }
  }
  for (const child of node.children ?? []) {
    if (child && typeof child === "object") {
      collectL10nAnnotationsFromWebTemplateTree(
        child as {
          aqlPath?: string;
          localizedNames?: Record<string, string>;
          children?: unknown[];
        },
        out,
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
