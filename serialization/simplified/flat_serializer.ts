/**
 * Serialize RM composition instances to FLAT JSON (web-template keyed).
 * @see openehr://guides/specs/its-rest-simplified_formats
 */

import type { FlatPayload, WebTemplate, WebTemplateNode } from "./types.ts";
import { templateRootId } from "./normalize.ts";
import {
  resolveAllValuesAtWebTemplateNode,
  resolveChildWebTemplateNodeValues,
} from "./instance_nav.ts";
import { extractValueFields } from "./value_extract.ts";
import { getFieldMap } from "./dv_field_maps.ts";
import {
  baseType,
  emitFlatTree,
  encodeRmObject,
  hasStructuredForm,
  TEMPLATE_SUPPLIED,
} from "./rm_attribute_codec.ts";
import {
  InputFlavorPolicy,
  inputContextFields,
  nullFlavourFields,
  partyFields,
  rmTypeOf,
  type SimplifiedFlavor,
} from "./flavor.ts";

export type { SimplifiedFlavor } from "./flavor.ts";

export interface FlatSerializerOptions {
  prettyPrint?: boolean;
  /**
   * `output` (default): every value at its own path, no `ctx/` keys
   * (lossless). `input`: composition-level values as `ctx/` and values equal
   * to deserializer defaults left out. Both are accepted on input.
   */
  flavor?: SimplifiedFlavor;
}

/**
 * Every field the RM value carries: the declared input suffixes first (so a
 * legacy `value` input keeps its `|value` key), then the other fields of the
 * type's field map, so nothing is lost (e.g. DV_PARSABLE `|formalism`).
 */
function allValueFields(
  data: unknown,
  node: WebTemplateNode,
): Record<string, string | number | boolean> {
  const declared = extractValueFields(data, node.inputs);
  for (const [suffix, value] of Object.entries(extractValueFields(data))) {
    if (suffix in declared) continue;
    if (suffix === "" && "value" in declared) continue;
    declared[suffix] = value;
  }
  return declared;
}

function indexSuffix(max: number, index: number): string {
  return max !== 1 || index > 0 ? `:${index}` : "";
}

/** Names the template gives a node (the instance name is written only when it differs). */
function templateNames(node: WebTemplateNode): string[] {
  return [node.name, node.localizedName, ...Object.values(node.localizedNames ?? {})]
    .filter((n): n is string => !!n);
}

/** Attributes of an ELEMENT that its leaf already writes. */
const ELEMENT_WRITTEN = new Set([...TEMPLATE_SUPPLIED, "value", "null_flavour", "null_reason"]);

/** EVENT_CONTEXT attributes the input flavour writes as `ctx/`. */
const INPUT_CTX_CONTEXT = new Set(["end_time", "location", "health_care_facility"]);

/**
 * RM attributes a Web Template node's descendants address (first AQL
 * segment below the node), so they are not written again as `_<attribute>`.
 */
function templateAttributes(node: WebTemplateNode, wt: WebTemplate): Set<string> {
  const base = node.aqlPath === "/" ? "" : node.aqlPath;
  const out = new Set<string>();
  // Objects the template constrains without a node of their own (HISTORY,
  // ITEM_TREE, a single EVENT, other_context).
  for (const path of Object.keys(wt.tree.collapsed ?? {})) {
    if (!path.startsWith(`${base}/`)) continue;
    const m = /^\/([^[/]+)/.exec(path.slice(base.length));
    if (m) out.add(m[1]);
  }
  const visit = (n: WebTemplateNode) => {
    for (const child of n.children ?? []) {
      if (child.aqlPath.startsWith(base) && child.aqlPath !== base) {
        const m = /^\/([^[/]+)/.exec(child.aqlPath.slice(base.length));
        if (m) out.add(m[1]);
      }
      visit(child);
    }
  };
  visit(node);
  return out;
}

export class FlatSerializer {
  private out: FlatPayload = {};
  private rootId: string;
  private instance: unknown;
  private policy?: InputFlavorPolicy;
  private covered = new WeakMap<WebTemplateNode, Set<string>>();

  constructor(
    private webTemplate: WebTemplate,
    private options: FlatSerializerOptions = {},
  ) {
    this.rootId = templateRootId(webTemplate.templateId);
  }

  serialize(instance: unknown): FlatPayload {
    this.instance = instance;
    const input = this.options.flavor === "input";
    this.policy = input
      ? new InputFlavorPolicy(instance, this.webTemplate)
      : undefined;
    this.out = input ? inputContextFields(instance) : {};

    // FLAT keys carry a single root segment (the normalised template id);
    // the tree root node itself contributes no extra path segment.
    for (const child of this.webTemplate.tree.children ?? []) {
      const values = resolveAllValuesAtWebTemplateNode(instance, child);
      for (let i = 0; i < values.length; i++) {
        this.walkNode(child, [this.rootId], i, values[i].value, [instance], values[i].element);
      }
    }
    this.writeAttributes(this.webTemplate.tree, this.rootId, instance);
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
    data: unknown,
    ancestors: unknown[],
    element?: unknown,
  ): void {
    if (data == null) return;
    if (node.inContext && this.policy?.omit(node, data, ancestors)) return;

    const nextPath = [...pathParts, node.id + indexSuffix(node.max, index)];
    const base = nextPath.join("/");
    const isLeaf = node.inputs?.length && !node.children?.length;

    if (isLeaf) {
      if (rmTypeOf(data) === "ELEMENT") {
        for (const [k, v] of nullFlavourFields(data)) this.out[`${base}/${k}`] = v;
        this.writeElementAttributes(node, base, data);
        return;
      }
      if (typeof data !== "object") {
        this.out[base] = data as string | number | boolean;
        return;
      }
      if (element) this.writeElementAttributes(node, base, element);
      if (hasStructuredForm(rmTypeOf(data) || node.rmType) && !getFieldMap(rmTypeOf(data))) {
        // e.g. DV_INTERVAL: `/lower`, `/upper`, `|lower_included`, …
        emitFlatTree(base, encodeRmObject(data, node.rmType), this.out);
        return;
      }
      if (node.rmType === "DV_CODED_TEXT" && rmTypeOf(data) === "DV_TEXT") {
        // Free text on an open coded value set.
        this.out[`${base}|other`] = (data as { value?: string }).value ?? "";
        this.writeValueAttributes(base, data);
        return;
      }
      const fields = rmTypeOf(data).startsWith("PARTY_")
        ? partyFields(data)
        : allValueFields(data, node);
      if (node.aqlPath === "/composer" && rmTypeOf(data) === "PARTY_SELF") {
        // No ctx/composer_self in output: mark the subtype at its path
        // (ehrtslib convention, docs/SIMPLIFIED_FORMATS.md "Composer").
        fields._type = "PARTY_SELF";
      }
      for (const [suffix, value] of Object.entries(fields)) {
        this.out[suffix === "" ? base : `${base}|${suffix}`] = value;
      }
      this.writeValueAttributes(base, data);
      return;
    }

    for (const child of node.children ?? []) {
      const childValues = resolveChildWebTemplateNodeValues(
        this.instance,
        data,
        node,
        child,
      );
      for (let i = 0; i < childValues.length; i++) {
        this.walkNode(child, nextPath, i, childValues[i].value, [...ancestors, data], childValues[i].element);
      }
    }
    this.writeAttributes(node, base, data);
  }

  /** `_<attribute>` paths for RM attributes no Web Template node writes. */
  private writeAttributes(node: WebTemplateNode, base: string, data: unknown): void {
    let covered = this.covered.get(node);
    if (!covered) {
      covered = new Set([...templateAttributes(node, this.webTemplate), ...TEMPLATE_SUPPLIED]);
      this.covered.set(node, covered);
    }
    const skip = this.policy && node.rmType === "EVENT_CONTEXT"
      ? new Set([...covered, ...INPUT_CTX_CONTEXT])
      : covered;
    const type = rmTypeOf(data) || node.rmType;
    const tree = encodeRmObject(data, type, undefined, { skip, templateNames: templateNames(node) });
    emitFlatTree(base, tree, this.out);
  }

  /** `_uid`, `_link:i`, `_feeder_audit`, `_name` of the ELEMENT of a leaf. */
  private writeElementAttributes(node: WebTemplateNode, base: string, element: unknown): void {
    const tree = encodeRmObject(element, "ELEMENT", undefined, {
      skip: ELEMENT_WRITTEN,
      templateNames: templateNames(node),
    });
    emitFlatTree(base, { fields: {}, children: tree.children }, this.out);
  }

  /**
   * `_<attribute>` paths for attributes of a leaf value that its `|suffix`
   * fields do not carry (DV_QUANTITY `_normal_range`, DV_TEXT `_mapping:i`,
   * PARTY_IDENTIFIED `_identifier:i`, …).
   */
  private writeValueAttributes(base: string, data: unknown): void {
    const type = baseType(rmTypeOf(data));
    if (!type) return;
    const tree = encodeRmObject(data, type);
    emitFlatTree(base, { fields: {}, children: tree.children }, this.out);
  }
}

export function serializeToFlat(
  instance: unknown,
  webTemplate: WebTemplate,
  options?: FlatSerializerOptions,
): FlatPayload {
  return new FlatSerializer(webTemplate, options).serialize(instance);
}

export function serializeToFlatJson(
  instance: unknown,
  webTemplate: WebTemplate,
  options?: FlatSerializerOptions,
): string {
  return new FlatSerializer(webTemplate, options).serializeJson(instance);
}
