/**
 * Navigate RM instance trees using Web Template AQL paths.
 */

type RmObject = Record<string, unknown>;

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
    nodeIdsMatch((item as RmObject).archetype_node_id, nodeId)
  );
  return found ?? arr[0];
}

function valuesByNodeId(arr: unknown[], nodeId?: string): unknown[] {
  if (!nodeId) return arr;
  const found = arr.filter((item) =>
    nodeIdsMatch((item as RmObject).archetype_node_id, nodeId)
  );
  return found.length ? found : arr.slice(0, 1);
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

    let next = obj[attr];
    if (next == null) return null;

    if (Array.isArray(next)) {
      current = nodeId ? pickByNodeId(next, nodeId) : next[0];
    } else {
      current = next;
    }
  }

  // ELEMENT nodes resolve to their value child
  const cur = current as RmObject;
  if (cur?._type === "ELEMENT" && cur.value != null) {
    return cur.value;
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
      const next = obj[attr];
      if (next == null) continue;

      if (Array.isArray(next)) {
        nextValues.push(...valuesByNodeId(next, nodeId));
      } else if (
        !nodeId || nodeIdsMatch((next as RmObject).archetype_node_id, nodeId)
      ) {
        nextValues.push(next);
      }
    }

    current = nextValues;
    if (!current.length) return [];
  }

  return current.map((item) => {
    const cur = item as RmObject;
    if (cur?._type === "ELEMENT" && cur.value != null) return cur.value;
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
  const val = (parent as RmObject)[attr];
  if (Array.isArray(val)) return val.length;
  return val != null ? 1 : 0;
}
