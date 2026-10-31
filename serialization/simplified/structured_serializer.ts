/**
 * Serialize RM composition instances to STRUCTURED JSON (web-template keyed).
 *
 * The instance is serialized to FLAT first and then nested with the spec's
 * "Flat to Structured" rule, so both formats always carry the same keys and
 * honour the same flavour (`output` / `input`).
 * @see openehr://guides/specs/its-rest-simplified_formats
 */

import type { FlatPayload, WebTemplate } from "./types.ts";
import { FlatSerializer } from "./flat_serializer.ts";
import type { SimplifiedFlavor } from "./flavor.ts";

export interface StructuredSerializerOptions {
  prettyPrint?: boolean;
  /** See {@link FlatSerializerOptions.flavor}. Default `output`. */
  flavor?: SimplifiedFlavor;
}

type StructuredValue = Record<string, unknown>;

/**
 * Nest FLAT keys into STRUCTURED JSON: every path segment becomes an array
 * (index from `:n`, default 0), `|suffix` fields become `"|suffix"`
 * properties, a bare-only leaf becomes a primitive array entry and `ctx/`
 * keys go to the `ctx` object.
 */
export function flatToStructured(flat: FlatPayload): StructuredValue {
  const result: StructuredValue = {};
  const ctx: StructuredValue = {};

  for (const [key, value] of Object.entries(flat)) {
    if (value == null) continue;
    const pipe = key.indexOf("|");
    const path = pipe >= 0 ? key.slice(0, pipe) : key;
    const suffix = pipe >= 0 ? key.slice(pipe + 1) : "";
    const segments = path.split("/");

    if (segments[0] === "ctx") {
      const field = segments.slice(1).join("/");
      setEntry(ctx, field, 0, suffix, value, false);
      continue;
    }

    let obj = (result[segments[0]] ??= {}) as StructuredValue;
    for (let i = 1; i < segments.length; i++) {
      const m = /^(.*?)(?::(\d+))?$/.exec(segments[i])!;
      const id = m[1];
      const idx = m[2] ? Number(m[2]) : 0;
      if (i === segments.length - 1) {
        setEntry(obj, id, idx, suffix, value, true);
      } else {
        obj = childObject(obj, id, idx);
      }
    }
  }

  return Object.keys(ctx).length ? { ctx, ...result } : result;
}

function fillArray(arr: unknown[], idx: number): void {
  for (let i = arr.length; i < idx; i++) arr[i] = null;
}

function childObject(obj: StructuredValue, id: string, idx: number): StructuredValue {
  const arr = (obj[id] ??= []) as unknown[];
  fillArray(arr, idx);
  const cur = arr[idx];
  if (cur != null && typeof cur === "object") return cur as StructuredValue;
  const next: StructuredValue = cur != null ? { "|value": cur } : {};
  arr[idx] = next;
  return next;
}

function setEntry(
  obj: StructuredValue,
  id: string,
  idx: number,
  suffix: string,
  value: unknown,
  asArray: boolean,
): void {
  if (!asArray) {
    // ctx: bare-only → primitive; with suffixes → [{ "|value", "|code", … }]
    const cur = obj[id];
    if (suffix === "" && cur === undefined) {
      obj[id] = value;
      return;
    }
    const entry = Array.isArray(cur)
      ? cur[0] as StructuredValue
      : cur !== undefined
      ? { "|value": cur }
      : {};
    entry[`|${suffix || "value"}`] = value;
    obj[id] = [entry];
    return;
  }
  const arr = (obj[id] ??= []) as unknown[];
  fillArray(arr, idx);
  const cur = arr[idx];
  if (suffix === "" && cur == null) {
    arr[idx] = value;
    return;
  }
  const entry = cur != null && typeof cur === "object"
    ? cur as StructuredValue
    : cur != null
    ? { "|value": cur }
    : {};
  entry[`|${suffix || "value"}`] = value;
  arr[idx] = entry;
}

export class StructuredSerializer {
  private flat: FlatSerializer;

  constructor(
    webTemplate: WebTemplate,
    private options: StructuredSerializerOptions = {},
  ) {
    this.flat = new FlatSerializer(webTemplate, { flavor: options.flavor });
  }

  serialize(instance: unknown): StructuredValue {
    return flatToStructured(this.flat.serialize(instance));
  }

  serializeJson(instance: unknown): string {
    return JSON.stringify(
      this.serialize(instance),
      null,
      this.options.prettyPrint ? 2 : undefined,
    );
  }
}

export function serializeToStructured(
  instance: unknown,
  webTemplate: WebTemplate,
  options?: StructuredSerializerOptions,
): StructuredValue {
  return new StructuredSerializer(webTemplate, options).serialize(instance);
}

export function serializeToStructuredJson(
  instance: unknown,
  webTemplate: WebTemplate,
  options?: StructuredSerializerOptions,
): string {
  return new StructuredSerializer(webTemplate, options).serializeJson(instance);
}
