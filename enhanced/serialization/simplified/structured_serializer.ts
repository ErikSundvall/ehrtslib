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

/** Drop trailing entries matching `isEmpty` (keeps inner gaps as null). */
function trimTrailing<T>(arr: T[], isEmpty: (e: T) => boolean): T[] {
  let end = arr.length;
  while (end > 0 && isEmpty(arr[end - 1])) end--;
  return arr.slice(0, end);
}

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
      const bare = fields[""] ?? fields.value;
      const suffixed = Object.entries(fields).filter(
        ([suffix]) => suffix !== "" && suffix !== "value",
      );
      if (suffixed.length) {
        const entry: StructuredValue = {};
        if (bare != null) entry["|value"] = bare;
        for (const [suffix, val] of suffixed) entry[`|${suffix}`] = val;
        ctx[node.id] = [entry];
      } else if (bare != null) {
        ctx[node.id] = bare;
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
      // Preserve instance positions (null placeholders) so array indices
      // stay aligned with FLAT `:n` occurrence indices; trim trailing gaps.
      const entries0 = nodeValues.map((data): unknown => {
        const fields = extractValueFields(data, node.inputs);
        const entries = Object.entries(fields);
        if (!entries.length) return null;
        // Single bare field → primitive array entry (per spec examples,
        // e.g. "time": ["2024-01-15T10:30:00Z"]).
        if (entries.length === 1 && entries[0][0] === "") {
          return entries[0][1];
        }
        const entry: StructuredValue = {};
        for (const [suffix, value] of entries) {
          entry[suffix === "" ? "|value" : `|${suffix}`] = value;
        }
        return entry;
      });
      return trimTrailing(entries0, (e) => e == null);
    }

    const items: (StructuredValue | null)[] = [];
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
      items.push(Object.keys(item).length ? item : null);
    }
    return trimTrailing(items, (e) => e == null);
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
