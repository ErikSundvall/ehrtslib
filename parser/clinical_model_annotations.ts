/**
 * Path-level annotation helpers and definition trees for archetypes and templates.
 */

import * as openehr_am from "../am/openehr_am.ts";
import {
  readTemplateId,
  type TermBag,
  termTableForArchetype,
} from "../am/util/ontology_merge.ts";
import * as openehr_base from "../base/openehr_base.ts";
import { getAnnotationsDocumentation } from "./aom_odin_sections.ts";
import { ADL2Serializer } from "../generation/adl2_serializer.ts";
import {
  applyOperationalTemplateTermScopes,
  archetypeTermBagsForLanguage,
  type OperationalTemplateWithTermScopes,
  resolveLocatableLabel,
  TERM_ARCHETYPE_SCOPE_KEY,
  TERM_NAME_FALLBACK_NODE_ID_KEY,
  type TermScopeMeta,
} from "../generation/term_scope.ts";
import { originalLanguageOf } from "./annotation_families.ts";
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
  /** Language for ontology / archetype-scoped term lookup (default: model original). */
  language?: string;
}

interface BuildTreeContext {
  resolveArchetype?: BuildDefinitionTreeOptions["resolveArchetype"];
  overlayId?: string;
  overlayRootPath?: string;
  language: string;
  templateTerms: TermBag;
  archetypeTerms: Record<string, TermBag>;
  /** Inherited archetype id when nodes lack `term_archetype_scope`. */
  termScope?: string;
}

function termBagForLanguage(
  table: Record<string, TermBag> | undefined,
  language: string,
): TermBag {
  if (!table) return {};
  return table[language] ?? table.en ?? Object.values(table)[0] ?? {};
}

function collectTemplateTerms(
  resource: AnnotatedResource,
  language: string,
): TermBag {
  const ontology =
    (resource as { ontology?: { term_definitions?: Record<string, TermBag> } })
      .ontology;
  return termBagForLanguage(ontology?.term_definitions, language);
}

function collectArchetypeTerms(
  resource: AnnotatedResource,
  language: string,
): Record<string, TermBag> {
  return archetypeTermBagsForLanguage(
    resource as OperationalTemplateWithTermScopes,
    language,
  );
}

function mergeArchetypeOntologyTerms(
  archetypeTerms: Record<string, TermBag>,
  archetypeId: string,
  archetype: openehr_am.ARCHETYPE,
  language: string,
): void {
  if (
    archetypeTerms[archetypeId] &&
    Object.keys(archetypeTerms[archetypeId]).length
  ) {
    return;
  }
  const ontology = archetype.ontology as
    | { term_definitions?: Record<string, TermBag> }
    | undefined;
  const bag = termBagForLanguage(ontology?.term_definitions, language);
  if (!Object.keys(bag).length) return;
  archetypeTerms[archetypeId] = {
    ...(archetypeTerms[archetypeId] ?? {}),
    ...bag,
  };
}

function clinicalLabelForObject(
  obj: openehr_am.C_OBJECT,
  ctx: BuildTreeContext,
  nameFallbackNodeId?: string,
): string | undefined {
  const meta = obj as TermScopeMeta;
  return resolveLocatableLabel(
    obj.node_id,
    nameFallbackNodeId ?? meta[TERM_NAME_FALLBACK_NODE_ID_KEY],
    ctx.templateTerms,
    ctx.archetypeTerms,
    meta[TERM_ARCHETYPE_SCOPE_KEY] ?? ctx.termScope,
  );
}

function definitionNodeLabel(
  obj: openehr_am.C_OBJECT,
  ctx: BuildTreeContext,
  technical: string,
  nameFallbackNodeId?: string,
): string {
  return clinicalLabelForObject(obj, ctx, nameFallbackNodeId) ?? technical;
}

/**
 * Store the filled archetype's terminology under the reference used as
 * `term_archetype_scope`. A second template with the same archetype id gets
 * its own key and does not replace the first bag.
 */
function installResolvedTermBags(
  ctx: BuildTreeContext,
  ref: string,
  filled: openehr_am.ARCHETYPE,
): string | undefined {
  const table = termTableForArchetype(filled, {
    resolve: (id) => ctx.resolveArchetype?.(id),
  });
  const bag = termBagForLanguage(table, ctx.language);
  if (Object.keys(bag).length) {
    ctx.archetypeTerms[ref] = bag;
    const templateId = readTemplateId(filled);
    if (templateId && templateId !== ref) ctx.archetypeTerms[templateId] = bag;
    const archetypeId = filled.archetype_id?.value;
    if (
      archetypeId && archetypeId !== ref && archetypeId !== templateId &&
      !Object.keys(ctx.archetypeTerms[archetypeId] ?? {}).length
    ) {
      ctx.archetypeTerms[archetypeId] = bag;
    }
  }
  return conceptNodeId(bag, filled.definition?.node_id);
}

function conceptNodeId(
  bag: TermBag,
  definitionNodeId?: string,
): string | undefined {
  if (definitionNodeId && bag[definitionNodeId]?.text) return definitionNodeId;
  if (bag["at0000.1"]?.text) return "at0000.1";
  if (bag["at0000"]?.text) return "at0000";
  return definitionNodeId;
}

function overlayOwnerId(
  filled: openehr_am.ARCHETYPE,
  ref: string,
): string {
  if (filled instanceof openehr_am.TEMPLATE) {
    return readTemplateId(filled) ?? ref;
  }
  return filled.archetype_id?.value ?? ref;
}

function seedArchetypeTermsFromResolver(
  archetypeTerms: Record<string, TermBag>,
  archetypeIds: Array<string | undefined>,
  resolveArchetype: BuildDefinitionTreeOptions["resolveArchetype"],
  language: string,
): void {
  if (!resolveArchetype) return;
  for (const id of archetypeIds) {
    if (!id) continue;
    const arch = resolveArchetype(id);
    if (arch) mergeArchetypeOntologyTerms(archetypeTerms, id, arch, language);
  }
}

function stampTermScopeOnSubtree(
  obj: openehr_am.C_OBJECT,
  scope: string,
): void {
  const meta = obj as TermScopeMeta;
  if (!meta[TERM_ARCHETYPE_SCOPE_KEY]) {
    meta[TERM_ARCHETYPE_SCOPE_KEY] = scope;
  }
  if (obj instanceof openehr_am.C_COMPLEX_OBJECT) {
    for (const attr of readAttributes(obj)) {
      for (const child of readAttributeChildren(attr)) {
        stampTermScopeOnSubtree(child, scope);
      }
    }
  }
}

function prepareTemplateTermContext(
  resource: AnnotatedResource,
  language: string,
  archetypeTerms: Record<string, TermBag>,
  resolveArchetype: BuildDefinitionTreeOptions["resolveArchetype"],
): string | undefined {
  if (
    !(resource instanceof openehr_am.TEMPLATE ||
      resource instanceof openehr_am.OPERATIONAL_TEMPLATE)
  ) {
    return undefined;
  }
  applyOperationalTemplateTermScopes(
    resource as OperationalTemplateWithTermScopes,
    language,
  );
  Object.assign(
    archetypeTerms,
    collectArchetypeTerms(resource, language),
  );
  if (resource instanceof openehr_am.TEMPLATE) {
    const parentId = resource.parent_archetype_id?.value;
    const specializedId = resource.archetype_id?.value;
    seedArchetypeTermsFromResolver(
      archetypeTerms,
      [parentId, specializedId],
      resolveArchetype,
      language,
    );
    const scope = parentId ?? specializedId;
    if (scope && resource.definition) {
      stampTermScopeOnSubtree(resource.definition, scope);
    }
    return scope;
  }
  return undefined;
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
    const filled = ref && ctx.resolveArchetype
      ? ctx.resolveArchetype(ref)
      : undefined;
    const conceptFallback = filled && ref
      ? installResolvedTermBags(ctx, ref, filled)
      : undefined;
    const scope = ref ?? ctx.termScope;
    const nodeCtx: BuildTreeContext = scope
      ? { ...ctx, termScope: scope }
      : ctx;
    const technical = ref
      ? `use ${ref}`
      : `${obj.rm_type_name ?? "ARCHETYPE_ROOT"}[${obj.node_id ?? "?"}]`;
    const label = definitionNodeLabel(obj, nodeCtx, technical, conceptFallback);
    let children = childrenOfComplex(obj, parentPath, doc, nodeCtx);
    if (!children.length && filled?.definition && ref) {
      const overlayDoc = getResourceDocumentation(filled);
      const overlayId = overlayOwnerId(filled, ref);
      const overlayCtx: BuildTreeContext = {
        ...ctx,
        resolveArchetype: ctx.resolveArchetype,
        overlayId,
        overlayRootPath: path,
        termScope: ref,
      };
      children = childrenOfComplex(
        filled.definition,
        parentPath,
        overlayDoc,
        overlayCtx,
      );
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
    const technical = `${obj.rm_type_name ?? "OBJECT"}[${obj.node_id ?? "?"}]`;
    const label = definitionNodeLabel(obj, ctx, technical);
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
    const technical = `${obj.rm_type_name ?? "PRIMITIVE"}[${
      obj.node_id ?? "?"
    }]`;
    const label = definitionNodeLabel(obj, ctx, technical);
    return finishNode({
      id: path,
      path,
      label,
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
  const language = options.language ?? originalLanguageOf(resource) ?? "en";
  const templateTerms = collectTemplateTerms(resource, language);
  const archetypeTerms = collectArchetypeTerms(resource, language);
  const templateScope = prepareTemplateTermContext(
    resource,
    language,
    archetypeTerms,
    options.resolveArchetype,
  );
  let termScope = templateScope;
  if (
    !termScope && resource instanceof openehr_am.ARCHETYPE &&
    !(resource instanceof openehr_am.TEMPLATE)
  ) {
    termScope = resource.archetype_id?.value;
    if (termScope) {
      mergeArchetypeOntologyTerms(
        archetypeTerms,
        termScope,
        resource,
        language,
      );
    }
  }
  return buildObjectSubtree(definition, "", doc, {
    resolveArchetype: options.resolveArchetype,
    language,
    templateTerms,
    archetypeTerms,
    termScope,
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
