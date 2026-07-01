/**
 * Validate FLAT JSON payloads against a Web Template schema.
 */

import type {
  FlatPayload,
  FlatValidationResult,
  WebTemplate,
  WebTemplateNode,
} from "./types.ts";
import { templateRootId } from "./normalize.ts";

function collectLeafPaths(
  node: WebTemplateNode,
  pathParts: string[],
  rootId: string,
  out: Set<string>,
): void {
  if (node.inContext) {
    if (node.inputs?.length) {
      for (const input of node.inputs) {
        const suffix = input.suffix ?? "value";
        const key = suffix === "value"
          ? `ctx/${node.id}`
          : `ctx/${node.id}|${suffix}`;
        out.add(key);
      }
    } else {
      out.add(`ctx/${node.id}`);
    }
    return;
  }

  const max = node.max === -1 ? 1 : Math.max(node.max, node.min, 1);
  const indexed = max !== 1;

  for (let i = 0; i < Math.max(1, node.min); i++) {
    const part = node.id + (indexed ? `:${i}` : "");
    const nextPath = pathParts.length ? [...pathParts, part] : [rootId, part];

    const isLeaf = node.inputs?.length && !node.children?.length;
    if (isLeaf) {
      for (const input of node.inputs ?? []) {
        if (input.suffix) {
          out.add(`${[...nextPath].join("/")}|${input.suffix}`);
        }
      }
      continue;
    }

    for (const child of node.children ?? []) {
      collectLeafPaths(child, nextPath, rootId, out);
    }
  }
}

export function collectExpectedFlatKeys(webTemplate: WebTemplate): Set<string> {
  const rootId = templateRootId(webTemplate.templateId);
  const keys = new Set<string>();
  collectLeafPaths(webTemplate.tree, [], rootId, keys);
  return keys;
}

export interface FlatValidatorOptions {
  /** Treat unknown keys as errors (default: warnings). */
  strictUnknownKeys?: boolean;
}

export function validateFlatPayload(
  payload: FlatPayload,
  webTemplate: WebTemplate,
  options: FlatValidatorOptions = {},
): FlatValidationResult {
  const expected = collectExpectedFlatKeys(webTemplate);
  const errors: FlatValidationResult["errors"] = [];
  const warnings: FlatValidationResult["warnings"] = [];

  const rootPrefix = templateRootId(webTemplate.templateId) + "/";
  const ctxPrefix = "ctx/";

  for (const key of Object.keys(payload)) {
    const isKnown = expected.has(key) ||
      key.startsWith(ctxPrefix) ||
      key.startsWith(rootPrefix);
    if (!isKnown) {
      const msg = {
        path: key,
        message: "Unknown flat key for template",
        severity: "warning" as const,
      };
      if (options.strictUnknownKeys) errors.push({ ...msg, severity: "error" });
      else warnings.push(msg);
    }
  }

  for (const key of expected) {
    if (!(key in payload)) {
      warnings.push({
        path: key,
        message: "Expected flat key missing from payload",
        severity: "warning",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
