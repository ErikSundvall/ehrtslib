/**
 * Serialize RM composition instances to FLAT JSON (web-template keyed).
 * @see openehr://guides/specs/its-rest-simplified_formats
 */

import type { FlatPayload, WebTemplate, WebTemplateNode } from "./types.ts";
import { templateRootId } from "./normalize.ts";
import {
  resolveAllAtWebTemplateNode,
  resolveChildWebTemplateNodes,
} from "./instance_nav.ts";
import { extractContextField, extractValueFields } from "./value_extract.ts";

export interface FlatSerializerOptions {
  prettyPrint?: boolean;
}

function joinFlatPath(parts: string[]): string {
  return parts.join("/");
}

function indexSuffix(max: number, index: number): string {
  return max !== 1 || index > 0 ? `:${index}` : "";
}


export class FlatSerializer {
  private out: FlatPayload = {};
  private rootId: string;
  private instance: unknown;

  constructor(
    private webTemplate: WebTemplate,
    private options: FlatSerializerOptions = {},
  ) {
    this.rootId = templateRootId(webTemplate.templateId);
  }

  serialize(instance: unknown): FlatPayload {
    this.out = {};
    this.instance = instance;
    // FLAT keys carry a single root segment (the normalised template id);
    // the tree root node itself contributes no extra path segment.
    for (const child of this.webTemplate.tree.children ?? []) {
      if (child.inContext) {
        this.walkNode(child, [this.rootId], 0);
        continue;
      }
      const values = resolveAllAtWebTemplateNode(instance, child);
      for (let i = 0; i < values.length; i++) {
        this.walkNode(child, [this.rootId], i, values[i]);
      }
    }
    return { ...this.out };
  }

  serializeJson(instance: unknown): string {
    const payload = this.serialize(instance);
    return JSON.stringify(
      payload,
      null,
      this.options.prettyPrint ? 2 : undefined,
    );
  }

  private walkNode(
    node: WebTemplateNode,
    pathParts: string[],
    index: number,
    scope?: unknown,
  ): void {
    if (node.inContext) {
      this.emitContext(node);
      return;
    }

    const nodeValues = scope != null
      ? [scope]
      : resolveAllAtWebTemplateNode(this.instance, node);
    if (!nodeValues.length) return;

    const part = node.id + indexSuffix(node.max, index);
    const nextPath = [...pathParts, part];

    const isLeaf = node.inputs?.length && !node.children?.length;
    const currentData = scope ?? nodeValues[index] ?? nodeValues[0];

    if (isLeaf) {
      const fields = extractValueFields(currentData, node.inputs);
      const base = joinFlatPath(nextPath);
      for (const [suffix, value] of Object.entries(fields)) {
        this.out[suffix === "" ? base : `${base}|${suffix}`] = value;
      }
      return;
    }

    if (node.children?.length) {
      for (const child of node.children) {
        const childValues = resolveChildWebTemplateNodes(
          this.instance,
          currentData,
          node,
          child,
        );
        for (let i = 0; i < childValues.length; i++) {
          this.walkNode(child, nextPath, i, childValues[i]);
        }
      }
    }
  }

  private emitContext(node: WebTemplateNode): void {
    const fields = extractContextField(this.instance, node.id);
    if (node.inputs?.length) {
      for (const input of node.inputs) {
        const suffix = input.suffix ?? "";
        // "value" remains a legacy alias for the bare field
        const val = fields[suffix] ??
          (suffix === "" || suffix === "value"
            ? fields[""] ?? fields.value
            : undefined);
        if (val != null) {
          const key = suffix === "" || suffix === "value"
            ? `ctx/${node.id}`
            : `ctx/${node.id}|${suffix}`;
          this.out[key] = val;
        }
      }
    } else {
      const val = fields[""] ?? fields.value;
      if (val != null) this.out[`ctx/${node.id}`] = val;
    }
  }
}

export function serializeToFlat(
  instance: unknown,
  webTemplate: WebTemplate,
): FlatPayload {
  return new FlatSerializer(webTemplate).serialize(instance);
}

export function serializeToFlatJson(
  instance: unknown,
  webTemplate: WebTemplate,
  options?: FlatSerializerOptions,
): string {
  return new FlatSerializer(webTemplate, options).serializeJson(instance);
}
