/**
 * Path-level annotation helpers and definition trees for archetypes and templates.
 */

import * as openehr_am from "../am/openehr_am.ts";
import * as openehr_base from "../base/openehr_base.ts";
import { getAnnotationsDocumentation } from "./aom_odin_sections.ts";
import { ADL2Serializer } from "../generation/adl2_serializer.ts";
import type { ArchetypeRepository } from "./legacy/archetype_repository.ts";
import type { LoadFileResult } from "./legacy/archetype_repository.ts";

/** language → path → annotation key → value */
export type AnnotationDocumentation = Record<
  string,
  Record<string, Record<string, string>>
>;

export interface DefinitionTreeNode {
  /** Stable id for UI (path-based). */
  id: string;
  /** openEHR constraint path (empty string for definition root). */
  path: string;
  label: string;
  rmType?: string;
  nodeId?: string;
  attributeName?: string;
  hasAnnotations: boolean;
  annotationKeyCount: number;
  isArchetypeRoot?: boolean;
  archetypeRef?: string;
  /**
   * Overlay archetype id when this node was grafted from a template overlay
   * (Better AD `.t.json` keeps nested constraints and path annotations there).
   */
  overlayId?: string;
  /** Path in the annotation owner's `documentation` map (overlay-relative when grafted). */
  annotationPath?: string;
  children: DefinitionTreeNode[];
}

export interface BuildDefinitionTreeOptions {
  /** Resolve `C_ARCHETYPE_ROOT.archetype_ref` (overlays / filled archetypes). */
  resolveArchetype?: (
    archetypeId: string,
  ) => openehr_am.ARCHETYPE | undefined;
}

interface BuildTreeContext {
  resolveArchetype?: BuildDefinitionTreeOptions["resolveArchetype"];
  overlayId?: string;
  overlayRootPath?: string;
}

export function annotationPathOf(node: DefinitionTreeNode): string {
  return node.annotationPath ?? node.path;
}

export type AnnotatedResource =
  | openehr_am.ARCHETYPE
  | openehr_am.TEMPLATE
  | openehr_am.TEMPLATE_OVERLAY;

export function asAnnotationDocumentation(
  doc: unknown,
): AnnotationDocumentation | undefined {
  if (!doc || typeof doc !== "object") return undefined;
  return doc as AnnotationDocumentation;
}

export function getResourceDocumentation(
  resource: AnnotatedResource,
): AnnotationDocumentation | undefined {
  return asAnnotationDocumentation(getAnnotationsDocumentation(resource));
}

export function ensureResourceAnnotations(
  resource: AnnotatedResource,
): AnnotationDocumentation {
  let ann = (resource as Record<string, unknown>).annotations as
    | openehr_base.RESOURCE_ANNOTATIONS
    | undefined;
  if (!ann) {
    ann = new openehr_base.RESOURCE_ANNOTATIONS();
    (resource as Record<string, unknown>).annotations = ann;
  }
  const bag = ann as Record<string, unknown>;
  let doc = bag.documentation as AnnotationDocumentation | undefined;
  if (!doc) {
    doc = {};
    bag.documentation = doc;
  }
  return doc;
}

export function countAnnotationKeysAtPath(
  doc: AnnotationDocumentation | undefined,
  path: string,
): number {
  if (!doc) return 0;
  let total = 0;
  for (const lang of Object.keys(doc)) {
    const atPath = doc[lang]?.[path];
    if (atPath) total += Object.keys(atPath).length;
  }
  return total;
}

export function pathHasAnnotations(
  doc: AnnotationDocumentation | undefined,
  path: string,
): boolean {
  return countAnnotationKeysAtPath(doc, path) > 0;
}

export function getPathAnnotations(
  doc: AnnotationDocumentation | undefined,
  path: string,
  language = "en",
): Record<string, string> {
  return { ...(doc?.[language]?.[path] ?? {}) };
}

export function setPathAnnotation(
  resource: AnnotatedResource,
  path: string,
  key: string,
  value: string,
  language = "en",
): void {
  const doc = ensureResourceAnnotations(resource);
  if (!doc[language]) doc[language] = {};
  if (!doc[language][path]) doc[language][path] = {};
  doc[language][path][key] = value;
}

export function removePathAnnotation(
  resource: AnnotatedResource,
  path: string,
  key: string,
  language = "en",
): void {
  const doc = getResourceDocumentation(resource);
  if (!doc?.[language]?.[path]) return;
  delete doc[language][path][key];
  if (Object.keys(doc[language][path]).length === 0) {
    delete doc[language][path];
  }
}

export function removeAllPathAnnotations(
  resource: AnnotatedResource,
  path: string,
): void {
  const doc = getResourceDocumentation(resource);
  if (!doc) return;
  for (const lang of Object.keys(doc)) {
    delete doc[lang][path];
  }
}

export function listAnnotatedPaths(
  doc: AnnotationDocumentation | undefined,
): string[] {
  if (!doc) return [];
  const paths = new Set<string>();
  for (const lang of Object.keys(doc)) {
    for (const path of Object.keys(doc[lang] ?? {})) {
      paths.add(path);
    }
  }
  return [...paths].sort();
}

export function joinConstraintPath(
  parentPath: string,
  attributeName: string,
  nodeId: string,
): string {
  const segment = `${attributeName}[${nodeId}]`;
  if (!parentPath) return `/${segment}`;
  return `${parentPath}/${segment}`;
}

function readAttributes(
  obj: openehr_am.C_COMPLEX_OBJECT,
): openehr_am.C_ATTRIBUTE[] {
  const attrs = (obj as { attributes?: openehr_am.C_ATTRIBUTE[] }).attributes;
  return attrs ?? [];
}

function readAttributeChildren(
  attr: openehr_am.C_ATTRIBUTE,
): openehr_am.C_OBJECT[] {
  const children = (attr as { children?: openehr_am.C_OBJECT[] }).children;
  return children ?? [];
}

function overlayRelativePath(
  fullPath: string,
  overlayRootPath: string | undefined,
): string | undefined {
  if (!overlayRootPath) return undefined;
  if (fullPath === overlayRootPath) return "";
  if (fullPath.startsWith(overlayRootPath)) {
    return fullPath.slice(overlayRootPath.length);
  }
  return undefined;
}

function childrenOfComplex(
  obj: openehr_am.C_COMPLEX_OBJECT,
  parentPath: string,
  doc: AnnotationDocumentation | undefined,
  ctx: BuildTreeContext,
): DefinitionTreeNode[] {
  const children: DefinitionTreeNode[] = [];
  for (const attr of readAttributes(obj)) {
    const attrName = attr.rm_attribute_name ?? "attr";
    for (const child of readAttributeChildren(attr)) {
      const childPath = joinConstraintPath(
        parentPath,
        attrName,
        child.node_id ?? "?",
      );
      children.push(buildObjectSubtree(child, childPath, doc, ctx));
    }
  }
  return children;
}

function finishNode(
  node: Omit<DefinitionTreeNode, "children"> & {
    children: DefinitionTreeNode[];
  },
  ctx: BuildTreeContext,
): DefinitionTreeNode {
  const annotationPath = overlayRelativePath(node.path, ctx.overlayRootPath);
  if (ctx.overlayId) node.overlayId = ctx.overlayId;
  if (annotationPath !== undefined) node.annotationPath = annotationPath;
  return node;
}

function buildObjectSubtree(
  obj: openehr_am.C_OBJECT,
  parentPath: string,
  doc: AnnotationDocumentation | undefined,
  ctx: BuildTreeContext,
): DefinitionTreeNode {
  if (obj instanceof openehr_am.C_ARCHETYPE_ROOT) {
    const path = parentPath;
    const keyCount = countAnnotationKeysAtPath(doc, path);
    const ref = obj.archetype_ref;
    const label = ref
      ? `use ${ref}`
      : `${obj.rm_type_name ?? "ARCHETYPE_ROOT"}[${obj.node_id ?? "?"}]`;
    let children = childrenOfComplex(obj, parentPath, doc, ctx);
    if (!children.length && ref && ctx.resolveArchetype) {
      const filled = ctx.resolveArchetype(ref);
      const overlayDef = filled?.definition;
      if (overlayDef) {
        const overlayDoc = getResourceDocumentation(filled);
        const overlayCtx: BuildTreeContext = {
          resolveArchetype: ctx.resolveArchetype,
          overlayId: filled.archetype_id?.value ?? ref,
          overlayRootPath: path,
        };
        children = childrenOfComplex(
          overlayDef,
          parentPath,
          overlayDoc,
          overlayCtx,
        );
      }
    }
    return finishNode({
      id: path || "/root",
      path,
      label,
      rmType: obj.rm_type_name,
      nodeId: obj.node_id,
      hasAnnotations: keyCount > 0,
      annotationKeyCount: keyCount,
      isArchetypeRoot: true,
      archetypeRef: ref,
      children,
    }, ctx);
  }

  if (obj instanceof openehr_am.C_COMPLEX_OBJECT) {
    const path = parentPath;
    const lookupPath = overlayRelativePath(path, ctx.overlayRootPath) ?? path;
    const keyCount = countAnnotationKeysAtPath(doc, lookupPath);
    const label = `${obj.rm_type_name ?? "OBJECT"}[${obj.node_id ?? "?"}]`;
    return finishNode({
      id: path || "/root",
      path,
      label,
      rmType: obj.rm_type_name,
      nodeId: obj.node_id,
      hasAnnotations: keyCount > 0,
      annotationKeyCount: keyCount,
      children: childrenOfComplex(obj, parentPath, doc, ctx),
    }, ctx);
  }

  if (obj instanceof openehr_am.C_PRIMITIVE_OBJECT) {
    const path = parentPath;
    const lookupPath = overlayRelativePath(path, ctx.overlayRootPath) ?? path;
    const keyCount = countAnnotationKeysAtPath(doc, lookupPath);
    return finishNode({
      id: path,
      path,
      label: `${obj.rm_type_name ?? "PRIMITIVE"}[${obj.node_id ?? "?"}]`,
      rmType: obj.rm_type_name,
      nodeId: obj.node_id,
      hasAnnotations: keyCount > 0,
      annotationKeyCount: keyCount,
      children: [],
    }, ctx);
  }

  const path = parentPath;
  const lookupPath = overlayRelativePath(path, ctx.overlayRootPath) ?? path;
  const keyCount = countAnnotationKeysAtPath(doc, lookupPath);
  return finishNode({
    id: path || "/unknown",
    path,
    label: "constraint",
    hasAnnotations: keyCount > 0,
    annotationKeyCount: keyCount,
    children: [],
  }, ctx);
}

/** Build a hierarchical definition tree with per-node annotation flags. */
export function buildDefinitionTree(
  resource: AnnotatedResource,
  options: BuildDefinitionTreeOptions = {},
): DefinitionTreeNode | undefined {
  const definition = resource.definition;
  if (!definition) return undefined;
  const doc = getResourceDocumentation(resource);
  return buildObjectSubtree(definition, "", doc, {
    resolveArchetype: options.resolveArchetype,
  });
}

/** Serialize an authored resource (archetype or template) to ADL2 text. */
export function serializeAnnotatedResource(
  resource: AnnotatedResource,
): string {
  return new ADL2Serializer().serialize(resource as openehr_am.ARCHETYPE);
}

export function resolveAnnotatedResource(
  repository: ArchetypeRepository,
  loadResult: LoadFileResult | undefined,
): AnnotatedResource | undefined {
  if (!loadResult?.archetypeId && !loadResult?.path) return undefined;
  const id = loadResult.archetypeId;
  if (!id) return undefined;
  switch (loadResult.kind) {
    case "archetype":
      return repository.get(id);
    case "template":
    case "template_json":
      return repository.getTemplate(id);
    case "operational_template":
      return repository.getOperationalTemplate(id);
    default:
      return repository.get(id) ?? repository.getTemplate(id);
  }
}
