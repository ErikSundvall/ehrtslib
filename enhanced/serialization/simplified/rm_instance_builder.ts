/**
 * Assign RM values at Web Template AQL paths on plain composition instances.
 */

type RmObject = Record<string, unknown>;

const ATTR_RM_TYPE: Record<string, string> = {
  content: "SECTION",
  data: "ITEM_TREE",
  items: "ELEMENT",
  events: "EVENT",
  protocol: "ITEM_TREE",
  state: "ITEM_TREE",
  description: "ITEM_TREE",
  other_participations: "PARTICIPATION",
};

function nodeIdsMatch(a: unknown, b: string): boolean {
  if (a == null) return false;
  const sa = String(a);
  if (sa === b) return true;
  if (/^id\d/i.test(sa)) {
    const digits = sa.replace(/^id/i, "").replace(/\./g, "");
    return `at${digits.padStart(4, "0")}` === b;
  }
  return false;
}

function findOrCreateInArray(
  arr: RmObject[],
  nodeId: string | undefined,
  rmType: string,
): RmObject {
  if (nodeId) {
    const found = arr.find((item) => nodeIdsMatch(item.archetype_node_id, nodeId));
    if (found) return found;
  }
  const item: RmObject = { _type: rmType, archetype_node_id: nodeId ?? null };
  arr.push(item);
  return item;
}

function ensureChild(
  parent: RmObject,
  attr: string,
  nodeId: string | undefined,
  rmType: string,
): RmObject {
  const existing = parent[attr];
  if (Array.isArray(existing)) {
    return findOrCreateInArray(existing as RmObject[], nodeId, rmType);
  }
  if (existing && typeof existing === "object") {
    return existing as RmObject;
  }
  const child: RmObject = { _type: rmType, archetype_node_id: nodeId ?? null };
  if (attr === "content" || attr === "items" || attr === "events") {
    parent[attr] = [child];
  } else {
    parent[attr] = child;
  }
  return child;
}

function inferRmType(attr: string, leafRmType: string): string {
  if (attr === "content") {
    if (leafRmType === "DV_QUANTITY" || leafRmType.startsWith("DV_")) return "EVALUATION";
    return "OBSERVATION";
  }
  return ATTR_RM_TYPE[attr] ?? "CLUSTER";
}

/**
 * Assign a data value at an AQL path, creating intermediate RM objects as needed.
 */
export function assignAtAqlPath(
  root: RmObject,
  aqlPath: string,
  leafValue: unknown,
  leafRmType: string,
  elementNodeId?: string,
): void {
  const normalized = aqlPath.replace(/\/+/g, "/");
  const segments = normalized.match(/\/[^/]+/g);
  if (!segments?.length) return;

  let current: RmObject = root;

  for (let si = 0; si < segments.length; si++) {
    const raw = segments[si];
    const m = /^\/([^[]+)(?:\[([^\]]+)\])?$/.exec(raw);
    if (!m) continue;
    const [, attr, nodeId] = m;
    const isLast = si === segments.length - 1;

    if (isLast) {
      const isDataValue = leafRmType.startsWith("DV_") ||
        leafRmType.startsWith("C_") ||
        leafRmType === "CODE_PHRASE";

      if (isDataValue && attr === "items") {
        const element: RmObject = {
          _type: "ELEMENT",
          archetype_node_id: elementNodeId ?? nodeId ?? null,
          value: leafValue,
        };
        if (!Array.isArray(current.items)) current.items = [];
        (current.items as RmObject[]).push(element);
      } else if (isDataValue) {
        current[attr] = leafValue;
      } else {
        ensureChild(current, attr, nodeId, leafRmType);
      }
      return;
    }

    const rmType = inferRmType(attr, leafRmType);
    current = ensureChild(current, attr, nodeId, rmType);
  }
}
