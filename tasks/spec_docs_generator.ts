/**
 * Build BMM-backed specification description tables (class/attribute prose
 * plus development-stream HTML and Markdown URLs).
 */
import type { BmmClass, BmmModel } from "./bmm_parser.ts";

const SPEC_ORIGIN = "https://specifications.openehr.org";

const SPEC_FILE_ALIASES: Record<string, string> = {
  aom14: "AOM1.4",
  adl14: "ADL1.4",
  AOM2: "AOM2",
  ADL2: "ADL2",
  OPT2: "OPT2",
};

const COMPONENT_FROM_BMM: Record<string, string> = {
  openehr_am: "AM",
  openehr_base: "BASE",
  openehr_lang: "LANG",
  openehr_rm: "RM",
  openehr_term: "TERM",
};

export interface SpecAttributeRow {
  name: string;
  documentation: string;
}

export interface SpecClassRow {
  name: string;
  component: string;
  documentation?: string;
  attributes: SpecAttributeRow[];
  specHtmlUrl?: string;
  specMarkdownUrl?: string;
}

export interface SpecDocsTables {
  generatedAt: string;
  sources: string[];
  classes: SpecClassRow[];
}

export interface ClassesJsonEntry {
  name: string;
  component?: string;
  package?: string;
  specification?: string;
  fragment?: string;
  link?: string;
}

export interface ClassesJson {
  classes?: ClassesJsonEntry[];
}

function specFileName(specification?: string): string | undefined {
  if (!specification) return undefined;
  const aliased = SPEC_FILE_ALIASES[specification] ?? specification;
  return aliased.endsWith(".html") ? aliased : `${aliased}.html`;
}

function htmlUrlFor(entry: ClassesJsonEntry | undefined): string | undefined {
  if (!entry) return undefined;
  if (entry.link) {
    return entry.link.startsWith("http")
      ? entry.link
      : `${SPEC_ORIGIN}${entry.link}`;
  }
  const file = specFileName(entry.specification);
  if (!entry.component || !file || !entry.fragment) return undefined;
  return `${SPEC_ORIGIN}/releases/${entry.component}/development/${file}#${entry.fragment}`;
}

function markdownUrlFor(htmlUrl?: string): string | undefined {
  if (!htmlUrl) return undefined;
  const hash = htmlUrl.indexOf("#");
  const base = hash >= 0 ? htmlUrl.slice(0, hash) : htmlUrl;
  const frag = hash >= 0 ? htmlUrl.slice(hash) : "";
  if (!base.endsWith(".html")) return undefined;
  return `${base.slice(0, -5)}.md${frag}`;
}

function pickClassIndex(
  name: string,
  component: string,
  index: Map<string, ClassesJsonEntry[]>,
): ClassesJsonEntry | undefined {
  const hits = index.get(name) ?? [];
  if (!hits.length) return undefined;
  const same = hits.find((h) =>
    (h.component ?? "").toUpperCase() === component.toUpperCase()
  );
  if (same) return same;
  return hits.find((h) => h.link) ?? hits[0];
}

function classRowsFromModel(
  model: BmmModel,
  component: string,
  index: Map<string, ClassesJsonEntry[]>,
): SpecClassRow[] {
  const rows: SpecClassRow[] = [];
  const bags: Array<Record<string, BmmClass> | undefined> = [
    model.class_definitions,
    model.primitive_types,
  ];
  for (const bag of bags) {
    if (!bag) continue;
    for (const cls of Object.values(bag)) {
      if (!cls?.name) continue;
      const loc = pickClassIndex(cls.name, component, index);
      const html = htmlUrlFor(loc);
      const attributes: SpecAttributeRow[] = [];
      for (const prop of Object.values(cls.properties ?? {})) {
        const doc = prop.documentation?.trim();
        if (!doc) continue;
        attributes.push({ name: prop.name, documentation: doc });
      }
      attributes.sort((a, b) => a.name.localeCompare(b.name));
      const row: SpecClassRow = {
        name: cls.name,
        component,
        attributes,
      };
      const classDoc = cls.documentation?.trim();
      if (classDoc) row.documentation = classDoc;
      if (html) {
        row.specHtmlUrl = html;
        const md = markdownUrlFor(html);
        if (md) row.specMarkdownUrl = md;
      }
      rows.push(row);
    }
  }
  return rows;
}

export function buildSpecDocsTables(
  models: Array<{ packageKey: string; model: BmmModel; source: string }>,
  classesJson: ClassesJson,
  generatedAt = new Date().toISOString(),
): SpecDocsTables {
  const index = new Map<string, ClassesJsonEntry[]>();
  for (const entry of classesJson.classes ?? []) {
    if (!entry.name) continue;
    const list = index.get(entry.name) ?? [];
    list.push(entry);
    index.set(entry.name, list);
  }
  const sources: string[] = [];
  const classes: SpecClassRow[] = [];
  const seen = new Set<string>();
  for (const { packageKey, model, source } of models) {
    sources.push(source);
    const component = COMPONENT_FROM_BMM[packageKey] ?? packageKey;
    for (const row of classRowsFromModel(model, component, index)) {
      const key = `${row.component}:${row.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      classes.push(row);
    }
  }
  for (const entry of classesJson.classes ?? []) {
    if (!entry.name) continue;
    const component = (entry.component ?? "").toUpperCase() || "UNKNOWN";
    const key = `${component}:${entry.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const html = htmlUrlFor(entry);
    const row: SpecClassRow = {
      name: entry.name,
      component,
      attributes: [],
    };
    if (html) {
      row.specHtmlUrl = html;
      const md = markdownUrlFor(html);
      if (md) row.specMarkdownUrl = md;
    }
    classes.push(row);
  }
  classes.sort((a, b) =>
    a.name.localeCompare(b.name) || a.component.localeCompare(b.component)
  );
  return { generatedAt, sources, classes };
}

export function emitSpecDocsTypeScript(tables: SpecDocsTables): string {
  const header =
    `// Generated openEHR class/attribute specification descriptions from BMM
// plus development-stream HTML / Markdown URLs from /api/classes.json.
// Sources:
${tables.sources.map((s) => `//   - ${s}`).join("\n")}
// Generated: ${tables.generatedAt}
//
// DO NOT EDIT THIS FILE DIRECTLY — regenerate with:
//   deno run --allow-read --allow-net --allow-write tasks/generate_spec_docs.ts
//

`;
  return `${header}export interface SpecAttributeRow {
  name: string;
  documentation: string;
}

export interface SpecClassRow {
  name: string;
  component: string;
  documentation?: string;
  attributes: SpecAttributeRow[];
  specHtmlUrl?: string;
  specMarkdownUrl?: string;
}

export const SPEC_DOCS_GENERATED_AT = ${JSON.stringify(tables.generatedAt)};
export const SPEC_DOCS_SOURCES: readonly string[] = ${
    JSON.stringify(tables.sources, null, 2)
  };
export const SPEC_CLASS_ROWS: readonly SpecClassRow[] = ${
    JSON.stringify(tables.classes, null, 2)
  };
`;
}
