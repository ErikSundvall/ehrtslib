/**
 * Extract typed attribute values from RM data-value objects for simplified formats.
 *
 * Field extraction is driven by the declarative per-type maps in
 * `dv_field_maps.ts` (derived from the ITS-REST simplified formats spec).
 * The returned record is keyed by pipe suffix; the empty-string key ""
 * denotes the bare path key (no `|suffix`).
 */

import { TypeRegistry } from "../common/type_registry.ts";
import type { WebTemplateInput } from "./types.ts";
import { extractFields, getFieldMap, rmProp } from "./dv_field_maps.ts";

type RmObject = Record<string, unknown>;

function rmTypeName(obj: unknown): string {
  if (obj == null || typeof obj !== "object") return "";
  const record = obj as RmObject;
  if (typeof record._type === "string") return record._type;
  return TypeRegistry.getTypeNameFromInstance(obj) ?? "";
}

/**
 * Map RM data value object to pipe-suffix keyed fields ("" = bare key).
 *
 * When `inputs` are provided, extraction is limited to the declared suffixes
 * (a declared input without `suffix` selects the bare field).
 */
export function extractValueFields(
  rmValue: unknown,
  inputs?: WebTemplateInput[],
): Record<string, string | number | boolean> {
  if (rmValue == null) return {};

  const type = rmTypeName(rmValue);
  let fields: Record<string, string | number | boolean>;

  if (getFieldMap(type)) {
    fields = extractFields(type, rmValue);
  } else {
    // Unknown type: try generic accessors guided by declared inputs.
    fields = {};
    const value = rmProp(rmValue, "value") ?? rmProp(rmValue, "id");
    if (
      value != null &&
      (typeof value === "string" || typeof value === "number" ||
        typeof value === "boolean")
    ) {
      fields[""] = value;
    }
    const magnitude = rmProp(rmValue, "magnitude");
    if (typeof magnitude === "number") fields.magnitude = magnitude;
    const units = rmProp(rmValue, "units");
    if (units != null) fields.unit = String(units);
  }

  if (!inputs?.length) return fields;

  const wanted = new Set(inputs.map((i) => i.suffix ?? ""));
  const out: Record<string, string | number | boolean> = {};
  for (const [suffix, v] of Object.entries(fields)) {
    if (wanted.has(suffix)) {
      out[suffix] = v;
    } else if (suffix === "" && wanted.has("value")) {
      // Legacy web templates declare an explicit "value" suffix for bare fields
      out.value = v;
    }
  }
  // Fall back to full extraction when the declared inputs matched nothing
  return Object.keys(out).length ? out : fields;
}

/** Extract ctx/composition-level scalar or coded value. */
export function extractContextField(
  instance: unknown,
  nodeId: string,
): Record<string, string | number | boolean> {
  if (rmTypeName(instance) !== "COMPOSITION") return {};

  if (nodeId === "composer_name") {
    const composer = rmProp(instance, "composer") as RmObject | undefined;
    const composerName = rmProp(composer, "name");
    return composerName != null ? { "": String(composerName) } : {};
  }

  if (nodeId === "time") {
    const ctx = rmProp(instance, "context") as RmObject | undefined;
    const t = rmProp(rmProp(ctx, "start_time"), "value");
    return t != null ? { "": String(t) } : {};
  }

  if (nodeId === "end_time") {
    const ctx = rmProp(instance, "context") as RmObject | undefined;
    const t = rmProp(rmProp(ctx, "end_time"), "value");
    return t != null ? { "": String(t) } : {};
  }

  if (nodeId === "location") {
    const ctx = rmProp(instance, "context") as RmObject | undefined;
    const loc = rmProp(ctx, "location");
    return loc != null ? { "": String(loc) } : {};
  }

  if (nodeId === "setting") {
    const ctx = rmProp(instance, "context") as RmObject | undefined;
    const setting = rmProp(ctx, "setting");
    if (setting == null) return {};
    return extractValueFields(setting);
  }

  const direct = rmProp(instance, nodeId);
  if (direct == null) {
    const ctx = rmProp(instance, "context") as RmObject | undefined;
    const ctxVal = ctx?.[nodeId];
    if (ctxVal != null) return extractValueFields(ctxVal);
    return {};
  }

  if (nodeId === "language" || nodeId === "territory") {
    const code = rmProp(direct, "code_string");
    return code != null ? { "": String(code) } : {};
  }

  return extractValueFields(direct);
}
