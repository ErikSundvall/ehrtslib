/**
 * Forward OPT / Web Template UI annotations into ZipEHR HTML5 as `data-zs-annot-*`
 * attributes. Stripped on deserialize (not part of RM).
 */

import {
  annotationsForAqlPath,
  L10N_ANNOTATION_KEY,
  type OptPathAnnotationMap,
  stripLeadingArchetypeId,
} from "../../generation/opt_l10n.ts";
import { resolveAllValuesAtPath } from "../simplified/instance_nav.ts";
import type { WebTemplate, WebTemplateNode } from "../simplified/types.ts";

/** Annotation keys never emitted on composition HTML (metadata / i18n). */
const DENY_FORWARD_KEYS = new Set([
  "synthetic_node_id",
]);

/** HTML attribute prefix for forwarded template annotations. */
export const ZIP_ANNOT_ATTR_PREFIX = "data-zs-annot-";

/** Whether a template annotation item should be copied to HTML5 output. */
export function shouldForwardTemplateAnnotationKey(key: string): boolean {
  const k = key.trim();
  if (!k) return false;
  if (DENY_FORWARD_KEYS.has(k)) return false;
  if (L10N_ANNOTATION_KEY.test(k)) return false;
  return true;
}

/** Normalise annotation id to a safe HTML attribute suffix (kebab-case). */
export function templateAnnotationKeyToAttrSuffix(key: string): string {
  let k = key.trim();
  if (k.startsWith("a.")) k = k.slice(2);
  return k
    .replace(/_/g, "-")
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function templateAnnotationKeyToAttrName(key: string): string {
  return ZIP_ANNOT_ATTR_PREFIX + templateAnnotationKeyToAttrSuffix(key);
}

function stringAnnotationValue(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "boolean") return value ? "true" : "false";
  const s = String(value).trim();
  return s === "" ? undefined : s;
}

/** Build attribute bags for one node's merged template annotations. */
export function attrsForTemplateAnnotations(
  items: Record<string, string> | undefined,
): Array<{ name: string; value: string } | { name: string; boolean: true }> {
  if (!items) return [];
  const out: Array<{ name: string; value: string } | { name: string; boolean: true }> =
    [];
  for (const [key, raw] of Object.entries(items)) {
    if (!shouldForwardTemplateAnnotationKey(key)) continue;
    const value = stringAnnotationValue(raw);
    if (value === undefined) continue;
    const name = templateAnnotationKeyToAttrName(key);
    if (value === "true") {
      out.push({ name, boolean: true });
    } else {
      out.push({ name, value });
    }
  }
  return out;
}

function wtNodeAnnotations(node: WebTemplateNode): Record<string, string> {
  const raw = node.annotations;
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const s = stringAnnotationValue(value);
    if (s !== undefined) out[key] = s;
  }
  return out;
}

function walkTemplateNode(
  node: WebTemplateNode,
  compositionRoot: unknown,
  map: WeakMap<object, Record<string, string>>,
  pathAnnotations: OptPathAnnotationMap,
): void {
  const path = node.aqlPath?.trim();
  if (path && path !== "/") {
    const lookupPath = stripLeadingArchetypeId(path);
    const fromOpt = annotationsForAqlPath(
      pathAnnotations,
      lookupPath,
      node.name,
    );
    const merged: Record<string, string> = {
      ...wtNodeAnnotations(node),
      ...fromOpt,
    };
    const forward = Object.fromEntries(
      Object.entries(merged).filter(([k]) =>
        shouldForwardTemplateAnnotationKey(k)
      ),
    );
    if (Object.keys(forward).length) {
      for (const { value } of resolveAllValuesAtPath(compositionRoot, path)) {
        if (value == null || typeof value !== "object" || Array.isArray(value)) {
          continue;
        }
        const prev = map.get(value) ?? {};
        map.set(value, { ...prev, ...forward });
      }
    }
  }
  for (const child of node.children ?? []) {
    walkTemplateNode(child, compositionRoot, map, pathAnnotations);
  }
}

/**
 * Map RM object identity → UI annotation items (merged Web Template node
 * annotations and OPT path annotations).
 */
export function indexTemplateUiAnnotations(
  composition: unknown,
  options: {
    webTemplate?: WebTemplate | null;
    pathAnnotations?: OptPathAnnotationMap;
  },
): WeakMap<object, Record<string, string>> {
  const map = new WeakMap<object, Record<string, string>>();
  const tree = options.webTemplate?.tree;
  if (!tree) return map;
  walkTemplateNode(
    tree,
    composition,
    map,
    options.pathAnnotations ?? {},
  );
  return map;
}