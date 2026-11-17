/**
 * Forward OPT template metadata (view constraints, rm_visibility, path
 * annotations) onto ZipEHR HTML5. Ignored on deserialize.
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

export const OPT_ANNOTATIONS_ATTR = "data-opt-annotations";
export const OPT_VISIBILITY_ATTR = "data-opt-visibility";
export const OPT_ATTR_PREFIX = "data-opt-";

export function annotationKeyToSlug(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function annotationKeyToAttrName(key: string): string {
  const slug = annotationKeyToSlug(key);
  return slug ? `${OPT_ATTR_PREFIX}${slug}` : "";
}

export function escapeHtmlAttrJson(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export type PresentationAttrs = Array<
  { name: string; value: string } | { name: string; boolean: true }
>;

export function attrsForPresentation(
  pres: OptPresentationByPath | undefined,
): PresentationAttrs {
  if (!pres) return [];
  const out: PresentationAttrs = [];
  if (pres.visibility) {
    out.push({ name: OPT_VISIBILITY_ATTR, value: pres.visibility });
  }
  if (pres.alias) {
    out.push({ name: `${OPT_ATTR_PREFIX}alias`, value: pres.alias });
  }
  const keys = Object.keys(pres.annotations);
  if (keys.length) {
    out.push({
      name: OPT_ANNOTATIONS_ATTR,
      value: escapeHtmlAttrJson(JSON.stringify(pres.annotations)),
    });
    for (const key of keys) {
      const name = annotationKeyToAttrName(key);
      if (!name) continue;
      const raw = pres.annotations[key];
      if (raw === "true") out.push({ name, boolean: true });
      else out.push({ name, value: raw });
    }
  }
  return out;
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
    visibility: next.visibility ?? prev.visibility,
    alias: next.alias ?? prev.alias,
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
  const hasMeta = pres.visibility || pres.alias ||
    Object.keys(pres.annotations).length;
  if (!hasMeta) return;
  const navPath = aqlPathForInstanceNav(aqlPath);
  for (const { value } of resolveAllValuesAtPath(compositionRoot, navPath)) {
    if (value == null || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }
    map.set(value, mergePresentation(map.get(value), pres));
  }
}

function walkWebTemplate(
  node: WebTemplateNode,
  compositionRoot: unknown,
  map: PresentationIndex,
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  pathAnnotations: OptPathAnnotationMap,
  renderLang: string,
): void {
  const path = node.aqlPath?.trim();
  if (path && path !== "/") {
    indexAtPath(
      compositionRoot,
      map,
      opt,
      pathAnnotations,
      stripLeadingArchetypeId(path),
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
        for (const { value } of resolveAllValuesAtPath(
          compositionRoot,
          aqlPathForInstanceNav(path),
        )) {
          if (value == null || typeof value !== "object" || Array.isArray(value)) {
            continue;
          }
          const prev = map.get(value) ?? {
            annotations: {},
          };
          map.set(value, mergePresentation(prev, {
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
    );
  }
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
  walkWebTemplate(tree, composition, map, opt, pathAnnotations, lang);
  return map;
}

export type { OptVisibilityToken };