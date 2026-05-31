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

/** Count how many sibling instances exist at the parent's attribute for indexed paths. */
export function countInstancesAtPath(instance: unknown, parentPath: string, attr: string): number {
  const parent = parentPath ? resolveAtPath(instance, parentPath) : instance;
  if (!parent) return 0;
  const val = (parent as RmObject)[attr];
  if (Array.isArray(val)) return val.length;
  return val != null ? 1 : 0;
}
