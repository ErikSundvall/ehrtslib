/**
 * Convert STRUCTURED JSON to FLAT for shared deserialization path.
 */

import type { FlatPayload, WebTemplate, WebTemplateNode } from "./types.ts";
import { templateRootId } from "./normalize.ts";

type StructuredValue = Record<string, unknown>;

function pipeFields(obj: StructuredValue): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("|") && v != null) {
      out[k.slice(1)] = v as string | number | boolean;
    }
  }
  return out;
}

function flattenCtx(ctx: StructuredValue, flat: FlatPayload): void {
  for (const [field, val] of Object.entries(ctx)) {
    if (Array.isArray(val) && val.length && typeof val[0] === "object") {
      const fields = pipeFields(val[0] as StructuredValue);
      for (const [suffix, v] of Object.entries(fields)) {
        flat[`ctx/${field}|${suffix}`] = v;
      }
    } else if (val != null) {
      flat[`ctx/${field}`] = val as string | number | boolean;
    }
  }
}

function flattenNodeArray(
  items: unknown[],
  pathParts: string[],
  flat: FlatPayload,
  schemaNodes: WebTemplateNode[],
): void {
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as StructuredValue;
    for (const schema of schemaNodes) {
      const max = schema.max === -1 ? 1 : schema.max;
      const indexed = max !== 1 || schema.max === -1;
      const part = schema.id + (indexed ? `:${i}` : "");
      const nextPath = [...pathParts, part];
      const val = item[schema.id];

      const isLeaf = schema.inputs?.length && !schema.children?.length;
      if (isLeaf && Array.isArray(val) && val.length) {
        const fields = pipeFields(val[0] as StructuredValue);
        const base = nextPath.join("/");
        for (const [suffix, v] of Object.entries(fields)) {
          flat[`${base}|${suffix}`] = v;
        }
      } else if (Array.isArray(val) && schema.children?.length) {
        flattenNodeArray(val, nextPath, flat, schema.children);
      }
    }
  }
}

export function structuredToFlat(
  structured: StructuredValue,
  webTemplate: WebTemplate,
): FlatPayload {
  const flat: FlatPayload = {};
  const rootId = templateRootId(webTemplate.templateId);

  if (structured.ctx && typeof structured.ctx === "object") {
    flattenCtx(structured.ctx as StructuredValue, flat);
  }

  const rootBranch = structured[rootId];
  const contentNodes = (webTemplate.tree.children ?? []).filter((c) => !c.inContext);

  if (rootBranch && typeof rootBranch === "object" && !Array.isArray(rootBranch)) {
    for (const schema of contentNodes) {
      const arr = (rootBranch as StructuredValue)[schema.id];
      if (Array.isArray(arr)) {
        flattenNodeArray(arr, [rootId], flat, [schema]);
      }
    }
  }

  return flat;
}
