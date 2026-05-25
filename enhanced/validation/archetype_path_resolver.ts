/**
 * Resolve ADL2 archetype paths (e.g. `/data[id2]/value/magnitude`) on plain RM instances.
 */

import type * as openehr_am from "../openehr_am.ts";

export interface PathResolveOptions {
  /** Archetype definition root for node-id → child mapping. */
  definition?: openehr_am.C_COMPLEX_OBJECT;
}

/** Map ADL node id `id2` to typical RM `archetype_node_id` `at0002`. */
export function adlNodeIdToAtCode(nodeId: string): string {
  const m = /^id(\d+)$/i.exec(nodeId.trim());
  if (m) return `at${m[1].padStart(4, "0")}`;
  return nodeId;
}

export class ArchetypePathResolver {
  private definition?: openehr_am.C_COMPLEX_OBJECT;

  constructor(options?: PathResolveOptions) {
    this.definition = options?.definition;
  }

  resolve(root: unknown, path: string): unknown {
    const trimmed = path.trim();
    if (!trimmed) return root;

    const normalized = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
    if (!normalized) return root;

    const segments = this.splitPath(normalized);
    let current: unknown = root;
    let defNode: openehr_am.C_OBJECT | undefined = this.definition;

    for (const seg of segments) {
      if (current === null || current === undefined) return undefined;

      const { attrName, nodeId } = this.parseSegment(seg);

      if (attrName) {
        current = this.getAttribute(current, attrName);
        defNode = this.findChildInDefinition(defNode, attrName, nodeId);
      }

      if (nodeId !== undefined) {
        current = this.selectByNodeId(current, nodeId, defNode);
      }
    }

    return current;
  }

  exists(root: unknown, path: string): boolean {
    const value = this.resolve(root, path);
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  private splitPath(path: string): string[] {
    const segments: string[] = [];
    let buf = "";
    let bracketDepth = 0;

    for (let i = 0; i < path.length; i++) {
      const c = path[i];
      if (c === "[") bracketDepth++;
      else if (c === "]") bracketDepth--;

      if (c === "/" && bracketDepth === 0) {
        if (buf) segments.push(buf);
        buf = "";
      } else {
        buf += c;
      }
    }
    if (buf) segments.push(buf);
    return segments;
  }

  private parseSegment(segment: string): { attrName?: string; nodeId?: string } {
    const m = /^([A-Za-z_][\w]*)(?:\[([^\]]+)\])?$/.exec(segment);
    if (!m) {
      const bracketOnly = /^\[([^\]]+)\]$/.exec(segment);
      if (bracketOnly) return { nodeId: bracketOnly[1] };
      return { attrName: segment };
    }
    return { attrName: m[1], nodeId: m[2] };
  }

  private getAttribute(node: unknown, attrName: string): unknown {
    if (node === null || node === undefined) return undefined;
    if (Array.isArray(node)) {
      if (node.length === 1) return this.getAttribute(node[0], attrName);
      return node.map((item) => this.getAttribute(item, attrName));
    }
    if (typeof node === "object") {
      const obj = node as Record<string, unknown>;
      if (attrName in obj) return obj[attrName];
      const camel = attrName.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (camel in obj) return obj[camel];
    }
    return undefined;
  }

  private selectByNodeId(
    node: unknown,
    nodeId: string,
    defChild?: openehr_am.C_OBJECT,
  ): unknown {
    const atCode = defChild?.node_id
      ? adlNodeIdToAtCode(defChild.node_id)
      : adlNodeIdToAtCode(nodeId);
    const candidates = new Set([
      nodeId,
      atCode,
      defChild?.node_id,
    ].filter(Boolean) as string[]);

    if (Array.isArray(node)) {
      const found = node.find((item) =>
        this.nodeIdMatches(item, candidates)
      );
      return found ?? node[0];
    }

    if (this.nodeIdMatches(node, candidates)) return node;
    return node;
  }

  private nodeIdMatches(item: unknown, candidates: Set<string>): boolean {
    if (!item || typeof item !== "object") return false;
    const id = (item as Record<string, unknown>).archetype_node_id;
    if (typeof id !== "string") return false;
    return candidates.has(id);
  }

  private findChildInDefinition(
    parent: openehr_am.C_OBJECT | undefined,
    attrName: string,
    nodeId?: string,
  ): openehr_am.C_OBJECT | undefined {
    if (!parent || !(parent as openehr_am.C_COMPLEX_OBJECT).attributes) {
      return undefined;
    }
    const complex = parent as openehr_am.C_COMPLEX_OBJECT;
    for (const attr of complex.attributes ?? []) {
      if (attr.rm_attribute_name !== attrName) continue;
      for (const child of attr.children ?? []) {
        if (!nodeId || child.node_id === nodeId) return child;
      }
      return attr.children?.[0];
    }
    return undefined;
  }
}
