/**
 * Helpers for openEHR RESOURCE_ANNOTATIONS documentation tables and compact
 * AOM tree views used by annotation editors.
 */

import * as openehr_am from "../openehr_am.ts";
import * as openehr_base from "../openehr_base.ts";
import type { OdinObject } from "./odin_parser.ts";
import { getAnnotationsDocumentation } from "./aom_odin_sections.ts";

export interface AnnotationEntry {
  language: string;
  path: string;
  key: string;
  value: string;
}

export interface AomTreeNode {
  id: string;
  path: string;
  label: string;
  rmType?: string;
  nodeId?: string;
  attributeName?: string;
  annotationCount: number;
  hasAnnotations: boolean;
  children: AomTreeNode[];
}

export interface SetAnnotationOptions {
  language?: string;
  path: string;
  key: string;
  value: string;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : undefined;
}

function ensureDocumentation(
  archetype: openehr_am.ARCHETYPE,
): OdinObject {
  const owner = archetype as unknown as Record<string, unknown>;
  let annotations = owner.annotations as
    | openehr_base.RESOURCE_ANNOTATIONS
    | undefined;
  if (!annotations) {
    annotations = new openehr_base.RESOURCE_ANNOTATIONS();
    owner.annotations = annotations;
  }

  const bag = annotations as Record<string, unknown>;
  if (!bag.documentation || typeof bag.documentation !== "object") {
    bag.documentation = {};
  }
  return bag.documentation as OdinObject;
}

export function listAnnotations(
  archetype: openehr_am.ARCHETYPE,
): AnnotationEntry[] {
  const doc = getAnnotationsDocumentation(archetype);
  if (!doc) return [];

  const entries: AnnotationEntry[] = [];
  for (const [language, paths] of Object.entries(doc)) {
    const pathTable = asRecord(paths);
    if (!pathTable) continue;
    for (const [path, tags] of Object.entries(pathTable)) {
      const tagTable = asRecord(tags);
      if (!tagTable) continue;
      for (const [key, value] of Object.entries(tagTable)) {
        entries.push({
          language,
          path,
          key,
          value: value === undefined || value === null ? "" : String(value),
        });
      }
    }
  }
  return entries.sort((a, b) =>
    a.language.localeCompare(b.language) ||
    a.path.localeCompare(b.path) ||
    a.key.localeCompare(b.key)
  );
}

export function getAnnotationsForPath(
  archetype: openehr_am.ARCHETYPE,
  path: string,
  language = "en",
): Record<string, string> {
  const langDoc = asRecord(getAnnotationsDocumentation(archetype)?.[language]);
  const pathDoc = asRecord(langDoc?.[path]);
  if (!pathDoc) return {};
  return Object.fromEntries(
    Object.entries(pathDoc).map(([key, value]) => [
      key,
      value === undefined || value === null ? "" : String(value),
    ]),
  );
}

export function countAnnotationsForPath(
  archetype: openehr_am.ARCHETYPE,
  path: string,
): number {
  return listAnnotations(archetype).filter((entry) => entry.path === path)
    .length;
}

export function annotatedPaths(archetype: openehr_am.ARCHETYPE): Set<string> {
  return new Set(listAnnotations(archetype).map((entry) => entry.path));
}

export function setAnnotation(
  archetype: openehr_am.ARCHETYPE,
  options: SetAnnotationOptions,
): void {
  const language = options.language?.trim() || "en";
  const path = options.path.trim();
  const key = options.key.trim();
  if (!path) throw new Error("Annotation path is required");
  if (!key) throw new Error("Annotation key is required");

  const doc = ensureDocumentation(archetype);
  const langDoc = (doc[language] && typeof doc[language] === "object")
    ? doc[language] as OdinObject
    : {};
  const pathDoc = (langDoc[path] && typeof langDoc[path] === "object")
    ? langDoc[path] as OdinObject
    : {};
  pathDoc[key] = options.value;
  langDoc[path] = pathDoc;
  doc[language] = langDoc;
}

export function removeAnnotation(
  archetype: openehr_am.ARCHETYPE,
  options: Omit<SetAnnotationOptions, "value">,
): void {
  const language = options.language?.trim() || "en";
  const doc = getAnnotationsDocumentation(archetype);
  const langDoc = asRecord(doc?.[language]);
  const pathDoc = asRecord(langDoc?.[options.path]);
  if (!doc || !langDoc || !pathDoc) return;

  delete pathDoc[options.key];
  if (Object.keys(pathDoc).length === 0) {
    delete langDoc[options.path];
  }
  if (Object.keys(langDoc).length === 0) {
    delete doc[language];
  }
}

function ontologyText(
  archetype: openehr_am.ARCHETYPE,
  nodeId: string | undefined,
  language: string,
): string | undefined {
  if (!nodeId) return undefined;
  const ontology = archetype.ontology as Record<string, unknown> | undefined;
  const defs = ontology?.term_definitions as
    | Record<string, unknown>
    | undefined;
  const langDefs = asRecord(defs?.[language]) ?? asRecord(defs?.en);
  const term = asRecord(langDefs?.[nodeId]);
  const text = term?.text;
  return text === undefined || text === null ? undefined : String(text);
}

function objectChildren(cObject: openehr_am.C_OBJECT): Array<{
  attributeName: string;
  child: openehr_am.C_OBJECT;
}> {
  const attrs =
    (cObject as { attributes?: openehr_am.C_ATTRIBUTE[] }).attributes ??
      [];
  const out: Array<{ attributeName: string; child: openehr_am.C_OBJECT }> = [];
  for (const attr of attrs) {
    const attributeName = attr.rm_attribute_name ?? "";
    const children = (attr as { children?: openehr_am.C_OBJECT[] }).children ??
      [];
    for (const child of children) {
      out.push({ attributeName, child });
    }
  }
  return out;
}

function buildNode(
  archetype: openehr_am.ARCHETYPE,
  cObject: openehr_am.C_OBJECT,
  path: string,
  attributeName: string | undefined,
  language: string,
): AomTreeNode {
  const nodeId = cObject.node_id;
  const rmType = cObject.rm_type_name;
  const text = ontologyText(archetype, nodeId, language);
  const labelParts = [
    attributeName ? `${attributeName}:` : "",
    text ?? rmType ?? "node",
    nodeId ? `[${nodeId}]` : "",
  ].filter(Boolean);
  const count = countAnnotationsForPath(archetype, path);
  const node: AomTreeNode = {
    id: path,
    path,
    label: labelParts.join(" "),
    rmType,
    nodeId,
    attributeName,
    annotationCount: count,
    hasAnnotations: count > 0,
    children: [],
  };

  node.children = objectChildren(cObject).map(({ attributeName, child }) => {
    const childNodeId = child.node_id ?? child.rm_type_name ?? "node";
    const segment = attributeName
      ? `${attributeName}[${childNodeId}]`
      : `[${childNodeId}]`;
    const childPath = path === "/" ? `/${segment}` : `${path}/${segment}`;
    return buildNode(archetype, child, childPath, attributeName, language);
  });
  return node;
}

export function buildAomTree(
  archetype: openehr_am.ARCHETYPE,
  language = "en",
): AomTreeNode {
  const root = archetype.definition;
  const id = archetype.archetype_id?.value ?? "archetype";
  if (!root) {
    const count = countAnnotationsForPath(archetype, "/");
    return {
      id: "/",
      path: "/",
      label: id,
      annotationCount: count,
      hasAnnotations: count > 0,
      children: [],
    };
  }

  const tree = buildNode(archetype, root, "/", undefined, language);
  tree.label = `${id} ${tree.nodeId ? `[${tree.nodeId}]` : ""}`.trim();
  return tree;
}
