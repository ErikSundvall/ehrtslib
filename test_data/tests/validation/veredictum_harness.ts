/**
 * Shared helpers for driving ehrtslib validators from Veredictum CNF content
 * cases and composition/FLAT fixtures.
 */

import { parse as parseYaml } from "https://deno.land/std@0.220.0/yaml/mod.ts";
import * as openehr_am from "../../../am/openehr_am.ts";
import * as openehr_base from "../../../base/openehr_base.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "../../../generation/rm_instance_generator.ts";
import {
  TemplateValidator,
  type ValidationResult,
} from "../../../validation/template_validator.ts";

export const VEREDICTUM_ROOT = new URL("../../veredictum/", import.meta.url);

export interface ContentCase {
  id: string;
  kind?: string;
  rm_class?: string;
  status?: string;
  constraint_context?: {
    template?: string;
    path?: string;
    constraint_columns?: string[];
  };
  decision_table?: {
    columns: string[];
    rows: unknown[][];
  };
}

export interface DecisionRow {
  values: Record<string, unknown>;
  expected: "accepted" | "rejected";
  violates: string[];
}

const SKIPPED_COLUMNS = new Set([
  "expected",
  "violates",
  "C_BOOLEAN.true_valid",
  "C_BOOLEAN.false_valid",
  "C_CODE_PHRASE.code_list",
  "C_CODE_PHRASE.terminology_id",
]);

export async function loadTemplateMap(): Promise<Record<string, string>> {
  const text = await Deno.readTextFile(
    new URL("template_map.json", VEREDICTUM_ROOT),
  );
  return JSON.parse(text) as Record<string, string>;
}

export async function listContentCases(): Promise<string[]> {
  const names: string[] = [];
  const dir = new URL("content/", VEREDICTUM_ROOT);
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(".yaml")) names.push(entry.name);
  }
  return names.sort();
}

export async function loadContentCase(name: string): Promise<ContentCase> {
  const text = await Deno.readTextFile(
    new URL(`content/${name}`, VEREDICTUM_ROOT),
  );
  return parseYaml(text) as ContentCase;
}

export function parseDecisionRows(c: ContentCase): DecisionRow[] {
  const table = c.decision_table;
  if (!table?.columns?.length || !table.rows?.length) return [];
  const expectedIdx = table.columns.indexOf("expected");
  const violatesIdx = table.columns.indexOf("violates");
  return table.rows.map((row) => {
    const values: Record<string, unknown> = {};
    for (let i = 0; i < table.columns.length; i++) {
      values[table.columns[i]] = row[i];
    }
    const expectedRaw = expectedIdx >= 0 ? row[expectedIdx] : "accepted";
    const expected = String(expectedRaw) === "rejected" ? "rejected" : "accepted";
    const violatesRaw = violatesIdx >= 0 ? row[violatesIdx] : [];
    const violates = Array.isArray(violatesRaw)
      ? violatesRaw.map((v) => String(v))
      : [];
    return { values, expected, violates };
  });
}

const optXmlCache = new Map<string, string>();

export async function loadOpt(
  templateId: string,
  map: Record<string, string>,
): Promise<openehr_am.OPERATIONAL_TEMPLATE> {
  const fname = map[templateId] ??
    `${templateId.replace(/^cnf\.tpl\./, "")}.opt`;
  let xml = optXmlCache.get(fname);
  if (!xml) {
    xml = await Deno.readTextFile(
      new URL(`templates/${fname}`, VEREDICTUM_ROOT),
    );
    optXmlCache.set(fname, xml);
  }
  // Re-parse each call so cardinality/pattern overlays cannot leak across rows.
  return parseOptXml(xml).operationalTemplate;
}

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function validateAgainstOpt(
  instance: unknown,
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): ValidationResult {
  const validator = new TemplateValidator({
    failFast: false,
    validateUnits: false,
    validateTerminology: true,
    useTypeRegistry: true,
    validateIntervals: false,
    validateRMSpecification: true,
    validateInvariants: true,
  });
  return validator.validate(instance, opt);
}

export function setObservationValue(
  instance: Record<string, unknown>,
  value: unknown,
): void {
  const content = asArray(instance.content);
  const obs = content[0] as Record<string, unknown> | undefined;
  if (!obs) return;
  const data = obs.data as Record<string, unknown> | undefined;
  const events = asArray(data?.events);
  const event = events[0] as Record<string, unknown> | undefined;
  const tree = event?.data as Record<string, unknown> | undefined;
  const items = asArray(tree?.items);
  const element = items[0] as Record<string, unknown> | undefined;
  if (!element) return;
  if (value === undefined) delete element.value;
  else element.value = value;
}

export function setContentCount(
  instance: Record<string, unknown>,
  count: number,
): void {
  const content = asArray(instance.content);
  const proto = content[0];
  if (count <= 0) {
    delete instance.content;
    return;
  }
  if (!proto) return;
  instance.content = Array.from({ length: count }, () => cloneJson(proto));
}

export function setContextMode(
  instance: Record<string, unknown>,
  mode: unknown,
): void {
  if (mode === "absent" || mode === null) {
    delete instance.context;
    return;
  }
  const ctx = (instance.context ?? {}) as Record<string, unknown>;
  if (mode === "present_with_other") {
    ctx.other_context = ctx.other_context ?? {
      _type: "ITEM_TREE",
      name: { _type: "DV_TEXT", value: "other" },
      items: [],
    };
  }
  instance.context = ctx;
}

export function overlayCardinality(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  attrName: string,
  token: unknown,
): void {
  const interval = cardinalityToken(String(token ?? ""));
  if (!interval || !opt.definition) return;
  const attr = opt.definition.attributes?.find((a) =>
    a.rm_attribute_name === attrName
  );
  if (!(attr instanceof openehr_am.C_MULTIPLE_ATTRIBUTE)) return;
  const card = attr.cardinality ?? new openehr_am.CARDINALITY();
  const m = new openehr_base.Multiplicity_interval();
  (m as unknown as { lower?: number }).lower = interval.lower;
  if (interval.upper === undefined) {
    m.upper_unbounded = true;
  } else {
    (m as unknown as { upper?: number }).upper = interval.upper;
    m.upper_unbounded = false;
  }
  card.interval = m;
  attr.cardinality = card;
}

export function overlayStringPattern(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
  pattern: unknown,
): void {
  if (typeof pattern !== "string") return;
  const valueNode = observationValueConstraint(opt.definition);
  if (!valueNode) return;
  const str = findStringConstraint(valueNode);
  if (str) {
    str.pattern = pattern;
    // Pattern overlays replace a list constraint on the same C_STRING.
    (str as { list?: string[] }).list = undefined;
  }
}

function findStringConstraint(
  node: openehr_am.C_OBJECT,
): openehr_am.C_STRING | undefined {
  if (node instanceof openehr_am.C_STRING) return node;
  if (
    node instanceof openehr_am.C_PRIMITIVE_OBJECT &&
    node.item instanceof openehr_am.C_STRING
  ) {
    return node.item;
  }
  if (node instanceof openehr_am.C_COMPLEX_OBJECT) {
    const valueAttr = node.attributes?.find((a) =>
      a.rm_attribute_name === "value"
    );
    for (const child of valueAttr?.children ?? []) {
      const found = findStringConstraint(child);
      if (found) return found;
    }
  }
  return undefined;
}

function observationValueConstraint(
  root?: openehr_am.C_COMPLEX_OBJECT,
): openehr_am.C_OBJECT | undefined {
  if (!root) return undefined;
  const walk = (
    obj: openehr_am.C_COMPLEX_OBJECT,
    attr: string,
  ): openehr_am.C_OBJECT | undefined => {
    const a = obj.attributes?.find((x) => x.rm_attribute_name === attr);
    return a?.children?.[0];
  };
  const content = walk(root, "content");
  if (!(content instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
  const data = walk(content, "data");
  if (!(data instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
  const events = walk(data, "events");
  if (!(events instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
  const eventData = walk(events, "data");
  if (!(eventData instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
  const items = walk(eventData, "items");
  if (!(items instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
  return walk(items, "value");
}

function cardinalityToken(
  token: string,
): { lower: number; upper?: number } | undefined {
  switch (token) {
    case "3to5":
      return { lower: 3, upper: 5 };
    case "mand":
      return { lower: 1, upper: 1 };
    case "opt":
      return { lower: 0, upper: 1 };
    case "any":
      return { lower: 0 };
    case "1plus":
      return { lower: 1 };
    case "3plus":
      return { lower: 3 };
    default:
      return undefined;
  }
}

export function buildDvValue(
  rmClass: string | undefined,
  caseId: string,
  row: Record<string, unknown>,
): unknown {
  const cls = rmClass ?? "";
  if (cls === "DV_COUNT") {
    return omitNulls({ _type: "DV_COUNT", magnitude: row.magnitude });
  }
  if (cls === "DV_BOOLEAN") {
    return omitNulls({ _type: "DV_BOOLEAN", value: row.value });
  }
  if (cls === "DV_TEXT") {
    return omitNulls({ _type: "DV_TEXT", value: row.value });
  }
  if (cls === "DV_URI") {
    return omitNulls({ _type: "DV_URI", value: row.value });
  }
  if (cls === "DV_EHR_URI") {
    return omitNulls({ _type: "DV_EHR_URI", value: row.value });
  }
  if (cls === "DV_DATE") {
    return omitNulls({ _type: "DV_DATE", value: row.value ?? row.date });
  }
  if (cls === "DV_TIME") {
    return omitNulls({ _type: "DV_TIME", value: row.value ?? row.time });
  }
  if (cls === "DV_DATE_TIME") {
    return omitNulls({
      _type: "DV_DATE_TIME",
      value: row.value ?? row.date_time,
    });
  }
  if (cls === "DV_DURATION") {
    return omitNulls({ _type: "DV_DURATION", value: row.value ?? row.duration });
  }
  if (cls === "DV_QUANTITY") {
    return omitNulls({
      _type: "DV_QUANTITY",
      magnitude: row.magnitude,
      units: row.units,
    });
  }
  if (cls === "DV_PROPORTION") {
    return omitNulls({
      _type: "DV_PROPORTION",
      type: row.type,
      numerator: row.numerator,
      denominator: row.denominator,
      precision: row.precision,
    });
  }
  if (cls === "DV_CODED_TEXT") {
    const code = codedTextFromRow(row);
    return omitNulls(code);
  }
  if (cls === "DV_ORDINAL" || cls === "DV_SCALE") {
    return ordinalFromRow(cls, row);
  }
  if (cls === "DV_IDENTIFIER") {
    return omitNulls({
      _type: "DV_IDENTIFIER",
      id: row.id ?? row.value,
      issuer: row.issuer,
      assigner: row.assigner,
      type: row.type,
    });
  }
  if (cls === "DV_PARSABLE") {
    return omitNulls({
      _type: "DV_PARSABLE",
      value: row.value,
      formalism: row.formalism,
    });
  }
  if (cls === "DV_MULTIMEDIA") {
    return omitNulls({
      _type: "DV_MULTIMEDIA",
      media_type: mediaTypeFromRow(row),
      size: row.size,
      data: row.data ?? "AA==",
    });
  }
  if (cls === "DV_INTERVAL" || caseId.includes("DV_INTERVAL")) {
    return intervalFromRow(caseId, row);
  }
  return omitNulls({ _type: cls || "DATA_VALUE", ...withoutMeta(row) });
}

function codedTextFromRow(row: Record<string, unknown>): Record<string, unknown> {
  const codeString = row.code_string as string | null | undefined;
  const terminology = row.terminology_id as string | null | undefined;
  const defining = codeString == null && terminology == null
    ? undefined
    : omitNulls({
      _type: "CODE_PHRASE",
      terminology_id: terminology == null ? undefined : {
        _type: "TERMINOLOGY_ID",
        value: terminology,
      },
      code_string: codeString ?? undefined,
    });
  return {
    _type: "DV_CODED_TEXT",
    defining_code: defining,
    value: row.value,
  };
}

function ordinalFromRow(
  cls: string,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const symbolRaw = String(row.symbol ?? "");
  const parts = symbolRaw.split("::");
  const terminology = parts.length > 1 ? parts[0] : "local";
  const code = parts.length > 1 ? parts[1] : symbolRaw;
  return omitNulls({
    _type: cls,
    value: row.value,
    symbol: code
      ? {
        _type: "DV_CODED_TEXT",
        defining_code: {
          _type: "CODE_PHRASE",
          terminology_id: { value: terminology },
          code_string: code,
        },
        value: code,
      }
      : undefined,
  });
}

function mediaTypeFromRow(row: Record<string, unknown>): unknown {
  if (row.media_type && typeof row.media_type === "object") return row.media_type;
  if (typeof row.media_type === "string") {
    return {
      _type: "CODE_PHRASE",
      terminology_id: { value: "IANA_media-types" },
      code_string: row.media_type,
    };
  }
  return undefined;
}

function intervalFromRow(
  caseId: string,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const inner = intervalInnerType(caseId);
  const wrap = (bound: unknown) => {
    if (bound === null || bound === undefined) return undefined;
    if (inner === "DV_COUNT") {
      return { _type: "DV_COUNT", magnitude: bound };
    }
    if (inner === "DV_QUANTITY") {
      if (bound && typeof bound === "object") {
        return { _type: "DV_QUANTITY", ...(bound as object) };
      }
      return { _type: "DV_QUANTITY", magnitude: bound, units: row.units ?? "cm" };
    }
    if (inner === "DV_DATE") return { _type: "DV_DATE", value: bound };
    if (inner === "DV_TIME") return { _type: "DV_TIME", value: bound };
    if (inner === "DV_DATE_TIME") return { _type: "DV_DATE_TIME", value: bound };
    if (inner === "DV_DURATION") return { _type: "DV_DURATION", value: bound };
    if (inner === "DV_ORDINAL" || inner === "DV_SCALE") {
      return ordinalFromRow(inner, {
        value: bound,
        symbol: row.symbol ?? "local::at0005",
      });
    }
    if (inner === "DV_PROPORTION") {
      return {
        _type: "DV_PROPORTION",
        type: row.type ?? 0,
        numerator: bound,
        denominator: row.denominator ?? 1,
      };
    }
    return bound;
  };
  return omitNulls({
    _type: "DV_INTERVAL",
    lower: wrap(row.lower),
    upper: wrap(row.upper),
    lower_unbounded: row.lower_unbounded,
    upper_unbounded: row.upper_unbounded,
    lower_included: row.lower_included,
    upper_included: row.upper_included,
  });
}

function intervalInnerType(caseId: string): string {
  if (caseId.includes("DV_COUNT")) return "DV_COUNT";
  if (caseId.includes("DV_QUANTITY")) return "DV_QUANTITY";
  if (caseId.includes("DV_DATE_TIME")) return "DV_DATE_TIME";
  if (caseId.includes("DV_DATE")) return "DV_DATE";
  if (caseId.includes("DV_TIME")) return "DV_TIME";
  if (caseId.includes("DV_DURATION")) return "DV_DURATION";
  if (caseId.includes("DV_ORDINAL")) return "DV_ORDINAL";
  if (caseId.includes("DV_SCALE")) return "DV_SCALE";
  if (caseId.includes("DV_PROPORTION")) return "DV_PROPORTION";
  return "DATA_VALUE";
}

export function generateBaseInstance(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): Record<string, unknown> {
  return new RMInstanceGenerator({ mode: "example" }).generate(opt) as Record<
    string,
    unknown
  >;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function omitNulls(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

function withoutMeta(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (SKIPPED_COLUMNS.has(k) || k.startsWith("C_")) continue;
    out[k] = v;
  }
  return out;
}

export function isDvCase(rmClass?: string, id?: string): boolean {
  return (rmClass ?? "").startsWith("DV_") ||
    (id ?? "").includes("-DV_");
}

export function outcomeMatches(
  result: ValidationResult,
  expected: "accepted" | "rejected",
): boolean {
  return expected === "accepted" ? result.valid : !result.valid;
}
