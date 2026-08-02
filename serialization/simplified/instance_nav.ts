/**
 * Navigate RM instance trees using Web Template AQL paths.
 */

import { TypeRegistry } from "../common/type_registry.ts";
import type { WebTemplateNode } from "./types.ts";

type RmObject = Record<string, unknown>;

function rmTypeName(obj: unknown): string {
  if (obj == null || typeof obj !== "object") return "";
  const record = obj as RmObject;
  if (typeof record._type === "string") return record._type;
  return TypeRegistry.getTypeNameFromInstance(obj) ?? "";
}

function rmProp(obj: unknown, key: string): unknown {
  if (obj == null || typeof obj !== "object") return undefined;
  const record = obj as RmObject;
  if (key in record) return record[key];

  let proto = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, key);
    if (descriptor?.get) {
      try {
        return descriptor.get.call(obj);
      } catch {
        return undefined;
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return undefined;
}

function normalizeNodeId(id: string): string {
  if (/^id\d/i.test(id)) {
    const digits = id.replace(/^id/i, "").replace(/\./g, "");
    return `at${digits.padStart(4, "0")}`;
  }
  return id;
}

function nodeIdsMatch(a: unknown, b: string): boolean {
  if (a == null) return false;
  const sa = String(a);
  return sa === b || normalizeNodeId(sa) === normalizeNodeId(b);
}

function pickByNodeId(arr: unknown[], nodeId: string): unknown {
  const found = arr.find((item) =>
    nodeIdsMatch(rmProp(item, "archetype_node_id"), nodeId)
  );
  return found ?? arr[0];
}

function valuesByNodeId(arr: unknown[], nodeId?: string): unknown[] {
  if (!nodeId) return arr;
  const found = arr.filter((item) =>
    nodeIdsMatch(rmProp(item, "archetype_node_id"), nodeId)
  );
  if (found.length) return found;
  // Fall back to unmatched items only when none of them carry a node id at
  // all (e.g. hand-built instances); otherwise a wrong-node match would
  // silently return another sibling's data.
  const anyIds = arr.some((item) => {
    const id = rmProp(item, "archetype_node_id");
    return id != null && id !== "";
  });
  return anyIds ? [] : arr.slice(0, 1);
}

function filterByRmType(values: unknown[], rmType?: string): unknown[] {
  if (!rmType) return values;
  const filtered = values.filter((item) => rmTypeName(item) === rmType);
  return filtered.length ? filtered : values;
}

/** Resolve child template nodes relative to a parent instance slice. */
export function resolveChildWebTemplateNodes(
  rootInstance: unknown,
  parentInstance: unknown,
  parentNode: WebTemplateNode,
  childNode: WebTemplateNode,
): unknown[] {
  const parentPath = parentNode.aqlPath ?? "/";
  const childPath = childNode.aqlPath ?? "/";

  if (parentPath === "/" || parentPath === "") {
    return resolveAllAtWebTemplateNode(rootInstance, childNode);
  }

  if (childPath.startsWith(parentPath)) {
    const relative = childPath.slice(parentPath.length);
    const relativePath = relative.startsWith("/") ? relative : `/${relative}`;
    const values = resolveAllAtPath(parentInstance, relativePath);
    return filterByRmType(values, childNode.rmType);
  }

  // Child path is not under the parent path (e.g. sibling attribute);
  // resolve it absolutely from the root instance.
  return resolveAllAtWebTemplateNode(rootInstance, childNode);
}

/** Resolve instance data for a Web Template node, filtering by rmType when needed. */
export function resolveAllAtWebTemplateNode(
  instance: unknown,
  node: WebTemplateNode,
): unknown[] {
  const values = node.aqlPath === "/"
    ? [instance]
    : resolveAllAtPath(instance, node.aqlPath);
  return filterByRmType(values, node.rmType);
}

/**
 * Resolve data at a Web Template node's AQL path within a composition instance.
 */
export function resolveAtPath(instance: unknown, aqlPath: string): unknown {
  if (!instance || !aqlPath) return null;

  const normalized = aqlPath.replace(/\/+/g, "/");
  const segments = normalized.match(/\/[^/]+/g);
  if (!segments?.length) return instance;

  let current: unknown = instance;

  for (const raw of segments) {
    const m = /^\/([^[]+)(?:\[([^\]]+)\])?$/.exec(raw);
    if (!m) continue;
    const [, attr, nodeId] = m;
    const obj = current as RmObject;
    if (!obj || typeof obj !== "object") return null;

    let next = rmProp(obj, attr);
    if (next == null) return null;

    if (Array.isArray(next)) {
      current = nodeId ? pickByNodeId(next, nodeId) : next[0];
    } else {
      current = next;
    }
  }

  // ELEMENT nodes resolve to their value child
  if (rmTypeName(current) === "ELEMENT" && rmProp(current, "value") != null) {
    return rmProp(current, "value");
  }

  return current;
}

/**
 * Resolve all matching data nodes at a Web Template AQL path.
 *
 * This is primarily used by example generation/serialization, where maximal
 * mode can create multiple instances for repeating template nodes.
 */
export function resolveAllAtPath(
  instance: unknown,
  aqlPath: string,
): unknown[] {
  if (!instance || !aqlPath) return [];

  const normalized = aqlPath.replace(/\/+/g, "/");
  const segments = normalized.match(/\/[^/]+/g);
  if (!segments?.length) return [instance];

  let current: unknown[] = [instance];

  for (const raw of segments) {
    const m = /^\/([^[]+)(?:\[([^\]]+)\])?$/.exec(raw);
    if (!m) continue;
    const [, attr, nodeId] = m;
    const nextValues: unknown[] = [];

    for (const item of current) {
      const obj = item as RmObject;
      if (!obj || typeof obj !== "object") continue;
      const next = rmProp(obj, attr);
      if (next == null) continue;

      if (Array.isArray(next)) {
        nextValues.push(...valuesByNodeId(next, nodeId));
      } else if (
        !nodeId || nodeIdsMatch(rmProp(next, "archetype_node_id"), nodeId)
      ) {
        nextValues.push(next);
      }
    }

    current = nextValues;
    if (!current.length) return [];
  }

  return current.map((item) => {
    if (rmTypeName(item) === "ELEMENT" && rmProp(item, "value") != null) {
      return rmProp(item, "value");
    }
    return item;
  });
}

/** Count how many sibling instances exist at the parent's attribute for indexed paths. */
export function countInstancesAtPath(
  instance: unknown,
  parentPath: string,
  attr: string,
): number {
  const parent = parentPath ? resolveAtPath(instance, parentPath) : instance;
  if (!parent) return 0;
  const val = rmProp(parent, attr);
  if (Array.isArray(val)) return val.length;
  return val != null ? 1 : 0;
}
