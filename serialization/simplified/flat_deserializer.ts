/**
 * Deserialize FLAT JSON payloads to RM composition instances using a Web Template.
 *
 * The deserializer scans the payload keys (rather than walking the template),
 * so it accepts both `node:0/...` and `node/...` spellings for repeatable
 * nodes, bare keys or `|value` for single-field types, `|raw` embedded
 * canonical JSON, and `|other` free-text on open coded value-sets.
 *
 * @see openehr://guides/specs/its-rest-simplified_formats
 * @see docs/vendor/simplified_formats.md
 */

import type { FlatPayload, WebTemplate, WebTemplateNode } from "./types.ts";
import { normalizeWebTemplateId, templateRootId } from "./normalize.ts";
import {
  assignAtAqlPath,
  ensureAtAqlPath,
  type OccurrenceHints,
  type RmTypeHints,
} from "./rm_instance_builder.ts";
import {
  baseType,
  decodeRmObjectInto,
  decodeRmValue,
  type FlatFieldValue,
  type FlatTree,
  hasStructuredForm,
  isRmAttributeSegmentOfAny,
  newFlatTree,
  resolveRmAttribute,
  type UnknownAttributes,
} from "./rm_attribute_codec.ts";
import {
  applyFlatRmDefaults,
  type FlatRmDefaultIssue,
  type FlatRmDefaultOptions,
  throwOnCodedTextMismatch,
} from "./flat_rm_defaults.ts";
import { buildRmValue } from "./value_build.ts";
import {
  applyFlatContextDefaults,
  type CtxFields,
  type FlatContextOptions,
  KNOWN_CTX_FIELDS,
  reportMissingActionState,
} from "./flat_context_defaults.ts";

type RmObject = Record<string, unknown>;
type Primitive = string | number | boolean;

interface ParsedSegment {
  id: string;
  index: number;
  /** Written with `:i`. */
  indexed: boolean;
}

interface LeafGroup {
  node: WebTemplateNode;
  segments: ParsedSegment[];
  /** suffix ("" = bare) → value */
  fields: Record<string, Primitive>;
  raw?: Record<string, unknown>;
  other?: Primitive;
  /** `_null_flavour|…` / `_null_reason` fields of an ELEMENT without value. */
  nullFlavour?: Record<string, Primitive>;
  nullReason?: Primitive;
  /** `/_<attribute>` (and plain form) sub-paths below the node. */
  attributes?: FlatTree;
  /** The leaf value was decoded from `fields` and `attributes` together. */
  attributesConsumed?: boolean;
}

/** Key path split into the Web Template node and the RM attribute path below it. */
interface ResolvedKey {
  node: WebTemplateNode;
  segments: ParsedSegment[];
  attr: ParsedSegment[];
  legacy: boolean;
}

function parseSegments(basePath: string): ParsedSegment[] {
  return basePath.split("/").map((seg) => {
    const m = /^(.*?)(?::(\d+))?$/.exec(seg)!;
    return { id: m[1], index: m[2] ? parseInt(m[2], 10) : 0, indexed: m[2] != null };
  });
}

function aqlSegmentCount(aqlPath: string): number {
  return aqlPath.replace(/\/+/g, "/").match(/\/[^/]+/g)?.length ?? 0;
}

function flatLanguage(flat: FlatPayload, roots: Set<string>): string | undefined {
  for (const [key, value] of Object.entries(flat)) {
    if (value == null || typeof value === "object") continue;
    const pipe = key.indexOf("|");
    const base = pipe === -1 ? key : key.slice(0, pipe);
    const suffix = pipe === -1 ? "" : key.slice(pipe + 1);
    const [first, second, ...rest] = base.split("/");
    const isCtx = first === "ctx" && second === "language" && !rest.length;
    const isPath = roots.has(first) && second === "language" && !rest.length;
    if (!isCtx && !isPath) continue;
    if (suffix && suffix !== "value" && suffix !== "code") continue;
    return String(value);
  }
  return undefined;
}

/**
 * What FLAT → RM does with a key that matches no Web Template node.
 * `"error"` (default): an error issue (`deserializeFromFlat` throws
 * {@link UnknownFlatKeyError}); `"warning"`: a warning issue; `"ignore"`: no
 * issue. Unknown `ctx/` fields are always at most a warning.
 */
export type UnknownFlatKeys = "error" | "warning" | "ignore";

/** Options for {@link FlatDeserializer} and `deserializeFromFlat*`. */
export interface FlatDeserializeOptions
  extends FlatRmDefaultOptions, FlatContextOptions {
  /** Default `"error"`. See {@link UnknownFlatKeys}. */
  unknownKeys?: UnknownFlatKeys;
}

/** Thrown by the non-collecting FLAT APIs on unknown-key error issues. */
export class UnknownFlatKeyError extends Error {
  constructor(readonly issues: FlatRmDefaultIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
    this.name = "UnknownFlatKeyError";
  }
}

/** Throw {@link UnknownFlatKeyError} when `issues` has an unknown-key error. */
export function throwOnUnknownFlatKey(issues: FlatRmDefaultIssue[]): void {
  const errors = issues.filter((issue) =>
    issue.kind === "unknown-key" && issue.severity === "error"
  );
  if (errors.length) throw new UnknownFlatKeyError(errors);
}

/** RM types whose leaf value sits in an ELEMENT (`items[…]` / `item[…]`). */
function isElementLeaf(node: WebTemplateNode): boolean {
  return /\/(items|item)\[[^\]]+\]$/.test(node.aqlPath) && node.rmType !== "ELEMENT";
}

function insertAttribute(
  tree: FlatTree,
  segments: ParsedSegment[],
  suffix: string,
  value: FlatFieldValue,
): void {
  let cur = tree;
  for (const seg of segments) {
    let child = cur.children.get(seg.id);
    if (!child) cur.children.set(seg.id, child = { multi: false, items: [] });
    if (seg.indexed) child.multi = true;
    cur = child.items[seg.index] ??= newFlatTree();
  }
  cur.fields[suffix] = value;
}

export class FlatDeserializer {
  /**
   * Issues from the most recent {@link deserialize} call (defaults, rubrics,
   * coded-text mismatches). `deserialize` collects them and does not throw;
   * `deserializeFromFlat` throws `CodedTextMismatchError` on a mismatch error.
   */
  issues: FlatRmDefaultIssue[] = [];
  private language?: string;
  private rootId: string;
  /** Accepted first path segments (template id, tree id, tree names). */
  private roots = new Set<string>();
  /** AQL path of a collapsed INTERVAL_EVENT (has `width`). */
  private intervalEvents = new Set<string>();
  /** id-chain (indices stripped, without root) → node */
  private nodeByChain = new Map<string, WebTemplateNode>();
  /** id-chain → chain of nodes from tree root (exclusive) to node (inclusive) */
  private pathNodes = new Map<string, WebTemplateNode[]>();

  constructor(
    private webTemplate: WebTemplate,
    private options: FlatDeserializeOptions = {},
  ) {
    this.rootId = templateRootId(webTemplate.templateId);
    const tree = webTemplate.tree;
    this.roots.add(this.rootId);
    if (tree.id) this.roots.add(tree.id);
    for (const name of [tree.name, ...Object.values(tree.localizedNames ?? {})]) {
      if (name) this.roots.add(normalizeWebTemplateId(name));
    }
    this.indexNodes(tree.children ?? [], "", []);
  }

  private indexNodes(
    nodes: WebTemplateNode[],
    prefix: string,
    ancestors: WebTemplateNode[],
  ): void {
    for (const node of nodes) {
      const chain = prefix ? `${prefix}/${node.id}` : node.id;
      const lineage = [...ancestors, node];
      this.nodeByChain.set(chain, node);
      this.pathNodes.set(chain, lineage);
      if (node.inContext && node.id === "width") {
        this.intervalEvents.add(node.aqlPath.replace(/\/width$/, ""));
      }
      if (node.children?.length) {
        this.indexNodes(node.children, chain, lineage);
      }
    }
  }

  deserialize(flat: FlatPayload): RmObject {
    this.issues = [];
    this.language = flatLanguage(flat, this.roots) ?? this.webTemplate.defaultLanguage;
    const comp: RmObject = { _type: "COMPOSITION" };
    const groups = new Map<string, LeafGroup>();
    const ctx: CtxFields = new Map();
    const legacyKeys: string[] = [];
    const unknownMode = this.options.unknownKeys ?? "error";
    const unknown = (key: string, message: string, severity = unknownMode) => {
      if (severity === "ignore") return;
      this.issues.push({
        path: key,
        message,
        severity: severity === "error" ? "error" : "warning",
        kind: "unknown-key",
      });
    };

    for (const [key, value] of Object.entries(flat)) {
      if (value == null) continue;

      const pipeIdx = key.indexOf("|");
      const basePath = pipeIdx === -1 ? key : key.slice(0, pipeIdx);
      const suffix = pipeIdx === -1 ? "" : key.slice(pipeIdx + 1);

      if (key.startsWith("ctx/")) {
        if (typeof value === "object") continue;
        const fieldId = basePath.slice(4).replace(/:\d+$/, "");
        if (!KNOWN_CTX_FIELDS.has(fieldId)) {
          unknown(key, `unknown ctx field "${fieldId}"; ignored`, unknownMode === "ignore" ? "ignore" : "warning");
          continue;
        }
        let fields = ctx.get(fieldId);
        if (!fields) ctx.set(fieldId, fields = {});
        fields[suffix] = value as Primitive;
        continue;
      }

      const segments = parseSegments(basePath);
      if (!segments.length || !this.roots.has(segments[0].id)) {
        unknown(key, `key does not start with the template root "${this.rootId}/"`);
        continue;
      }
      segments.shift();
      if (!segments.length) continue;

      const resolved = this.resolveKey(segments);
      if (!resolved) {
        unknown(key, "no Web Template node has this path");
        continue;
      }
      if (resolved.legacy) legacyKeys.push(key);
      const node = resolved.node;
      segments.splice(0, segments.length, ...resolved.segments);

      // `…/_null_flavour|code`, `…/_null_reason` of an ELEMENT without value.
      const attrName = resolved.attr.length === 1 ? resolved.attr[0].id : undefined;
      const nullAttr = attrName === "_null_flavour" || attrName === "_null_reason";
      if (resolved.attr.length && !nullAttr) {
        const group = this.group(groups, node, segments);
        insertAttribute(group.attributes ??= newFlatTree(), resolved.attr, suffix, value as FlatFieldValue);
        continue;
      }
      const attr = nullAttr ? attrName : undefined;

      const group = this.group(groups, node, segments);

      if (attr === "_null_flavour" && typeof value !== "object") {
        (group.nullFlavour ??= {})[suffix] = value as Primitive;
      } else if (attr === "_null_reason" && typeof value !== "object") {
        group.nullReason = value as Primitive;
      } else if (suffix === "raw" && typeof value === "object") {
        group.raw = value as Record<string, unknown>;
      } else if (suffix === "other" && typeof value !== "object") {
        group.other = value as Primitive;
      } else if (typeof value !== "object") {
        // Keep "value" as-is: it is a real suffix for DV_CODED_TEXT and an
        // alias for the bare key elsewhere (buildDvValue resolves it).
        group.fields[suffix] = value as Primitive;
      }
    }

    if (legacyKeys.length) {
      this.issues.push({
        path: legacyKeys[0],
        severity: "warning",
        kind: "legacy-path",
        message:
          `${legacyKeys.length} key(s) use the older ehrtslib path form with a HISTORY "data" segment (and a single event segment); accepted. Current paths leave these segments out (spec "Level Removal")`,
      });
    }

    for (const group of groups.values()) {
      this.assignGroup(comp, group);
    }
    // RM attributes after the values, so they land on existing objects.
    for (const group of groups.values()) {
      this.applyAttributes(comp, group);
    }

    // ctx/ and RM defaults fill only what the paths did not set.
    applyFlatContextDefaults(comp, this.webTemplate, ctx, this.issues, this.options);
    applyFlatRmDefaults(comp, this.webTemplate, flat, this.issues, this.options);
    reportMissingActionState(comp, this.issues);

    return comp;
  }

  deserializeJson(json: string): RmObject {
    return this.deserialize(JSON.parse(json) as FlatPayload);
  }

  /**
   * Older ehrtslib Web Templates kept a `data` segment for HISTORY below an
   * OBSERVATION and a segment for a single event. Map such keys to the
   * collapsed form.
   */
  private legacySegments(segments: ParsedSegment[]): ParsedSegment[] | undefined {
    for (let i = 1; i < segments.length; i++) {
      if (segments[i].id !== "data") continue;
      const parent = this.nodeByChain.get(segments.slice(0, i).map((s) => s.id).join("/"));
      if (parent?.rmType !== "OBSERVATION") continue;
      for (const drop of [1, 2]) {
        const candidate = [...segments.slice(0, i), ...segments.slice(i + drop)];
        if (this.nodeByChain.has(candidate.map((s) => s.id).join("/"))) {
          return candidate;
        }
      }
    }
    return undefined;
  }

  private group(groups: Map<string, LeafGroup>, node: WebTemplateNode, segments: ParsedSegment[]): LeafGroup {
    const groupKey = segments.map((s) => `${s.id}:${s.index}`).join("/");
    let group = groups.get(groupKey);
    if (!group) {
      group = { node, segments, fields: {} };
      groups.set(groupKey, group);
    }
    return group;
  }

  /** Node for a segment chain (indices ignored), with the legacy HISTORY form. */
  private matchChain(segments: ParsedSegment[]): { node: WebTemplateNode; segments: ParsedSegment[]; legacy: boolean } | undefined {
    if (!segments.length) return { node: this.webTemplate.tree, segments: [], legacy: false };
    const node = this.nodeByChain.get(segments.map((s) => s.id).join("/"));
    if (node) return { node, segments, legacy: false };
    const legacy = this.legacySegments(segments);
    if (!legacy) return undefined;
    const legacyNode = this.nodeByChain.get(legacy.map((s) => s.id).join("/"));
    return legacyNode ? { node: legacyNode, segments: legacy, legacy: true } : undefined;
  }

  /** RM types an attribute segment below `node` may belong to (ELEMENT first for a leaf). */
  private attributeOwners(node: WebTemplateNode): string[] {
    if (node === this.webTemplate.tree) return ["COMPOSITION"];
    const types = [baseType(node.rmType)];
    if (isElementLeaf(node)) types.unshift("ELEMENT");
    return types;
  }

  /**
   * Split key segments into the Web Template node and the RM attribute path:
   * the first `_<name>` segment starts the attribute path; a plain segment
   * does when it names an attribute of the node's RM type (form paths such
   * as DV_INTERVAL `/lower` or ISM_TRANSITION `/transition`).
   */
  private resolveKey(segments: ParsedSegment[]): ResolvedKey | undefined {
    const full = this.matchChain(segments);
    if (full && segments.length) return { ...full, attr: [] };
    const underscore = segments.findIndex((s) => s.id.startsWith("_"));
    if (underscore !== -1) {
      const prefix = this.matchChain(segments.slice(0, underscore));
      if (prefix) return { ...prefix, attr: segments.slice(underscore) };
    }
    for (let j = segments.length - 1; j >= 1; j--) {
      const prefix = this.matchChain(segments.slice(0, j));
      if (!prefix) continue;
      const seg = segments[j].id;
      if (this.attributeOwners(prefix.node).some((t) => isRmAttributeSegmentOfAny(t, seg))) {
        return { ...prefix, attr: segments.slice(j) };
      }
      return undefined;
    }
    return undefined;
  }

  private reportAttributes(unknownAttrs: UnknownAttributes, node: WebTemplateNode): void {
    const mode = this.options.unknownKeys ?? "error";
    if (mode === "ignore") return;
    for (const path of unknownAttrs) {
      const computed = /\/_?offset(:\d+)?$/.test(path) && /EVENT$/.test(node.rmType);
      this.issues.push({
        path: `${node.aqlPath}${path}`,
        severity: "warning",
        kind: "unknown-key",
        message: computed
          ? "EVENT.offset is computed (time − HISTORY.origin), not stored; ignored"
          : `RM type ${node.rmType} has no attribute for "${path.split("/").pop()}"; ignored`,
      });
    }
  }

  /** Apply `/_<attribute>` paths (and form fields of non-leaf nodes) to the RM objects. */
  private applyAttributes(comp: RmObject, group: LeafGroup): void {
    const { node } = group;
    const leaf = !node.children?.length;
    const tree = group.attributes;
    const nodeFields = node.children?.length && node !== this.webTemplate.tree ? group.fields : {};
    if ((!tree || group.attributesConsumed) && !Object.keys(nodeFields).length) return;
    const unknownAttrs: UnknownAttributes = [];
    const attrs = tree && !group.attributesConsumed ? tree : newFlatTree();
    if (node === this.webTemplate.tree) {
      decodeRmObjectInto(comp, "COMPOSITION", undefined, attrs, unknownAttrs);
      this.reportAttributes(unknownAttrs, node);
      return;
    }
    const hints = this.occurrenceHints(group);
    const typeHints = this.rmTypeHints(group);
    if (!leaf) {
      const obj = ensureAtAqlPath(comp, node.aqlPath, node.rmType, node.nodeId, hints, typeHints);
      const type = String(obj._type ?? node.rmType);
      decodeRmObjectInto(obj, type, undefined, { fields: { ...nodeFields }, children: attrs.children }, unknownAttrs);
      this.reportAttributes(unknownAttrs, node);
      return;
    }
    // Leaf: ELEMENT attributes (uid, links, feeder_audit, name) on the
    // ELEMENT, the others on its value.
    const valueTree = newFlatTree();
    const elementTree = newFlatTree();
    const elementLeaf = isElementLeaf(node);
    for (const [name, child] of attrs.children) {
      const onElement = elementLeaf && resolveRmAttribute("ELEMENT", name) != null;
      (onElement ? elementTree : valueTree).children.set(name, child);
    }
    if (elementTree.children.size) {
      const element = ensureAtAqlPath(comp, node.aqlPath, "ELEMENT", node.nodeId, hints, typeHints);
      decodeRmObjectInto(element, "ELEMENT", undefined, elementTree, unknownAttrs);
    }
    if (valueTree.children.size) {
      let value: RmObject;
      if (elementLeaf) {
        const element = ensureAtAqlPath(comp, node.aqlPath, "ELEMENT", node.nodeId, hints, typeHints);
        value = (element.value ??= { _type: baseType(node.rmType) }) as RmObject;
      } else {
        value = ensureAtAqlPath(comp, node.aqlPath, baseType(node.rmType), undefined, hints, typeHints);
      }
      decodeRmObjectInto(value, String(value._type ?? node.rmType), undefined, valueTree, unknownAttrs);
    }
    this.reportAttributes(unknownAttrs, node);
  }

  private occurrenceHints(group: LeafGroup): OccurrenceHints {
    const hints: OccurrenceHints = {};
    const chainIds: string[] = [];
    for (const seg of group.segments) {
      chainIds.push(seg.id);
      if (seg.index === 0) continue;
      const node = this.nodeByChain.get(chainIds.join("/"));
      if (!node?.aqlPath) continue;
      const depth = aqlSegmentCount(node.aqlPath);
      hints[depth] = seg.index;
      // Spec-style leaves point at ELEMENT.value; the repeat actually
      // happens on the enclosing ELEMENT one segment up.
      if (/\/value$/.test(node.aqlPath)) hints[depth - 1] = seg.index;
    }
    return hints;
  }

  /** RM types of ancestor template nodes, keyed by AQL path depth. */
  private rmTypeHints(group: LeafGroup): RmTypeHints {
    const hints: RmTypeHints = {};
    const chain = group.segments.map((s) => s.id).join("/");
    const lineage = this.pathNodes.get(chain) ?? [];
    for (const node of lineage) {
      if (!node.aqlPath || node.aqlPath === "/") continue;
      hints[aqlSegmentCount(node.aqlPath)] = node.rmType;
    }
    // Collapsed HISTORY, EVENT and ITEM_STRUCTURE have no node of their
    // own: use the Web Template registry, else RM defaults.
    const leafPath = group.node.aqlPath;
    const collapsed = this.webTemplate.tree.collapsed;
    if (collapsed) {
      const segs = leafPath.match(/\/[^/]+/g) ?? [];
      for (let d = 1; d <= segs.length; d++) {
        const entry = collapsed[segs.slice(0, d).join("")];
        if (entry) hints[d] ??= entry.rmType;
      }
    }
    for (const node of lineage) {
      if (node.rmType !== "OBSERVATION") continue;
      const depth = aqlSegmentCount(node.aqlPath);
      const rest = leafPath.slice(node.aqlPath.length).match(/\/[^/]+/g) ?? [];
      if (rest[0]?.startsWith("/data")) hints[depth + 1] ??= "HISTORY";
      if (rest[1]?.startsWith("/events")) {
        const eventPath = node.aqlPath + rest[0] + rest[1];
        hints[depth + 2] ??= this.intervalEvents.has(eventPath)
          ? "INTERVAL_EVENT"
          : "POINT_EVENT";
      }
    }
    return hints;
  }

  private assignGroup(comp: RmObject, group: LeafGroup): void {
    const { node } = group;
    if (node === this.webTemplate.tree) return;
    // Fields of a node with children are its form fields (applyAttributes).
    if (node.children?.length && !group.raw) return;
    const hints = this.occurrenceHints(group);
    const typeHints = this.rmTypeHints(group);

    if (!group.raw && group.other === undefined && hasStructuredForm(node.rmType)) {
      // e.g. DV_INTERVAL: `|lower_included` fields and `/lower`, `/upper` paths.
      const tree: FlatTree = { fields: { ...group.fields }, children: group.attributes?.children ?? new Map() };
      group.attributesConsumed = true;
      if (!Object.keys(tree.fields).length && !tree.children.size) return;
      const unknownAttrs: UnknownAttributes = [];
      const value = decodeRmValue(node.rmType, undefined, tree, unknownAttrs);
      this.reportAttributes(unknownAttrs, node);
      assignAtAqlPath(comp, node.aqlPath, value, baseType(node.rmType), node.nodeId, hints, typeHints);
      return;
    }

    if (group.raw) {
      assignAtAqlPath(
        comp,
        node.aqlPath,
        group.raw,
        (group.raw._type as string) ?? node.rmType,
        node.nodeId,
        hints,
        typeHints,
      );
      return;
    }

    if (group.other !== undefined) {
      assignAtAqlPath(
        comp,
        node.aqlPath,
        { _type: "DV_TEXT", value: String(group.other) },
        "DV_TEXT",
        node.nodeId,
        hints,
        typeHints,
      );
      return;
    }

    if (node.rmType === "STRING") {
      const v = group.fields[""] ?? group.fields.value;
      if (v != null) {
        assignAtAqlPath(comp, node.aqlPath, String(v), "STRING", node.nodeId, hints, typeHints);
      }
      return;
    }

    if (group.nullFlavour || group.nullReason != null) {
      const element: RmObject = {
        _type: "ELEMENT",
        archetype_node_id: node.nodeId ?? null,
      };
      if (group.nullFlavour) {
        element.null_flavour = buildRmValue("DV_CODED_TEXT", {
          terminology: "openehr",
          ...group.nullFlavour,
        });
      }
      if (group.nullReason != null) {
        element.null_reason = { _type: "DV_TEXT", value: String(group.nullReason) };
      }
      assignAtAqlPath(
        comp,
        node.aqlPath.replace(/\/value$/, ""),
        element,
        "ELEMENT",
        node.nodeId,
        hints,
        typeHints,
      );
      if (!Object.keys(group.fields).length) return;
    }

    if (!Object.keys(group.fields).length) return;

    assignAtAqlPath(
      comp,
      node.aqlPath,
      buildRmValue(node.rmType, group.fields, {
        node,
        language: this.language,
        issues: this.issues,
        path: node.aqlPath,
        codedTextMismatch: this.options.codedTextMismatch,
        codedTextDisplayValue: this.options.codedTextDisplayValue,
      }),
      node.rmType,
      node.nodeId,
      hints,
      typeHints,
    );
  }
}

export function deserializeFromFlat(
  flat: FlatPayload,
  webTemplate: WebTemplate,
  options?: FlatDeserializeOptions,
): RmObject {
  const deserializer = new FlatDeserializer(webTemplate, options);
  const composition = deserializer.deserialize(flat);
  throwOnCodedTextMismatch(deserializer.issues);
  throwOnUnknownFlatKey(deserializer.issues);
  return composition;
}

export function deserializeFromFlatJson(
  json: string,
  webTemplate: WebTemplate,
  options?: FlatDeserializeOptions,
): RmObject {
  return deserializeFromFlat(JSON.parse(json) as FlatPayload, webTemplate, options);
}

export type { ContextDefaults, FlatContextOptions } from "./flat_context_defaults.ts";

export {
  type CodedTextDisplayValue,
  type CodedTextMismatch,
  CodedTextMismatchError,
  type FlatRmDefaultIssue,
} from "./flat_rm_defaults.ts";

export function deserializeFromFlatWithIssues(
  flat: FlatPayload,
  webTemplate: WebTemplate,
  options?: FlatDeserializeOptions,
): { composition: RmObject; issues: FlatRmDefaultIssue[] } {
  const deserializer = new FlatDeserializer(webTemplate, options);
  return {
    composition: deserializer.deserialize(flat),
    issues: deserializer.issues,
  };
}
