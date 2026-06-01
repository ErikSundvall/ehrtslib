/**
 * Navigate AOM constraint trees by archetype paths (e.g. `/data[at0001]/events[at0002]`).
 */

import * as openehr_am from "../openehr_am.ts";
import { adlNodeIdToAtCode } from "../validation/archetype_path_resolver.ts";

export interface AomPathMatch {
  object: openehr_am.C_OBJECT;
  parentAttribute?: openehr_am.C_ATTRIBUTE;
  parentObject?: openehr_am.C_COMPLEX_OBJECT;
  childIndex?: number;
}

function normalizeNodeId(nodeId: string): string[] {
  const trimmed = nodeId.trim();
  const variants = new Set<string>([trimmed]);
  const at = /^at(\d+)$/i.exec(trimmed);
  if (at) {
    const n = parseInt(at[1], 10);
    variants.add(`id${n}`);
    variants.add(`at${String(n).padStart(4, "0")}`);
  }
  const id = /^id(\d+(?:\.\d+)*)$/i.exec(trimmed);
  if (id) {
    variants.add(`at${id[1].replace(/\./g, "").padStart(4, "0")}`);
    variants.add(adlNodeIdToAtCode(trimmed));
  }
  return [...variants];
}

function nodeIdsMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const va = normalizeNodeId(a);
  const vb = normalizeNodeId(b);
  return va.some((x) => vb.includes(x));
}

function parsePathSegment(segment: string): { attrName?: string; nodeId?: string } {
  const m = /^([A-Za-z_][\w]*)(?:\[([^\]]+)\])?$/.exec(segment);
  if (!m) return {};
  return { attrName: m[1], nodeId: m[2] };
}

function splitArchetypePath(path: string): string[] {
  const trimmed = path.trim();
  const normalized = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  if (!normalized) return [];

  const segments: string[] = [];
  let buf = "";
  let depth = 0;
  for (const c of normalized) {
    if (c === "[") depth++;
    else if (c === "]") depth--;
    if (c === "/" && depth === 0) {
      if (buf) segments.push(buf);
      buf = "";
    } else {
      buf += c;
    }
  }
  if (buf) segments.push(buf);
  return segments;
}

function findAttribute(
  obj: openehr_am.C_COMPLEX_OBJECT,
  name: string,
): openehr_am.C_ATTRIBUTE | undefined {
  return obj.attributes?.find((a) => a.rm_attribute_name === name);
}

function findChildByNodeId(
  attr: openehr_am.C_ATTRIBUTE,
  nodeId?: string,
): { child: openehr_am.C_OBJECT; index: number } | undefined {
  const children = (attr as { children?: openehr_am.C_OBJECT[] }).children ?? [];
  if (!nodeId) {
    if (children.length === 1) return { child: children[0], index: 0 };
    return undefined;
  }
  for (let i = 0; i < children.length; i++) {
    if (nodeIdsMatch(children[i].node_id, nodeId)) {
      return { child: children[i], index: i };
    }
  }
  return undefined;
}

/**
 * Resolve an archetype path to a C_OBJECT in the constraint tree.
 */
export function resolveAomPath(
  root: openehr_am.C_COMPLEX_OBJECT,
  path: string,
): AomPathMatch | undefined {
  const segments = splitArchetypePath(path);
  if (segments.length === 0) {
    return { object: root };
  }

  let current: openehr_am.C_OBJECT = root;
  let parentObject: openehr_am.C_COMPLEX_OBJECT | undefined;
  let parentAttribute: openehr_am.C_ATTRIBUTE | undefined;
  let childIndex: number | undefined;

  for (const seg of segments) {
    const { attrName, nodeId } = parsePathSegment(seg);
    if (!attrName) continue;

    if (!(current instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
    const attr = findAttribute(current, attrName);
    if (!attr) return undefined;

    const found = findChildByNodeId(attr, nodeId);
    if (!found) return undefined;

    parentObject = current;
    parentAttribute = attr;
    childIndex = found.index;
    current = found.child;
  }

  return {
    object: current,
    parentObject,
    parentAttribute,
    childIndex,
  };
}

/**
 * Replace the object at an archetype path (must already exist).
 */
export function replaceAtAomPath(
  root: openehr_am.C_COMPLEX_OBJECT,
  path: string,
  replacement: openehr_am.C_OBJECT,
): boolean {
  const match = resolveAomPath(root, path);
  if (!match?.parentAttribute || match.childIndex === undefined) return false;
  const children = (match.parentAttribute as { children?: openehr_am.C_OBJECT[] }).children;
  if (!children) return false;
  children[match.childIndex] = replacement;
  return true;
}
