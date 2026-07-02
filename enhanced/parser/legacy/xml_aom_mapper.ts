/**
 * Map ADL 1.4 operational template XML (OPT) constraint nodes to AOM instances.
 */

import { XMLParser } from "fast-xml-parser";
import * as openehr_am from "../../openehr_am.ts";
import * as openehr_base from "../../openehr_base.ts";

export function parseLegacyTemplateXml(xml: string): Record<string, unknown> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    parseTagValue: true,
    trimValues: true,
    isArray: (_name, jpath) => {
      const p = jpath as string;
      return p.endsWith(".attributes") ||
        p.endsWith(".children") ||
        p.endsWith(".code_list") ||
        p.endsWith(".list") ||
        p.endsWith(".term_definitions") ||
        p.endsWith(".items");
    },
  });
  const doc = parser.parse(xml) as Record<string, unknown>;
  const root = doc.template ?? doc.OPERATIONALTEMPLATE ??
    doc.operationaltemplate;
  if (!root || typeof root !== "object") {
    throw new Error("Expected root <template> element");
  }
  return root as Record<string, unknown>;
}

export function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function textValue(node: unknown, key = "value"): string | undefined {
  if (node === undefined || node === null) return undefined;
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (typeof node === "object") {
    const rec = node as Record<string, unknown>;
    if (rec[key] !== undefined) return textValue(rec[key], key);
    if (rec.code_string !== undefined) return String(rec.code_string);
    const text = rec["#text"];
    if (text !== undefined && text !== null) {
      if (typeof text === "string" || typeof text === "number") return String(text);
      if (Array.isArray(text)) {
        const joined = text
          .map((part) => (typeof part === "string" || typeof part === "number"
            ? String(part)
            : ""))
          .join("")
          .trim();
        if (joined) return joined;
      }
    }
  }
  return undefined;
}

export function xsiType(node: Record<string, unknown>): string {
  const t = node["@_type"] ?? node["@_xsi:type"] ?? "";
  return String(t).replace(/^.*:/, "");
}

/** Store a plain number bound on a Multiplicity_interval (typed Integer). */
function setBound(
  m: openehr_base.Multiplicity_interval,
  key: "lower" | "upper",
  value: number,
): void {
  (m as unknown as Record<string, unknown>)[key] = value;
}

export function parseMultiplicity(
  node: unknown,
): openehr_base.Multiplicity_interval | undefined {
  if (!node || typeof node !== "object") return undefined;
  const n = node as Record<string, unknown>;
  const interval = (n.interval ?? n) as Record<string, unknown>;
  const m = new openehr_base.Multiplicity_interval();
  // Runtime convention: plain numbers in lower/upper (declared as Integer)
  if (interval.lower !== undefined) setBound(m, "lower", Number(interval.lower));
  if (interval.upper !== undefined) setBound(m, "upper", Number(interval.upper));
  if (interval.lower_unbounded !== undefined) {
    m.lower_unbounded = interval.lower_unbounded === true ||
      interval.lower_unbounded === "true";
  }
  if (interval.upper_unbounded !== undefined) {
    m.upper_unbounded = interval.upper_unbounded === true ||
      interval.upper_unbounded === "true";
  }
  if (interval.lower_included !== undefined) {
    m.lower_included = interval.lower_included === true ||
      interval.lower_included === "true";
  }
  if (interval.upper_included !== undefined) {
    m.upper_included = interval.upper_included === true ||
      interval.upper_included === "true";
  }
  return m;
}

export function parseCardinality(
  node: unknown,
): openehr_am.CARDINALITY | undefined {
  if (!node || typeof node !== "object") return undefined;
  const n = node as Record<string, unknown>;
  const card = new openehr_am.CARDINALITY();
  if (n.is_ordered !== undefined) {
    card.is_ordered = n.is_ordered === true || n.is_ordered === "true";
  }
  if (n.is_unique !== undefined) {
    card.is_unique = n.is_unique === true || n.is_unique === "true";
  }
  card.interval = parseMultiplicity(n.interval ?? n);
  return card;
}

function defaultContainerCardinality(): openehr_am.CARDINALITY {
  const card = new openehr_am.CARDINALITY();
  const interval = new openehr_base.Multiplicity_interval();
  setBound(interval, "lower", 0);
  interval.upper_unbounded = true;
  card.interval = interval;
  return card;
}

function mapPrimitiveType(xsi: string): string {
  const map: Record<string, string> = {
    C_DV_QUANTITY: "C_QUANTITY",
    C_QUANTITY: "C_QUANTITY",
    C_DV_CODED_TEXT: "C_CODED_TEXT",
    C_CODED_TEXT: "C_CODED_TEXT",
    C_CODE_PHRASE: "C_TERMINOLOGY_CODE",
    C_TERMINOLOGY_CODE: "C_TERMINOLOGY_CODE",
    C_DV_TEXT: "C_STRING",
    C_STRING: "C_STRING",
    C_INTEGER: "C_INTEGER",
    C_REAL: "C_REAL",
    C_BOOLEAN: "C_BOOLEAN",
    C_DV_DATE_TIME: "C_DATE_TIME",
    C_DATE_TIME: "C_DATE_TIME",
    C_DV_DATE: "C_DATE",
    C_DATE: "C_DATE",
    C_DV_TIME: "C_TIME",
    C_TIME: "C_TIME",
    C_DV_DURATION: "C_DURATION",
    C_DURATION: "C_DURATION",
    C_DV_ORDINAL: "C_ORDINAL",
    C_ORDINAL: "C_ORDINAL",
  };
  return map[xsi] ?? xsi;
}

export function parseCObject(node: unknown): openehr_am.C_OBJECT {
  if (!node || typeof node !== "object") {
    throw new Error("Invalid C_OBJECT node");
  }
  const n = node as Record<string, unknown>;
  const type = (xsiType(n) || amFieldString(n, "rm_type_name", "rmTypeName")) ??
    "C_COMPLEX_OBJECT";

  if (type === "C_ARCHETYPE_ROOT") {
    return parseCArchetypeRoot(n);
  }
  if (type === "C_COMPLEX_OBJECT" || !type.startsWith("C_")) {
    return parseCComplexObject(n);
  }

  const mapped = mapPrimitiveType(type);
  if (mapped === "C_QUANTITY") return parseCQuantity(n);
  if (mapped === "C_TERMINOLOGY_CODE") return parseCTerminologyCode(n);
  if (mapped === "C_CODED_TEXT") return parseCCodedText(n);
  // The primitive constraint classes do not extend C_OBJECT in the generated
  // model but carry equivalent runtime metadata (see ConstraintMeta).
  if (mapped === "C_STRING") {
    return parseCString(n) as unknown as openehr_am.C_OBJECT;
  }
  if (mapped === "C_INTEGER") {
    return parseCInteger(n) as unknown as openehr_am.C_OBJECT;
  }
  if (mapped === "C_REAL") {
    return parseCReal(n) as unknown as openehr_am.C_OBJECT;
  }
  if (mapped === "C_BOOLEAN") {
    return parseCBoolean(n) as unknown as openehr_am.C_OBJECT;
  }

  const fallback = new openehr_am.C_PRIMITIVE_OBJECT();
  fallback.rm_type_name = String(n.rm_type_name ?? type.replace(/^C_/, "DV_"));
  return fallback;
}

export function parseOccurrencesOrMultiplicity(
  val: unknown,
): openehr_base.Multiplicity_interval | undefined {
  if (typeof val === "string") {
    const s = val.trim();
    const star = s.match(/^(\d+|\*)\.\.(\d+|\*)$/);
    if (star) {
      const m = new openehr_base.Multiplicity_interval();
      const lo = star[1];
      const hi = star[2];
      if (lo === "*") m.lower_unbounded = true;
      else setBound(m, "lower", Number(lo));
      if (hi === "*") m.upper_unbounded = true;
      else setBound(m, "upper", Number(hi));
      return m;
    }
  }
  return parseMultiplicity(val);
}

function amFieldString(
  n: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const k of keys) {
    const v = n[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v);
    }
  }
  return undefined;
}

/**
 * Structural view of constraint-node metadata. The AM primitive constraint
 * classes (C_STRING, C_INTEGER, …) do not extend C_OBJECT in the generated
 * model, but the legacy OPT mapper decorates them with the same metadata at
 * runtime so downstream consumers can treat them uniformly.
 */
type ConstraintMeta = {
  occurrences?: openehr_base.Multiplicity_interval;
  rm_type_name?: string;
  node_id?: string;
  range?: openehr_base.Multiplicity_interval;
};

function meta(target: unknown): ConstraintMeta {
  return target as ConstraintMeta;
}

function applyOccurrence(
  target: ConstraintMeta,
  n: Record<string, unknown>,
): void {
  const rm = amFieldString(n, "rm_type_name", "rmTypeName");
  if (rm) target.rm_type_name = rm;
  const nodeId = amFieldString(n, "node_id", "nodeId");
  if (nodeId) target.node_id = nodeId;
  target.occurrences = parseOccurrencesOrMultiplicity(n.occurrences);
}

function parseCComplexObject(
  n: Record<string, unknown>,
): openehr_am.C_COMPLEX_OBJECT {
  const obj = new openehr_am.C_COMPLEX_OBJECT();
  applyOccurrence(obj, n);
  obj.attributes = asArray(n.attributes).map((attr) =>
    parseAttribute(attr, obj.rm_type_name)
  ).filter(
    Boolean,
  ) as openehr_am.C_ATTRIBUTE[];
  return obj;
}

function parseCArchetypeRoot(
  n: Record<string, unknown>,
): openehr_am.C_ARCHETYPE_ROOT {
  const root = new openehr_am.C_ARCHETYPE_ROOT();
  applyOccurrence(root, n);
  root.archetype_ref = textValue(n.archetype_id) ??
    textValue(n.archetype_ref) ??
    textValue(n.archetypeRef);
  root.attributes = asArray(n.attributes).map((attr) =>
    parseAttribute(attr, root.rm_type_name)
  ).filter(
    Boolean,
  ) as openehr_am.C_ATTRIBUTE[];
  return root;
}

const CONTAINER_RM_ATTRIBUTES: Record<string, string[]> = {
  COMPOSITION: ["content"],
  SECTION: ["items"],
  CLUSTER: ["items"],
  ITEM_TREE: ["items"],
  ITEM_LIST: ["items"],
  ITEM_TABLE: ["rows"],
  HISTORY: ["events"],
  EVENT: ["data", "state"],
  POINT_EVENT: ["data", "state"],
  INTERVAL_EVENT: ["data", "state"],
  INSTRUCTION: ["activities"],
};

function isContainerRmAttribute(
  parentRmType: string | undefined,
  attrName: string,
): boolean {
  if (!parentRmType) return false;
  return (CONTAINER_RM_ATTRIBUTES[parentRmType] ?? []).includes(attrName);
}

export function parseAttribute(
  node: unknown,
  parentRmType?: string,
): openehr_am.C_ATTRIBUTE | null {
  if (!node || typeof node !== "object") return null;
  const n = node as Record<string, unknown>;
  const type = xsiType(n);
  const attrName =
    amFieldString(n, "rm_attribute_name", "rmAttributeName") ?? "";
  const useMultiple = type === "C_MULTIPLE_ATTRIBUTE" ||
    ((type === "C_ATTRIBUTE" || type === "") &&
      isContainerRmAttribute(parentRmType, attrName));
  const attr = useMultiple
    ? new openehr_am.C_MULTIPLE_ATTRIBUTE()
    : new openehr_am.C_SINGLE_ATTRIBUTE();

  attr.rm_attribute_name = attrName;
  (attr as { existence?: openehr_base.Multiplicity_interval }).existence =
    parseOccurrencesOrMultiplicity(n.existence);

  if (attr instanceof openehr_am.C_MULTIPLE_ATTRIBUTE) {
    attr.cardinality = parseCardinality(n.cardinality) ??
      defaultContainerCardinality();
  }

  const children = asArray(n.children).map(parseCObject);
  if (children.length) {
    (attr as { children: openehr_am.C_OBJECT[] }).children = children;
  }
  return attr;
}

function parseCString(n: Record<string, unknown>): openehr_am.C_STRING {
  const s = new openehr_am.C_STRING();
  applyOccurrence(meta(s), n);
  if (!meta(s).rm_type_name) meta(s).rm_type_name = "STRING";
  if (n.pattern) s.pattern = String(n.pattern);
  const lists = asArray(n.list).map((x) =>
    String((x as Record<string, unknown>).value ?? x)
  );
  if (lists.length) (s as { list?: string[] }).list = lists;
  return s;
}

function constraintToRange(
  n: Record<string, unknown>,
): openehr_base.Multiplicity_interval | undefined {
  const direct = parseOccurrencesOrMultiplicity(n.range);
  if (direct) return direct;
  const constraints = asArray(n.constraint);
  if (!constraints.length) return undefined;
  const first = constraints[0];
  if (first && typeof first === "object") {
    return parseOccurrencesOrMultiplicity(first);
  }
  return undefined;
}

function parseCInteger(n: Record<string, unknown>): openehr_am.C_INTEGER {
  const i = new openehr_am.C_INTEGER();
  applyOccurrence(meta(i), n);
  if (!meta(i).rm_type_name) meta(i).rm_type_name = "INTEGER";
  meta(i).range = constraintToRange(n);
  return i;
}

function parseCReal(n: Record<string, unknown>): openehr_am.C_REAL {
  const r = new openehr_am.C_REAL();
  applyOccurrence(meta(r), n);
  if (!meta(r).rm_type_name) meta(r).rm_type_name = "REAL";
  meta(r).range = constraintToRange(n);
  return r;
}

function parseCBoolean(n: Record<string, unknown>): openehr_am.C_BOOLEAN {
  const b = new openehr_am.C_BOOLEAN();
  applyOccurrence(meta(b), n);
  if (n.true_valid !== undefined) {
    b.true_valid = n.true_valid === true || n.true_valid === "true";
  }
  if (n.false_valid !== undefined) {
    b.false_valid = n.false_valid === true || n.false_valid === "true";
  }
  return b;
}

function parseCTerminologyCode(
  n: Record<string, unknown>,
): openehr_am.C_TERMINOLOGY_CODE {
  const t = new openehr_am.C_TERMINOLOGY_CODE();
  applyOccurrence(t, n);
  t.rm_type_name = "CODE_PHRASE";

  const tid = n.terminology_id ?? n.terminologyId;
  if (typeof tid === "string") {
    (t as { terminology_id?: string }).terminology_id = tid;
  } else if (tid && typeof tid === "object") {
    const v = textValue(tid as Record<string, unknown>);
    if (v) (t as { terminology_id?: string }).terminology_id = v;
  }

  const fromList = asArray(n.code_list).map(String);
  const fromConstraint = asArray(n.constraint).filter((x) =>
    typeof x === "string"
  ).map(String);
  const codes = fromList.length ? fromList : fromConstraint;
  if (codes.length === 1) t.constraint = codes[0];

  if (!t.constraint) {
    const ext = asArray(n.includedExternalTerminologyCodes);
    for (const entry of ext) {
      if (!entry || typeof entry !== "object") continue;
      const code = (entry as Record<string, unknown>).code;
      if (code !== undefined) {
        t.constraint = String(code);
        break;
      }
    }
  }
  return t;
}

function parseCCodedText(n: Record<string, unknown>): openehr_am.C_CODED_TEXT {
  const c = new openehr_am.C_CODED_TEXT();
  applyOccurrence(c, n);
  return c;
}

function parseCQuantity(n: Record<string, unknown>): openehr_am.C_QUANTITY {
  const q = new openehr_am.C_QUANTITY();
  applyOccurrence(q, n);
  q.rm_type_name = "DV_QUANTITY";
  const prop = n.property as Record<string, unknown> | undefined;
  if (prop) {
    q.property = textValue(prop.code_string) ?? textValue(prop);
  }
  const items = asArray(n.list).map((entry) => {
    const item = new openehr_am.C_QUANTITY_ITEM();
    const rec = entry as Record<string, unknown>;
    item.units = String(rec.units ?? rec.value ?? entry);
    return item;
  });
  if (items.length) (q as { list?: openehr_am.C_QUANTITY_ITEM[] }).list = items;
  return q;
}

export function collectTermDefinitions(
  node: unknown,
  bag: Record<string, Record<string, { text?: string; description?: string }>>,
): void {
  if (!node || typeof node !== "object") return;
  const n = node as Record<string, unknown>;
  for (const td of asArray(n.term_definitions)) {
    const rec = td as Record<string, unknown>;
    const code = String(rec["@_code"] ?? rec.code ?? "");
    if (!code) continue;
    const items = asArray(rec.items);
    const entry: { text?: string; description?: string } = {};
    for (const it of items) {
      const item = it as Record<string, unknown>;
      const id = String(item["@_id"] ?? item.id ?? "");
      const val = textValue(item);
      if (!val) continue;
      if (id === "text") entry.text = val;
      if (id === "description") entry.description = val;
    }
    if (!bag.en) bag.en = {};
    bag.en[code] = entry;
  }
  for (const child of asArray(n.children)) collectTermDefinitions(child, bag);
  for (const attr of asArray(n.attributes)) {
    for (const c of asArray((attr as Record<string, unknown>).children)) {
      collectTermDefinitions(c, bag);
    }
  }
}
