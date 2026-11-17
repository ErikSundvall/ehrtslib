/**
 * Forward OPT template metadata onto ZipEHR HTML5: view constraints →
 * `data-opt-visibility`, and `html:` annotation pass-through.
 * Ignored on deserialize.
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
import type { Html5Dialect } from "./html5_serialize.ts";
import type { WebTemplate, WebTemplateNode } from "../simplified/types.ts";

/** Template annotation keys with this prefix copy verbatim to HTML attributes. */
export const HTML_ANNOTATION_PREFIX = "html:";

export const OPT_VISIBILITY_ATTR = "data-opt-visibility";
const OPT_ALIAS_ATTR = "data-opt-alias";

const RESERVED_ATTR_PREFIXES = ["data-zs-", "data-opt-"];

type AttrBag = { name: string; value?: string; boolean?: boolean };

/** Attributes the html5 serializer owns for canonical round-trip (short dialect). */
const RESERVED_SHORT = new Set([
  "fmt",
  "n",
  "a",
  "tp",
  "rm",
  "lang",
  "ter",
  "enc",
  "p",
  "tabindex",
  "title",
]);

const RESERVED_FULL = new Set([
  "fmt",
  "archetype-node-id",
  "archetype-id",
  "template-id",
  "rm-version",
  "lang",
  "territory",
  "encoding",
  "property",
  "tabindex",
  "title",
]);

export function isValidHtmlAttributeName(name: string): boolean {
  const n = name.trim();
  if (!n) return false;
  return /^[^\x00-\x20\x22\x27\x3C\x3E\x2F\x3D]+$/u.test(n);
}

export function htmlAttributeNameFromAnnotationKey(key: string): string | null {
  if (!key.startsWith(HTML_ANNOTATION_PREFIX)) return null;
  const name = key.slice(HTML_ANNOTATION_PREFIX.length).trim();
  return isValidHtmlAttributeName(name) ? name : null;
}

export function isReservedSerializerAttr(
  name: string,
  dialect: Html5Dialect,
): boolean {
  const lower = name.toLowerCase();
  if (RESERVED_ATTR_PREFIXES.some((p) => lower.startsWith(p))) {
    return true;
  }
  if (dialect === "short") return RESERVED_SHORT.has(lower);
  if (dialect === "full") return RESERVED_FULL.has(lower);
  if (lower === "fmt" || lower === "lang" || lower === "tabindex") return true;
  return false;
}

export function assertSafePassthroughValue(
  attrName: string,
  value: string,
): void {
  const lower = attrName.toLowerCase();
  if (lower.startsWith("on")) {
    throw new Error(
      `ZipEHR template html:${attrName} rejected (event handler attribute names)`,
    );
  }
  if (/javascript:/i.test(value)) {
    throw new Error(
      `ZipEHR template html:${attrName} rejected (javascript: URL)`,
    );
  }
}

export function passthroughAttrsFromAnnotations(
  annotations: Record<string, string>,
  dialect: Html5Dialect,
): AttrBag[] {
  const out: AttrBag[] = [];
  for (const [key, raw] of Object.entries(annotations)) {
    const attrName = htmlAttributeNameFromAnnotationKey(key);
    if (!attrName) continue;
    if (!isValidHtmlAttributeName(attrName)) {
      throw new Error(
        `ZipEHR template ${key} is not a valid HTML attribute name`,
      );
    }
    if (isReservedSerializerAttr(attrName, dialect)) {
      throw new Error(
        `ZipEHR template ${key} would overwrite serializer attribute ${attrName}`,
      );
    }
    const value = String(raw ?? "");
    assertSafePassthroughValue(attrName, value);
    if (value === "true" && attrName.startsWith("data-")) {
      out.push({ name: attrName, value: "true" });
    } else if (value === "true" || value === "") {
      out.push({ name: attrName, boolean: true });
    } else {
      out.push({ name: attrName, value });
    }
  }
  return out;
}

function indexOfAttr(attrs: AttrBag[], name: string): number {
  const lower = name.toLowerCase();
  return attrs.findIndex((a) => a.name.toLowerCase() === lower);
}

function mergeClassAttr(attrs: AttrBag[], extra: string): void {
  const add = extra.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  const i = indexOfAttr(attrs, "class");
  if (i < 0) {
    attrs.push({ name: "class", value: add.join(" ") });
    return;
  }
  const cur = attrs[i]!;
  const existing = (cur.value ?? "").split(/\s+/).filter(Boolean);
  const seen = new Set(existing);
  for (const t of add) {
    if (!seen.has(t)) {
      existing.push(t);
      seen.add(t);
    }
  }
  cur.value = existing.join(" ");
  cur.boolean = undefined;
}

/**
 * Apply view metadata and `html:` pass-through onto serializer attrs.
 * Throws when pass-through would clobber a reserved name or existing attr.
 */
export function applyPresentationAttrs(
  attrs: AttrBag[],
  presentation: OptPresentationByPath,
  dialect: Html5Dialect,
): void {
  if (presentation.visibility) {
    attrs.push({
      name: OPT_VISIBILITY_ATTR,
      value: presentation.visibility,
    });
  }
  if (presentation.alias) {
    attrs.push({ name: OPT_ALIAS_ATTR, value: presentation.alias });
  }

  const passthrough = passthroughAttrsFromAnnotations(
    presentation.annotations,
    dialect,
  );
  for (const p of passthrough) {
    if (p.name.toLowerCase() === "class") {
      mergeClassAttr(attrs, p.value ?? "");
      continue;
    }
    if (indexOfAttr(attrs, p.name) >= 0) {
      throw new Error(
        `ZipEHR template html:${p.name} would overwrite existing attribute`,
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