/**
 * Deserialize FLAT JSON payloads to RM composition instances using a Web Template.
 *
 * The deserializer scans the payload keys (rather than walking the template),
 * so it accepts both `node:0/...` and `node/...` spellings for repeatable
 * nodes, bare keys or `|value` for single-field types, `|raw` embedded
 * canonical JSON, and `|other` free-text on open coded value-sets.
 *
 * @see openehr://guides/specs/its-rest-simplified_formats
 * @see docs/reference_for_llms/simplified_formats.md
 */

import type { FlatPayload, WebTemplate, WebTemplateNode } from "./types.ts";
import { templateRootId } from "./normalize.ts";
import {
  assignAtAqlPath,
  type OccurrenceHints,
  type RmTypeHints,
} from "./rm_instance_builder.ts";
import { applyContextFromFields, buildRmValue } from "./value_build.ts";

type RmObject = Record<string, unknown>;
type Primitive = string | number | boolean;

interface ParsedSegment {
  id: string;
  index: number;
}

interface LeafGroup {
  node: WebTemplateNode;
  segments: ParsedSegment[];
  /** suffix ("" = bare) → value */
  fields: Record<string, Primitive>;
  raw?: Record<string, unknown>;
  other?: Primitive;
}

function parseSegments(basePath: string): ParsedSegment[] {
  return basePath.split("/").map((seg) => {
    const m = /^(.*?)(?::(\d+))?$/.exec(seg)!;
    return { id: m[1], index: m[2] ? parseInt(m[2], 10) : 0 };
  });
}

function aqlSegmentCount(aqlPath: string): number {
  return aqlPath.replace(/\/+/g, "/").match(/\/[^/]+/g)?.length ?? 0;
}

export class FlatDeserializer {
  private rootId: string;
  /** id-chain (indices stripped, without root) → node */
  private nodeByChain = new Map<string, WebTemplateNode>();
  /** id-chain → chain of nodes from tree root (exclusive) to node (inclusive) */
  private pathNodes = new Map<string, WebTemplateNode[]>();

  constructor(private webTemplate: WebTemplate) {
    this.rootId = templateRootId(webTemplate.templateId);
    this.indexNodes(webTemplate.tree.children ?? [], "", []);
  }

  private indexNodes(
    nodes: WebTemplateNode[],
    prefix: string,
    ancestors: WebTemplateNode[],
  ): void {
    for (const node of nodes) {
      const chain = prefix ? `${prefix}/${node.id}` : node.id;
      const lineage = [...ancestors, node];
      this.nodeByChain.set(chain, node);
      this.pathNodes.set(chain, lineage);
      if (node.children?.length) {
        this.indexNodes(node.children, chain, lineage);
      }
    }
  }

  deserialize(flat: FlatPayload): RmObject {
    const comp: RmObject = { _type: "COMPOSITION" };
    const groups = new Map<string, LeafGroup>();

    for (const [key, value] of Object.entries(flat)) {
      if (value == null) continue;

      if (key.startsWith("ctx/")) continue; // handled below

      const pipeIdx = key.indexOf("|");
      const basePath = pipeIdx === -1 ? key : key.slice(0, pipeIdx);
      const suffix = pipeIdx === -1 ? "" : key.slice(pipeIdx + 1);

      const segments = parseSegments(basePath);
      if (!segments.length) continue;

      if (segments[0].id === this.rootId) segments.shift();
      if (!segments.length) continue;

      // Root-level RM attribute escape (e.g. `template/_uid`)
      if (segments.length === 1 && segments[0].id === "_uid") {
        if (typeof value !== "object") {
          comp.uid = { _type: "OBJECT_VERSION_ID", value: String(value) };
        }
        continue;
      }

      const chain = segments.map((s) => s.id).join("/");
      const node = this.nodeByChain.get(chain);
      if (!node) continue; // unknown path: ignore (validator reports it)

      const groupKey = segments
        .map((s) => `${s.id}:${s.index}`)
        .join("/");
      let group = groups.get(groupKey);
      if (!group) {
        group = { node, segments, fields: {} };
        groups.set(groupKey, group);
      }

      if (suffix === "raw" && typeof value === "object") {
        group.raw = value as Record<string, unknown>;
      } else if (suffix === "other" && typeof value !== "object") {
        group.other = value as Primitive;
      } else if (typeof value !== "object") {
        // Keep "value" as-is: it is a real suffix for DV_CODED_TEXT and an
        // alias for the bare key elsewhere (buildDvValue resolves it).
        group.fields[suffix] = value as Primitive;
      }
    }

    for (const group of groups.values()) {
      this.assignGroup(comp, group);
    }

    // ctx fields last so composition-level defaults are not clobbered
    this.applyContext(comp, flat);

    return comp;
  }

  deserializeJson(json: string): RmObject {
    return this.deserialize(JSON.parse(json) as FlatPayload);
  }

  private applyContext(comp: RmObject, flat: FlatPayload): void {
    // Group ctx keys by field id: ctx/<id>[:i][|suffix]
    const byField = new Map<string, Record<string, Primitive>>();
    for (const [key, value] of Object.entries(flat)) {
      if (!key.startsWith("ctx/") || value == null || typeof value === "object") {
        continue;
      }
      const rest = key.slice(4);
      const pipeIdx = rest.indexOf("|");
      const base = pipeIdx === -1 ? rest : rest.slice(0, pipeIdx);
      const suffix = pipeIdx === -1 ? "" : rest.slice(pipeIdx + 1);
      const fieldId = base.replace(/:\d+$/, "");
      let fields = byField.get(fieldId);
      if (!fields) {
        fields = {};
        byField.set(fieldId, fields);
      }
      fields[suffix] = value as Primitive;
    }
    for (const [fieldId, fields] of byField) {
      applyContextFromFields(comp, fieldId, fields);
    }
  }

  private occurrenceHints(group: LeafGroup): OccurrenceHints {
    const hints: OccurrenceHints = {};
    const chainIds: string[] = [];
    for (const seg of group.segments) {
      chainIds.push(seg.id);
      if (seg.index === 0) continue;
      const node = this.nodeByChain.get(chainIds.join("/"));
      if (!node?.aqlPath) continue;
      const depth = aqlSegmentCount(node.aqlPath);
      hints[depth] = seg.index;
      // Spec-style leaves point at ELEMENT.value; the repeat actually
      // happens on the enclosing ELEMENT one segment up.
      if (/\/value$/.test(node.aqlPath)) hints[depth - 1] = seg.index;
    }
    return hints;
  }

  /** RM types of ancestor template nodes, keyed by AQL path depth. */
  private rmTypeHints(group: LeafGroup): RmTypeHints {
    const hints: RmTypeHints = {};
    const chain = group.segments.map((s) => s.id).join("/");
    for (const node of this.pathNodes.get(chain) ?? []) {
      if (!node.aqlPath || node.aqlPath === "/") continue;
      hints[aqlSegmentCount(node.aqlPath)] = node.rmType;
    }
    return hints;
  }

  private assignGroup(comp: RmObject, group: LeafGroup): void {
    const { node } = group;
    const hints = this.occurrenceHints(group);
    const typeHints = this.rmTypeHints(group);

    if (group.raw) {
      assignAtAqlPath(
        comp,
        node.aqlPath,
        group.raw,
        (group.raw._type as string) ?? node.rmType,
        node.nodeId,
        hints,
        typeHints,
      );
      return;
    }

    if (group.other !== undefined) {
      assignAtAqlPath(
        comp,
        node.aqlPath,
        { _type: "DV_TEXT", value: String(group.other) },
        "DV_TEXT",
        node.nodeId,
        hints,
        typeHints,
      );
      return;
    }

    if (!Object.keys(group.fields).length) return;

    assignAtAqlPath(
      comp,
      node.aqlPath,
      buildRmValue(node.rmType, group.fields),
      node.rmType,
      node.nodeId,
      hints,
      typeHints,
    );
  }
}

export function deserializeFromFlat(
  flat: FlatPayload,
  webTemplate: WebTemplate,
): RmObject {
  return new FlatDeserializer(webTemplate).deserialize(flat);
}

export function deserializeFromFlatJson(
  json: string,
  webTemplate: WebTemplate,
): RmObject {
  return new FlatDeserializer(webTemplate).deserializeJson(json);
}
