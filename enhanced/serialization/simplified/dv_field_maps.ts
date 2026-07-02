/**
 * Declarative field maps between RM data-value objects and simplified-format
 * pipe-suffix fields, per the ITS-REST simplified formats specification
 * (docs/reference_for_llms/simplified_formats.md, "RM Mappings" section).
 *
 * A suffix of "" (empty string) denotes the *bare* flat key, i.e. the value
 * is written on the path itself with no `|suffix` (e.g. DV_TEXT, DV_COUNT,
 * date/time types). `|value` is accepted as a read alias for the bare key.
 */

type RmObject = Record<string, unknown>;

export type FieldKind = "string" | "number" | "integer" | "boolean";

export interface FieldSpec {
  /** Pipe suffix ("" = bare path key). */
  suffix: string;
  /** Dotted attribute path inside the RM value object. */
  path: string[];
  kind: FieldKind;
  /** Web template input type (DECIMAL, TEXT, CODED_TEXT, DATETIME, …). */
  inputType: string;
  required?: boolean;
  /** Fixed _type values for intermediate objects along `path`. */
  intermediates?: Record<string, string>;
  /** Default leaf values applied when building (e.g. terminology ids). */
  buildDefaults?: Record<string, unknown>;
}

export interface DvFieldMap {
  rmType: string;
  fields: FieldSpec[];
}

const MAPS: Record<string, DvFieldMap> = {};

function def(rmType: string, fields: FieldSpec[]): void {
  MAPS[rmType] = { rmType, fields };
}

// --- Text & codes -----------------------------------------------------------

def("DV_TEXT", [
  { suffix: "", path: ["value"], kind: "string", inputType: "TEXT", required: true },
  { suffix: "formatting", path: ["formatting"], kind: "string", inputType: "TEXT" },
]);

def("DV_CODED_TEXT", [
  {
    suffix: "code",
    path: ["defining_code", "code_string"],
    kind: "string",
    inputType: "CODED_TEXT",
    required: true,
    intermediates: { defining_code: "CODE_PHRASE" },
  },
  { suffix: "value", path: ["value"], kind: "string", inputType: "TEXT" },
  {
    suffix: "terminology",
    path: ["defining_code", "terminology_id", "value"],
    kind: "string",
    inputType: "TEXT",
    intermediates: {
      defining_code: "CODE_PHRASE",
      terminology_id: "TERMINOLOGY_ID",
    },
    buildDefaults: { value: "local" },
  },
  {
    suffix: "preferred_term",
    path: ["defining_code", "preferred_term"],
    kind: "string",
    inputType: "TEXT",
    intermediates: { defining_code: "CODE_PHRASE" },
  },
]);

def("CODE_PHRASE", [
  { suffix: "code", path: ["code_string"], kind: "string", inputType: "TEXT", required: true },
  {
    suffix: "terminology",
    path: ["terminology_id", "value"],
    kind: "string",
    inputType: "TEXT",
    intermediates: { terminology_id: "TERMINOLOGY_ID" },
  },
  { suffix: "preferred_term", path: ["preferred_term"], kind: "string", inputType: "TEXT" },
]);

def("DV_ORDINAL", [
  {
    suffix: "code",
    path: ["symbol", "defining_code", "code_string"],
    kind: "string",
    inputType: "CODED_TEXT",
    required: true,
    intermediates: { symbol: "DV_CODED_TEXT", defining_code: "CODE_PHRASE" },
  },
  {
    suffix: "value",
    path: ["symbol", "value"],
    kind: "string",
    inputType: "TEXT",
    intermediates: { symbol: "DV_CODED_TEXT" },
  },
  { suffix: "ordinal", path: ["value"], kind: "integer", inputType: "INTEGER" },
  {
    suffix: "terminology",
    path: ["symbol", "defining_code", "terminology_id", "value"],
    kind: "string",
    inputType: "TEXT",
    intermediates: {
      symbol: "DV_CODED_TEXT",
      defining_code: "CODE_PHRASE",
      terminology_id: "TERMINOLOGY_ID",
    },
    buildDefaults: { value: "local" },
  },
]);

// --- Quantities & numbers ---------------------------------------------------

def("DV_QUANTITY", [
  { suffix: "magnitude", path: ["magnitude"], kind: "number", inputType: "DECIMAL", required: true },
  { suffix: "unit", path: ["units"], kind: "string", inputType: "TEXT", required: true },
  { suffix: "precision", path: ["precision"], kind: "integer", inputType: "INTEGER" },
  { suffix: "magnitude_status", path: ["magnitude_status"], kind: "string", inputType: "TEXT" },
  { suffix: "accuracy", path: ["accuracy"], kind: "number", inputType: "DECIMAL" },
  { suffix: "accuracy_is_percent", path: ["accuracy_is_percent"], kind: "boolean", inputType: "BOOLEAN" },
  { suffix: "units_system", path: ["units_system"], kind: "string", inputType: "TEXT" },
  { suffix: "units_display_name", path: ["units_display_name"], kind: "string", inputType: "TEXT" },
]);

def("DV_COUNT", [
  { suffix: "", path: ["magnitude"], kind: "integer", inputType: "INTEGER", required: true },
  { suffix: "magnitude_status", path: ["magnitude_status"], kind: "string", inputType: "TEXT" },
  { suffix: "accuracy", path: ["accuracy"], kind: "number", inputType: "DECIMAL" },
  { suffix: "accuracy_is_percent", path: ["accuracy_is_percent"], kind: "boolean", inputType: "BOOLEAN" },
]);

def("DV_PROPORTION", [
  { suffix: "numerator", path: ["numerator"], kind: "number", inputType: "DECIMAL", required: true },
  { suffix: "denominator", path: ["denominator"], kind: "number", inputType: "DECIMAL", required: true },
  { suffix: "type", path: ["type"], kind: "integer", inputType: "INTEGER", required: true },
  { suffix: "precision", path: ["precision"], kind: "integer", inputType: "INTEGER" },
]);

// --- Booleans, dates, times -------------------------------------------------

def("DV_BOOLEAN", [
  { suffix: "", path: ["value"], kind: "boolean", inputType: "BOOLEAN", required: true },
]);

def("DV_DATE", [
  { suffix: "", path: ["value"], kind: "string", inputType: "DATE", required: true },
]);

def("DV_DATE_TIME", [
  { suffix: "", path: ["value"], kind: "string", inputType: "DATETIME", required: true },
]);

def("DV_TIME", [
  { suffix: "", path: ["value"], kind: "string", inputType: "TIME", required: true },
]);

def("DV_DURATION", [
  { suffix: "", path: ["value"], kind: "string", inputType: "DURATION", required: true },
]);

// --- URIs, identifiers, parsable, multimedia --------------------------------

def("DV_URI", [
  { suffix: "", path: ["value"], kind: "string", inputType: "TEXT", required: true },
]);

def("DV_EHR_URI", [
  { suffix: "", path: ["value"], kind: "string", inputType: "TEXT", required: true },
]);

def("DV_IDENTIFIER", [
  { suffix: "id", path: ["id"], kind: "string", inputType: "TEXT", required: true },
  { suffix: "issuer", path: ["issuer"], kind: "string", inputType: "TEXT" },
  { suffix: "assigner", path: ["assigner"], kind: "string", inputType: "TEXT" },
  { suffix: "type", path: ["type"], kind: "string", inputType: "TEXT" },
]);

def("DV_PARSABLE", [
  { suffix: "", path: ["value"], kind: "string", inputType: "TEXT", required: true },
  { suffix: "formalism", path: ["formalism"], kind: "string", inputType: "TEXT", required: true },
]);

def("DV_MULTIMEDIA", [
  {
    suffix: "",
    path: ["uri", "value"],
    kind: "string",
    inputType: "TEXT",
    intermediates: { uri: "DV_URI" },
  },
  {
    suffix: "mediatype",
    path: ["media_type", "code_string"],
    kind: "string",
    inputType: "TEXT",
    required: true,
    intermediates: { media_type: "CODE_PHRASE" },
    buildDefaults: { terminology: "IANA_media-types" },
  },
  { suffix: "size", path: ["size"], kind: "integer", inputType: "INTEGER", required: true },
  { suffix: "data", path: ["data"], kind: "string", inputType: "TEXT" },
  { suffix: "alternatetext", path: ["alternate_text"], kind: "string", inputType: "TEXT" },
  {
    suffix: "compression_algorithm",
    path: ["compression_algorithm", "code_string"],
    kind: "string",
    inputType: "TEXT",
    intermediates: { compression_algorithm: "CODE_PHRASE" },
  },
  { suffix: "integrity_check", path: ["integrity_check"], kind: "string", inputType: "TEXT" },
  {
    suffix: "integrity_check_algorithm",
    path: ["integrity_check_algorithm", "code_string"],
    kind: "string",
    inputType: "TEXT",
    intermediates: { integrity_check_algorithm: "CODE_PHRASE" },
  },
]);

// --- Parties ----------------------------------------------------------------

const PARTY_FIELDS: FieldSpec[] = [
  { suffix: "name", path: ["name"], kind: "string", inputType: "TEXT" },
  {
    suffix: "id",
    path: ["external_ref", "id", "value"],
    kind: "string",
    inputType: "TEXT",
    intermediates: { external_ref: "PARTY_REF", id: "GENERIC_ID" },
  },
  {
    suffix: "id_scheme",
    path: ["external_ref", "id", "scheme"],
    kind: "string",
    inputType: "TEXT",
    intermediates: { external_ref: "PARTY_REF", id: "GENERIC_ID" },
  },
  {
    suffix: "id_namespace",
    path: ["external_ref", "namespace"],
    kind: "string",
    inputType: "TEXT",
    intermediates: { external_ref: "PARTY_REF" },
  },
];

def("PARTY_PROXY", PARTY_FIELDS);
def("PARTY_IDENTIFIED", PARTY_FIELDS);
def("PARTY_RELATED", PARTY_FIELDS);

// -----------------------------------------------------------------------------

/** Constraint-class aliases used inside OPTs. */
const RM_TYPE_ALIASES: Record<string, string> = {
  C_QUANTITY: "DV_QUANTITY",
  C_CODED_TEXT: "DV_CODED_TEXT",
  C_TERMINOLOGY_CODE: "CODE_PHRASE",
  C_CODE_PHRASE: "CODE_PHRASE",
  C_STRING: "DV_TEXT",
  C_ORDINAL: "DV_ORDINAL",
};

export function resolveDvType(rmType: string): string {
  return RM_TYPE_ALIASES[rmType] ?? rmType;
}

export function getFieldMap(rmType: string): DvFieldMap | undefined {
  return MAPS[resolveDvType(rmType)];
}

/** Fallback map for unknown types: single bare `value` field. */
export function fallbackFieldMap(rmType: string): DvFieldMap {
  return {
    rmType,
    fields: [
      { suffix: "", path: ["value"], kind: "string", inputType: "TEXT" },
    ],
  };
}

// --- Generic getters/setters over plain objects or typed instances ----------

export function rmProp(obj: unknown, key: string): unknown {
  if (obj == null || typeof obj !== "object") return undefined;
  const record = obj as RmObject;
  if (key in record) return record[key];

  let proto = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, key);
    if (descriptor?.get) {
      try {
        return descriptor.get.call(obj);
      } catch {
        return undefined;
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return undefined;
}

export function rmPropAtPath(obj: unknown, path: string[]): unknown {
  let current: unknown = obj;
  for (const key of path) {
    current = rmProp(current, key);
    if (current == null) return undefined;
  }
  // Unwrap primitive wrapper objects exposing `.value`
  if (
    current != null && typeof current === "object" &&
    !Array.isArray(current)
  ) {
    const inner = rmProp(current, "value");
    if (
      inner != null &&
      (typeof inner === "string" || typeof inner === "number" ||
        typeof inner === "boolean")
    ) {
      return inner;
    }
  }
  return current;
}

function coerce(
  value: unknown,
  kind: FieldKind,
): string | number | boolean | undefined {
  if (value == null) return undefined;
  switch (kind) {
    case "boolean":
      if (typeof value === "boolean") return value;
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    case "number":
      if (typeof value === "number") return value;
      if (typeof value === "string" && value !== "") return Number(value);
      return undefined;
    case "integer": {
      const n = typeof value === "number"
        ? value
        : (typeof value === "string" && value !== ""
          ? Number(value)
          : undefined);
      return n != null && Number.isFinite(n) ? Math.trunc(n) : undefined;
    }
    default:
      return typeof value === "boolean" || typeof value === "number"
        ? value
        : String(value);
  }
}

/**
 * Extract simplified-format fields (keyed by suffix, "" = bare) from an RM
 * data value object using the declarative maps.
 */
export function extractFields(
  rmType: string,
  rmValue: unknown,
): Record<string, string | number | boolean> {
  const map = getFieldMap(rmType) ?? fallbackFieldMap(rmType);
  const out: Record<string, string | number | boolean> = {};
  for (const field of map.fields) {
    const raw = rmPropAtPath(rmValue, field.path);
    const v = coerce(raw, field.kind);
    if (v !== undefined) out[field.suffix] = v;
  }
  return out;
}

/**
 * Build an RM data value object (plain, with `_type` markers) from
 * simplified-format fields keyed by suffix ("" = bare).
 */
export function buildDvValue(
  rmType: string,
  fields: Record<string, string | number | boolean | null | undefined>,
): RmObject {
  const resolved = resolveDvType(rmType);
  const map = getFieldMap(resolved) ?? fallbackFieldMap(resolved);
  const root: RmObject = { _type: resolved };

  for (const field of map.fields) {
    let value = fields[field.suffix];
    // `|value` is a read alias for the bare suffix
    if (value == null && field.suffix === "") value = fields.value;
    if (value == null) continue;
    const coerced = coerce(value, field.kind);
    if (coerced === undefined) continue;

    let current = root;
    for (let i = 0; i < field.path.length - 1; i++) {
      const key = field.path[i];
      let next = current[key] as RmObject | undefined;
      if (!next || typeof next !== "object") {
        next = { _type: field.intermediates?.[key] ?? "OBJECT" };
        current[key] = next;
      }
      current = next;
    }
    current[field.path[field.path.length - 1]] = coerced;
  }

  // Apply build defaults (e.g. default terminology) when the owning object
  // was created but the defaulted leaf is missing.
  applyBuildDefaults(resolved, root, map);
  return root;
}

function applyBuildDefaults(
  rmType: string,
  root: RmObject,
  map: DvFieldMap,
): void {
  if (rmType === "DV_CODED_TEXT") {
    const dc = root.defining_code as RmObject | undefined;
    if (dc && dc.code_string != null && dc.terminology_id == null) {
      dc.terminology_id = { _type: "TERMINOLOGY_ID", value: "local" };
    }
  } else if (rmType === "CODE_PHRASE") {
    if (root.code_string != null && root.terminology_id == null) {
      root.terminology_id = { _type: "TERMINOLOGY_ID", value: "local" };
    }
  } else if (rmType === "DV_ORDINAL") {
    const symbol = root.symbol as RmObject | undefined;
    const dc = symbol?.defining_code as RmObject | undefined;
    if (dc && dc.code_string != null && dc.terminology_id == null) {
      dc.terminology_id = { _type: "TERMINOLOGY_ID", value: "local" };
    }
  } else if (rmType === "DV_MULTIMEDIA") {
    const mt = root.media_type as RmObject | undefined;
    if (mt && mt.code_string != null && mt.terminology_id == null) {
      mt.terminology_id = { _type: "TERMINOLOGY_ID", value: "IANA_media-types" };
    }
  } else if (rmType === "PARTY_IDENTIFIED" || rmType === "PARTY_PROXY") {
    root._type = "PARTY_IDENTIFIED";
    const ref = root.external_ref as RmObject | undefined;
    if (ref && ref.type == null) ref.type = "PARTY";
  }
  void map;
}

/**
 * Web template `inputs` for a leaf of the given RM type, per the simplified
 * formats spec: single-field types get one input without `suffix`; others get
 * one input per required/primary suffix.
 */
export function inputsForRmType(
  rmType: string,
): Array<{ type: string; suffix?: string }> {
  const map = getFieldMap(rmType);
  if (!map) return [{ type: "TEXT" }];
  const primary = map.fields.filter((f) => f.required || isPrimary(map, f));
  const chosen = primary.length ? primary : map.fields.slice(0, 1);
  return chosen.map((f) =>
    f.suffix === "" ? { type: f.inputType } : { type: f.inputType, suffix: f.suffix }
  );
}

function isPrimary(map: DvFieldMap, f: FieldSpec): boolean {
  // For coded text, code/value/terminology are all primary; for parties, all.
  if (map.rmType === "DV_CODED_TEXT") {
    return f.suffix === "code" || f.suffix === "value" ||
      f.suffix === "terminology";
  }
  if (map.rmType === "CODE_PHRASE") {
    return f.suffix === "code" || f.suffix === "terminology";
  }
  if (map.rmType === "DV_ORDINAL") {
    return f.suffix === "code" || f.suffix === "value" ||
      f.suffix === "ordinal";
  }
  if (
    map.rmType === "PARTY_PROXY" || map.rmType === "PARTY_IDENTIFIED" ||
    map.rmType === "PARTY_RELATED"
  ) {
    return true;
  }
  return f.suffix === "";
}
