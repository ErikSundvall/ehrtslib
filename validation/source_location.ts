/**
 * Format-aware source location (line/column/JSON Pointer) and missing-content
 * guidance for openEHR validation messages across Canonical JSON, FLAT JSON,
 * and STRUCTURED JSON.
 *
 * Designed to support editors and mapping workbenches (e.g. intEHRgrator#373):
 * - Present failing nodes → exact `sourceLine`, `sourceColumn`, `jsonPointer`
 *   (and `targetPath` in FLAT/STRUCTURED).
 * - Missing required attributes/nodes → nearest existing container location
 *   (`sourceIsAncestor: true`), `targetPath`, and a concise `expectedExample`
 *   snippet in the target format showing approximately what is expected and
 *   where it belongs.
 */

import * as openehr_am from "../am/openehr_am.ts";
import { nodeIdsMatch } from "../generation/id_to_at_code.ts";
import {
  buildJsonSourceIndex,
  escapeJsonPointerSegment,
  type JsonSourceIndex,
  type JsonSourceLocation,
  lookupJsonSourceLocation,
  rmPathToJsonPointer,
} from "../serialization/common/json_source_index.ts";
import { getFieldMap, resolveDvType } from "../serialization/simplified/dv_field_maps.ts";
import {
  acceptedFlatRoots,
  aqlPathSegments,
  flatRootId,
} from "../serialization/simplified/normalize.ts";
import type {
  WebTemplate,
  WebTemplateNode,
} from "../serialization/simplified/types.ts";

export type ValidationSourceFormat =
  | "canonical-json"
  | "flat-json"
  | "structured-json";

export interface SourceEnrichableMessage {
  path: string;
  archetypePath?: string;
  message: string;
  severity: "error" | "warning" | "info";
  constraintType?: string;
  constraintNodeId?: string;
  jsonPointer?: string;
  sourceLine?: number;
  sourceColumn?: number;
  sourceIsAncestor?: boolean;
  targetPath?: string;
  expectedExample?: string;
}

export interface ValidationSourceEnrichmentOptions {
  /** Original JSON text (Canonical, FLAT, or STRUCTURED). */
  jsonSource?: string;
  /** Override format detection; auto-detected from `jsonSource` when omitted. */
  sourceFormat?: ValidationSourceFormat;
  /** Web Template for RM ↔ FLAT / STRUCTURED path mapping and examples. */
  webTemplate?: WebTemplate;
  /** Operational template / archetype for canonical missing-content examples. */
  template?: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE;
  /** Deserialized RM instance (enables exact array/occurrence resolution). */
  rmInstance?: unknown;
  /** Attach `expectedExample` snippets for missing-content errors (default `true`). */
  includeMissingHints?: boolean;
}

/** Detect whether a JSON document is canonical RM JSON, FLAT JSON, or STRUCTURED JSON. */
export function detectJsonSourceFormat(
  jsonSource: string,
): ValidationSourceFormat {
  try {
    const parsed = JSON.parse(jsonSource) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return "canonical-json";
    }
    const rec = parsed as Record<string, unknown>;
    if ("_type" in rec || "archetype_node_id" in rec) {
      return "canonical-json";
    }
    const keys = Object.keys(rec);
    if (keys.some((k) => k.startsWith("ctx/") || k.includes("/"))) {
      return "flat-json";
    }
    const nonCtx = keys.filter((k) => k !== "ctx");
    if (
      nonCtx.length === 1 &&
      rec[nonCtx[0]] != null &&
      typeof rec[nonCtx[0]] === "object"
    ) {
      return "structured-json";
    }
  } catch {
    // Fall back to canonical-json when text is malformed
  }
  return "canonical-json";
}

interface RmStep {
  attr: string;
  index?: number;
  nodePredicate?: string;
}

interface WalkedRmNode {
  attr: string;
  nodeId?: string;
  nameValue?: string;
  occurrence: number;
  rmType?: string;
  value: unknown;
}

interface RmWalkResult {
  canonicalPointerSegments: string[];
  aqlSteps: WalkedRmNode[];
  /** Remaining attribute names after the last LOCATABLE / ELEMENT (e.g. ["value", "units"]). */
  leafAttrTrail: string[];
  /** True when the full RM path existed on `rmInstance`. */
  resolvedCompletely: boolean;
  /** The last RM object reached before resolution stopped. */
  lastObject?: Record<string, unknown>;
  /** First attribute name that was missing on `rmInstance`, if any. */
  missingAttribute?: string;
}

function parseRmPath(rmPath: string): RmStep[] {
  const trimmed = rmPath.replace(/^\/+|\/+$/g, "");
  if (!trimmed) return [];
  const steps: RmStep[] = [];
  for (const raw of trimmed.split("/")) {
    if (!raw) continue;
    const m = /^([^[]+)(?:\[([^\]]+)\])?$/.exec(raw);
    if (!m) {
      steps.push({ attr: raw });
      continue;
    }
    const attr = m[1];
    const bracket = m[2];
    if (bracket === undefined) {
      steps.push({ attr });
    } else if (/^\d+$/.test(bracket)) {
      steps.push({ attr, index: parseInt(bracket, 10) });
    } else {
      steps.push({ attr, nodePredicate: bracket });
    }
  }
  return steps;
}

function readProp(obj: unknown, key: string): unknown {
  if (obj == null || typeof obj !== "object") return undefined;
  const rec = obj as Record<string, unknown>;
  if (key in rec) return rec[key];
  let proto = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    const desc = Object.getOwnPropertyDescriptor(proto, key);
    if (desc?.get) {
      try {
        return desc.get.call(obj);
      } catch {
        return undefined;
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return undefined;
}

function readStringProp(obj: unknown, key: string): string | undefined {
  const v = readProp(obj, key);
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && "value" in (v as Record<string, unknown>)) {
    const inner = (v as Record<string, unknown>).value;
    return inner != null ? String(inner) : undefined;
  }
  return String(v);
}

function readRmType(obj: unknown): string | undefined {
  if (obj == null || typeof obj !== "object") return undefined;
  const rec = obj as Record<string, unknown>;
  if (typeof rec._type === "string" && rec._type) return rec._type;
  const ctor = (obj as { constructor?: { name?: string } }).constructor?.name;
  if (ctor && ctor !== "Object" && ctor !== "Array") return ctor;
  return undefined;
}

function walkRmPath(rmInstance: unknown, rmPath: string): RmWalkResult {
  const steps = parseRmPath(rmPath);
  const canonicalPointerSegments: string[] = [];
  const aqlSteps: WalkedRmNode[] = [];
  const leafAttrTrail: string[] = [];

  let current: unknown = rmInstance;
  let lastObject = current && typeof current === "object" && !Array.isArray(current)
    ? current as Record<string, unknown>
    : undefined;
  let inLeafValue = false;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (current == null || typeof current !== "object") {
      return {
        canonicalPointerSegments,
        aqlSteps,
        leafAttrTrail: [...leafAttrTrail, ...steps.slice(i).map((s) => s.attr)],
        resolvedCompletely: false,
        lastObject,
        missingAttribute: step.attr,
      };
    }

    const propVal = readProp(current, step.attr);
    canonicalPointerSegments.push(escapeJsonPointerSegment(step.attr));

    if (propVal === undefined || propVal === null) {
      if (inLeafValue || step.attr === "value" || step.attr === "null_flavour") {
        leafAttrTrail.push(...steps.slice(i).map((s) => s.attr));
      } else {
        aqlSteps.push({ attr: step.attr, occurrence: 0, value: undefined });
      }
      return {
        canonicalPointerSegments,
        aqlSteps,
        leafAttrTrail,
        resolvedCompletely: false,
        lastObject,
        missingAttribute: step.attr,
      };
    }

    let next: unknown = propVal;
    let occurrence = 0;

    if (Array.isArray(propVal)) {
      let idx = step.index;
      if (idx === undefined && step.nodePredicate) {
        idx = propVal.findIndex((item) =>
          nodeIdsMatch(readStringProp(item, "archetype_node_id"), step.nodePredicate!)
        );
      }
      if (idx === undefined || idx < 0 || idx >= propVal.length) {
        return {
          canonicalPointerSegments,
          aqlSteps,
          leafAttrTrail,
          resolvedCompletely: false,
          lastObject,
          missingAttribute: step.attr,
        };
      }
      canonicalPointerSegments.push(String(idx));
      next = propVal[idx];

      const nodeId = readStringProp(next, "archetype_node_id");
      const nameValue = readStringProp(readProp(next, "name"), "value");
      if (nodeId) {
        let count = 0;
        for (let j = 0; j < idx; j++) {
          const sib = propVal[j];
          const sibId = readStringProp(sib, "archetype_node_id");
          const sibName = readStringProp(readProp(sib, "name"), "value");
          if (nodeIdsMatch(sibId, nodeId) && (!nameValue || !sibName || sibName === nameValue)) {
            count++;
          }
        }
        occurrence = count;
      } else {
        occurrence = idx;
      }
    }

    const nextRmType = readRmType(next);
    const nodeId = readStringProp(next, "archetype_node_id");
    const nameValue = readStringProp(readProp(next, "name"), "value");

    if (inLeafValue) {
      leafAttrTrail.push(step.attr);
    } else if (
      step.attr === "value" &&
      lastObject &&
      readRmType(lastObject) === "ELEMENT"
    ) {
      inLeafValue = true;
      leafAttrTrail.push(step.attr);
    } else if (step.attr === "null_flavour") {
      inLeafValue = true;
      leafAttrTrail.push(step.attr);
    } else {
      aqlSteps.push({
        attr: step.attr,
        nodeId,
        nameValue,
        occurrence,
        rmType: nextRmType,
        value: next,
      });
    }

    current = next;
    if (next && typeof next === "object" && !Array.isArray(next)) {
      lastObject = next as Record<string, unknown>;
    }
  }

  return {
    canonicalPointerSegments,
    aqlSteps,
    leafAttrTrail,
    resolvedCompletely: true,
    lastObject,
  };
}

interface IndexedWtEntry {
  node: WebTemplateNode;
  chain: WebTemplateNode[];
  aqlSegs: ReturnType<typeof aqlPathSegments>;
  normalizedAql: string;
}

function normalizeAqlForMatch(aqlPath: string): string {
  return aqlPath
    .trim()
    .replace(/^\[[^\]]+\]/, "")
    .replace(/\s+and\s+name\/value\s*=\s*'[^']*'/gi, "")
    .replace(/\s+and\s+name\/value\s*=\s*"[^"]*"/gi, "")
    .replace(/,'[^']*'/g, "")
    .replace(/,"[^"]*"/g, "");
}

function indexWebTemplateEntries(webTemplate: WebTemplate): IndexedWtEntry[] {
  const entries: IndexedWtEntry[] = [];
  const walk = (node: WebTemplateNode, chain: WebTemplateNode[]) => {
    const nextChain = [...chain, node];
    const aql = node.aqlPath?.trim() ?? "";
    if (aql && aql !== "/") {
      entries.push({
        node,
        chain: nextChain,
        aqlSegs: aqlPathSegments(aql),
        normalizedAql: normalizeAqlForMatch(aql),
      });
    }
    for (const child of node.children ?? []) {
      walk(child, nextChain);
    }
  };
  for (const child of webTemplate.tree.children ?? []) {
    walk(child, []);
  }
  return entries;
}

function aqlStepMatchesWtSeg(
  rmStep: WalkedRmNode,
  wtSeg: { attr: string; nodeId?: string; nameValue?: string },
): boolean {
  if (rmStep.attr !== wtSeg.attr) return false;
  if (wtSeg.nodeId && rmStep.nodeId && !nodeIdsMatch(rmStep.nodeId, wtSeg.nodeId)) {
    return false;
  }
  if (wtSeg.nameValue && rmStep.nameValue && wtSeg.nameValue !== rmStep.nameValue) {
    return false;
  }
  return true;
}

function matchWtEntryForWalk(
  entries: IndexedWtEntry[],
  aqlSteps: WalkedRmNode[],
  constraintNodeId?: string,
): { entry?: IndexedWtEntry; occurrences: number[]; isMissingChild?: boolean } {
  if (!aqlSteps.length && !constraintNodeId) return { occurrences: [] };

  // 1. Exact AQL length match on walked steps
  let bestExact: IndexedWtEntry | undefined;
  let bestExactScore = -1;
  for (const entry of entries) {
    if (entry.aqlSegs.length !== aqlSteps.length) continue;
    let ok = true;
    let score = 0;
    for (let i = 0; i < aqlSteps.length; i++) {
      if (!aqlStepMatchesWtSeg(aqlSteps[i], entry.aqlSegs[i])) {
        ok = false;
        break;
      }
      if (entry.aqlSegs[i].nameValue && aqlSteps[i].nameValue === entry.aqlSegs[i].nameValue) {
        score += 2;
      }
      if (entry.aqlSegs[i].nodeId && aqlSteps[i].nodeId) {
        score += 1;
      }
    }
    if (ok && score > bestExactScore) {
      bestExact = entry;
      bestExactScore = score;
    }
  }

  // When a missing-child constraintNodeId is present (e.g. missing ELEMENT[at0004]
  // inside items), prefer the child entry whose last segment matches constraintNodeId.
  if (constraintNodeId) {
    for (const entry of entries) {
      if (entry.aqlSegs.length !== aqlSteps.length + 1) continue;
      let prefixOk = true;
      for (let i = 0; i < aqlSteps.length; i++) {
        if (!aqlStepMatchesWtSeg(aqlSteps[i], entry.aqlSegs[i])) {
          prefixOk = false;
          break;
        }
      }
      if (!prefixOk) continue;
      const lastSeg = entry.aqlSegs[entry.aqlSegs.length - 1];
      if (
        (lastSeg.nodeId && nodeIdsMatch(lastSeg.nodeId, constraintNodeId)) ||
        (entry.node.nodeId && nodeIdsMatch(entry.node.nodeId, constraintNodeId))
      ) {
        return {
          entry,
          occurrences: computeChainOccurrences(entry.chain, aqlSteps),
          isMissingChild: true,
        };
      }
    }
    // Also check when the missing step's attribute was already appended as the
    // final unresolved step in aqlSteps (e.g. `/content[0]/.../items` + nodeId `at0004`).
    if (aqlSteps.length > 0 && aqlSteps[aqlSteps.length - 1].value === undefined) {
      const parentSteps = aqlSteps.slice(0, -1);
      const missingAttr = aqlSteps[aqlSteps.length - 1].attr;
      for (const entry of entries) {
        if (entry.aqlSegs.length !== parentSteps.length + 1) continue;
        let prefixOk = true;
        for (let i = 0; i < parentSteps.length; i++) {
          if (!aqlStepMatchesWtSeg(parentSteps[i], entry.aqlSegs[i])) {
            prefixOk = false;
            break;
          }
        }
        if (!prefixOk) continue;
        const lastSeg = entry.aqlSegs[entry.aqlSegs.length - 1];
        if (
          lastSeg.attr === missingAttr &&
          ((lastSeg.nodeId && nodeIdsMatch(lastSeg.nodeId, constraintNodeId)) ||
            (entry.node.nodeId && nodeIdsMatch(entry.node.nodeId, constraintNodeId)))
        ) {
          return {
            entry,
            occurrences: computeChainOccurrences(entry.chain, parentSteps),
            isMissingChild: true,
          };
        }
      }
    }
  }

  if (bestExact) {
    return {
      entry: bestExact,
      occurrences: computeChainOccurrences(bestExact.chain, aqlSteps),
    };
  }

  // 2. Longest prefix match (e.g. missing attribute inside a WT node, or
  //    collapsed RM structure node whose parent IS a WT node)
  let bestPrefix: IndexedWtEntry | undefined;
  let bestLen = 0;
  for (const entry of entries) {
    const segLen = entry.aqlSegs.length;
    if (segLen > aqlSteps.length || segLen <= bestLen) continue;
    let ok = true;
    for (let i = 0; i < segLen; i++) {
      if (!aqlStepMatchesWtSeg(aqlSteps[i], entry.aqlSegs[i])) {
        ok = false;
        break;
      }
    }
    if (ok) {
      bestPrefix = entry;
      bestLen = segLen;
    }
  }
  if (bestPrefix) {
    return {
      entry: bestPrefix,
      occurrences: computeChainOccurrences(bestPrefix.chain, aqlSteps),
    };
  }

  return { occurrences: [] };
}

function computeChainOccurrences(
  chain: WebTemplateNode[],
  aqlSteps: WalkedRmNode[],
): number[] {
  return chain.map((wtNode) => {
    const len = aqlPathSegments(wtNode.aqlPath ?? "").length;
    if (len > 0 && len <= aqlSteps.length) {
      return aqlSteps[len - 1].occurrence;
    }
    return 0;
  });
}

/** Map a trailing RM attribute trail under ELEMENT.value to a FLAT pipe suffix. */
function leafTrailToFlatSuffix(
  trail: string[],
  rmType?: string,
): string | undefined {
  const attrs = trail[0] === "value" ? trail.slice(1) : trail;
  if (!attrs.length) return undefined;
  const joined = attrs.join("/");
  if (joined === "units") return "unit";
  if (joined === "magnitude") return "magnitude";
  if (joined === "precision") return "precision";
  if (joined === "magnitude_status") return "magnitude_status";
  if (joined === "defining_code/code_string" || joined === "defining_code" || joined === "code_string") {
    return "code";
  }
  if (
    joined === "defining_code/terminology_id/value" ||
    joined === "defining_code/terminology_id" ||
    joined === "terminology_id"
  ) {
    return "terminology";
  }
  if (joined === "value") {
    // Check if |value is a real suffix (e.g. DV_CODED_TEXT) vs bare key (DV_TEXT)
    if (rmType) {
      const fm = getFieldMap(resolveDvType(rmType));
      if (fm?.fields.some((f) => f.suffix === "value")) return "value";
    }
    return "";
  }
  if (joined === "numerator") return "numerator";
  if (joined === "denominator") return "denominator";
  if (joined === "type") return "type";
  if (joined === "symbol/defining_code/code_string" || joined === "symbol") return "code";
  if (joined === "symbol/value") return "value";
  if (joined === "id") return "id";
  if (joined === "issuer") return "issuer";
  if (joined === "assigner") return "assigner";
  return attrs[attrs.length - 1];
}

interface ParsedFlatKey {
  rawKey: string;
  root: string;
  segments: Array<{ id: string; occ: number }>;
  suffix: string;
  location: JsonSourceLocation;
}

function parseFlatSourceKeys(
  jsonSource: string,
  index: JsonSourceIndex,
): ParsedFlatKey[] {
  const out: ParsedFlatKey[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonSource);
  } catch {
    return out;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return out;
  for (const key of Object.keys(parsed as Record<string, unknown>)) {
    const pointer = `/${escapeJsonPointerSegment(key)}`;
    const loc = index.get(pointer);
    if (!loc) continue;
    const pipeIdx = key.indexOf("|");
    const base = pipeIdx === -1 ? key : key.slice(0, pipeIdx);
    const suffix = pipeIdx === -1 ? "" : key.slice(pipeIdx + 1);
    const rawSegs = base.split("/");
    const root = rawSegs[0] ?? "";
    const segments = rawSegs.slice(1).map((s) => {
      const m = /^(.*?)(?::(\d+))?$/.exec(s)!;
      return { id: m[1], occ: m[2] ? parseInt(m[2], 10) : 0 };
    });
    out.push({ rawKey: key, root, segments, suffix, location: loc });
  }
  return out;
}

function formatFlatChainPath(
  rootId: string,
  chain: WebTemplateNode[],
  occurrences: number[],
  suffix?: string,
): string {
  const segs = chain.map((node, i) => {
    const occ = occurrences[i] ?? 0;
    return occ > 0 ? `${node.id}:${occ}` : node.id;
  });
  const base = segs.length ? `${rootId}/${segs.join("/")}` : rootId;
  return suffix ? `${base}|${suffix}` : base;
}

const CONTEXT_RM_TO_FLAT_KEYS: Readonly<Record<string, string[]>> = {
  language: ["ctx/language", "language|code", "language"],
  territory: ["ctx/territory", "territory|code", "territory"],
  category: ["ctx/category", "category|code", "category|value", "category"],
  composer: ["ctx/composer_name", "ctx/composer_id", "ctx/composer_self", "composer|name", "composer|id"],
  "context/start_time": ["ctx/time", "context/start_time"],
  "context/end_time": ["ctx/end_time", "context/end_time"],
  "context/setting": ["ctx/setting", "context/setting|code", "context/setting|value"],
  "context/location": ["ctx/location", "context/location"],
  "context/health_care_facility": [
    "ctx/health_care_facility|name",
    "ctx/health_care_facility|id",
    "context/health_care_facility|name",
  ],
};

function contextFlatCandidates(
  rmPath: string,
  rootId: string,
): { candidates: string[]; primary: string } | undefined {
  const norm = rmPath.replace(/^\/+|\/+$/g, "").replace(/\[\d+\]/g, "");
  for (const [prefix, flatKeys] of Object.entries(CONTEXT_RM_TO_FLAT_KEYS)) {
    if (norm === prefix || norm.startsWith(`${prefix}/`)) {
      const expanded = flatKeys.map((k) =>
        k.startsWith("ctx/") ? k : `${rootId}/${k}`
      );
      return { candidates: expanded, primary: expanded[0] };
    }
  }
  return undefined;
}

function lookupFlatKeyForChain(
  parsedKeys: ParsedFlatKey[],
  roots: Set<string>,
  chain: WebTemplateNode[],
  occurrences: number[],
  suffix: string | undefined,
): { key: ParsedFlatKey; exact: boolean } | undefined {
  const matchingChain = parsedKeys.filter((k) => {
    if (!roots.has(k.root)) return false;
    if (k.segments.length !== chain.length) return false;
    for (let i = 0; i < chain.length; i++) {
      if (k.segments[i].id !== chain[i].id) return false;
      if (k.segments[i].occ !== (occurrences[i] ?? 0)) return false;
    }
    return true;
  });

  if (matchingChain.length) {
    if (suffix !== undefined) {
      const exactSuffix = matchingChain.find((k) => k.suffix === suffix) ??
        (suffix === "value"
          ? matchingChain.find((k) => k.suffix === "")
          : suffix === ""
          ? matchingChain.find((k) => k.suffix === "value")
          : undefined);
      if (exactSuffix) return { key: exactSuffix, exact: true };
      return { key: matchingChain[0], exact: false };
    }
    return { key: matchingChain[0], exact: true };
  }

  // Ancestor prefix fallback: find longest matching prefix among existing keys
  for (let prefixLen = chain.length; prefixLen >= 1; prefixLen--) {
    const ancestorKey = parsedKeys.find((k) => {
      if (!roots.has(k.root)) return false;
      if (k.segments.length < prefixLen) return false;
      for (let i = 0; i < prefixLen; i++) {
        if (k.segments[i].id !== chain[i].id) return false;
        if (k.segments[i].occ !== (occurrences[i] ?? 0)) return false;
      }
      return true;
    });
    if (ancestorKey) return { key: ancestorKey, exact: false };
  }

  return undefined;
}

function lookupStructuredPointerForChain(
  index: JsonSourceIndex,
  roots: string[],
  chain: WebTemplateNode[],
  occurrences: number[],
  suffix: string | undefined,
): { location: JsonSourceLocation; exact: boolean; targetPath: string } | undefined {
  for (const root of roots) {
    const rootPtr = `/${escapeJsonPointerSegment(root)}`;
    if (!index.has(rootPtr)) continue;

    let cur = rootPtr;
    let matchedDepth = 0;
    for (let i = 0; i < chain.length; i++) {
      const seg = escapeJsonPointerSegment(chain[i].id);
      const occ = occurrences[i] ?? 0;
      const arrPtr = `${cur}/${seg}/${occ}`;
      const objPtr = `${cur}/${seg}`;
      if (index.has(arrPtr)) {
        cur = arrPtr;
        matchedDepth = i + 1;
      } else if (occ === 0 && index.has(objPtr)) {
        cur = objPtr;
        matchedDepth = i + 1;
      } else {
        break;
      }
    }

    const fullTarget = formatFlatChainPath(root, chain, occurrences, suffix);
    if (matchedDepth === chain.length) {
      if (suffix) {
        const leafPtr = `${cur}/${escapeJsonPointerSegment(`|${suffix}`)}`;
        const leafLoc = index.get(leafPtr);
        if (leafLoc) {
          return { location: leafLoc, exact: true, targetPath: fullTarget };
        }
        const curLoc = index.get(cur);
        if (curLoc) {
          return { location: curLoc, exact: false, targetPath: fullTarget };
        }
      }
      const curLoc = index.get(cur);
      if (curLoc) {
        return { location: curLoc, exact: true, targetPath: fullTarget };
      }
    }

    const ancLoc = index.get(cur);
    if (ancLoc) {
      return { location: ancLoc, exact: false, targetPath: fullTarget };
    }
  }
  return undefined;
}

function lookupCanonicalWithAncestor(
  index: JsonSourceIndex,
  segments: string[],
): { location: JsonSourceLocation; isAncestor: boolean } | undefined {
  for (let len = segments.length; len >= 0; len--) {
    const ptr = len === 0 ? "" : `/${segments.slice(0, len).join("/")}`;
    const loc = lookupJsonSourceLocation(index, ptr);
    if (loc) {
      return { location: loc, isAncestor: len < segments.length };
    }
  }
  return undefined;
}

function isMissingContentMessage(msg: SourceEnrichableMessage): boolean {
  const ct = (msg.constraintType ?? "").toLowerCase();
  const text = msg.message.toLowerCase();
  if (ct === "existence") return true;
  if (ct === "occurrences" && (text.includes("below minimum") || text.includes("missing") || text.includes("required"))) {
    return true;
  }
  if (ct === "cardinality" && (text.includes("below minimum") || text.includes("minimum") || text.includes("has 0"))) {
    return true;
  }
  if (ct === "rm_specification" && (text.includes("missing") || text.includes("mandatory") || text.includes("required"))) {
    return true;
  }
  if (text.includes("mandatory") && text.includes("missing")) return true;
  if (text.includes("required attribute missing")) return true;
  return false;
}

function sampleLeafFieldsForWtNode(
  node: WebTemplateNode,
): Array<{ suffix: string; value: string | number | boolean }> {
  const rmType = resolveDvType(node.rmType);
  const inputs = node.inputs ?? [];

  if (rmType === "DV_QUANTITY") {
    const unitInput = inputs.find((i) => i.suffix === "unit");
    const firstUnit = unitInput?.list?.[0]?.value ?? "1";
    const magInput = inputs.find((i) => i.suffix === "magnitude");
    const minVal = (magInput?.validation as { range?: { min?: number } } | undefined)?.range?.min;
    return [
      { suffix: "magnitude", value: typeof minVal === "number" ? minVal : 0 },
      { suffix: "unit", value: firstUnit },
    ];
  }
  if (rmType === "DV_CODED_TEXT") {
    const codeInput = inputs.find((i) => i.suffix === "code");
    const first = codeInput?.list?.[0];
    const terminology = codeInput?.terminology ?? "local";
    return [
      { suffix: "code", value: first?.value ?? "at0001" },
      { suffix: "value", value: first?.label ?? node.name ?? "Example" },
      { suffix: "terminology", value: terminology },
    ];
  }
  if (rmType === "DV_ORDINAL") {
    const codeInput = inputs.find((i) => i.suffix === "code");
    const first = codeInput?.list?.[0];
    return [
      { suffix: "code", value: first?.value ?? "at0001" },
      { suffix: "ordinal", value: 0 },
      { suffix: "value", value: first?.label ?? "Example" },
    ];
  }
  if (rmType === "DV_DATE_TIME") {
    return [{ suffix: "", value: "2024-01-01T12:00:00Z" }];
  }
  if (rmType === "DV_DATE") {
    return [{ suffix: "", value: "2024-01-01" }];
  }
  if (rmType === "DV_TIME") {
    return [{ suffix: "", value: "12:00:00" }];
  }
  if (rmType === "DV_DURATION") {
    return [{ suffix: "", value: "PT1H" }];
  }
  if (rmType === "DV_COUNT") {
    return [{ suffix: "", value: 0 }];
  }
  if (rmType === "DV_BOOLEAN") {
    return [{ suffix: "", value: true }];
  }
  if (rmType === "DV_PROPORTION") {
    return [
      { suffix: "numerator", value: 1 },
      { suffix: "denominator", value: 100 },
      { suffix: "type", value: 2 },
    ];
  }
  if (rmType === "DV_URI" || rmType === "DV_EHR_URI") {
    return [{ suffix: "", value: "https://example.org" }];
  }
  if (rmType === "DV_IDENTIFIER") {
    return [
      { suffix: "id", value: "id-1" },
      { suffix: "issuer", value: "issuer" },
    ];
  }
  return [{ suffix: "", value: node.name ?? "Example text" }];
}

function findFirstLeafChild(
  node: WebTemplateNode,
  prefix: WebTemplateNode[],
): { leaf: WebTemplateNode; chain: WebTemplateNode[] } | undefined {
  if ((node.inputs?.length ?? 0) > 0 && !(node.children?.length)) {
    return { leaf: node, chain: [...prefix, node] };
  }
  const children = node.children ?? [];
  const requiredChild = children.find((c) => c.min > 0 && !c.inContext) ??
    children.find((c) => !c.inContext) ??
    children[0];
  if (!requiredChild) return undefined;
  return findFirstLeafChild(requiredChild, [...prefix, node]);
}

function buildCanonicalDvObject(node: WebTemplateNode): Record<string, unknown> {
  const rmType = resolveDvType(node.rmType);
  const fields = sampleLeafFieldsForWtNode(node);
  const bySuffix = Object.fromEntries(fields.map((f) => [f.suffix, f.value]));

  if (rmType === "DV_QUANTITY") {
    return {
      _type: "DV_QUANTITY",
      magnitude: bySuffix.magnitude ?? 0,
      units: bySuffix.unit ?? "1",
    };
  }
  if (rmType === "DV_CODED_TEXT") {
    return {
      _type: "DV_CODED_TEXT",
      value: bySuffix.value ?? "Example",
      defining_code: {
        _type: "CODE_PHRASE",
        terminology_id: {
          _type: "TERMINOLOGY_ID",
          value: bySuffix.terminology ?? "local",
        },
        code_string: bySuffix.code ?? "at0001",
      },
    };
  }
  if (rmType === "DV_COUNT") {
    return { _type: "DV_COUNT", magnitude: bySuffix[""] ?? 0 };
  }
  if (rmType === "DV_BOOLEAN") {
    return { _type: "DV_BOOLEAN", value: bySuffix[""] ?? true };
  }
  if (rmType === "DV_PROPORTION") {
    return {
      _type: "DV_PROPORTION",
      numerator: bySuffix.numerator ?? 1,
      denominator: bySuffix.denominator ?? 100,
      type: bySuffix.type ?? 2,
    };
  }
  return { _type: rmType, value: bySuffix[""] ?? "Example" };
}

function contextMissingExample(
  rmPath: string,
  format: ValidationSourceFormat,
): string | undefined {
  const norm = rmPath.replace(/^\/+|\/+$/g, "").replace(/\[\d+\]/g, "");
  const map: Record<
    string,
    { flat: string; structured: string; canonical: string }
  > = {
    language: {
      flat: '"ctx/language": "en"',
      structured: '"ctx": { "language": "en" }',
      canonical:
        '"language": { "_type": "CODE_PHRASE", "terminology_id": { "_type": "TERMINOLOGY_ID", "value": "ISO_639-1" }, "code_string": "en" }',
    },
    territory: {
      flat: '"ctx/territory": "SE"',
      structured: '"ctx": { "territory": "SE" }',
      canonical:
        '"territory": { "_type": "CODE_PHRASE", "terminology_id": { "_type": "TERMINOLOGY_ID", "value": "ISO_3166-1" }, "code_string": "SE" }',
    },
    category: {
      flat: '"ctx/category": "433"',
      structured: '"ctx": { "category": "433" }',
      canonical:
        '"category": { "_type": "DV_CODED_TEXT", "value": "event", "defining_code": { "_type": "CODE_PHRASE", "terminology_id": { "_type": "TERMINOLOGY_ID", "value": "openehr" }, "code_string": "433" } }',
    },
    composer: {
      flat: '"ctx/composer_name": "Dr Name"',
      structured: '"ctx": { "composer_name": "Dr Name" }',
      canonical: '"composer": { "_type": "PARTY_IDENTIFIED", "name": "Dr Name" }',
    },
    "context/start_time": {
      flat: '"ctx/time": "2024-01-01T12:00:00Z"',
      structured: '"ctx": { "time": "2024-01-01T12:00:00Z" }',
      canonical: '"start_time": { "_type": "DV_DATE_TIME", "value": "2024-01-01T12:00:00Z" }',
    },
    "context/setting": {
      flat: '"ctx/setting": "228"',
      structured: '"ctx": { "setting": "228" }',
      canonical:
        '"setting": { "_type": "DV_CODED_TEXT", "value": "primary medical care", "defining_code": { "_type": "CODE_PHRASE", "terminology_id": { "_type": "TERMINOLOGY_ID", "value": "openehr" }, "code_string": "228" } }',
    },
    "context": {
      flat: '"ctx/time": "2024-01-01T12:00:00Z",\n"ctx/setting": "228"',
      structured: '"ctx": { "time": "2024-01-01T12:00:00Z", "setting": "228" }',
      canonical:
        '"context": { "_type": "EVENT_CONTEXT", "start_time": { "_type": "DV_DATE_TIME", "value": "2024-01-01T12:00:00Z" }, "setting": { "_type": "DV_CODED_TEXT", "value": "primary medical care", "defining_code": { "_type": "CODE_PHRASE", "terminology_id": { "_type": "TERMINOLOGY_ID", "value": "openehr" }, "code_string": "228" } } }',
    },
  };
  for (const [key, snippets] of Object.entries(map)) {
    if (norm === key || norm.startsWith(`${key}/`)) {
      if (format === "flat-json") return snippets.flat;
      if (format === "structured-json") return snippets.structured;
      return snippets.canonical;
    }
  }
  return undefined;
}

function findConstraintInTemplate(
  template: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE | undefined,
  constraintNodeId: string | undefined,
): openehr_am.C_OBJECT | undefined {
  if (!template?.definition || !constraintNodeId) return undefined;
  let found: openehr_am.C_OBJECT | undefined;
  const walk = (node: openehr_am.C_OBJECT) => {
    if (found) return;
    if (node.node_id && nodeIdsMatch(node.node_id, constraintNodeId)) {
      found = node;
      return;
    }
    if (
      node instanceof openehr_am.C_ARCHETYPE_ROOT &&
      node.archetype_ref === constraintNodeId
    ) {
      found = node;
      return;
    }
    const attrs = (node as { attributes?: openehr_am.C_ATTRIBUTE[] }).attributes ?? [];
    for (const attr of attrs) {
      const children = (attr as { children?: openehr_am.C_OBJECT[] }).children ?? [];
      for (const child of children) walk(child);
    }
  };
  walk(template.definition);
  return found;
}

/** Build a concise expected-content snippet in the target format for a missing node/attribute. */
export function formatExpectedExampleForMissingNode(params: {
  format: ValidationSourceFormat;
  rmPath: string;
  webTemplateNode?: WebTemplateNode;
  flatBasePath?: string;
  constraintNodeId?: string;
  missingAttribute?: string;
  template?: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE;
}): string | undefined {
  const ctxExample = contextMissingExample(params.rmPath, params.format);
  if (ctxExample) return ctxExample;

  const { format, webTemplateNode } = params;
  if (webTemplateNode) {
    const isLeaf = (webTemplateNode.inputs?.length ?? 0) > 0 &&
      !(webTemplateNode.children?.length);
    const targetLeafInfo = isLeaf
      ? { leaf: webTemplateNode, chain: [] as WebTemplateNode[] }
      : findFirstLeafChild(webTemplateNode, []);

    if (format === "flat-json") {
      const base = params.flatBasePath ?? webTemplateNode.id;
      const leaf = targetLeafInfo?.leaf ?? webTemplateNode;
      const subPath = targetLeafInfo && targetLeafInfo.chain.length > 1
        ? `${base}/${targetLeafInfo.chain.slice(1).map((n) => n.id).join("/")}`
        : base;
      const fields = sampleLeafFieldsForWtNode(leaf);
      return fields
        .map((f) => {
          const key = f.suffix ? `${subPath}|${f.suffix}` : subPath;
          return `${JSON.stringify(key)}: ${JSON.stringify(f.value)}`;
        })
        .join(",\n");
    }

    if (format === "structured-json") {
      const leaf = targetLeafInfo?.leaf ?? webTemplateNode;
      const fields = sampleLeafFieldsForWtNode(leaf);
      if (fields.length === 1 && fields[0].suffix === "") {
        return `${JSON.stringify(leaf.id)}: [${JSON.stringify(fields[0].value)}]`;
      }
      const obj = Object.fromEntries(
        fields.map((f) => [`|${f.suffix || "value"}`, f.value]),
      );
      return `${JSON.stringify(leaf.id)}: [${JSON.stringify(obj)}]`;
    }

    // Canonical JSON
    if (isLeaf) {
      const elem: Record<string, unknown> = {
        _type: "ELEMENT",
        name: { _type: "DV_TEXT", value: webTemplateNode.name ?? webTemplateNode.id },
        ...(webTemplateNode.nodeId ? { archetype_node_id: webTemplateNode.nodeId } : {}),
        value: buildCanonicalDvObject(webTemplateNode),
      };
      return JSON.stringify(elem, null, 2);
    }
    const stub: Record<string, unknown> = {
      _type: webTemplateNode.rmType,
      name: { _type: "DV_TEXT", value: webTemplateNode.name ?? webTemplateNode.id },
      ...(webTemplateNode.nodeId ? { archetype_node_id: webTemplateNode.nodeId } : {}),
    };
    return JSON.stringify(stub, null, 2);
  }

  // Fallback using OPT C_OBJECT when no WebTemplate is available
  const cObj = findConstraintInTemplate(params.template, params.constraintNodeId);
  if (cObj && format === "canonical-json") {
    const stub: Record<string, unknown> = {
      _type: cObj.rm_type_name || "OBJECT",
      ...(cObj.node_id ? { archetype_node_id: cObj.node_id } : {}),
    };
    if (cObj.rm_type_name === "ELEMENT") {
      const valAttr = (cObj as { attributes?: openehr_am.C_ATTRIBUTE[] })
        .attributes?.find((a) => a.rm_attribute_name === "value");
      const valChild = (valAttr as { children?: openehr_am.C_OBJECT[] })
        ?.children?.[0];
      if (valChild) {
        stub.value = { _type: valChild.rm_type_name || "DV_TEXT" };
      }
    }
    return JSON.stringify(stub, null, 2);
  }

  if (params.missingAttribute && format === "canonical-json") {
    return `${JSON.stringify(params.missingAttribute)}: { ... }`;
  }

  return undefined;
}

function inferLeafSuffixFromMessage(
  msg: SourceEnrichableMessage,
): string | undefined {
  const ct = (msg.constraintType ?? "").toLowerCase();
  const text = msg.message.toLowerCase();
  if (ct === "units" || ct === "ucum" || /\bunit[s]?\b/.test(text)) {
    return "unit";
  }
  if (ct === "magnitude" || /\bmagnitude\b/.test(text)) {
    return "magnitude";
  }
  if (ct === "precision" || /\bprecision\b/.test(text)) {
    return "precision";
  }
  if (
    ct === "terminology" ||
    /\bdefining_code\b|\bcode_string\b|\bcode\b|\bterminology\b|\brubric\b/.test(
      text,
    )
  ) {
    return "code";
  }
  return undefined;
}

/**
 * Enrich `TemplateValidator` messages with source line/column/JSON Pointer and
 * missing-content hints across Canonical JSON, FLAT JSON, and STRUCTURED JSON.
 */
export function enrichValidationMessagesWithSource(
  messages: SourceEnrichableMessage[],
  options: ValidationSourceEnrichmentOptions,
): void {
  const { jsonSource, webTemplate, template, rmInstance } = options;
  const includeHints = options.includeMissingHints !== false;

  let sourceIndex: JsonSourceIndex | undefined;
  if (jsonSource) {
    try {
      sourceIndex = buildJsonSourceIndex(jsonSource);
    } catch {
      sourceIndex = undefined;
    }
  }

  const format: ValidationSourceFormat = options.sourceFormat ??
    (jsonSource ? detectJsonSourceFormat(jsonSource) : "canonical-json");

  const wtEntries = webTemplate ? indexWebTemplateEntries(webTemplate) : [];
  const parsedFlatKeys =
    format === "flat-json" && jsonSource && sourceIndex
      ? parseFlatSourceKeys(jsonSource, sourceIndex)
      : [];
  const rootId = webTemplate ? flatRootId(webTemplate) : "";
  const acceptedRoots = webTemplate
    ? acceptedFlatRoots(webTemplate)
    : new Set<string>();
  for (const k of parsedFlatKeys) {
    if (k.root && k.root !== "ctx") acceptedRoots.add(k.root);
  }
  const actualFlatRoot = parsedFlatKeys.find((k) => k.root && k.root !== "ctx")?.root ??
    rootId;
  const structuredRoots = (() => {
    const out: string[] = [];
    if (actualFlatRoot) out.push(actualFlatRoot);
    for (const r of acceptedRoots) {
      if (!out.includes(r)) out.push(r);
    }
    return out;
  })();

  for (const msg of messages) {
    const walk = rmInstance ? walkRmPath(rmInstance, msg.path || "/") : undefined;
    const isMissing = isMissingContentMessage(msg);

    if (format === "canonical-json") {
      if (sourceIndex) {
        const ptrSegs = walk
          ? walk.canonicalPointerSegments
          : rmPathToJsonPointer(msg.path || "/")
            .split("/")
            .filter(Boolean);
        const found = lookupCanonicalWithAncestor(sourceIndex, ptrSegs);
        if (found) {
          msg.jsonPointer = found.location.jsonPointer;
          msg.sourceLine = found.location.sourceLine;
          msg.sourceColumn = found.location.sourceColumn;
          if (found.isAncestor) msg.sourceIsAncestor = true;
        }
      }

      if (includeHints && isMissing) {
        const matched = webTemplate && walk
          ? matchWtEntryForWalk(wtEntries, walk.aqlSteps, msg.constraintNodeId)
          : undefined;
        const example = formatExpectedExampleForMissingNode({
          format: "canonical-json",
          rmPath: msg.path || "/",
          webTemplateNode: matched?.entry?.node,
          constraintNodeId: msg.constraintNodeId,
          missingAttribute: walk?.missingAttribute,
          template,
        });
        if (example) msg.expectedExample = example;
      }
      continue;
    }

    // FLAT JSON or STRUCTURED JSON
    const ctxMatch = contextFlatCandidates(msg.path || "/", actualFlatRoot);
    if (ctxMatch) {
      msg.targetPath = ctxMatch.primary;
      if (sourceIndex) {
        if (format === "flat-json") {
          const hit = ctxMatch.candidates
            .map((c) => parsedFlatKeys.find((k) => k.rawKey === c))
            .find((k) => k !== undefined);
          if (hit) {
            msg.targetPath = hit.rawKey;
            msg.jsonPointer = hit.location.jsonPointer;
            msg.sourceLine = hit.location.sourceLine;
            msg.sourceColumn = hit.location.sourceColumn;
          } else {
            const anyCtx = parsedFlatKeys.find((k) => k.root === "ctx");
            const fallback = anyCtx?.location ?? sourceIndex.get("");
            if (fallback) {
              msg.jsonPointer = fallback.jsonPointer;
              msg.sourceLine = fallback.sourceLine;
              msg.sourceColumn = fallback.sourceColumn;
              msg.sourceIsAncestor = true;
            }
          }
        } else {
          // STRUCTURED JSON context lookup
          const ctxField = ctxMatch.primary.replace(/^ctx\//, "");
          const ctxPtr = `/ctx/${escapeJsonPointerSegment(ctxField)}`;
          const exactLoc = sourceIndex.get(ctxPtr);
          if (exactLoc) {
            msg.jsonPointer = exactLoc.jsonPointer;
            msg.sourceLine = exactLoc.sourceLine;
            msg.sourceColumn = exactLoc.sourceColumn;
          } else {
            const fallback = sourceIndex.get("/ctx") ?? sourceIndex.get("");
            if (fallback) {
              msg.jsonPointer = fallback.jsonPointer;
              msg.sourceLine = fallback.sourceLine;
              msg.sourceColumn = fallback.sourceColumn;
              msg.sourceIsAncestor = true;
            }
          }
        }
      }

      if (includeHints && isMissing) {
        const example = formatExpectedExampleForMissingNode({
          format,
          rmPath: msg.path || "/",
          template,
        });
        if (example) msg.expectedExample = example;
      }
      continue;
    }

    if (webTemplate && walk) {
      const matched = matchWtEntryForWalk(
        wtEntries,
        walk.aqlSteps,
        msg.constraintNodeId,
      );
      if (matched.entry) {
        const leafSuffix = matched.isMissingChild
          ? undefined
          : leafTrailToFlatSuffix(walk.leafAttrTrail, matched.entry.node.rmType) ??
            inferLeafSuffixFromMessage(msg);
        const flatBase = formatFlatChainPath(
          actualFlatRoot,
          matched.entry.chain,
          matched.occurrences,
        );
        msg.targetPath = leafSuffix ? `${flatBase}|${leafSuffix}` : flatBase;

        if (sourceIndex) {
          if (format === "flat-json") {
            const hit = lookupFlatKeyForChain(
              parsedFlatKeys,
              acceptedRoots,
              matched.entry.chain,
              matched.occurrences,
              leafSuffix,
            );
            if (hit) {
              if (hit.exact) msg.targetPath = hit.key.rawKey;
              msg.jsonPointer = hit.key.location.jsonPointer;
              msg.sourceLine = hit.key.location.sourceLine;
              msg.sourceColumn = hit.key.location.sourceColumn;
              if (!hit.exact || matched.isMissingChild) {
                msg.sourceIsAncestor = true;
              }
            } else {
              const rootLoc = sourceIndex.get("");
              if (rootLoc) {
                msg.jsonPointer = rootLoc.jsonPointer;
                msg.sourceLine = rootLoc.sourceLine;
                msg.sourceColumn = rootLoc.sourceColumn;
                msg.sourceIsAncestor = true;
              }
            }
          } else {
            const hit = lookupStructuredPointerForChain(
              sourceIndex,
              structuredRoots,
              matched.entry.chain,
              matched.occurrences,
              leafSuffix,
            );
            if (hit) {
              msg.targetPath = hit.targetPath;
              msg.jsonPointer = hit.location.jsonPointer;
              msg.sourceLine = hit.location.sourceLine;
              msg.sourceColumn = hit.location.sourceColumn;
              if (!hit.exact || matched.isMissingChild) {
                msg.sourceIsAncestor = true;
              }
            } else {
              const rootLoc = sourceIndex.get("");
              if (rootLoc) {
                msg.jsonPointer = rootLoc.jsonPointer;
                msg.sourceLine = rootLoc.sourceLine;
                msg.sourceColumn = rootLoc.sourceColumn;
                msg.sourceIsAncestor = true;
              }
            }
          }
        }

        if (includeHints && isMissing) {
          const example = formatExpectedExampleForMissingNode({
            format,
            rmPath: msg.path || "/",
            webTemplateNode: matched.entry.node,
            flatBasePath: flatBase,
            constraintNodeId: msg.constraintNodeId,
            missingAttribute: walk.missingAttribute,
            template,
          });
          if (example) msg.expectedExample = example;
        }
        continue;
      }
    }

    // Fallback: attach root location when source is available
    if (sourceIndex) {
      const rootLoc = sourceIndex.get("");
      if (rootLoc) {
        msg.jsonPointer = rootLoc.jsonPointer;
        msg.sourceLine = rootLoc.sourceLine;
        msg.sourceColumn = rootLoc.sourceColumn;
        msg.sourceIsAncestor = true;
      }
    }
  }
}

/**
 * Enrich FLAT/STRUCTURED deserializer or validator issues (whose `.path` may be
 * a FLAT key like `my_template/bp/systolic|code`, `ctx/setting`, or an AQL/RM
 * path like `/content[...]/items[at0008]`) with exact `sourceLine`,
 * `sourceColumn`, `jsonPointer`, and missing-content examples.
 */
export function enrichSimplifiedMessagesWithSource(
  messages: SourceEnrichableMessage[],
  jsonSource: string,
  options?: {
    webTemplate?: WebTemplate;
    sourceFormat?: ValidationSourceFormat;
    includeMissingHints?: boolean;
  },
): void {
  let index: JsonSourceIndex;
  try {
    index = buildJsonSourceIndex(jsonSource);
  } catch {
    return;
  }

  const format = options?.sourceFormat ?? detectJsonSourceFormat(jsonSource);
  const includeHints = options?.includeMissingHints !== false;
  const parsedFlatKeys = format === "flat-json"
    ? parseFlatSourceKeys(jsonSource, index)
    : [];
  const wtEntries = options?.webTemplate
    ? indexWebTemplateEntries(options.webTemplate)
    : [];
  const acceptedRoots = options?.webTemplate
    ? acceptedFlatRoots(options.webTemplate)
    : new Set<string>();
  for (const k of parsedFlatKeys) {
    if (k.root && k.root !== "ctx") acceptedRoots.add(k.root);
  }
  const actualFlatRoot = parsedFlatKeys.find((k) => k.root && k.root !== "ctx")?.root ??
    (options?.webTemplate ? flatRootId(options.webTemplate) : "");
  const structuredRoots = (() => {
    const out: string[] = [];
    if (actualFlatRoot) out.push(actualFlatRoot);
    for (const r of acceptedRoots) {
      if (!out.includes(r)) out.push(r);
    }
    return out;
  })();

  const wtByChain = new Map<string, WebTemplateNode>();
  if (options?.webTemplate) {
    const walk = (nodes: WebTemplateNode[], prefix: string) => {
      for (const n of nodes) {
        const chain = prefix ? `${prefix}/${n.id}` : n.id;
        wtByChain.set(chain, n);
        if (n.children?.length) walk(n.children, chain);
      }
    };
    walk(options.webTemplate.tree.children ?? [], "");
  }

  for (const msg of messages) {
    const rawPath = msg.path || "";
    if (!rawPath) continue;

    // AQL / RM path (e.g. `FlatDeserializer` coded-text-mismatch issues)
    if (rawPath.startsWith("/") && wtEntries.length > 0) {
      const normPath = normalizeAqlForMatch(rawPath);
      const entry = wtEntries.find((e) => e.normalizedAql === normPath);
      if (entry) {
        const suffix = inferLeafSuffixFromMessage(msg);
        const occs = entry.chain.map(() => 0);
        const flatBase = formatFlatChainPath(actualFlatRoot, entry.chain, occs);
        msg.targetPath = suffix ? `${flatBase}|${suffix}` : flatBase;

        if (format === "flat-json") {
          const hit = lookupFlatKeyForChain(
            parsedFlatKeys,
            acceptedRoots,
            entry.chain,
            occs,
            suffix,
          );
          if (hit) {
            if (hit.exact) msg.targetPath = hit.key.rawKey;
            msg.jsonPointer = hit.key.location.jsonPointer;
            msg.sourceLine = hit.key.location.sourceLine;
            msg.sourceColumn = hit.key.location.sourceColumn;
            if (!hit.exact) msg.sourceIsAncestor = true;
          }
        } else if (format === "structured-json") {
          const hit = lookupStructuredPointerForChain(
            index,
            structuredRoots,
            entry.chain,
            occs,
            suffix,
          );
          if (hit) {
            msg.targetPath = hit.targetPath;
            msg.jsonPointer = hit.location.jsonPointer;
            msg.sourceLine = hit.location.sourceLine;
            msg.sourceColumn = hit.location.sourceColumn;
            if (!hit.exact) msg.sourceIsAncestor = true;
          }
        }

        if (includeHints && isMissingContentMessage(msg)) {
          const example = formatExpectedExampleForMissingNode({
            format,
            rmPath: rawPath,
            webTemplateNode: entry.node,
            flatBasePath: flatBase,
          });
          if (example) msg.expectedExample = example;
        }
        continue;
      }
    }

    const flatPath = rawPath;
    msg.targetPath = flatPath;

    if (format === "flat-json") {
      const exactPtr = `/${escapeJsonPointerSegment(flatPath)}`;
      const exactLoc = index.get(exactPtr);
      if (exactLoc) {
        msg.jsonPointer = exactLoc.jsonPointer;
        msg.sourceLine = exactLoc.sourceLine;
        msg.sourceColumn = exactLoc.sourceColumn;
      } else {
        // Try normalized segment match (handles omitted `:0` vs explicit `:0`)
        const pipeIdx = flatPath.indexOf("|");
        const base = pipeIdx === -1 ? flatPath : flatPath.slice(0, pipeIdx);
        const wantSuffix = pipeIdx === -1 ? undefined : flatPath.slice(pipeIdx + 1);
        const rawSegs = base.split("/");
        const wantRoot = rawSegs[0] ?? "";
        const wantSegs = rawSegs.slice(1).map((s) => {
          const m = /^(.*?)(?::(\d+))?$/.exec(s)!;
          return { id: m[1], occ: m[2] ? parseInt(m[2], 10) : 0 };
        });
        const normMatch = parsedFlatKeys.find((k) => {
          if (k.root !== wantRoot || k.segments.length !== wantSegs.length) {
            return false;
          }
          for (let i = 0; i < wantSegs.length; i++) {
            if (
              k.segments[i].id !== wantSegs[i].id ||
              k.segments[i].occ !== wantSegs[i].occ
            ) {
              return false;
            }
          }
          return wantSuffix === undefined || k.suffix === wantSuffix;
        });

        if (normMatch) {
          msg.targetPath = normMatch.rawKey;
          msg.jsonPointer = normMatch.location.jsonPointer;
          msg.sourceLine = normMatch.location.sourceLine;
          msg.sourceColumn = normMatch.location.sourceColumn;
          if (wantSuffix === undefined && normMatch.suffix !== "") {
            msg.sourceIsAncestor = true;
          }
        } else {
          // Walk up path prefixes (normalizing `:n`)
          let foundLoc: JsonSourceLocation | undefined;
          for (let len = wantSegs.length - 1; len >= 1; len--) {
            const anc = parsedFlatKeys.find((k) => {
              if (k.root !== wantRoot || k.segments.length < len) return false;
              for (let i = 0; i < len; i++) {
                if (
                  k.segments[i].id !== wantSegs[i].id ||
                  k.segments[i].occ !== wantSegs[i].occ
                ) {
                  return false;
                }
              }
              return true;
            });
            if (anc) {
              foundLoc = anc.location;
              break;
            }
          }
          const loc = foundLoc ?? index.get("");
          if (loc) {
            msg.jsonPointer = loc.jsonPointer;
            msg.sourceLine = loc.sourceLine;
            msg.sourceColumn = loc.sourceColumn;
            msg.sourceIsAncestor = true;
          }
        }
      }
    } else if (format === "structured-json") {
      const pipeIdx = flatPath.indexOf("|");
      const base = pipeIdx === -1 ? flatPath : flatPath.slice(0, pipeIdx);
      const suffix = pipeIdx === -1 ? undefined : flatPath.slice(pipeIdx + 1);
      const rawSegs = base.split("/");

      if (rawSegs[0] === "ctx" && rawSegs.length >= 2) {
        const ptr = `/ctx/${escapeJsonPointerSegment(rawSegs[1].replace(/:\d+$/, ""))}`;
        const loc = index.get(ptr) ?? index.get("/ctx") ?? index.get("");
        if (loc) {
          msg.jsonPointer = loc.jsonPointer;
          msg.sourceLine = loc.sourceLine;
          msg.sourceColumn = loc.sourceColumn;
          if (!index.has(ptr)) msg.sourceIsAncestor = true;
        }
      } else {
        let cur = "";
        let exact = true;
        for (let i = 0; i < rawSegs.length; i++) {
          const m = /^(.*?)(?::(\d+))?$/.exec(rawSegs[i])!;
          const id = escapeJsonPointerSegment(m[1]);
          const occ = m[2] ? parseInt(m[2], 10) : 0;
          const arrPtr = `${cur}/${id}/${occ}`;
          const objPtr = `${cur}/${id}`;
          if (i > 0 && index.has(arrPtr)) {
            cur = arrPtr;
          } else if (index.has(objPtr)) {
            cur = objPtr;
          } else {
            exact = false;
            break;
          }
        }
        if (exact && suffix) {
          const leafPtr = `${cur}/${escapeJsonPointerSegment(`|${suffix}`)}`;
          if (index.has(leafPtr)) cur = leafPtr;
          else exact = false;
        }
        const loc = index.get(cur) ?? index.get("");
        if (loc) {
          msg.jsonPointer = loc.jsonPointer;
          msg.sourceLine = loc.sourceLine;
          msg.sourceColumn = loc.sourceColumn;
          if (!exact) msg.sourceIsAncestor = true;
        }
      }
    }

    if (includeHints && isMissingContentMessage(msg)) {
      if (flatPath.startsWith("ctx/")) {
        const ctxKey = flatPath.slice(4);
        const rmAlias = ctxKey === "time"
          ? "/context/start_time"
          : ctxKey === "setting"
          ? "/context/setting"
          : `/${ctxKey}`;
        const example = contextMissingExample(rmAlias, format);
        if (example) msg.expectedExample = example;
      } else if (wtByChain.size > 0) {
        const pipeIdx = flatPath.indexOf("|");
        const base = pipeIdx === -1 ? flatPath : flatPath.slice(0, pipeIdx);
        const chainKey = base.split("/").slice(1).map((s) => s.replace(/:\d+$/, "")).join("/");
        const wtNode = wtByChain.get(chainKey);
        if (wtNode) {
          const example = formatExpectedExampleForMissingNode({
            format,
            rmPath: wtNode.aqlPath || "/",
            webTemplateNode: wtNode,
            flatBasePath: base,
          });
          if (example) msg.expectedExample = example;
        }
      }
    }
  }
}
