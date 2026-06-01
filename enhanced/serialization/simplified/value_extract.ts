/**
 * Extract typed attribute values from RM data-value objects for simplified formats.
 */

import type { WebTemplateInput } from "./types.ts";

type RmObject = Record<string, unknown>;

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  return String(v);
}

function num(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v !== "") return Number(v);
  return undefined;
}

/** Map RM data value object to pipe-suffix keyed fields. */
export function extractValueFields(
  rmValue: unknown,
  inputs?: WebTemplateInput[],
): Record<string, string | number | boolean> {
  if (rmValue == null) return {};

  const obj = rmValue as RmObject;
  const type = str(obj._type) ?? "";
  const out: Record<string, string | number | boolean> = {};

  const suffixes = inputs?.map((i) => i.suffix).filter(Boolean) as string[] | undefined;

  const add = (suffix: string, value: unknown) => {
    if (value == null) return;
    if (typeof value === "boolean" || typeof value === "number") {
      out[suffix] = value;
    } else {
      out[suffix] = String(value);
    }
  };

  if (type === "DV_QUANTITY") {
    add("magnitude", obj.magnitude);
    add("unit", obj.units);
  } else if (type === "DV_CODED_TEXT") {
    const code = obj.defining_code as RmObject | undefined;
    add("code", code?.code_string);
    add("value", obj.value);
    add("terminology", (code?.terminology_id as RmObject | undefined)?.value);
  } else if (type === "CODE_PHRASE") {
    add("code", obj.code_string);
    add("terminology", (obj.terminology_id as RmObject | undefined)?.value);
  } else if (type === "DV_DATE_TIME" || type === "DV_DATE" || type === "DV_TIME" || type === "DV_DURATION") {
    add("value", obj.value);
  } else if (type === "DV_BOOLEAN") {
    add("value", obj.value);
  } else if (type === "DV_TEXT" || type === "DV_URI" || type === "DV_EHR_URI" || type === "DV_IDENTIFIER") {
    add("value", obj.value ?? obj.id);
  } else if (type === "DV_COUNT" || type === "DV_PROPORTION") {
    add("magnitude", obj.magnitude ?? obj.numerator);
    if (obj.units) add("unit", obj.units);
  } else {
    // Fallback: honour declared inputs or generic value
    if (suffixes?.length) {
      for (const s of suffixes) {
        if (s === "value") add("value", obj.value);
        else if (s === "code") add("code", (obj.defining_code as RmObject)?.code_string ?? obj.code_string);
        else if (s === "terminology") {
          add("terminology", (obj.terminology_id as RmObject)?.value ??
            ((obj.defining_code as RmObject)?.terminology_id as RmObject)?.value);
        } else if (s === "magnitude") add("magnitude", num(obj.magnitude));
        else if (s === "unit") add("unit", obj.units);
      }
    } else if (obj.value != null) {
      add("value", obj.value);
    }
  }

  return out;
}

/** Extract ctx/composition-level scalar or coded value. */
export function extractContextField(
  instance: unknown,
  nodeId: string,
): Record<string, string | number | boolean> {
  const comp = instance as RmObject;
  if (!comp || comp._type !== "COMPOSITION") return {};

  if (nodeId === "composer_name") {
    const name = (comp.composer as RmObject | undefined)?.name;
    return name != null ? { value: String(name) } : {};
  }

  if (nodeId === "time") {
    const ctx = comp.context as RmObject | undefined;
    const t = (ctx?.start_time as RmObject | undefined)?.value;
    return t != null ? { value: String(t) } : {};
  }

  const direct = comp[nodeId];
  if (direct == null) {
    const ctx = comp.context as RmObject | undefined;
    const ctxVal = ctx?.[nodeId];
    if (ctxVal != null) return extractValueFields(ctxVal);
    return {};
  }

  if (nodeId === "language" || nodeId === "territory") {
    const code = (direct as RmObject).code_string;
    return code != null ? { value: String(code) } : {};
  }

  return extractValueFields(direct);
}
