/**
 * Serialize RM composition instances to FLAT JSON (web-template keyed).
 * @see openehr://guides/specs/its-rest-simplified_formats
 */

import type { FlatPayload, WebTemplate, WebTemplateNode } from "./types.ts";
import { templateRootId } from "./normalize.ts";
import {
  resolveAllAtWebTemplateNode,
  resolveChildWebTemplateNodes,
} from "./instance_nav.ts";
import { extractValueFields } from "./value_extract.ts";
import { rmProp } from "./dv_field_maps.ts";
import {
  contextUnderscoreFields,
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

export class FlatSerializer {
  private out: FlatPayload = {};
  private rootId: string;
  private instance: unknown;
  private policy?: InputFlavorPolicy;

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

    const composer = rmProp(instance, "composer");
    if (
      !input && rmTypeOf(composer) === "PARTY_SELF" &&
      !Object.keys(partyFields(composer)).length
    ) {
      // A plain PARTY_SELF composer has no field to write at /composer.
      this.out["ctx/composer_self"] = true;
    }

    const uid = rmProp(rmProp(instance, "uid"), "value");
    if (uid != null) this.out[`${this.rootId}/_uid`] = String(uid);

    // FLAT keys carry a single root segment (the normalised template id);
    // the tree root node itself contributes no extra path segment.
    for (const child of this.webTemplate.tree.children ?? []) {
      const values = resolveAllAtWebTemplateNode(instance, child);
      for (let i = 0; i < values.length; i++) {
        this.walkNode(child, [this.rootId], i, values[i], [instance]);
      }
    }
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
  ): void {
    if (data == null) return;
    if (node.inContext && this.policy?.omit(node, data, ancestors)) return;

    const nextPath = [...pathParts, node.id + indexSuffix(node.max, index)];
    const base = nextPath.join("/");
    const isLeaf = node.inputs?.length && !node.children?.length;

    if (isLeaf) {
      if (rmTypeOf(data) === "ELEMENT") {
        for (const [k, v] of nullFlavourFields(data)) this.out[`${base}/${k}`] = v;
        return;
      }
      if (typeof data !== "object") {
        this.out[base] = data as string | number | boolean;
        return;
      }
      const fields = rmTypeOf(data).startsWith("PARTY_")
        ? partyFields(data)
        : allValueFields(data, node);
      for (const [suffix, value] of Object.entries(fields)) {
        this.out[suffix === "" ? base : `${base}|${suffix}`] = value;
      }
      return;
    }

    for (const child of node.children ?? []) {
      const childValues = resolveChildWebTemplateNodes(
        this.instance,
        data,
        node,
        child,
      );
      for (let i = 0; i < childValues.length; i++) {
        this.walkNode(child, nextPath, i, childValues[i], [...ancestors, data]);
      }
    }

    if (node.rmType === "EVENT_CONTEXT" && !this.policy) {
      for (const [k, v] of contextUnderscoreFields(data)) {
        const [attr, suffix] = k.split("|");
        this.out[suffix ? `${base}/${attr}|${suffix}` : `${base}/${attr}`] = v;
      }
    }
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
