/**
 * Build RM data-value objects from simplified format pipe-suffix fields.
 */

type RmObject = Record<string, unknown>;

export function buildRmValue(
  rmType: string,
  fields: Record<string, string | number | boolean | null | undefined>,
): RmObject {
  const f = fields;

  switch (rmType) {
    case "DV_TEXT":
      return { _type: "DV_TEXT", value: f.value };
    case "DV_BOOLEAN":
      return { _type: "DV_BOOLEAN", value: f.value };
    case "DV_DATE_TIME":
    case "DV_DATE":
    case "DV_TIME":
    case "DV_DURATION":
      return { _type: rmType, value: f.value };
    case "DV_QUANTITY":
      return { _type: "DV_QUANTITY", magnitude: f.magnitude, units: f.unit };
    case "DV_COUNT":
      return { _type: "DV_COUNT", magnitude: f.magnitude };
    case "DV_CODED_TEXT":
      return {
        _type: "DV_CODED_TEXT",
        value: f.value,
        defining_code: {
          _type: "CODE_PHRASE",
          terminology_id: { _type: "TERMINOLOGY_ID", value: f.terminology ?? "local" },
          code_string: f.code,
        },
      };
    case "CODE_PHRASE":
      return {
        _type: "CODE_PHRASE",
        terminology_id: { _type: "TERMINOLOGY_ID", value: f.terminology ?? "ISO_639-1" },
        code_string: f.code ?? f.value,
      };
    default:
      if (f.value != null) return { _type: rmType, value: f.value };
      if (f.magnitude != null) {
        return { _type: rmType, magnitude: f.magnitude, units: f.unit };
      }
      return { _type: rmType };
  }
}

export function applyContextFromFields(
  comp: RmObject,
  nodeId: string,
  fields: Record<string, string | number | boolean | null | undefined>,
): void {
  if (nodeId === "composer_name") {
    if (fields.value != null) {
      comp.composer = { _type: "PARTY_IDENTIFIED", name: String(fields.value) };
    }
    return;
  }

  if (nodeId === "language") {
    comp.language = {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
      code_string: String(fields.value ?? "en"),
    };
    return;
  }

  if (nodeId === "territory") {
    comp.territory = {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_3166-1" },
      code_string: String(fields.value ?? "US"),
    };
    return;
  }

  if (nodeId === "time") {
    if (fields.value != null) {
      comp.context = comp.context ?? { _type: "EVENT_CONTEXT" };
      (comp.context as RmObject).start_time = {
        _type: "DV_DATE_TIME",
        value: String(fields.value),
      };
    }
    return;
  }

  if (nodeId === "category") {
    comp.category = buildRmValue("DV_CODED_TEXT", fields);
    return;
  }

  if (nodeId === "setting") {
    comp.context = comp.context ?? { _type: "EVENT_CONTEXT" };
    (comp.context as RmObject).setting = buildRmValue("DV_CODED_TEXT", fields);
  }
}
