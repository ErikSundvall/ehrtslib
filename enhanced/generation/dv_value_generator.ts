/**
 * Generate example RM data values from AOM primitive / DV constraints.
 */

import * as openehr_am from "../openehr_am.ts";

const ISO_NOW = () => new Date().toISOString();

function readDefaultValue(cObject: openehr_am.C_OBJECT): unknown | undefined {
  const bag = cObject as Record<string, unknown>;
  return bag.default_value ?? bag.defaultValue;
}

function rmInstanceFromDefaultValue(raw: unknown): unknown | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const rec = raw as Record<string, unknown>;
  const type = String(rec["@type"] ?? rec._type ?? "").replace(/^@/, "");
  if (!type) return undefined;

  const out: Record<string, unknown> = { _type: type };
  for (const [key, val] of Object.entries(rec)) {
    if (key === "@type" || key === "_type") continue;
    const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const nested = rmInstanceFromDefaultValue(val);
      out[snake] = nested ?? val;
    } else {
      out[snake] = val;
    }
  }
  return out;
}

export function generatePrimitiveValue(
  prim: openehr_am.C_PRIMITIVE_OBJECT,
): unknown {
  const fromDefault = readDefaultValue(prim);
  if (fromDefault !== undefined) {
    const converted = rmInstanceFromDefaultValue(fromDefault);
    if (converted !== undefined) return converted;
  }

  const item = prim.item;
  const rmType = prim.rm_type_name ?? item?.rm_type_name ?? "DV_TEXT";

  if (item instanceof openehr_am.C_TERMINOLOGY_CODE) {
    const code = item.constraint ?? "at0001";
    const terminology = (item as { terminology_id?: string }).terminology_id ??
      "local";
    return {
      _type: "CODE_PHRASE",
      terminology_id: { value: terminology },
      code_string: code,
    };
  }

  if (item instanceof openehr_am.C_STRING) {
    const list = (item as { list?: string[] }).list;
    const value = list?.[0] ?? "example";
    return { _type: "DV_TEXT", value };
  }

  if (item instanceof openehr_am.C_INTEGER) {
    return { _type: "DV_COUNT", magnitude: 1 };
  }

  if (item instanceof openehr_am.C_REAL) {
    return { _type: "DV_QUANTITY", magnitude: 1.0, units: "1" };
  }

  if (item instanceof openehr_am.C_QUANTITY) {
    const list = (item as { list?: openehr_am.C_QUANTITY_ITEM[] }).list;
    const units = list?.[0]?.units ?? "1";
    return { _type: "DV_QUANTITY", magnitude: 1.0, units };
  }

  if (item instanceof openehr_am.C_BOOLEAN) {
    return { _type: "DV_BOOLEAN", value: true };
  }

  if (item instanceof openehr_am.C_DATE_TIME) {
    return { _type: "DV_DATE_TIME", value: ISO_NOW() };
  }

  if (item instanceof openehr_am.C_DATE) {
    return { _type: "DV_DATE", value: ISO_NOW().slice(0, 10) };
  }

  if (item instanceof openehr_am.C_TIME) {
    return { _type: "DV_TIME", value: ISO_NOW().slice(11, 19) };
  }

  if (item instanceof openehr_am.C_DURATION) {
    return { _type: "DV_DURATION", value: "PT1H" };
  }

  return generateDvFromRmTypeName(rmType.replace(/^C_/, "DV_"), prim);
}

export function generateDvFromRmTypeName(
  rmType: string,
  constraint?: openehr_am.C_OBJECT,
): unknown {
  const fromDefault = constraint ? readDefaultValue(constraint) : undefined;
  if (fromDefault !== undefined) {
    const converted = rmInstanceFromDefaultValue(fromDefault);
    if (converted !== undefined) return converted;
  }

  switch (rmType) {
    case "DV_TEXT":
      return { _type: "DV_TEXT", value: "example" };
    case "DV_CODED_TEXT":
      return {
        _type: "DV_CODED_TEXT",
        value: "example",
        defining_code: {
          _type: "CODE_PHRASE",
          terminology_id: { value: "local" },
          code_string: "at0001",
        },
      };
    case "DV_QUANTITY":
      return { _type: "DV_QUANTITY", magnitude: 1.0, units: "1" };
    case "DV_COUNT":
      return { _type: "DV_COUNT", magnitude: 1 };
    case "DV_PROPORTION":
      return {
        _type: "DV_PROPORTION",
        numerator: 1,
        denominator: 2,
        type: 0,
      };
    case "DV_BOOLEAN":
      return { _type: "DV_BOOLEAN", value: true };
    case "DV_DATE_TIME":
      return { _type: "DV_DATE_TIME", value: ISO_NOW() };
    case "DV_DATE":
      return { _type: "DV_DATE", value: ISO_NOW().slice(0, 10) };
    case "DV_TIME":
      return { _type: "DV_TIME", value: ISO_NOW().slice(11, 19) };
    case "DV_DURATION":
      return { _type: "DV_DURATION", value: "PT1H" };
    case "DV_IDENTIFIER":
      return {
        _type: "DV_IDENTIFIER",
        issuer: "example",
        assigner: "example",
        id: "example-id",
        type: "example",
      };
    case "DV_URI":
      return { _type: "DV_URI", value: "https://example.org" };
    case "DV_EHR_URI":
      return { _type: "DV_EHR_URI", value: "ehr:example" };
    case "CODE_PHRASE":
      return {
        _type: "CODE_PHRASE",
        terminology_id: { value: "local" },
        code_string: "at0001",
      };
    case "DV_MULTIMEDIA":
      return {
        _type: "DV_MULTIMEDIA",
        media_type: { _type: "CODE_PHRASE", terminology_id: { value: "IANA_media-types" }, code_string: "text/plain" },
        size: 0,
      };
    case "DV_PARSABLE":
      return {
        _type: "DV_PARSABLE",
        value: "example",
        formalism: "text/plain",
      };
    default:
      return { _type: rmType };
  }
}

export function isDataValueRmType(rmType?: string): boolean {
  return !!rmType &&
    (rmType.startsWith("DV_") || rmType === "CODE_PHRASE");
}
