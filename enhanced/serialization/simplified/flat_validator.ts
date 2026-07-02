/**
 * Validate FLAT JSON payloads against a Web Template schema.
 *
 * Checks that each key resolves to a web template node (accepting `:n`
 * instance indices, `|suffix` attributes including the `|value` alias,
 * `|raw`, `|other` on open coded lists, and `_`-prefixed RM attribute
 * segments), and that mandatory context/leaf fields are present.
 */

import type {
  FlatPayload,
  FlatValidationResult,
  SimplifiedValidationMessage,
  WebTemplate,
  WebTemplateNode,
} from "./types.ts";
import { templateRootId } from "./normalize.ts";
import { getFieldMap } from "./dv_field_maps.ts";

const CTX_FIELDS = new Set([
  "language",
  "territory",
  "composer_name",
  "composer_id",
  "composer_self",
  "id_namespace",
  "id_scheme",
  "time",
  "end_time",
  "history_origin",
  "action_time",
  "activity_timing",
  "instruction_narrative",
  "action_ism_transition_current_state",
  "location",
  "setting",
  "category",
  "work_flow_id",
  "health_care_facility",
  "provider_name",
  "provider_id",
]);

function stripIndex(segment: string): string {
  return segment.replace(/:\d+$/, "");
}

function buildChainSet(webTemplate: WebTemplate): Map<string, WebTemplateNode> {
  const map = new Map<string, WebTemplateNode>();
  const walk = (nodes: WebTemplateNode[], prefix: string) => {
    for (const node of nodes) {
      const chain = prefix ? `${prefix}/${node.id}` : node.id;
      map.set(chain, node);
      if (node.children?.length) walk(node.children, chain);
    }
  };
  walk(webTemplate.tree.children ?? [], "");
  return map;
}

function knownSuffixes(node: WebTemplateNode): Set<string> {
  const suffixes = new Set<string>(["raw"]);
  for (const input of node.inputs ?? []) {
    suffixes.add(input.suffix ?? "");
  }
  const map = getFieldMap(node.rmType);
  if (map) for (const f of map.fields) suffixes.add(f.suffix);
  if (suffixes.has("")) suffixes.add("value");
  if (node.rmType === "DV_CODED_TEXT") suffixes.add("other");
  return suffixes;
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
  const errors: SimplifiedValidationMessage[] = [];
  const warnings: SimplifiedValidationMessage[] = [];
  const rootId = templateRootId(webTemplate.templateId);
  const chains = buildChainSet(webTemplate);

  const report = (path: string, message: string) => {
    if (options.strictUnknownKeys) {
      errors.push({ path, message, severity: "error" });
    } else {
      warnings.push({ path, message, severity: "warning" });
    }
  };

  const seenChains = new Set<string>();

  for (const key of Object.keys(payload)) {
    if (key.startsWith("ctx/")) {
      const rest = key.slice(4);
      const field = stripIndex(rest.split("|")[0]).replace(/:\d+.*$/, "");
      const base = field.split("/")[0].replace(/:\d+$/, "");
      if (!CTX_FIELDS.has(base) && !base.startsWith("participation")) {
        report(key, "Unknown ctx field");
      }
      continue;
    }

    const pipeIdx = key.indexOf("|");
    const basePath = pipeIdx === -1 ? key : key.slice(0, pipeIdx);
    const suffix = pipeIdx === -1 ? "" : key.slice(pipeIdx + 1);

    const segments = basePath.split("/").map(stripIndex);
    if (segments[0] !== rootId) {
      report(key, `Key does not start with template root "${rootId}"`);
      continue;
    }

    // RM attribute escape segments (underscore-prefixed) are pass-through
    const rmAttrIdx = segments.findIndex((s) => s.startsWith("_"));
    const chainSegs = rmAttrIdx === -1
      ? segments.slice(1)
      : segments.slice(1, rmAttrIdx);
    if (!chainSegs.length) continue;

    const chain = chainSegs.join("/");
    const node = chains.get(chain);
    if (!node) {
      report(key, "Unknown flat key for template");
      continue;
    }
    seenChains.add(chain);

    if (rmAttrIdx === -1 && suffix && !knownSuffixes(node).has(suffix)) {
      warnings.push({
        path: key,
        message: `Unknown suffix "|${suffix}" for rmType ${node.rmType}`,
        severity: "warning",
      });
    }
  }

  // Mandatory context fields per spec
  if (!("ctx/language" in payload)) {
    warnings.push({
      path: "ctx/language",
      message: "Mandatory context field missing",
      severity: "warning",
    });
  }
  if (!("ctx/territory" in payload)) {
    warnings.push({
      path: "ctx/territory",
      message: "Mandatory context field missing",
      severity: "warning",
    });
  }

  // Mandatory leaves (min > 0, not inContext)
  const requireChains = (
    nodes: WebTemplateNode[],
    prefix: string,
    ancestorsRequired: boolean,
  ) => {
    for (const node of nodes) {
      if (node.inContext) continue;
      const chain = prefix ? `${prefix}/${node.id}` : node.id;
      const required = ancestorsRequired && node.min > 0;
      const isLeaf = !!node.inputs?.length && !node.children?.length;
      if (isLeaf && required && !seenChains.has(chain)) {
        warnings.push({
          path: `${rootId}/${chain}`,
          message: "Mandatory field missing from payload",
          severity: "warning",
        });
      }
      if (node.children?.length) {
        requireChains(node.children, chain, required);
      }
    }
  };
  requireChains(webTemplate.tree.children ?? [], "", true);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/** @deprecated retained for compatibility; prefer validateFlatPayload. */
export function collectExpectedFlatKeys(webTemplate: WebTemplate): Set<string> {
  const keys = new Set<string>();
  const rootId = templateRootId(webTemplate.templateId);
  const walk = (node: WebTemplateNode, parts: string[]) => {
    if (node.inContext) {
      for (const input of node.inputs ?? [{ type: "TEXT" }]) {
        const suffix = input.suffix ?? "";
        keys.add(
          suffix === "" || suffix === "value"
            ? `ctx/${node.id}`
            : `ctx/${node.id}|${suffix}`,
        );
      }
      return;
    }
    const next = [...parts, node.id];
    const isLeaf = !!node.inputs?.length && !node.children?.length;
    if (isLeaf) {
      for (const input of node.inputs ?? []) {
        const suffix = input.suffix ?? "";
        keys.add(
          suffix === ""
            ? next.join("/")
            : `${next.join("/")}|${suffix}`,
        );
      }
      return;
    }
    for (const child of node.children ?? []) walk(child, next);
  };
  for (const child of webTemplate.tree.children ?? []) walk(child, [rootId]);
  return keys;
}
