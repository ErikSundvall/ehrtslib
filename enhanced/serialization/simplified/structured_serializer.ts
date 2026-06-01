/**
 * Serialize RM composition instances to STRUCTURED JSON (web-template keyed).
 * @see openehr://guides/specs/its-rest-simplified_formats
 */

import type { WebTemplate, WebTemplateNode } from "./types.ts";
import { templateRootId } from "./normalize.ts";
import { resolveAtPath } from "./instance_nav.ts";
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

    const contentChildren = (this.webTemplate.tree.children ?? []).filter((c) => !c.inContext);
    if (contentChildren.length) {
      result[this.rootId] = this.buildBranch(contentChildren);
    }

    return result;
  }

  serializeJson(instance: unknown): string {
    return JSON.stringify(this.serialize(instance), null, this.options.prettyPrint ? 2 : undefined);
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
      if (node.inputs?.length && (fields.code != null || fields.terminology != null)) {
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
      out[node.id] = this.buildNodeArray(node);
    }
    return out;
  }

  private buildNodeArray(node: WebTemplateNode): unknown[] {
    const isLeaf = node.inputs?.length && !node.children?.length;
    if (isLeaf) {
      const data = resolveAtPath(this.instance, node.aqlPath);
      const fields = extractValueFields(data, node.inputs);
      if (!Object.keys(fields).length) return [];
      const entry: StructuredValue = {};
      for (const [suffix, value] of Object.entries(fields)) {
        entry[`|${suffix}`] = value;
      }
      return [entry];
    }

    const count = this.estimateCount(node);
    const items: StructuredValue[] = [];
    for (let i = 0; i < count; i++) {
      const item: StructuredValue = {};
      for (const child of node.children ?? []) {
        item[child.id] = this.buildNodeArray(child);
      }
      if (Object.keys(item).length) items.push(item);
    }
    return items;
  }

  private estimateCount(node: WebTemplateNode): number {
    if (node.max === 1 && node.min <= 1) return 1;
    return Math.max(node.min, 1);
  }
}

export function serializeToStructured(instance: unknown, webTemplate: WebTemplate): StructuredValue {
  return new StructuredSerializer(webTemplate).serialize(instance);
}

export function serializeToStructuredJson(
  instance: unknown,
  webTemplate: WebTemplate,
  options?: StructuredSerializerOptions,
): string {
  return new StructuredSerializer(webTemplate, options).serializeJson(instance);
}
