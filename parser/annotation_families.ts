/**
 * Annotation families are dotted key prefixes (`L10n.`, `a.`).
 *
 * @see https://discourse.openehr.org/t/agreeing-on-optional-user-interface-hints-in-templates/2406/19
 * @see https://discourse.openehr.org/t/limitation-preventing-multilingual-repeated-parts-in-the-opt-operational-template-export-format/2760
 */

import {
  type AnnotationDocumentation,
  annotationPathOf,
  type DefinitionTreeNode,
} from "./clinical_model_annotations.ts";
import type { L10nSourceNode } from "./l10n_annotation_generate.ts";

/** Keys with no dotted namespace, e.g. `comment`, `design note`, `ui`. */
export const UNPREFIXED_FAMILY = "(unprefixed)";

/** Always listed in the TAAAT legend, even when unused on the current model. */
export const KNOWN_FAMILIES = ["L10n.", "a.", UNPREFIXED_FAMILY] as const;

export interface AnnotationPill {
  language: string;
  key: string;
  value: string;
  family: string;
}

/** First dotted segment of a key (`L10n.sv` → `L10n.`, `a.rule.adl` → `a.`). */
export function annotationFamily(key: string): string {
  const m = key.trim().match(/^([A-Za-z][A-Za-z0-9]*)\./);
  return m ? `${m[1]}.` : UNPREFIXED_FAMILY;
}

export function listLanguageBags(
  doc: AnnotationDocumentation | undefined,
  extra: string[] = [],
): string[] {
  const set = new Set<string>();
  for (const lang of extra) {
    if (lang.trim()) set.add(lang.trim());
  }
  if (doc) {
    for (const lang of Object.keys(doc)) {
      if (lang.trim()) set.add(lang);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function listFamilies(
  doc: AnnotationDocumentation | undefined,
): string[] {
  const set = new Set<string>(KNOWN_FAMILIES);
  if (doc) {
    for (const bag of Object.values(doc)) {
      for (const atPath of Object.values(bag ?? {})) {
        for (const key of Object.keys(atPath ?? {})) {
          set.add(annotationFamily(key));
        }
      }
    }
  }
  const known = KNOWN_FAMILIES as readonly string[];
  const rest = [...set].filter((f) => !known.includes(f)).sort();
  return [...known, ...rest];
}

/** Every language bag × key at a path (nothing collapsed). */
export function pillsAtPath(
  doc: AnnotationDocumentation | undefined,
  path: string,
): AnnotationPill[] {
  if (!doc) return [];
  const pills: AnnotationPill[] = [];
  for (const language of listLanguageBags(doc)) {
    const items = doc[language]?.[path] ?? {};
    for (const [key, value] of Object.entries(items)) {
      pills.push({
        language,
        key,
        value,
        family: annotationFamily(key),
      });
    }
  }
  return pills.sort((a, b) =>
    a.family.localeCompare(b.family) ||
    a.key.localeCompare(b.key) ||
    a.language.localeCompare(b.language)
  );
}

export function flattenDefinitionTree(
  node: DefinitionTreeNode,
  out: DefinitionTreeNode[] = [],
): DefinitionTreeNode[] {
  out.push(node);
  for (const child of node.children) flattenDefinitionTree(child, out);
  return out;
}

/** Union language bags and paths from several documentation maps. */
export function mergeDocumentation(
  docs: Array<AnnotationDocumentation | undefined>,
): AnnotationDocumentation {
  const out: AnnotationDocumentation = {};
  for (const doc of docs) {
    if (!doc) continue;
    for (const [lang, paths] of Object.entries(doc)) {
      out[lang] ??= {};
      for (const [path, keys] of Object.entries(paths ?? {})) {
        out[lang][path] = { ...out[lang][path], ...keys };
      }
    }
  }
  return out;
}

/**
 * Project each node's owner documentation onto the tree `path` so L10n
 * generation and scans can use one map.
 */
export function documentationViewForTree(
  tree: DefinitionTreeNode,
  getDoc: (node: DefinitionTreeNode) => AnnotationDocumentation | undefined,
): AnnotationDocumentation {
  const out: AnnotationDocumentation = {};
  for (const node of flattenDefinitionTree(tree)) {
    const src = getDoc(node);
    if (!src) continue;
    const srcPath = annotationPathOf(node);
    for (const [lang, paths] of Object.entries(src)) {
      const items = paths?.[srcPath];
      if (!items) continue;
      out[lang] ??= {};
      out[lang][node.path] = { ...out[lang][node.path], ...items };
    }
  }
  return out;
}

/**
 * Seed L10n generation from existing L10n.* values on each node.
 * Does not invent names from RM-type labels.
 */
export function l10nSourcesFromTree(
  tree: DefinitionTreeNode,
  doc: AnnotationDocumentation | undefined,
): L10nSourceNode[] {
  return flattenDefinitionTree(tree).map((node) => {
    const localizedNames: Record<string, string> = {};
    if (doc) {
      for (const bag of Object.values(doc)) {
        const items = bag?.[node.path] ?? {};
        for (const [key, value] of Object.entries(items)) {
          const m = /^L10n\.(.+)$/i.exec(key);
          if (m && value.trim()) localizedNames[m[1].toLowerCase()] = value;
        }
      }
    }
    return {
      path: node.path,
      archetypeRef: node.archetypeRef,
      localizedNames,
    };
  });
}

const LANGUAGE_OUTLINE: Record<string, string> = {
  en: "#2563eb",
  sv: "#ca8a04",
  de: "#dc2626",
  fr: "#16a34a",
  nb: "#7c3aed",
  nn: "#6d28d9",
  da: "#db2777",
  fi: "#0891b2",
  es: "#ea580c",
  it: "#0d9488",
  nl: "#4f46e5",
  pt: "#c026d3",
};

const FAMILY_FILL: Record<string, string> = {
  "L10n.": "#ede9fe",
  "a.": "#d1fae5",
  [UNPREFIXED_FAMILY]: "#e2e8f0",
};

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function languageOutlineColor(language: string): string {
  const key = language.toLowerCase();
  return LANGUAGE_OUTLINE[key] ?? `hsl(${hashHue(key)} 70% 38%)`;
}

export function familyFillColor(family: string): string {
  return FAMILY_FILL[family] ?? `hsl(${hashHue(family)} 45% 90%)`;
}

export function familyLegendLabel(family: string): string {
  if (family === UNPREFIXED_FAMILY) return "unprefixed";
  return family;
}
