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
    this.walkNode(this.webTemplate.tree, [this.rootId], 0);
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

    const max = node.max === -1 ? Math.max(node.min, 1) : node.max;
    const indexed = max !== 1;
    const part = node.id + (indexed ? indexSuffix(max, index) : "");
    const nextPath = [...pathParts, part];

    const isLeaf = node.inputs?.length && !node.children?.length;

    if (isLeaf) {
      const data = nodeValues[index] ?? nodeValues[0];
      const fields = extractValueFields(data, node.inputs);
      const base = joinFlatPath(nextPath);
      for (const [suffix, value] of Object.entries(fields)) {
        this.out[`${base}|${suffix}`] = value;
      }
      return;
    }

    const currentData = nodeValues[index] ?? nodeValues[0];

    if (node.children?.length) {
      for (const child of node.children) {
        const childValues = resolveChildWebTemplateNodes(
          this.instance,
          currentData,
          node,
          child,
        );
        const repeats = Math.max(childValues.length, 1);
        for (let i = 0; i < repeats; i++) {
          this.walkNode(child, nextPath, i, childValues[i] ?? childValues[0]);
        }
      }
    }
  }

  private emitContext(node: WebTemplateNode): void {
    const fields = extractContextField(this.instance, node.id);
    if (node.inputs?.length) {
      for (const input of node.inputs) {
        const suffix = input.suffix ?? "value";
        const val = fields[suffix] ?? fields.value;
        if (val != null) {
          const key = suffix === "value"
            ? `ctx/${node.id}`
            : `ctx/${node.id}|${suffix}`;
          this.out[key] = val;
        }
      }
    } else if (fields.value != null) {
      this.out[`ctx/${node.id}`] = fields.value;
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
