/**
 * Deserialize FLAT JSON payloads to RM composition instances using a Web Template.
 * @see openehr://guides/specs/its-rest-simplified_formats
 */

import type { FlatPayload, WebTemplate, WebTemplateNode } from "./types.ts";
import { templateRootId } from "./normalize.ts";
import { assignAtAqlPath } from "./rm_instance_builder.ts";
import { applyContextFromFields, buildRmValue } from "./value_build.ts";

type RmObject = Record<string, unknown>;

function joinPath(parts: string[]): string {
  return parts.join("/");
}

function indexSuffix(max: number, index: number): string {
  return max !== 1 || index > 0 ? `:${index}` : "";
}

function readFlatFields(
  flat: FlatPayload,
  basePath: string,
  suffixes: string[],
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const suffix of suffixes) {
    const key = `${basePath}|${suffix}`;
    if (key in flat && flat[key] != null) {
      out[suffix] = flat[key] as string | number | boolean;
    }
  }
  return out;
}

/** Highest :index present under parentPath for a given node id segment. */
function maxIndexAt(flat: FlatPayload, parentPath: string, nodeId: string): number {
  const prefix = `${parentPath}/${nodeId}:`;
  let max = -1;
  for (const key of Object.keys(flat)) {
    if (!key.startsWith(prefix)) continue;
    const idx = parseInt(key.slice(prefix.length).split(/[/|]/)[0], 10);
    if (!Number.isNaN(idx)) max = Math.max(max, idx);
  }
  return max;
}

export class FlatDeserializer {
  private flat: FlatPayload = {};
  private rootId: string;
  private comp!: RmObject;

  constructor(private webTemplate: WebTemplate) {
    this.rootId = templateRootId(webTemplate.templateId);
  }

  deserialize(flat: FlatPayload): RmObject {
    this.flat = flat;
    this.comp = { _type: "COMPOSITION" };

    for (const node of this.webTemplate.tree.children ?? []) {
      if (node.inContext) this.applyContext(node);
    }

    for (const node of this.webTemplate.tree.children ?? []) {
      if (!node.inContext) this.walkNode(node, [this.rootId], 0);
    }

    return this.comp;
  }

  deserializeJson(json: string): RmObject {
    return this.deserialize(JSON.parse(json) as FlatPayload);
  }

  private applyContext(node: WebTemplateNode): void {
    const suffixes = node.inputs?.map((i) => i.suffix ?? "value") ?? ["value"];
    const fields: Record<string, string | number | boolean> = {};

    for (const suffix of suffixes) {
      const key = suffix === "value" && suffixes.length === 1
        ? `ctx/${node.id}`
        : `ctx/${node.id}|${suffix}`;
      if (key in this.flat && this.flat[key] != null) {
        fields[suffix] = this.flat[key] as string | number | boolean;
      }
    }

    if (Object.keys(fields).length) {
      applyContextFromFields(this.comp, node.id, fields);
    }
  }

  /** Mirrors FlatSerializer.walkNode */
  private walkNode(node: WebTemplateNode, pathParts: string[], index: number): void {
    const max = node.max === -1 ? Math.max(node.min, 1) : node.max;
    const indexed = max !== 1;
    const part = node.id + (indexed ? indexSuffix(max, index) : "");
    const nextPath = joinPath([...pathParts, part]);

    const isLeaf = node.inputs?.length && !node.children?.length;
    if (isLeaf) {
      const suffixes = node.inputs!.map((i) => i.suffix ?? "value");
      const fields = readFlatFields(this.flat, nextPath, suffixes);
      if (Object.keys(fields).length) {
        assignAtAqlPath(
          this.comp,
          node.aqlPath,
          buildRmValue(node.rmType, fields),
          node.rmType,
          node.nodeId,
        );
      }
      return;
    }

    if (!node.children?.length) return;

    const repeats = node.max === -1
      ? Math.max(maxIndexAt(this.flat, joinPath(pathParts), node.id) + 1, node.min > 0 ? 1 : 0)
      : (max > 1 ? max : 1);

    for (let i = 0; i < repeats; i++) {
      const idx = node.max === -1 ? i : index;
      const branchPart = node.id + (node.max === -1 || indexed ? indexSuffix(node.max === -1 ? 1 : max, idx) : "");
      const branchPath = [...pathParts, branchPart];
      for (const child of node.children) {
        this.walkNode(child, branchPath, node.max === -1 ? 0 : idx);
      }
    }
  }
}

export function deserializeFromFlat(flat: FlatPayload, webTemplate: WebTemplate): RmObject {
  return new FlatDeserializer(webTemplate).deserialize(flat);
}

export function deserializeFromFlatJson(json: string, webTemplate: WebTemplate): RmObject {
  return new FlatDeserializer(webTemplate).deserializeJson(json);
}
