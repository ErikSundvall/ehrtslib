/**
 * Forward template metadata onto ZipEHR HTML5 (ignored on canonical html5
 * deserialize): `data-antn-*` (all path annotations), `data-opt-*` (OPT 1.4
 * `<view>` only), `data-rm-*` (ADL2 rm_visibility).
 */

import {
  flattenOptPathAnnotations,
  type OptPathAnnotationMap,
  stripLeadingArchetypeId,
} from "../../generation/opt_l10n.ts";
import {
  presentationForPath,
  type OptPresentationByPath,
  type OptVisibilityToken,
} from "../../generation/opt_view.ts";
import * as openehr_am from "../../am/openehr_am.ts";
import { resolveAllValuesAtPath } from "../simplified/instance_nav.ts";
import type { WebTemplate, WebTemplateNode } from "../simplified/types.ts";

export const DATA_ANTN_PREFIX = "data-antn-";

/** Stable docs anchor: `docs/maintainers/zipehr-template-annotations.md#…` */
export const ZIP_ANNOTATION_FILTER_DOCS_ANCHOR =
  "template-annotation-filter-regexp";
export const ZIP_ANNOTATION_FILTER_DOCS_PATH =
  `docs/maintainers/zipehr-template-annotations.md#${ZIP_ANNOTATION_FILTER_DOCS_ANCHOR}`;

export type AnnotationSlugCollision = {
  keptKey: string;
  droppedKey: string;
  attrSlug: string;
};

let annotationSlugCollisionWarn: (
  message?: string,
  ...optionalParams: unknown[]
) => void = console.warn.bind(console);

/** Test hook: capture `console.warn` from slug collision reporting. */
export function setAnnotationSlugCollisionWarnForTests(
  fn: (message?: string, ...optionalParams: unknown[]) => void,
): void {
  annotationSlugCollisionWarn = fn;
}

export function resetAnnotationSlugCollisionWarnForTests(): void {
  annotationSlugCollisionWarn = console.warn.bind(console);
}

/** HTML comment body safe for `<!-- … -->` (no raw `--`). */
export function escapeHtmlCommentBody(text: string): string {
  return text.replace(/--/g, "‑‑");
}

export function formatSafeHtmlComment(body: string): string {
  return `<!--${escapeHtmlCommentBody(body)}-->`;
}

export function formatAnnotationCollisionHtmlComment(
  collision: AnnotationSlugCollision,
): string {
  return formatSafeHtmlComment(
    `ehrtslib: data-antn slug collision: kept ${collision.keptKey} as ${dataAntnAttrName(collision.attrSlug)}; ` +
      `dropped ${collision.droppedKey}. Narrow keys with templateAnnotationFilter (${ZIP_ANNOTATION_FILTER_DOCS_PATH}).`,
  );
}

export function detectAnnotationSlugCollisions(
  annotations: Record<string, string>,
  filter?: RegExp | RegExp[],
): AnnotationSlugCollision[] {
  const filtered = filterAnnotationRecord(annotations, filter);
  const keys = Object.keys(filtered).sort((a, b) => a.localeCompare(b));
  const collisions: AnnotationSlugCollision[] = [];
  const slugToKept = new Map<string, string>();

  for (const key of keys) {
    const slug = normalizeAnnotationKeySlug(key);
    if (!slug) continue;
    const kept = slugToKept.get(slug);
    if (kept !== undefined) {
      collisions.push({ keptKey: kept, droppedKey: key, attrSlug: slug });
    } else {
      slugToKept.set(slug, key);
    }
  }
  return collisions;
}

export function warnAnnotationSlugCollisions(
  collisions: AnnotationSlugCollision[],
  context: { aqlPath?: string },
): void {
  for (const c of collisions) {
    const attr = dataAntnAttrName(c.attrSlug);
    const path = context.aqlPath ?? "?";
    annotationSlugCollisionWarn(
      `ZipEHR data-antn slug collision at ${path}: ` +
        `kept ${JSON.stringify(c.keptKey)} → ${attr}; ` +
        `dropped ${JSON.stringify(c.droppedKey)} (both normalize to ${JSON.stringify(c.attrSlug)})`,
    );
  }
}

export const OPT_VISIBILITY_ATTR = "data-opt-visibility";
export const OPT_ALIAS_ATTR = "data-opt-alias";
export const RM_VISIBILITY_ATTR = "data-rm-visibility";
export const RM_ALIAS_ATTR = "data-rm-alias";

/** Presentation attrs on `<o-*>` / locatable elements (not canonical RM). */
export function isZipEhrTemplatePresentationHtmlAttr(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.startsWith(DATA_ANTN_PREFIX) || lower.startsWith("data-opt-") ||
    lower.startsWith("data-rm-");
}

export function annotationKeyMatchesFilter(
  key: string,
  filter?: RegExp | RegExp[],
): boolean {
  if (!filter) return true;
  const list = Array.isArray(filter) ? filter : [filter];
  return list.some((re) => re.test(key));
}

export function filterAnnotationRecord(
  annotations: Record<string, string>,
  filter?: RegExp | RegExp[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(annotations)) {
    if (annotationKeyMatchesFilter(k, filter)) out[k] = v;
  }
  return out;
}

type AttrBag = { name: string; value?: string; boolean?: boolean };

/**
 * Normalize a template annotation key for `data-antn-{slug}`:
 * lowercase; any char outside `[a-z0-9-]` → `-`; collapse runs; trim ends.
 */
export function normalizeAnnotationKeySlug(key: string): string {
  const slug = key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug;
}

export function dataAntnAttrName(attrSlug: string): string {
  return `${DATA_ANTN_PREFIX}${attrSlug}`;
}

export type DataAntnAttrPlan = {
  attrSlug: string;
  originalKey: string;
  value: string;
};

/**
 * Plan `data-antn-*` attrs (sorted keys; slug collision → first key wins).
 */
export function planDataAntnAttrs(
  annotations: Record<string, string>,
): DataAntnAttrPlan[] {
  const filtered = { ...annotations };
  const keys = Object.keys(filtered).sort((a, b) => a.localeCompare(b));
  const plans: DataAntnAttrPlan[] = [];
  const usedSlugs = new Set<string>();

  for (const key of keys) {
    const slug = normalizeAnnotationKeySlug(key);
    if (!slug) {
      throw new Error(
        `ZipEHR template annotation key ${JSON.stringify(key)} normalizes to empty slug`,
      );
    }
    if (usedSlugs.has(slug)) continue;
    usedSlugs.add(slug);
    plans.push({
      attrSlug: slug,
      originalKey: key,
      value: String(filtered[key] ?? ""),
    });
  }
  return plans;
}

export type DataAntnEmitResult = {
  attrs: AttrBag[];
  presentationComments: string[];
};

export function emitDataAntnPresentation(
  annotations: Record<string, string>,
  context: {
    aqlPath?: string;
    filter?: RegExp | RegExp[];
  },
): DataAntnEmitResult {
  const collisions = detectAnnotationSlugCollisions(
    annotations,
    context.filter,
  );
  warnAnnotationSlugCollisions(collisions, { aqlPath: context.aqlPath });
  return {
    attrs: dataAntnAttrsFromAnnotations(annotations, context.filter),
    presentationComments: collisions.map(formatAnnotationCollisionHtmlComment),
  };
}

export function dataAntnAttrsFromAnnotations(
  annotations: Record<string, string>,
  filter?: RegExp | RegExp[],
): AttrBag[] {
  const filtered = filterAnnotationRecord(annotations, filter);
  const out: AttrBag[] = [];
  for (const plan of planDataAntnAttrs(filtered)) {
    const val = plan.value;
    if (val === "true" && plan.attrSlug.length > 0) {
      out.push({
        name: dataAntnAttrName(plan.attrSlug),
        value: "true",
      });
    } else if (val === "true" || val === "") {
      out.push({ name: dataAntnAttrName(plan.attrSlug), boolean: true });
    } else {
      out.push({
        name: dataAntnAttrName(plan.attrSlug),
        value: val,
      });
    }
  }
  return out;
}

function indexOfAttr(attrs: AttrBag[], name: string): number {
  const lower = name.toLowerCase();
  return attrs.findIndex((a) => a.name.toLowerCase() === lower);
}

/** Apply attrs; returns HTML comments for `data-antn-*` slug collisions. */
export function applyPresentationAttrsAndComments(
  attrs: AttrBag[],
  presentation: OptPresentationByPath,
  annotationFilter?: RegExp | RegExp[],
): string[] {
  if (presentation.optVisibility) {
    attrs.push({
      name: OPT_VISIBILITY_ATTR,
      value: presentation.optVisibility,
    });
  }
  if (presentation.optAlias) {
    attrs.push({ name: OPT_ALIAS_ATTR, value: presentation.optAlias });
  }
  if (presentation.rmVisibility) {
    attrs.push({
      name: RM_VISIBILITY_ATTR,
      value: presentation.rmVisibility,
    });
  }
  if (presentation.rmAlias) {
    attrs.push({ name: RM_ALIAS_ATTR, value: presentation.rmAlias });
  }

  const { attrs: antnAttrs, presentationComments } = emitDataAntnPresentation(
    presentation.annotations,
    {
      aqlPath: presentation.presentationPath,
      filter: annotationFilter,
    },
  );
  for (const p of antnAttrs) {
    if (indexOfAttr(attrs, p.name) >= 0) {
      throw new Error(
        `ZipEHR template annotation would overwrite existing attribute ${p.name}`,
      );
    }
    attrs.push(p);
  }
  return presentationComments;
}

/** Apply `data-opt-*`, `data-rm-*`, and `data-antn-*` presentation attrs. */
export function applyPresentationAttrs(
  attrs: AttrBag[],
  presentation: OptPresentationByPath,
  annotationFilter?: RegExp | RegExp[],
): void {
  applyPresentationAttrsAndComments(attrs, presentation, annotationFilter);
}

export type PresentationIndex = WeakMap<object, OptPresentationByPath>;

/** Web Template paths often use `and name/value='X'`; instance_nav expects `,'X'`. */
function aqlPathForInstanceNav(path: string): string {
  return path
    .replace(/\s+and\s+name\/value\s*=\s*'([^']*)'/gi, ",'$1'")
    .replace(/\s+and\s+name\/value\s*=\s*"([^"]*)"/gi, ",'$1'");
}

function mergePresentation(
  prev: OptPresentationByPath | undefined,
  next: OptPresentationByPath,
): OptPresentationByPath {
  if (!prev) return next;
  return {
    optVisibility: next.optVisibility ?? prev.optVisibility,
    optAlias: next.optAlias ?? prev.optAlias,
    rmVisibility: next.rmVisibility ?? prev.rmVisibility,
    rmAlias: next.rmAlias ?? prev.rmAlias,
    annotations: { ...prev.annotations, ...next.annotations },
  };
}

function indexAtPath(
  compositionRoot: unknown,
  map: PresentationIndex,
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  pathAnnotations: OptPathAnnotationMap,
  aqlPath: string,
  nodeName: string | undefined,
  renderLang: string,
): void {
  const pres = presentationForPath(
    opt,
    pathAnnotations,
    aqlPath,
    nodeName,
    renderLang,
  );
  const hasMeta = pres.optVisibility || pres.optAlias || pres.rmVisibility ||
    pres.rmAlias || Object.keys(pres.annotations).length;
  if (!hasMeta) return;
  const navPath = aqlPathForInstanceNav(aqlPath);
  for (const resolved of resolveAllValuesAtPath(compositionRoot, navPath)) {
    const target = resolved.element ?? resolved.value;
    if (target == null || typeof target !== "object" || Array.isArray(target)) {
      continue;
    }
    map.set(
      target,
      mergePresentation(map.get(target), {
        ...pres,
        presentationPath: pres.presentationPath ?? aqlPath,
      }),
    );
  }
}

function walkWebTemplate(
  node: WebTemplateNode,
  compositionRoot: unknown,
  map: PresentationIndex,
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  pathAnnotations: OptPathAnnotationMap,
  renderLang: string,
  visitedPaths: Set<string>,
): void {
  const path = node.aqlPath?.trim();
  if (path) {
    const stripped = stripLeadingArchetypeId(path);
    visitedPaths.add(stripped);
    indexAtPath(
      compositionRoot,
      map,
      opt,
      pathAnnotations,
      stripped,
      node.name,
      renderLang,
    );
    if (node.annotations && typeof node.annotations === "object") {
      const extra: Record<string, string> = {};
      for (const [k, v] of Object.entries(node.annotations)) {
        if (v == null) continue;
        extra[k] = String(v);
      }
      if (Object.keys(extra).length) {
        for (const resolved of resolveAllValuesAtPath(
          compositionRoot,
          aqlPathForInstanceNav(path),
        )) {
          const target = resolved.element ?? resolved.value;
          if (
            target == null || typeof target !== "object" ||
            Array.isArray(target)
          ) {
            continue;
          }
          const prev = map.get(target) ?? {
            annotations: {},
          };
          map.set(target, mergePresentation(prev, {
            ...prev,
            annotations: { ...prev.annotations, ...extra },
          }));
        }
      }
    }
  }
  for (const child of node.children ?? []) {
    walkWebTemplate(
      child,
      compositionRoot,
      map,
      opt,
      pathAnnotations,
      renderLang,
      visitedPaths,
    );
  }
}

function collectExtraAnnotationPaths(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  explicitPathAnnotations: OptPathAnnotationMap | undefined,
): string[] {
  const paths = new Set<string>(["/", "/category", "/context/setting"]);
  if (explicitPathAnnotations) {
    for (const p of Object.keys(explicitPathAnnotations)) {
      if (p) paths.add(stripLeadingArchetypeId(p.trim()));
    }
  }
  const ann = (opt as { annotations?: { documentation?: Record<string, Record<string, unknown>> } })
    .annotations;
  const doc = ann?.documentation;
  if (doc && typeof doc === "object") {
    for (const bag of Object.values(doc)) {
      if (!bag || typeof bag !== "object") continue;
      for (const p of Object.keys(bag)) {
        if (p) paths.add(stripLeadingArchetypeId(p.trim()));
      }
    }
  }
  return [...paths];
}

/** Index RM nodes → presentation metadata (not propagated to descendants). */
export function indexTemplatePresentation(
  composition: unknown,
  options: {
    webTemplate?: WebTemplate | null;
    operationalTemplate?: openehr_am.OPERATIONAL_TEMPLATE | null;
    pathAnnotations?: OptPathAnnotationMap;
    renderLang?: string;
  },
): PresentationIndex {
  const map: PresentationIndex = new WeakMap();
  const opt = options.operationalTemplate;
  const tree = options.webTemplate?.tree;
  if (!opt || !tree) return map;
  const pathAnnotations = options.pathAnnotations ??
    flattenOptPathAnnotations(opt);
  const lang = options.renderLang ??
    options.webTemplate?.defaultLanguage ??
    "en";
  const visitedPaths = new Set<string>();
  walkWebTemplate(tree, composition, map, opt, pathAnnotations, lang, visitedPaths);
  for (const extraPath of collectExtraAnnotationPaths(opt, options.pathAnnotations)) {
    if (visitedPaths.has(extraPath)) continue;
    visitedPaths.add(extraPath);
    indexAtPath(
      composition,
      map,
      opt,
      pathAnnotations,
      extraPath,
      undefined,
      lang,
    );
  }
  return map;
}

export type { OptVisibilityToken };