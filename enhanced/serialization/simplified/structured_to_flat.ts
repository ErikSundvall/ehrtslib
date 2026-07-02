/**
 * Convert STRUCTURED JSON to FLAT for shared deserialization path.
 *
 * Follows the "Structured to Flat" algorithm in the ITS-REST simplified
 * formats spec: recursively traverse, join property names with `/`, unwrap
 * arrays, turn `|suffix` properties into pipe-suffixed keys (with `|value`
 * collapsing to the bare key), and flatten `ctx` with the `ctx/` prefix.
 *
 * Instance indexing follows the same policy as the FLAT serializer: a node
 * gets an `:n` suffix when its template `max` allows repetition or when the
 * instance index is greater than zero.
 */

import type {
  FlatPayload,
  FlatValue,
  WebTemplate,
  WebTemplateNode,
} from "./types.ts";
import { templateRootId } from "./normalize.ts";
import { getFieldMap, resolveDvType } from "./dv_field_maps.ts";

type StructuredValue = Record<string, unknown>;

function isPlainObject(v: unknown): v is StructuredValue {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Whether `|value` is a genuine suffix for the RM type (DV_CODED_TEXT,
 * DV_ORDINAL, …) rather than an alias for the bare key.
 */
function valueIsRealSuffix(rmType?: string): boolean {
  if (!rmType) return false;
  const map = getFieldMap(resolveDvType(rmType));
  return !!map?.fields.some((f) => f.suffix === "value");
}

function setLeaf(
  flat: FlatPayload,
  base: string,
  suffix: string,
  v: unknown,
  keepValueSuffix = false,
): void {
  if (v == null) return;
  const collapse = suffix === "" || (suffix === "value" && !keepValueSuffix);
  const key = collapse ? base : `${base}|${suffix}`;
  flat[key] = v as FlatValue;
}

/** Emit all `|suffix` fields of a leaf object; returns true if any emitted. */
function emitPipeFields(
  flat: FlatPayload,
  base: string,
  obj: StructuredValue,
  keepValueSuffix = false,
): boolean {
  let any = false;
  for (const [k, v] of Object.entries(obj)) {
    if (!k.startsWith("|") || v == null) continue;
    const suffix = k.slice(1);
    if (suffix === "raw") {
      flat[`${base}|raw`] = v as FlatValue;
    } else {
      setLeaf(flat, base, suffix, v, keepValueSuffix);
    }
    any = true;
  }
  return any;
}

function flattenCtx(ctx: StructuredValue, flat: FlatPayload): void {
  for (const [field, val] of Object.entries(ctx)) {
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        const entry = val[i];
        const indexed = val.length > 1 ? `${field}:${i}` : field;
        if (isPlainObject(entry)) {
          emitPipeFields(flat, `ctx/${indexed}`, entry);
        } else if (entry != null) {
          flat[`ctx/${indexed}`] = entry as FlatValue;
        }
      }
    } else if (isPlainObject(val)) {
      emitPipeFields(flat, `ctx/${field}`, val);
    } else if (val != null) {
      flat[`ctx/${field}`] = val as FlatValue;
    }
  }
}

class StructuredToFlatConverter {
  /** id-chain (without root) → template node */
  private nodeByChain = new Map<string, WebTemplateNode>();
  private flat: FlatPayload = {};

  constructor(private webTemplate: WebTemplate) {
    this.indexNodes(webTemplate.tree.children ?? [], "");
  }

  private indexNodes(nodes: WebTemplateNode[], prefix: string): void {
    for (const node of nodes) {
      const chain = prefix ? `${prefix}/${node.id}` : node.id;
      this.nodeByChain.set(chain, node);
      if (node.children?.length) this.indexNodes(node.children, chain);
    }
  }

  convert(structured: StructuredValue): FlatPayload {
    this.flat = {};
    const rootId = templateRootId(this.webTemplate.templateId);

    if (isPlainObject(structured.ctx)) {
      flattenCtx(structured.ctx, this.flat);
    }

    const rootBranch = structured[rootId];
    if (isPlainObject(rootBranch)) {
      for (const [k, v] of Object.entries(rootBranch)) {
        if (k.startsWith("|")) continue;
        this.flattenValue(`${rootId}/${k}`, k, v);
      }
    }

    return this.flat;
  }

  /** Same index policy as the FLAT serializer's `indexSuffix`. */
  private indexSuffix(chain: string, i: number, arrayLen: number): string {
    const node = this.nodeByChain.get(chain);
    if (node) return node.max !== 1 || i > 0 ? `:${i}` : "";
    return arrayLen > 1 || i > 0 ? `:${i}` : "";
  }

  /**
   * Recursively flatten a structured node value.
   *
   * `base` is the flat path accumulated so far (with root and instance
   * indices); `chain` is the same path with indices stripped and without
   * the root segment, used to look up template nodes.
   */
  private flattenValue(base: string, chain: string, value: unknown): void {
    if (value == null) return;

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const suffix = /:\d+$/.test(base)
          ? ""
          : this.indexSuffix(chain, i, value.length);
        this.flattenValue(`${base}${suffix}`, chain, value[i]);
      }
      return;
    }

    if (isPlainObject(value)) {
      const node = this.nodeByChain.get(chain);
      emitPipeFields(this.flat, base, value, valueIsRealSuffix(node?.rmType));
      for (const [k, v] of Object.entries(value)) {
        if (k.startsWith("|")) continue;
        this.flattenValue(`${base}/${k}`, `${chain}/${k}`, v);
      }
      return;
    }

    // Primitive leaf → bare key
    this.flat[base] = value as FlatValue;
  }
}

export function structuredToFlat(
  structured: StructuredValue,
  webTemplate: WebTemplate,
): FlatPayload {
  return new StructuredToFlatConverter(webTemplate).convert(structured);
}
