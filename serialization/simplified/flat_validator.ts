/**
 * Validate FLAT JSON payloads against a Web Template schema.
 *
 * Checks that each key resolves to a web template node (accepting `:n`
 * instance indices, `|suffix` attributes including the `|value` alias,
 * `|raw`, `|other` on open coded lists, and `_`-prefixed RM attribute
 * segments), and that mandatory context/leaf fields are present. Then reads
 * the payload with {@link FlatDeserializer} and reports its errors (coded
 * text without a code, two values on one ELEMENT, a value with
 * `_null_flavour`, the untyped `_value`, keys or fields the reader rejects),
 * so a payload the reader rejects is not valid.
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
import { nodeForChain } from "./element_value_choice.ts";
import { FlatDeserializer } from "./flat_deserializer.ts";

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
  // A DV_CODED_TEXT may stand where DV_TEXT is constrained.
  if (node.rmType === "DV_TEXT") {
    for (const f of getFieldMap("DV_CODED_TEXT")?.fields ?? []) suffixes.add(f.suffix);
  }
  if (suffixes.has("")) suffixes.add("value");
  if (node.rmType === "DV_CODED_TEXT") suffixes.add("other");
  if (node.rmType.startsWith("PARTY_")) suffixes.add("_type");
  return suffixes;
}

const READER_REJECTS = new Set<string>([
  "coded-text-mismatch",
  "element-value",
  "unknown-key",
]);

export interface FlatValidatorOptions {
  /**
   * Treat unknown keys as errors (default `true`, as the FLAT reader does);
   * `false` reports them as warnings.
   */
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

  const strict = options.strictUnknownKeys ?? true;
  const report = (path: string, message: string) => {
    if (strict) {
      errors.push({ path, message, severity: "error" });
    } else {
      warnings.push({ path, message, severity: "warning" });
    }
  };

  const seenChains = new Set<string>();
  const indexCounts = new Map<string, number>();

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

    const rawSegments = basePath.split("/");
    const segments = rawSegments.map(stripIndex);
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

    let chain = chainSegs.join("/");
    let node = nodeForChain(chains, chain);
    // DV_INTERVAL<T> bounds: `<interval>/lower|…`, `<interval>/upper|…`.
    const bound = node ? undefined : /^(.*)\/(?:lower|upper)$/.exec(chain);
    if (bound) {
      const interval = nodeForChain(chains, bound[1]);
      const param = interval && /^DV_INTERVAL<(.+)>$/.exec(interval.rmType);
      if (param) {
        chain = bound[1];
        node = { ...interval, rmType: param[1], inputs: undefined };
      }
    }
    if (!node) {
      report(key, "Unknown flat key for template");
      continue;
    }
    seenChains.add(chain);

    const lastRaw = rawSegments[rawSegments.length - 1] ?? "";
    const indexMatch = lastRaw.match(/:(\d+)$/);
    const instanceIndex = indexMatch ? Number(indexMatch[1]) : 0;
    const parentRaw = rawSegments.slice(0, -1).join("/");
    const countKey = `${parentRaw}\n${chain}`;
    const prev = indexCounts.get(countKey) ?? 0;
    indexCounts.set(countKey, Math.max(prev, instanceIndex + 1));

    if (rmAttrIdx === -1 && suffix && !knownSuffixes(node).has(suffix)) {
      warnings.push({
        path: key,
        message: `Unknown suffix "|${suffix}" for rmType ${node.rmType}`,
        severity: "warning",
      });
    }
  }

  for (const [countKey, count] of indexCounts) {
    const chain = countKey.slice(countKey.indexOf("\n") + 1);
    const node = chains.get(chain);
    if (!node) continue;
    if (node.max >= 0 && count > node.max) {
      errors.push({
        path: `${rootId}/${chain}`,
        message:
          `instance count ${count} exceeds the template cardinality ${node.max} for the node`,
        severity: "error",
      });
    }
  }

  // Mandatory composition fields: as ctx/ (input flavour) or at their own
  // path (output flavour).
  for (const field of ["language", "territory"]) {
    const atPath = Object.keys(payload).some((k) =>
      k === `${rootId}/${field}` || k.startsWith(`${rootId}/${field}|`)
    );
    if (!(`ctx/${field}` in payload) && !atPath) {
      warnings.push({
        path: `ctx/${field}`,
        message: "Mandatory context field missing",
        severity: "warning",
      });
    }
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

  // What the reader rejects. Unknown keys are reported above.
  const known = new Set([...errors, ...warnings].map((m) => m.path));
  try {
    const reader = new FlatDeserializer(webTemplate, {
      unknownKeys: strict ? "error" : "warning",
    });
    reader.deserialize(payload);
    for (const issue of reader.issues) {
      // The kinds that make deserializeFromFlat throw.
      if (!issue.kind || !READER_REJECTS.has(issue.kind)) continue;
      if (issue.kind === "unknown-key" && known.has(issue.path)) continue;
      if (issue.severity !== "error" && issue.kind !== "unknown-key") continue;
      (issue.severity === "error" ? errors : warnings).push({
        path: issue.path,
        message: issue.message,
        severity: issue.severity,
      });
    }
  } catch (e) {
    errors.push({
      path: rootId,
      message: `FLAT reader failed: ${e instanceof Error ? e.message : String(e)}`,
      severity: "error",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

