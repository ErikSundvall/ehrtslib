/**
 * Serialize RM composition instances to STRUCTURED JSON (web-template keyed).
 * @see openehr://guides/specs/its-rest-simplified_formats
 */

import type { WebTemplate, WebTemplateNode } from "./types.ts";
import { templateRootId } from "./normalize.ts";
import {
  resolveAllAtWebTemplateNode,
  resolveChildWebTemplateNodes,
} from "./instance_nav.ts";
import { extractContextField, extractValueFields } from "./value_extract.ts";

export interface StructuredSerializerOptions {
  prettyPrint?: boolean;
}

type StructuredValue = Record<string, unknown>;

export class StructuredSerializer {
  private rootId: string;
  private instance: unknown;

  constructor(
    private webTemplate: WebTemplate,
    private options: StructuredSerializerOptions = {},
  ) {
    this.rootId = templateRootId(webTemplate.templateId);
  }

  serialize(instance: unknown): StructuredValue {
    this.instance = instance;
    const result: StructuredValue = {};

    const ctxNodes = this.collectContextNodes(this.webTemplate.tree);
    if (ctxNodes.length) {
      result.ctx = this.buildContext(ctxNodes);
    }

    const contentChildren = (this.webTemplate.tree.children ?? []).filter((c) =>
      !c.inContext
    );
    if (contentChildren.length) {
      result[this.rootId] = this.buildBranch(contentChildren);
    }

    return result;
  }

  serializeJson(instance: unknown): string {
    return JSON.stringify(
      this.serialize(instance),
      null,
      this.options.prettyPrint ? 2 : undefined,
    );
  }

  private collectContextNodes(node: WebTemplateNode): WebTemplateNode[] {
    const ctx: WebTemplateNode[] = [];
    if (node.inContext) ctx.push(node);
    for (const child of node.children ?? []) {
      if (child.inContext) ctx.push(child);
    }
    return ctx;
  }

  private buildContext(nodes: WebTemplateNode[]): StructuredValue {
    const ctx: StructuredValue = {};
    for (const node of nodes) {
      const fields = extractContextField(this.instance, node.id);
      if (
        node.inputs?.length &&
        (fields.code != null || fields.terminology != null)
      ) {
        const entry: StructuredValue = {};
        for (const input of node.inputs) {
          const suffix = input.suffix ?? "value";
          const val = fields[suffix];
          if (val != null) entry[`|${suffix}`] = val;
        }
        ctx[node.id] = [entry];
      } else if (fields.value != null) {
        ctx[node.id] = fields.value;
      }
    }
    return ctx;
  }

  private buildBranch(nodes: WebTemplateNode[]): StructuredValue {
    const out: StructuredValue = {};
    for (const node of nodes) {
      const values = this.buildNodeArray(node);
      if (values.length) out[node.id] = values;
    }
    return out;
  }

  private buildNodeArray(
    node: WebTemplateNode,
    scope?: unknown,
  ): unknown[] {
    const nodeValues = scope != null
      ? [scope]
      : resolveAllAtWebTemplateNode(this.instance, node);
    if (!nodeValues.length) return [];

    const isLeaf = node.inputs?.length && !node.children?.length;
    if (isLeaf) {
      return nodeValues.flatMap((data) => {
        const fields = extractValueFields(data, node.inputs);
        if (!Object.keys(fields).length) return [];
        const entry: StructuredValue = {};
        for (const [suffix, value] of Object.entries(fields)) {
          entry[`|${suffix}`] = value;
        }
        return [entry];
      });
    }

    const items: StructuredValue[] = [];
    for (let i = 0; i < nodeValues.length; i++) {
      const currentData = nodeValues[i];
      const item: StructuredValue = {};
      for (const child of node.children ?? []) {
        const childValues = resolveChildWebTemplateNodes(
          this.instance,
          currentData,
          node,
          child,
        );
        if (!childValues.length) continue;
        const built = childValues.flatMap((childData) =>
          this.buildNodeArray(child, childData)
        );
        if (built.length) item[child.id] = built;
      }
      if (Object.keys(item).length) items.push(item);
    }
    return items;
  }
}

export function serializeToStructured(
  instance: unknown,
  webTemplate: WebTemplate,
): StructuredValue {
  return new StructuredSerializer(webTemplate).serialize(instance);
}

export function serializeToStructuredJson(
  instance: unknown,
  webTemplate: WebTemplate,
  options?: StructuredSerializerOptions,
): string {
  return new StructuredSerializer(webTemplate, options).serializeJson(instance);
}
