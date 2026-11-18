/**
 * Forward template metadata onto ZipEHR HTML5 (ignored on canonical html5
 * deserialize): `data-antn-*` (path annotations), `data-opt-*` (OPT 1.4 view /
 * hide-on-form), `data-rm-*` (ADL2 rm_visibility).
 */

import {
  flattenOptPathAnnotations,
  type OptPathAnnotationMap,
  stripLeadingArchetypeId,
} from "../../generation/opt_l10n.ts";
import {
  optVisibilityFromConventionKeys,
  pathAnnotationsForDataAntn,
  presentationForPath,
  type OptPresentationByPath,
  type OptVisibilityToken,
} from "../../generation/opt_view.ts";
import * as openehr_am from "../../am/openehr_am.ts";
import { resolveAllValuesAtPath } from "../simplified/instance_nav.ts";
import type { WebTemplate, WebTemplateNode } from "../simplified/types.ts";

export const DATA_ANTN_PREFIX = "data-antn-";
/** Companion suffix: `data-antn-{slug}${DATA_ANTN_KEY_SUFFIX}` holds the original key. */
export const DATA_ANTN_KEY_SUFFIX = "-key";

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

/** Key is unchanged by normalization (no lossy transform needed for round-trip). */
export function isSelfDescribingAnnotationKey(key: string): boolean {
  const k = key.trim();
  if (!k) return false;
  return k === normalizeAnnotationKeySlug(k);
}

export function dataAntnAttrName(attrSlug: string): string {
  return `${DATA_ANTN_PREFIX}${attrSlug}`;
}

export function dataAntnKeyCompanionAttrName(attrSlug: string): string {
  return `${DATA_ANTN_PREFIX}${attrSlug}${DATA_ANTN_KEY_SUFFIX}`;
}

export type DataAntnAttrPlan = {
  attrSlug: string;
  originalKey: string;
  value: string;
  needsKeyCompanion: boolean;
};

/**
 * Plan `data-antn-*` attrs for a path annotation map (deterministic order).
 * Throws on empty slug or attr slug collision after disambiguation.
 */
export function planDataAntnAttrs(
  annotations: Record<string, string>,
): DataAntnAttrPlan[] {
  const keys = Object.keys(annotations).sort((a, b) => a.localeCompare(b));
  const bySlug = new Map<string, string[]>();
  for (const key of keys) {
    const slug = normalizeAnnotationKeySlug(key);
    if (!slug) {
      throw new Error(
        `ZipEHR template annotation key ${JSON.stringify(key)} normalizes to empty slug`,
      );
    }
    const group = bySlug.get(slug) ?? [];
    group.push(key);
    bySlug.set(slug, group);
  }

  const plans: DataAntnAttrPlan[] = [];
  const usedAttrSlugs = new Set<string>();

  for (const key of keys) {
    const baseSlug = normalizeAnnotationKeySlug(key);
    const group = bySlug.get(baseSlug)!;
    const indexInGroup = group.indexOf(key);
    let attrSlug = baseSlug;
    if (group.length > 1) {
      attrSlug = `${baseSlug}--${indexInGroup + 1}`;
    }
    if (usedAttrSlugs.has(attrSlug)) {
      throw new Error(
        `ZipEHR template annotation attr slug collision: ${attrSlug}`,
      );
    }
    usedAttrSlugs.add(attrSlug);

    const needsKeyCompanion = !isSelfDescribingAnnotationKey(key) ||
      group.length > 1;
    plans.push({
      attrSlug,
      originalKey: key,
      value: String(annotations[key] ?? ""),
      needsKeyCompanion,
    });
  }
  return plans;
}

export function dataAntnAttrsFromAnnotations(
  annotations: Record<string, string>,
): AttrBag[] {
  const out: AttrBag[] = [];
  for (const plan of planDataAntnAttrs(annotations)) {
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
    if (plan.needsKeyCompanion) {
      out.push({
        name: dataAntnKeyCompanionAttrName(plan.attrSlug),
        value: plan.originalKey,
      });
    }
  }
  return out;
}

/** Parse `data-antn-*` attrs back to annotation keys/values (html5 annotation round-trip). */
export function annotationsFromDataAntnAttrs(
  attrs: Record<string, string | true | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  const keySuffix = DATA_ANTN_KEY_SUFFIX;
  const prefix = DATA_ANTN_PREFIX;

  const valueAttrs: Array<{ attrSlug: string; value: string }> = [];
  for (const [name, raw] of Object.entries(attrs)) {
    if (!name.startsWith(prefix)) continue;
    if (name.endsWith(keySuffix)) continue;
    const attrSlug = name.slice(prefix.length);
    if (!attrSlug) continue;
    const value = raw === true ? "true" : String(raw ?? "");
    valueAttrs.push({ attrSlug, value });
  }
  valueAttrs.sort((a, b) => a.attrSlug.localeCompare(b.attrSlug));

  for (const { attrSlug, value } of valueAttrs) {
    const companion = attrs[dataAntnKeyCompanionAttrName(attrSlug)];
    let key: string;
    if (companion !== undefined && companion !== true) {
      key = String(companion);
    } else if (companion === true) {
      key = "true";
    } else {
      key = attrSlug;
    }
    if (key in out && out[key] !== value) {
      throw new Error(
        `ZipEHR data-antn duplicate annotation key ${JSON.stringify(key)}`,
      );
    }
    out[key] = value;
  }
  return out;
}

function indexOfAttr(attrs: AttrBag[], name: string): number {
  const lower = name.toLowerCase();
  return attrs.findIndex((a) => a.name.toLowerCase() === lower);
}

/** Apply `data-opt-*`, `data-rm-*`, and `data-antn-*` presentation attrs. */
export function applyPresentationAttrs(
  attrs: AttrBag[],
  presentation: OptPresentationByPath,
): void {
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

  for (const p of dataAntnAttrsFromAnnotations(presentation.annotations)) {
    if (indexOfAttr(attrs, p.name) >= 0) {
      throw new Error(
        `ZipEHR template annotation would overwrite existing attribute ${p.name}`,
      );
    }
    attrs.push(p);
  }
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
      const wtAntn = pathAnnotationsForDataAntn(extra);
      const wtOptVis = optVisibilityFromConventionKeys(undefined, extra);
      if (Object.keys(wtAntn).length || wtOptVis) {
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
            optVisibility: wtOptVis ?? prev.optVisibility,
            annotations: { ...prev.annotations, ...wtAntn },
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