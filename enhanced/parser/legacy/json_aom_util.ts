/**
 * Shared helpers for Archetype Designer / Better `.t.json` (JSON AOM) parsing.
 */

import * as openehr_base from "../../openehr_base.ts";
import { parseMultiplicity, textValue, asArray } from "./xml_aom_mapper.ts";

export function jsonType(node: Record<string, unknown>): string {
  const t = node["@type"] ?? node["@_type"] ?? "";
  return String(t).replace(/^.*:/, "");
}

/** Normalize JSON nodes for reuse of XML-oriented parsers (`@_type`). */
export function normalizeJsonNode(node: Record<string, unknown>): Record<string, unknown> {
  const out = { ...node };
  if (out["@type"] && !out["@_type"]) out["@_type"] = out["@type"];
  return out;
}

export function parseOccurrencesField(
  val: unknown,
): openehr_base.Multiplicity_interval | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "string") {
    const s = val.trim();
    const star = s.match(/^(\d+|\*)\.\.(\d+|\*)$/);
    if (star) {
      const m = new openehr_base.Multiplicity_interval();
      const lo = star[1];
      const hi = star[2];
      if (lo === "*") m.lower_unbounded = true;
      else m.lower = Number(lo);
      if (hi === "*") m.upper_unbounded = true;
      else m.upper = Number(hi);
      return m;
    }
  }
  return parseMultiplicity(val);
}

export function parseArchetypeIdField(
  node: unknown,
): openehr_base.ARCHETYPE_ID | undefined {
  if (!node) return undefined;
  if (typeof node === "string") {
    const id = new openehr_base.ARCHETYPE_ID();
    id.value = node;
    return id;
  }
  if (typeof node === "object") {
    const rec = node as Record<string, unknown>;
    const v = textValue(rec.value) ?? textValue(rec);
    if (v) {
      const id = new openehr_base.ARCHETYPE_ID();
      id.value = v;
      return id;
    }
  }
  return undefined;
}

export function parseCodePhrase(node: unknown): openehr_base.CODE_PHRASE | undefined {
  if (!node || typeof node !== "object") return undefined;
  const n = node as Record<string, unknown>;
  const cp = new openehr_base.CODE_PHRASE();
  if (n.codeString !== undefined) cp.code_string = String(n.codeString);
  if (n.code_string !== undefined) cp.code_string = String(n.code_string);
  const tid = n.terminologyId ?? n.terminology_id;
  if (tid && typeof tid === "object") {
    const t = tid as Record<string, unknown>;
    const termId = new openehr_base.TERMINOLOGY_ID();
    termId.value = textValue(t.value) ?? String(t.value ?? "");
    cp.terminology_id = termId;
  }
  return cp;
}
