/**
 * FLAT/STRUCTURED flavours: `output` and `input`.
 *
 * Both flavours describe the same RM content and both are accepted by the
 * deserializers. They differ only in where RM-mandatory values that the
 * template does not constrain (the Web Template `inContext` nodes) are
 * written:
 *
 * - `output` (default): every value at its own path, no `ctx/` keys. This is
 *   the lossless form; a FLAT → RM → FLAT round trip keeps it unchanged.
 * - `input`: composition-level values go to `ctx/` and values that equal the
 *   defaults the deserializer would apply (entry language = composition
 *   language, encoding UTF-8, subject PARTY_SELF, event time = `ctx/time`, …)
 *   are left out. This is the short form people write by hand.
 *
 * @see docs/SIMPLIFIED_FORMATS.md "Input and output flavours"
 */

import { TypeRegistry } from "../common/type_registry.ts";
import { extractFields, rmProp } from "./dv_field_maps.ts";
import type { FlatPayload, WebTemplate, WebTemplateNode } from "./types.ts";

export type SimplifiedFlavor = "output" | "input";

type RmObject = Record<string, unknown>;

export function rmTypeOf(obj: unknown): string {
  if (obj == null || typeof obj !== "object") return "";
  const record = obj as RmObject;
  if (typeof record._type === "string") return record._type;
  return TypeRegistry.getTypeNameFromInstance(obj) ?? "";
}

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "object") {
    const inner = rmProp(v, "value");
    return inner == null ? undefined : String(inner);
  }
  return String(v);
}

/** Composition-level `inContext` paths that the input flavour writes as `ctx/`. */
export const COMPOSITION_CTX_PATHS = new Set([
  "/composer",
  "/language",
  "/territory",
  "/context/start_time",
  "/context/setting",
]);

/** PARTY_* fields (`name`, `id`, `id_scheme`, `id_namespace`). */
export function partyFields(
  party: unknown,
): Record<string, string | number | boolean> {
  return extractFields("PARTY_IDENTIFIED", party);
}

/** Template fixes the composition category to a single code. */
export function fixedCategoryCode(wt: WebTemplate): string | undefined {
  const node = wt.tree.children?.find((c) => c.aqlPath === "/category");
  const list = node?.inputs?.find((i) => i.list?.length)?.list;
  return list?.length === 1 ? list[0].value : undefined;
}

/** `ctx/` keys for the input flavour (composition-level values). */
export function inputContextFields(instance: unknown): FlatPayload {
  const out: FlatPayload = {};
  const lang = rmProp(rmProp(instance, "language"), "code_string");
  if (lang != null) out["ctx/language"] = String(lang);
  const terr = rmProp(rmProp(instance, "territory"), "code_string");
  if (terr != null) out["ctx/territory"] = String(terr);

  const composer = rmProp(instance, "composer");
  if (composer != null) {
    const f = partyFields(composer);
    if (rmTypeOf(composer) === "PARTY_SELF") out["ctx/composer_self"] = true;
    if (f.name != null) out["ctx/composer_name"] = f.name;
    if (f.id != null) out["ctx/composer_id"] = f.id;
    if (f.id_scheme != null) out["ctx/id_scheme"] = f.id_scheme;
    if (f.id_namespace != null) out["ctx/id_namespace"] = f.id_namespace;
  }

  const ctx = rmProp(instance, "context");
  if (ctx != null) {
    const time = str(rmProp(ctx, "start_time"));
    if (time != null) out["ctx/time"] = time;
    const end = str(rmProp(ctx, "end_time"));
    if (end != null) out["ctx/end_time"] = end;
    const location = rmProp(ctx, "location");
    if (location != null) out["ctx/location"] = String(location);
    const setting = rmProp(ctx, "setting");
    if (setting != null) {
      const f = extractFields("DV_CODED_TEXT", setting);
      if (f.value != null) out["ctx/setting"] = f.value;
      if (f.code != null) out["ctx/setting|code"] = f.code;
      if (f.terminology != null) out["ctx/setting|terminology"] = f.terminology;
    }
    const hcf = rmProp(ctx, "health_care_facility");
    if (hcf != null) {
      const f = partyFields(hcf);
      for (const [k, v] of Object.entries(f)) {
        out[`ctx/health_care_facility|${k}`] = v;
      }
    }
  }
  return out;
}

/**
 * Default ACTIVITY.action_archetype_id for a Web Template
 * `action_archetype_id` node: the template's pattern as `/pattern/`
 * (`inputs[0].defaultValue`), else the match-all pattern (spec ACTIVITY
 * table).
 */
export function actionArchetypeIdDefault(node: WebTemplateNode | undefined): string {
  const value = node?.inputs?.find((i) => i.defaultValue != null)?.defaultValue;
  return value != null ? String(value) : "/.*/";
}

/** `_null_flavour|…` and `_null_reason` of an ELEMENT without a value. */
export function nullFlavourFields(
  element: unknown,
): Array<[string, string | number | boolean]> {
  const out: Array<[string, string | number | boolean]> = [];
  const nf = rmProp(element, "null_flavour");
  if (nf != null) {
    const f = extractFields("DV_CODED_TEXT", nf);
    for (const suffix of ["code", "value", "terminology"]) {
      if (f[suffix] != null) out.push([`_null_flavour|${suffix}`, f[suffix]]);
    }
  }
  const reason = str(rmProp(element, "null_reason"));
  if (reason != null) out.push(["_null_reason", reason]);
  return out;
}

/**
 * Decides which `inContext` values the input flavour leaves out because the
 * deserializer would restore them from `ctx/` or from a default.
 */
export class InputFlavorPolicy {
  private language?: string;
  private ctxTime?: string;
  private fixedCategory?: string;

  constructor(instance: unknown, wt: WebTemplate) {
    this.language = str(rmProp(rmProp(instance, "language"), "code_string"));
    this.ctxTime = str(rmProp(rmProp(instance, "context"), "start_time"));
    this.fixedCategory = fixedCategoryCode(wt);
  }

  /** True when the input flavour omits this node's value. */
  omit(node: WebTemplateNode, data: unknown, ancestors: unknown[]): boolean {
    if (COMPOSITION_CTX_PATHS.has(node.aqlPath)) return true;
    if (node.aqlPath === "/category") {
      const code = rmProp(rmProp(data, "defining_code"), "code_string");
      return this.fixedCategory != null && String(code) === this.fixedCategory;
    }
    const owner = ancestors[ancestors.length - 1];
    const ownerType = rmTypeOf(owner);
    switch (node.id) {
      case "action_archetype_id":
        return data === actionArchetypeIdDefault(node);
      case "language":
        return node.rmType === "CODE_PHRASE" &&
          str(rmProp(data, "code_string")) === this.language;
      case "encoding":
        return str(rmProp(data, "code_string")) === "UTF-8";
      case "subject":
        return rmTypeOf(data) === "PARTY_SELF" &&
          rmProp(data, "external_ref") == null;
      case "history_origin": {
        const obs = ownerType === "OBSERVATION" ? owner : undefined;
        if (!obs) return false;
        if (this.allTimesEqualCtx(obs)) return true;
        const times = eventTimes(obs);
        return times.length > 0 && str(data) === times.slice().sort()[0];
      }
      case "time": {
        if (node.rmType !== "DV_DATE_TIME") return false;
        if (ownerType === "ACTION") {
          return this.ctxTime != null && str(data) === this.ctxTime;
        }
        const obs = [...ancestors].reverse().find((a) =>
          rmTypeOf(a) === "OBSERVATION"
        );
        return obs != null && this.allTimesEqualCtx(obs);
      }
    }
    return false;
  }

  /** HISTORY origin and all event times equal `ctx/time`. */
  private allTimesEqualCtx(obs: unknown): boolean {
    if (this.ctxTime == null) return false;
    const history = rmProp(obs, "data");
    if (str(rmProp(history, "origin")) !== this.ctxTime) return false;
    return eventTimes(obs).every((t) => t === this.ctxTime);
  }
}

function eventTimes(obs: unknown): string[] {
  const events = rmProp(rmProp(obs, "data"), "events");
  if (!Array.isArray(events)) return [];
  return events.map((e) => str(rmProp(e, "time"))).filter((t): t is string =>
    t != null
  );
}
