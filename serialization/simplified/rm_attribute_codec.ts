/**
 * RM attributes in FLAT/STRUCTURED paths: the `_<attribute>` rule.
 *
 * A path segment `_<name>` addresses the RM attribute `<name>` of the object
 * at that path (spec "RM Attributes prefix"). ehrtslib applies the rule to
 * every RM attribute that has no Web Template node and no form of its own,
 * driven by the BMM attribute tables in `meta/`:
 *
 * - Each RM type has a FLAT form: `|suffix` fields and plain sub-paths, as
 *   the spec's "RM Mappings" tables define them (LINK `|type|meaning|target`,
 *   PARTICIPATION `|function|mode|name|id…`, FEEDER_AUDIT
 *   `/originating_system_audit`, DV_INTERVAL `/lower` `/upper`, …). Types
 *   without a table have no fields and no plain sub-paths.
 * - Every other set attribute is written as `/_<name>`; container attributes
 *   get `:i` and a singular name (`links` → `_link:0`, `participations` →
 *   `_participation:0`). The value is written with the form of its own type,
 *   recursively.
 * - `|_type` names the RM type when it cannot be inferred from the declared
 *   type and the fields. `|raw` (canonical JSON) is the last resort for a
 *   value that the paths cannot carry exactly.
 *
 * Writing checks that reading gives back the same value, so RM → FLAT → RM
 * keeps every attribute the model declares.
 *
 * @see docs/vendor/simplified_formats.md "RM Attributes prefix", "RM Mappings"
 * @see docs/SIMPLIFIED_FORMATS.md "RM attributes (`_` prefix)"
 */

import { TypeRegistry } from "../common/type_registry.ts";
import {
  attributesFor,
  hasRmType,
  isAbstractType,
  isSubtypeOf,
  type RmAttributeMeta,
  subtypesOf,
} from "../../meta/mod.ts";
import {
  buildDvValue,
  type FieldKind,
  getFieldMap,
  rmProp,
  rmPropAtPath,
} from "./dv_field_maps.ts";
import {
  openEhrGroupCode,
  PARTICIPATION_MODE_GROUP,
} from "../../term/openehr_group_rubrics.ts";

type RmObject = Record<string, unknown>;
export type FlatPrimitive = string | number | boolean;
/** A FLAT field value: a primitive, or a canonical JSON object for `|raw`. */
export type FlatFieldValue = FlatPrimitive | RmObject;

/** Child attribute of a {@link FlatTree}: items by `:i` index. */
export interface FlatTreeChild {
  /** Written with `:i` (container attribute). */
  multi: boolean;
  items: (FlatTree | undefined)[];
}

/**
 * FLAT keys below one path, as a tree: `fields` are the `|suffix` values
 * ("" = bare key), `children` the `/segment` sub-paths by segment name as
 * written (`_link`, `lower`, …).
 */
export interface FlatTree {
  fields: Record<string, FlatFieldValue>;
  children: Map<string, FlatTreeChild>;
}

export function newFlatTree(): FlatTree {
  return { fields: {}, children: new Map() };
}

// --- Types -------------------------------------------------------------------

const PRIMITIVE_TYPES = new Set([
  "String",
  "Integer",
  "Integer64",
  "Real",
  "Double",
  "Boolean",
  "Character",
  "Octet",
  "ISO8601_DATE",
  "ISO8601_DATE_TIME",
  "ISO8601_TIME",
  "ISO8601_DURATION",
  "URI",
  "STRING",
]);

const CONTAINER_RE = /^(List|Set|Array)<(.+)>$/;

/** `List<LINK>` → container of `LINK`; `Hash<…>` is not supported. */
function parseAttrType(typeName: string): { container: boolean; elem: string } {
  const m = CONTAINER_RE.exec(typeName);
  return m ? { container: true, elem: m[2] } : { container: false, elem: typeName };
}

/** `DV_INTERVAL<DV_QUANTITY>` → `DV_INTERVAL`. */
export function baseType(typeName: string): string {
  const i = typeName.indexOf("<");
  return i === -1 ? typeName : typeName.slice(0, i);
}

function genericParam(typeName: string): string | undefined {
  const m = /^[A-Za-z0-9_]+<(.+)>$/.exec(typeName);
  return m ? m[1] : undefined;
}

function isTypeParameter(typeName: string): boolean {
  return /^[A-Z]$/.test(typeName);
}

function isPrimitiveType(typeName: string): boolean {
  return PRIMITIVE_TYPES.has(baseType(typeName));
}

export function rmTypeOfValue(obj: unknown): string {
  if (obj == null || typeof obj !== "object") return "";
  const record = obj as RmObject;
  if (typeof record._type === "string") return record._type;
  return TypeRegistry.getTypeNameFromInstance(obj) ?? "";
}

/** Declared type with type parameters resolved (`T` → param). */
function resolveDeclared(declared: string, param?: string): string {
  if (isTypeParameter(declared)) return param ?? "DATA_VALUE";
  return declared;
}

/**
 * Type parameter for an attribute value: `DV_INTERVAL<X>` → X; `T` → the
 * owner's parameter; an interval or reference range on an ordered value
 * without a concrete parameter takes the owner's type (spec:
 * `/_normal_range` is `DV_INTERVAL<DV_QUANTITY>` on a DV_QUANTITY).
 */
function paramFor(elemType: string, ownerType: string, ownerParam?: string): string | undefined {
  if (isTypeParameter(elemType)) return genericParam(ownerParam ?? "") ?? ownerParam;
  let p = genericParam(elemType);
  if (p && isTypeParameter(p)) p = ownerParam;
  const base = baseType(elemType);
  if (base === "DV_INTERVAL" || base === "REFERENCE_RANGE") {
    const ownerBase = baseType(ownerType);
    if ((!p || isAbstractType(baseType(p))) && hasRmType(ownerBase) && isSubtypeOf(ownerBase, "DV_ORDERED")) {
      return ownerBase;
    }
    if (!p) return ownerParam;
  }
  return p;
}

/** Type parameter of a value: its own concrete one, else the one passed in. */
function ownParamOf(type: string, declared: string, param?: string): string | undefined {
  const g = genericParam(type) ?? (baseType(declared) === baseType(type) ? genericParam(declared) : undefined);
  if (!g || isTypeParameter(g) || (param && isAbstractType(baseType(g)))) return param ?? g;
  return g;
}

// --- Attribute names ---------------------------------------------------------

/** FLAT names that differ from the RM attribute name (spec tables). */
const FLAT_NAME_OF: Record<string, string> = {
  workflow_id: "work_flow_id",
};
const RM_NAME_OF: Record<string, string> = Object.fromEntries(
  Object.entries(FLAT_NAME_OF).map(([rm, flat]) => [flat, rm]),
);
/** Container attributes the spec writes in plural (`_other_reference_ranges:i`). */
const KEEP_PLURAL = new Set(["other_reference_ranges"]);

function singular(name: string): string {
  if (KEEP_PLURAL.has(name)) return name;
  if (name.endsWith("ies")) return `${name.slice(0, -3)}y`;
  if (name.endsWith("s") && !name.endsWith("ss")) return name.slice(0, -1);
  return name;
}

/** FLAT segment name (without `_`) for an RM attribute. */
export function flatAttributeName(meta: RmAttributeMeta): string {
  const alias = FLAT_NAME_OF[meta.name];
  if (alias) return alias;
  return parseAttrType(meta.typeName).container ? singular(meta.name) : meta.name;
}

function attributeMap(rmType: string): Map<string, RmAttributeMeta> {
  let map = ATTR_CACHE.get(rmType);
  if (!map) {
    map = new Map(attributesFor(baseType(rmType)).map((a) => [a.name, a]));
    ATTR_CACHE.set(rmType, map);
  }
  return map;
}
const ATTR_CACHE = new Map<string, Map<string, RmAttributeMeta>>();

/**
 * RM attribute addressed by a FLAT segment name (`_link` → `links`,
 * `_work_flow_id` → `workflow_id`, `_uid` → `uid`); `undefined` when the type
 * has no such attribute.
 */
export function resolveRmAttribute(rmType: string, segment: string): RmAttributeMeta | undefined {
  const name = segment.startsWith("_") ? segment.slice(1) : segment;
  const attrs = attributeMap(rmType);
  const candidates = [name, RM_NAME_OF[name], `${name}s`, name.endsWith("y") ? `${name.slice(0, -1)}ies` : undefined];
  for (const c of candidates) {
    if (!c) continue;
    const meta = attrs.get(c);
    if (!meta) continue;
    if (c === name || c === RM_NAME_OF[name] || parseAttrType(meta.typeName).container) return meta;
  }
  return undefined;
}

// --- Forms -------------------------------------------------------------------

interface FormField {
  suffix: string;
  path: string[];
  kind: FieldKind;
  /** Also read under these suffixes. */
  aliases?: string[];
  /** RM types of objects created along `path`. */
  intermediates?: Record<string, string>;
  /** Not written when the value equals the default reading would fill. */
  defaultOf?: (obj: RmObject) => unknown;
}

interface PlainPath {
  /** Segment name as written. */
  name: string;
  /** RM path the segment maps to (inlined objects: `range.lower`). */
  path: string[];
  /** RM type of the value; default from BMM. */
  type?: string;
  /** Use this name only for values of this RM type (FEEDER_AUDIT `original_content_multimedia`). */
  onlyType?: string;
}

interface FlatForm {
  fields: FormField[];
  plain?: PlainPath[];
  /** Fill what reading implies (defaults, subtypes) after decoding. */
  complete?: (obj: RmObject) => void;
  /** Extra fields that do not fit `fields` (PARTICIPATION `|identifiers_id:i`). */
  encodeExtra?: (obj: unknown, fields: Record<string, FlatFieldValue>) => void;
  decodeExtra?: (fields: Record<string, FlatFieldValue>, obj: RmObject) => void;
  /** Field values are built with {@link buildDvValue} (data value field maps). */
  dvMap?: boolean;
}

const f = (
  suffix: string,
  path: string[],
  kind: FieldKind = "string",
  extra: Partial<FormField> = {},
): FormField => ({ suffix, path, kind, ...extra });

function intervalFlags(prefix: string[]): FormField[] {
  const owner = (obj: RmObject): RmObject | undefined => {
    let cur: unknown = obj;
    for (const key of prefix) cur = (cur as RmObject | undefined)?.[key];
    return cur as RmObject | undefined;
  };
  const inter = prefix.length ? { [prefix[0]]: "DV_INTERVAL" } : undefined;
  // Spec: `|…_unbounded` only in output if true, `|…_included` only if false.
  void owner;
  return [
    f("lower_unbounded", [...prefix, "lower_unbounded"], "boolean", { intermediates: inter, defaultOf: () => false }),
    f("upper_unbounded", [...prefix, "upper_unbounded"], "boolean", { intermediates: inter, defaultOf: () => false }),
    f("lower_included", [...prefix, "lower_included"], "boolean", { intermediates: inter, defaultOf: () => true }),
    f("upper_included", [...prefix, "upper_included"], "boolean", { intermediates: inter, defaultOf: () => true }),
  ];
}

/**
 * Missing DV_INTERVAL flags: the spec defaults (bounded, included) for a
 * bound that is present, unbounded and not included for one that is not
 * (RM invariants).
 */
function completeInterval(iv: RmObject | undefined): void {
  if (!iv) return;
  iv.lower_unbounded ??= iv.lower == null;
  iv.upper_unbounded ??= iv.upper == null;
  iv.lower_included ??= iv.lower != null;
  iv.upper_included ??= iv.upper != null;
}

/** OBJECT_ID subtype for an id value (`scheme` → GENERIC_ID, `::` → OBJECT_VERSION_ID). */
function inferObjectIdType(id: RmObject, declared: string): string {
  if (id.scheme != null) return "GENERIC_ID";
  const value = String(id.value ?? "");
  if (/::/.test(value)) return "OBJECT_VERSION_ID";
  return declared === "OBJECT_ID" || declared === "UID_BASED_ID" ? "HIER_OBJECT_ID" : declared;
}

function fixObjectIdType(ref: RmObject | undefined, declared = "OBJECT_ID"): void {
  const id = ref?.id as RmObject | undefined;
  if (id && (id._type === "OBJECT_ID" || id._type === "UID_BASED_ID")) {
    id._type = inferObjectIdType(id, String(id._type));
  }
  void declared;
}

const OBJECT_REF_FIELDS: FormField[] = [
  f("id", ["id", "value"], "string", { intermediates: { id: "OBJECT_ID" } }),
  f("id_scheme", ["id", "scheme"], "string", { aliases: ["scheme"], intermediates: { id: "OBJECT_ID" } }),
  f("namespace", ["namespace"]),
  f("type", ["type"]),
];

const PERFORMER = { performer: "PARTY_IDENTIFIED", external_ref: "PARTY_REF", id: "GENERIC_ID" };
const IDENTIFIER_FIELDS = ["id", "issuer", "assigner", "type"];

function completeParty(party: RmObject | undefined): void {
  if (!party) return;
  if (party.relationship != null && party._type === "PARTY_IDENTIFIED") party._type = "PARTY_RELATED";
  const ref = party.external_ref as RmObject | undefined;
  if (ref && ref.type == null) ref.type = "PARTY";
}

const FORMS: Record<string, FlatForm> = {
  LINK: {
    fields: [
      f("type", ["type", "value"], "string", { intermediates: { type: "DV_TEXT" } }),
      f("meaning", ["meaning", "value"], "string", { intermediates: { meaning: "DV_TEXT" } }),
      f("target", ["target", "value"], "string", { intermediates: { target: "DV_EHR_URI" } }),
    ],
  },
  OBJECT_REF: { fields: OBJECT_REF_FIELDS, complete: (o) => fixObjectIdType(o) },
  PARTY_REF: { fields: OBJECT_REF_FIELDS, complete: (o) => fixObjectIdType(o) },
  ACCESS_GROUP_REF: { fields: OBJECT_REF_FIELDS, complete: (o) => fixObjectIdType(o) },
  LOCATABLE_REF: {
    fields: [...OBJECT_REF_FIELDS, f("path", ["path"])],
    complete: (o) => fixObjectIdType(o),
  },
  PARTICIPATION: {
    fields: [
      f("function", ["function", "value"], "string", { intermediates: { function: "DV_TEXT" } }),
      f("mode", ["mode", "value"], "string", { intermediates: { mode: "DV_CODED_TEXT" } }),
      f("name", ["performer", "name"], "string", { intermediates: PERFORMER }),
      f("id", ["performer", "external_ref", "id", "value"], "string", { intermediates: PERFORMER }),
      f("id_scheme", ["performer", "external_ref", "id", "scheme"], "string", { intermediates: PERFORMER }),
      f("id_namespace", ["performer", "external_ref", "namespace"], "string", { intermediates: PERFORMER }),
    ],
    plain: [{ name: "relationship", path: ["performer", "relationship"], type: "DV_CODED_TEXT" }],
    encodeExtra: (obj, fields) => {
      const ids = rmProp(rmProp(obj, "performer"), "identifiers");
      if (!Array.isArray(ids)) return;
      ids.forEach((id, i) => {
        for (const k of IDENTIFIER_FIELDS) {
          const v = rmProp(id, k);
          if (v != null) fields[`identifiers_${k}:${i}`] = String(v);
        }
      });
    },
    decodeExtra: (fields, obj) => {
      for (const [suffix, v] of Object.entries(fields)) {
        const m = /^identifiers_(id|issuer|assigner|type):(\d+)$/.exec(suffix);
        if (!m) continue;
        const performer = (obj.performer ??= { _type: "PARTY_IDENTIFIED" }) as RmObject;
        const ids = (performer.identifiers ??= []) as RmObject[];
        const i = Number(m[2]);
        for (let k = ids.length; k <= i; k++) ids[k] = { _type: "DV_IDENTIFIER" };
        ids[i][m[1]] = String(v);
      }
    },
    complete: (o) => {
      const mode = o.mode as RmObject | undefined;
      if (mode && mode.defining_code == null && mode.value != null) {
        const code = openEhrGroupCode(PARTICIPATION_MODE_GROUP, String(mode.value));
        if (code) {
          mode.defining_code = {
            _type: "CODE_PHRASE",
            terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
            code_string: code,
          };
        }
      }
      completeParty(o.performer as RmObject | undefined);
      const performer = o.performer as RmObject | undefined;
      if (performer) fixObjectIdType(performer.external_ref as RmObject | undefined);
    },
  },
  FEEDER_AUDIT: {
    fields: [],
    plain: [
      { name: "originating_system_item_id", path: ["originating_system_item_ids"] },
      { name: "feeder_system_item_id", path: ["feeder_system_item_ids"] },
      { name: "original_content_multimedia", path: ["original_content"], type: "DV_MULTIMEDIA", onlyType: "DV_MULTIMEDIA" },
      { name: "original_content", path: ["original_content"] },
      { name: "originating_system_audit", path: ["originating_system_audit"] },
      { name: "feeder_system_audit", path: ["feeder_system_audit"] },
    ],
  },
  FEEDER_AUDIT_DETAILS: {
    fields: [
      f("system_id", ["system_id"]),
      f("version_id", ["version_id"]),
      f("time", ["time", "value"], "string", { intermediates: { time: "DV_DATE_TIME" } }),
    ],
    plain: [
      { name: "subject", path: ["subject"] },
      { name: "provider", path: ["provider"] },
      { name: "location", path: ["location"] },
    ],
  },
  INSTRUCTION_DETAILS: {
    fields: [
      f("path", ["instruction_id", "path"], "string", { intermediates: { instruction_id: "LOCATABLE_REF" } }),
      f("composition_uid", ["instruction_id", "id", "value"], "string", {
        intermediates: { instruction_id: "LOCATABLE_REF", id: "UID_BASED_ID" },
      }),
      f("activity_id", ["activity_id"]),
    ],
    complete: (o) => {
      const ref = o.instruction_id as RmObject | undefined;
      if (!ref) return;
      fixObjectIdType(ref);
      ref.namespace ??= "local";
      ref.type ??= "INSTRUCTION";
    },
  },
  ISM_TRANSITION: {
    fields: [],
    plain: [
      { name: "current_state", path: ["current_state"] },
      { name: "transition", path: ["transition"] },
      { name: "careflow_step", path: ["careflow_step"] },
    ],
  },
  TERM_MAPPING: {
    fields: [f("match", ["match"])],
    plain: [{ name: "target", path: ["target"] }, { name: "purpose", path: ["purpose"] }],
  },
  DV_INTERVAL: {
    fields: intervalFlags([]),
    plain: [{ name: "lower", path: ["lower"], type: "T" }, { name: "upper", path: ["upper"], type: "T" }],
    complete: completeInterval,
  },
  REFERENCE_RANGE: {
    fields: intervalFlags(["range"]),
    plain: [
      { name: "lower", path: ["range", "lower"], type: "T" },
      { name: "upper", path: ["range", "upper"], type: "T" },
      { name: "meaning", path: ["meaning"] },
    ],
    complete: (o) => {
      o.range ??= { _type: "DV_INTERVAL" };
      completeInterval(o.range as RmObject);
    },
  },
  INTERVAL_EVENT: {
    fields: [f("sample_count", ["sample_count"], "integer")],
    plain: [{ name: "width", path: ["width"] }, { name: "math_function", path: ["math_function"] }],
  },
  EVENT_CONTEXT: {
    fields: [],
    plain: [{ name: "start_time", path: ["start_time"] }, { name: "setting", path: ["setting"] }],
  },
  ACTIVITY: {
    fields: [],
    plain: [{ name: "timing", path: ["timing"] }, { name: "action_archetype_id", path: ["action_archetype_id"] }],
  },
  PARTY_SELF: {
    fields: [
      f("id", ["external_ref", "id", "value"], "string", { intermediates: { external_ref: "PARTY_REF", id: "GENERIC_ID" } }),
      f("id_scheme", ["external_ref", "id", "scheme"], "string", { intermediates: { external_ref: "PARTY_REF", id: "GENERIC_ID" } }),
      f("id_namespace", ["external_ref", "namespace"], "string", { intermediates: { external_ref: "PARTY_REF" } }),
    ],
    complete: (o) => completeParty(o),
  },
};

// PARTY_RELATED: the spec examples (and PARTICIPATION) write `/relationship`;
// its table says `/_relationship`. Both are read.
const partyMap = getFieldMap("PARTY_RELATED")!;
FORMS.PARTY_RELATED = {
  dvMap: true,
  fields: partyMap.fields.map((x) => ({ ...x })),
  plain: [{ name: "relationship", path: ["relationship"], type: "DV_CODED_TEXT" }],
  complete: (o) => completeParty(o),
};

const ID_VALUE_FORM: FlatForm = { fields: [f("", ["value"])] };
for (const t of ["HIER_OBJECT_ID", "OBJECT_VERSION_ID", "TERMINOLOGY_ID", "ARCHETYPE_ID", "TEMPLATE_ID", "GENERIC_ID", "INTERNET_ID", "UUID", "ISO_OID"]) {
  FORMS[t] = ID_VALUE_FORM;
}

const EMPTY_FORM: FlatForm = { fields: [] };

function formFor(rmType: string): FlatForm {
  const base = baseType(rmType);
  const own = FORMS[base];
  if (own) return own;
  const map = getFieldMap(base);
  if (map) {
    return {
      dvMap: true,
      fields: map.fields.map((x) => ({ ...x })),
      complete: base.startsWith("PARTY_") ? (o) => completeParty(o) : undefined,
    };
  }
  return EMPTY_FORM;
}

/** True when the RM type has a FLAT form with sub-paths (written as a subtree, e.g. DV_INTERVAL). */
export function hasStructuredForm(rmType: string): boolean {
  const base = baseType(rmType);
  return !getFieldMap(base) && hasRmType(base) && isSubtypeOf(base, "DATA_VALUE");
}

/** RM attributes a form writes (as fields or plain sub-paths). */
function formAttributes(form: FlatForm): Set<string> {
  const out = new Set<string>();
  for (const x of form.fields) out.add(x.path[0]);
  for (const p of form.plain ?? []) out.add(p.path[0]);
  return out;
}

// --- Plain values and comparison -----------------------------------------------

function isPlainObject(v: unknown): v is RmObject {
  if (v == null || typeof v !== "object" || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function isEmpty(v: unknown): boolean {
  return v == null || (Array.isArray(v) && v.length === 0);
}

/**
 * Canonical-JSON-like plain copy (`_type` + attributes) of a plain or typed
 * RM value; typed instances are read through their BMM attributes.
 */
export function toPlainRm(v: unknown): unknown {
  if (v == null) return undefined;
  if (typeof v !== "object") return v;
  if (Array.isArray(v)) {
    const arr = v.map(toPlainRm).filter((x) => x !== undefined);
    return arr.length ? arr : undefined;
  }
  const type = rmTypeOfValue(v);
  if (isPlainObject(v)) {
    const out: RmObject = {};
    for (const [k, val] of Object.entries(v)) {
      const p = toPlainRm(val);
      if (p !== undefined) out[k] = p;
    }
    return out;
  }
  if (isPrimitiveType(type)) {
    const inner = rmProp(v, "value");
    return inner ?? undefined;
  }
  const out: RmObject = type ? { _type: type } : {};
  const names = type && hasRmType(baseType(type))
    ? attributesFor(baseType(type)).map((a) => a.name)
    : Object.keys(v);
  for (const k of names) {
    const p = toPlainRm(rmProp(v, k));
    if (p !== undefined) out[k] = p;
  }
  return out;
}

/** Every value set in `a` is in `b` (extra defaults in `b` are fine). */
export function rmSubset(a: unknown, b: unknown): boolean {
  if (a == null) return true;
  if (b == null) return false;
  if (typeof a !== "object") {
    return typeof b !== "object" && (a === b || String(a) === String(b));
  }
  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every((x, i) => rmSubset(x, b[i]));
  }
  if (typeof b !== "object" || Array.isArray(b)) return false;
  for (const [k, v] of Object.entries(a as RmObject)) {
    const w = (b as RmObject)[k];
    if (k === "_type") {
      if (baseType(String(v)) !== baseType(String(w ?? v))) return false;
      continue;
    }
    if (!rmSubset(v, w)) return false;
  }
  return true;
}

// --- Type inference ------------------------------------------------------------

function hasChild(tree: FlatTree, ...names: string[]): boolean {
  return names.some((n) => tree.children.has(n) || tree.children.has(`_${n}`));
}

/** RM type a reader infers for `tree` at a position declared `declared`. */
export function inferRmType(declared: string, param: string | undefined, tree: FlatTree): string {
  const explicit = tree.fields._type;
  if (explicit != null && typeof explicit !== "object") return String(explicit);
  const d = baseType(resolveDeclared(declared, param));
  const fields = tree.fields;
  if (d === "DV_TEXT" && (fields.code != null || fields.terminology != null)) return "DV_CODED_TEXT";
  if (d === "PARTY_IDENTIFIED" && hasChild(tree, "relationship")) return "PARTY_RELATED";
  if (hasRmType(d) && !isAbstractType(d)) return d;
  switch (d) {
    case "PARTY_PROXY":
      return hasChild(tree, "relationship") ? "PARTY_RELATED" : "PARTY_IDENTIFIED";
    case "UID_BASED_ID":
    case "OBJECT_ID": {
      const value = String(fields[""] ?? fields.value ?? "");
      if (d === "OBJECT_ID" && hasChild(tree, "scheme")) return "GENERIC_ID";
      return value.includes("::") ? "OBJECT_VERSION_ID" : "HIER_OBJECT_ID";
    }
    case "DV_ENCAPSULATED":
      return fields.mediatype != null || fields.size != null ? "DV_MULTIMEDIA" : "DV_PARSABLE";
    case "ITEM_STRUCTURE":
      return "ITEM_TREE";
    case "ITEM":
      return hasChild(tree, "items", "item") ? "CLUSTER" : "ELEMENT";
    case "EVENT":
      return hasChild(tree, "width", "math_function") || fields.sample_count != null
        ? "INTERVAL_EVENT"
        : "POINT_EVENT";
  }
  if (hasRmType(d) && isSubtypeOf("DV_TEXT", d) || d === "DATA_VALUE" || (hasRmType(d) && isSubtypeOf(d, "DATA_VALUE"))) {
    if (fields.magnitude != null && fields.unit != null) return "DV_QUANTITY";
    if (fields.numerator != null) return "DV_PROPORTION";
    if (fields.ordinal != null) return "DV_ORDINAL";
    if (fields.code != null) return isSubtypeOf("DV_CODED_TEXT", d) ? "DV_CODED_TEXT" : "DV_ORDINAL";
    if (fields.formalism != null) return "DV_PARSABLE";
    if (fields.mediatype != null) return "DV_MULTIMEDIA";
    if (fields.issuer != null || fields.assigner != null || fields.id != null) return "DV_IDENTIFIER";
    if (hasChild(tree, "lower", "upper")) return "DV_INTERVAL";
    if (d === "DATA_VALUE") return "DV_TEXT";
  }
  return d;
}

// --- Path helpers ----------------------------------------------------------------

function coerce(value: unknown, kind: FieldKind | string): FlatPrimitive | undefined {
  if (value == null) return undefined;
  switch (kind) {
    case "boolean":
    case "Boolean":
      if (typeof value === "boolean") return value;
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    case "number":
    case "Real":
    case "Double":
      if (typeof value === "number") return value;
      if (typeof value === "string" && value !== "" && !isNaN(Number(value))) return Number(value);
      return undefined;
    case "integer":
    case "Integer":
    case "Integer64": {
      const n = typeof value === "number" ? value : typeof value === "string" && value !== "" ? Number(value) : NaN;
      return Number.isFinite(n) ? Math.trunc(n) : undefined;
    }
    default:
      return typeof value === "object" ? undefined : String(value);
  }
}

function setPath(obj: RmObject, path: string[], value: unknown, intermediates?: Record<string, string>): void {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    let next = cur[key] as RmObject | undefined;
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      next = { _type: intermediates?.[key] ?? "OBJECT" };
      cur[key] = next;
    }
    cur = next;
  }
  cur[path[path.length - 1]] = value;
}

function getPath(obj: unknown, path: string[]): unknown {
  let cur = obj;
  for (const key of path) {
    cur = rmProp(cur, key);
    if (cur == null) return undefined;
  }
  return cur;
}

/** BMM type of the attribute at `path` below `rmType`. */
function attrTypeAt(rmType: string, path: string[], intermediates?: Record<string, string>): string | undefined {
  let type = rmType;
  for (let i = 0; i < path.length; i++) {
    const meta = attributeMap(type).get(path[i]);
    if (!meta) return undefined;
    if (i === path.length - 1) return meta.typeName;
    type = intermediates?.[path[i]] ?? parseAttrType(meta.typeName).elem;
    if (isTypeParameter(type)) return undefined;
  }
  return undefined;
}

// --- Encoding ------------------------------------------------------------------

export interface EncodeOptions {
  /** RM attributes written elsewhere (Web Template nodes, `ctx/`). */
  skip?: ReadonlySet<string>;
  /**
   * Names the template gives this object: `name` is written as `/_name` only
   * when it differs. Without it, `name` is written like any attribute.
   */
  templateNames?: readonly string[];
}

/** Attributes never written at a Web Template node (the template supplies them). */
export const TEMPLATE_SUPPLIED = new Set(["archetype_node_id", "archetype_details"]);

function nameMatches(name: unknown, names: readonly string[]): boolean {
  if (name == null) return true;
  if (rmProp(name, "defining_code") != null) return false;
  if (rmProp(name, "mappings") != null || rmProp(name, "formatting") != null) return false;
  const value = rmProp(name, "value");
  return !names.length || (value != null && names.includes(String(value)));
}

/**
 * FLAT tree for `obj`: the fields and plain sub-paths of its form, then
 * `/_<attribute>` for every other set attribute (and for form fields that
 * would not read back the same value).
 */
export function encodeRmObject(
  obj: unknown,
  declared: string,
  param?: string,
  options: EncodeOptions = {},
): FlatTree {
  const type = rmTypeOfValue(obj) || baseType(resolveDeclared(declared, param));
  const base = baseType(type);
  const tree = newFlatTree();
  const form = formFor(type);
  const skip = options.skip ?? new Set<string>();
  const ownParam = ownParamOf(type, declared, param);

  for (const field of form.fields) {
    if (skip.has(field.path[0])) continue;
    const raw = form.dvMap ? rmPropAtPath(obj, field.path) : getPath(obj, field.path);
    const v = coerce(raw, field.kind);
    if (v === undefined) continue;
    if (field.defaultOf && v === field.defaultOf(toPlainRm(obj) as RmObject)) continue;
    tree.fields[field.suffix] = v;
  }
  form.encodeExtra?.(obj, tree.fields);

  const written = new Set<string>();
  for (const p of form.plain ?? []) {
    if (skip.has(p.path[0])) continue;
    const v = getPath(obj, p.path);
    if (isEmpty(v)) continue;
    if (p.onlyType && baseType(rmTypeOfValue(v)) !== p.onlyType) continue;
    if (written.has(p.path.join("."))) continue;
    const declaredType = p.type ?? attrTypeAt(base, p.path, intermediatesOf(form)) ?? "DATA_VALUE";
    encodeChild(tree, p.name, v, declaredType, base, ownParam);
    written.add(p.path.join("."));
  }

  // Attributes the fields and plain paths would not read back exactly.
  const plainObj = toPlainRm(obj) as RmObject | undefined ?? {};
  const typed = ownParam && !genericParam(type) ? `${base}<${ownParam}>` : type;
  const decoded = decodeRmValue(typed, param, { fields: { ...tree.fields, _type: base }, children: tree.children }) as RmObject | undefined ?? {};
  const covered = formAttributes(form);
  for (const meta of attributeMap(base).values()) {
    const name = meta.name;
    if (skip.has(name)) continue;
    const v = rmProp(obj, name);
    if (isEmpty(v)) continue;
    if (name === "name" && options.templateNames && nameMatches(v, options.templateNames)) continue;
    if (covered.has(name) && rmSubset(plainObj[name], decoded[name])) continue;
    encodeChild(tree, `_${flatAttributeName(meta)}`, v, meta.typeName, base, ownParam);
  }
  return tree;
}

function intermediatesOf(form: FlatForm): Record<string, string> {
  const out: Record<string, string> = {};
  for (const x of form.fields) Object.assign(out, x.intermediates ?? {});
  return out;
}

function encodeChild(
  tree: FlatTree,
  name: string,
  value: unknown,
  typeName: string,
  ownerType: string,
  ownerParam?: string,
): void {
  const { container, elem } = parseAttrType(typeName);
  const values = Array.isArray(value) ? value : [value];
  const p = paramFor(elem, ownerType, ownerParam);
  const items = values.filter((v) => v != null).map((v) => encodeRmValue(v, elem, p));
  if (!items.length) return;
  tree.children.set(name, { multi: container || Array.isArray(value), items });
}

/**
 * FLAT tree for an attribute value: primitives are the bare field, objects
 * their form plus `|_type` when a reader would infer another type; `|raw`
 * when the paths do not read back the same value.
 */
export function encodeRmValue(value: unknown, declared: string, param?: string): FlatTree {
  if (typeof value !== "object" || value == null) {
    return { fields: { "": value as FlatPrimitive }, children: new Map() };
  }
  const type = rmTypeOfValue(value);
  const plain = toPlainRm(value);
  const resolved = resolveDeclared(declared, param);
  if ((!type && !hasRmType(baseType(resolved))) || /^Hash</.test(declared) || isPrimitiveType(type)) {
    if (isPrimitiveType(type) && plain != null && typeof plain !== "object") {
      return { fields: { "": plain as FlatPrimitive }, children: new Map() };
    }
    return { fields: { raw: plain as RmObject }, children: new Map() };
  }
  const tree = encodeRmObject(value, declared, param);
  const actual = baseType(type || resolved);
  if (baseType(inferRmType(declared, param, tree)) !== actual) tree.fields._type = actual;
  if (!rmSubset(plain, decodeRmValue(declared, param, tree))) {
    return { fields: { raw: plain as RmObject }, children: new Map() };
  }
  return tree;
}

/** Write `tree` as FLAT keys below `base`. */
export function emitFlatTree(base: string, tree: FlatTree, out: Record<string, unknown>): void {
  for (const [suffix, v] of Object.entries(tree.fields)) {
    out[suffix === "" ? base : `${base}|${suffix}`] = v;
  }
  for (const [name, child] of tree.children) {
    child.items.forEach((item, i) => {
      if (!item) return;
      const seg = child.multi || i > 0 ? `${name}:${i}` : name;
      emitFlatTree(`${base}/${seg}`, item, out);
    });
  }
}

// --- Decoding ------------------------------------------------------------------

/** Attribute paths a decode could not map (reported as unknown keys). */
export type UnknownAttributes = string[];

/**
 * `|meaning|code` style suffixes: fields of a sub-object written on the
 * owner's path (spec "RM Attributes prefix" LINK example).
 */
function splitNestedSuffixes(tree: FlatTree): FlatTree {
  const nested = Object.keys(tree.fields).filter((k) => k.includes("|"));
  if (!nested.length) return tree;
  const out: FlatTree = { fields: { ...tree.fields }, children: new Map(tree.children) };
  for (const key of nested) {
    const [head, ...rest] = key.split("|");
    const value = out.fields[key];
    delete out.fields[key];
    const existing = out.children.get(head);
    const child = existing?.items[0] ?? newFlatTree();
    child.fields[rest.join("|")] = value;
    if (!existing) out.children.set(head, { multi: false, items: [child] });
  }
  return out;
}

/** Primitive fields only, with `|value` and the bare key as aliases. */
function primitiveFields(tree: FlatTree, form: FlatForm): Record<string, FlatPrimitive> {
  const out: Record<string, FlatPrimitive> = {};
  for (const [k, v] of Object.entries(tree.fields)) {
    if (typeof v !== "object") out[k] = v;
  }
  const suffixes = new Set(form.fields.map((x) => x.suffix));
  if (out[""] != null && !suffixes.has("") && suffixes.has("value") && out.value == null) {
    out.value = out[""];
  }
  return out;
}

/** Decode an attribute value from its FLAT tree. */
export function decodeRmValue(
  declared: string,
  param: string | undefined,
  tree: FlatTree,
  unknown?: UnknownAttributes,
  path = "",
): unknown {
  const raw = tree.fields.raw;
  if (raw != null && typeof raw === "object") return structuredClone(raw);
  const resolved = resolveDeclared(declared, param);
  if (isPrimitiveType(resolved)) {
    const v = tree.fields[""] ?? tree.fields.value;
    // A value that does not fit the RM type is kept as sent.
    return coerce(v, baseType(resolved)) ?? (typeof v === "object" ? undefined : v);
  }
  const type = inferRmType(declared, param, tree);
  const obj: RmObject = { _type: baseType(type) };
  const ownParam = ownParamOf(type, declared, param);
  decodeRmObjectInto(obj, type, ownParam, tree, unknown, path);
  return obj;
}

/**
 * Apply a FLAT tree to an existing RM object: form fields, plain sub-paths
 * and `/_<attribute>` children (which replace what the fields set).
 */
export function decodeRmObjectInto(
  obj: RmObject,
  rmType: string,
  param: string | undefined,
  input: FlatTree,
  unknown?: UnknownAttributes,
  path = "",
): void {
  const tree = splitNestedSuffixes(input);
  let base = baseType(rmType);
  if (isAbstractType(base)) {
    // e.g. an EVENT node with `/width` is an INTERVAL_EVENT.
    const inferred = baseType(inferRmType(base, param, tree));
    if (inferred !== base && !isAbstractType(inferred)) obj._type = base = inferred;
  }
  for (const name of tree.children.keys()) {
    // An attribute only a subtype has selects it (PARTY_IDENTIFIED with
    // `/relationship` → PARTY_RELATED).
    if (isRmAttributeSegment(base, name)) continue;
    const sub = subtypesOf(base).find((t) => isRmAttributeSegment(t, name));
    if (sub) obj._type = base = sub;
  }
  const form = formFor(base);
  const fields = primitiveFields(tree, form);

  if (form.dvMap) {
    const usable = Object.keys(fields).some((k) => k !== "_type");
    if (usable) {
      const built = buildDvValue(base, fields);
      const keepType = obj._type;
      Object.assign(obj, built);
      if (fields._type == null && keepType) obj._type = base.startsWith("PARTY_") ? built._type : keepType;
    }
  } else {
    for (const field of form.fields) {
      let v: unknown = fields[field.suffix];
      for (const alias of field.aliases ?? []) v ??= fields[alias];
      if (v == null && field.suffix === "") v = fields.value;
      const c = coerce(v, field.kind);
      if (c === undefined) continue;
      setPath(obj, field.path, c, field.intermediates);
    }
  }
  form.decodeExtra?.(fields, obj);

  for (const [name, child] of tree.children) {
    const plain = (form.plain ?? []).find((p) => p.name === name || `_${p.name}` === name);
    let targetPath: string[];
    let typeName: string;
    let container: boolean;
    if (plain) {
      targetPath = plain.path;
      const bmm = attrTypeAt(base, plain.path, intermediatesOf(form)) ?? "DATA_VALUE";
      container = parseAttrType(bmm).container;
      typeName = plain.type ?? parseAttrType(bmm).elem;
    } else {
      const meta = resolveRmAttribute(base, name);
      if (!meta) {
        unknown?.push(`${path}/${name}`);
        continue;
      }
      targetPath = [meta.name];
      const parsed = parseAttrType(meta.typeName);
      container = parsed.container;
      typeName = parsed.elem;
    }
    const p = paramFor(typeName, base, param);
    const values: unknown[] = [];
    child.items.forEach((item, i) => {
      if (!item) return;
      const v = decodeRmValue(typeName, p, item, unknown, `${path}/${name}:${i}`);
      if (v !== undefined) values[i] = v;
    });
    const dense = values.filter((v) => v !== undefined);
    if (!dense.length) continue;
    const intermediates = { ...intermediatesOf(form) };
    setPath(obj, targetPath, container ? dense : dense[0], intermediates);
  }
  form.complete?.(obj);
  if (base.startsWith("PARTY_")) completeParty(obj);
}

/** Can `segment` (with or without `_`) address an attribute of `rmType`? */
export function isRmAttributeSegment(rmType: string, segment: string): boolean {
  const form = formFor(rmType);
  if ((form.plain ?? []).some((p) => p.name === segment || `_${p.name}` === segment)) return true;
  return resolveRmAttribute(baseType(rmType), segment) != null;
}

/** Like {@link isRmAttributeSegment}, also for the concrete subtypes of `rmType`. */
export function isRmAttributeSegmentOfAny(rmType: string, segment: string): boolean {
  const base = baseType(rmType);
  if (isRmAttributeSegment(base, segment)) return true;
  return hasRmType(base) && subtypesOf(base).some((t) => isRmAttributeSegment(t, segment));
}
