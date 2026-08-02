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

/** Attributes that are containers (arrays) in the RM. */
const ARRAY_ATTRS = new Set([
  "content",
  "items",
  "events",
  "activities",
  "rows",
]);

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
  occurrence: number,
): RmObject {
  if (nodeId) {
    const matches = arr.filter((item) =>
      nodeIdsMatch(item.archetype_node_id, nodeId)
    );
    if (occurrence < matches.length) return matches[occurrence];
    // Create missing instances up to the requested occurrence
    let created: RmObject | undefined;
    for (let i = matches.length; i <= occurrence; i++) {
      created = { _type: rmType, archetype_node_id: nodeId };
      arr.push(created);
    }
    return created!;
  }
  if (occurrence < arr.length) return arr[occurrence];
  const item: RmObject = { _type: rmType, archetype_node_id: null };
  arr.push(item);
  return item;
}

function ensureChild(
  parent: RmObject,
  attr: string,
  nodeId: string | undefined,
  rmType: string,
  occurrence: number,
): RmObject {
  const existing = parent[attr];
  if (Array.isArray(existing)) {
    return findOrCreateInArray(existing as RmObject[], nodeId, rmType, occurrence);
  }
  if (existing && typeof existing === "object" && occurrence === 0) {
    return existing as RmObject;
  }
  const child: RmObject = { _type: rmType, archetype_node_id: nodeId ?? null };
  if (ARRAY_ATTRS.has(attr) || occurrence > 0) {
    const arr: RmObject[] = existing && typeof existing === "object"
      ? [existing as RmObject]
      : [];
    arr.push(child);
    parent[attr] = arr;
  } else {
    parent[attr] = child;
  }
  return child;
}

function inferRmType(attr: string): string {
  if (attr === "content") return "OBSERVATION";
  return ATTR_RM_TYPE[attr] ?? "CLUSTER";
}

/**
 * Occurrence hints for repeated ancestors: maps the number of AQL segments
 * of the ancestor's path to the instance index to use at that depth.
 */
export type OccurrenceHints = Record<number, number>;

/**
 * RM type hints for intermediate nodes: maps the number of AQL segments of
 * the ancestor's path to its RM type (known from the Web Template lineage).
 */
export type RmTypeHints = Record<number, string>;

/**
 * Assign a data value at an AQL path, creating intermediate RM objects as needed.
 */
export function assignAtAqlPath(
  root: RmObject,
  aqlPath: string,
  leafValue: unknown,
  leafRmType: string,
  elementNodeId?: string,
  occurrences?: OccurrenceHints,
  rmTypes?: RmTypeHints,
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
    const occurrence = occurrences?.[si + 1] ?? 0;

    if (isLast) {
      const isDataValue = leafRmType.startsWith("DV_") ||
        leafRmType.startsWith("C_") ||
        leafRmType === "CODE_PHRASE" ||
        leafRmType.startsWith("PARTY_");

      if (isDataValue && attr === "items") {
        const elemNodeId = elementNodeId || nodeId || null;
        if (!Array.isArray(current.items)) current.items = [];
        const items = current.items as RmObject[];
        // Idempotent per (node id, occurrence): alternative template nodes
        // addressing the same RM node must not create duplicate elements.
        const matches = elemNodeId
          ? items.filter((it) =>
            it._type === "ELEMENT" &&
            nodeIdsMatch(it.archetype_node_id, elemNodeId)
          )
          : [];
        if (occurrence < matches.length) {
          matches[occurrence].value = leafValue;
        } else {
          items.push({
            _type: "ELEMENT",
            archetype_node_id: elemNodeId,
            value: leafValue,
          });
        }
      } else if (isDataValue) {
        current[attr] = leafValue;
      } else if (
        leafValue != null && typeof leafValue === "object" &&
        (leafValue as RmObject)._type
      ) {
        // Raw canonical JSON object for a non-data-value node
        if (ARRAY_ATTRS.has(attr)) {
          if (!Array.isArray(current[attr])) current[attr] = [];
          (current[attr] as unknown[]).push(leafValue);
        } else {
          current[attr] = leafValue;
        }
      } else {
        ensureChild(current, attr, nodeId, leafRmType, occurrence);
      }
      return;
    }

    const rmType = rmTypes?.[si + 1] ?? inferRmType(attr);
    current = ensureChild(current, attr, nodeId, rmType, occurrence);
  }
}
