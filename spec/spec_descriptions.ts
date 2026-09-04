/**
 * Optional specification-description package (BMM prose + spec URLs).
 *
 * Import `spec/mod.ts` directly so form-engine / compact bundles that do not
 * need class help text never load the generated tables.
 *
 * Distinct from `meta` (RM attribute *schema*: types, multiplicity) — this
 * module is documentation text and links for UI / LLM help.
 *
 * Data: `spec_docs.generated.ts` (regenerate via
 * `deno run --allow-read --allow-net --allow-write tasks/generate_spec_docs.ts`).
 */

import {
  SPEC_CLASS_ROWS,
  SPEC_DOCS_GENERATED_AT,
  SPEC_DOCS_SOURCES,
  type SpecAttributeRow,
  type SpecClassRow,
} from "./spec_docs.generated.ts";

export {
  SPEC_DOCS_GENERATED_AT,
  SPEC_DOCS_SOURCES,
  type SpecAttributeRow,
  type SpecClassRow,
};

export interface SpecLookupOptions {
  /** Prefer this openEHR component (RM, AM, BASE, LANG, TERM) when names collide. */
  component?: string;
}

const byName = new Map<string, SpecClassRow[]>();
for (const row of SPEC_CLASS_ROWS) {
  const key = row.name.toUpperCase();
  const list = byName.get(key) ?? [];
  list.push(row);
  byName.set(key, list);
}

const COMPONENT_RANK: Record<string, number> = {
  RM: 0,
  AM: 1,
  BASE: 2,
  LANG: 3,
  TERM: 4,
};

function pickRow(
  name: string,
  options?: SpecLookupOptions,
): SpecClassRow | undefined {
  const hits = byName.get(name.toUpperCase());
  if (!hits?.length) return undefined;
  const wanted = options?.component?.toUpperCase();
  if (wanted) {
    const match = hits.find((h) => h.component.toUpperCase() === wanted);
    if (match) return match;
  }
  const withUrl = hits.filter((h) => h.specHtmlUrl);
  const pool = withUrl.length ? withUrl : hits;
  return [...pool].sort((a, b) =>
    (COMPONENT_RANK[a.component] ?? 9) - (COMPONENT_RANK[b.component] ?? 9)
  )[0];
}

/** Class-level BMM documentation plus specification HTML/Markdown URLs. */
export function classSpec(
  name: string,
  options?: SpecLookupOptions,
): SpecClassRow | undefined {
  return pickRow(name, options);
}

/** Attribute-level BMM documentation for `className.attributeName`. */
export function attributeSpec(
  className: string,
  attributeName: string,
  options?: SpecLookupOptions,
): SpecAttributeRow | undefined {
  const cls = pickRow(className, options);
  if (!cls) return undefined;
  const wanted = attributeName.toLowerCase();
  return cls.attributes.find((a) => a.name.toLowerCase() === wanted);
}

/** Development-stream HTML class section and Markdown twin URLs. */
export function specUrls(
  name: string,
  options?: SpecLookupOptions,
): { html?: string; markdown?: string } | undefined {
  const cls = pickRow(name, options);
  if (!cls) return undefined;
  const out: { html?: string; markdown?: string } = {};
  if (cls.specHtmlUrl) out.html = cls.specHtmlUrl;
  if (cls.specMarkdownUrl) out.markdown = cls.specMarkdownUrl;
  return out.html || out.markdown ? out : undefined;
}

export function hasClassSpec(name: string): boolean {
  return byName.has(name.toUpperCase());
}
