/**
 * Build RM data-value objects from simplified format pipe-suffix fields.
 *
 * Value construction is driven by the declarative per-type maps in
 * `dv_field_maps.ts`. Fields are keyed by pipe suffix; the empty-string key
 * "" denotes the bare path key (no `|suffix`), with `value` accepted as an
 * alias for compatibility with older payloads.
 */

import { buildDvValue } from "./dv_field_maps.ts";

type RmObject = Record<string, unknown>;
type Fields = Record<string, string | number | boolean | null | undefined>;

export function buildRmValue(rmType: string, fields: Fields): RmObject {
  return buildDvValue(rmType, fields);
}

function bare(fields: Fields): string | number | boolean | undefined {
  return fields[""] ?? fields.value ?? undefined;
}

export function applyContextFromFields(
  comp: RmObject,
  nodeId: string,
  fields: Fields,
): void {
  const ensureContext = (): RmObject => {
    if (!comp.context || typeof comp.context !== "object") {
      comp.context = { _type: "EVENT_CONTEXT" };
    }
    return comp.context as RmObject;
  };

  switch (nodeId) {
    case "composer_name": {
      const name = bare(fields);
      if (name != null) {
        comp.composer = { _type: "PARTY_IDENTIFIED", name: String(name) };
      }
      return;
    }
    case "composer_id": {
      const id = bare(fields);
      if (id == null) return;
      const composer = (comp.composer ?? {
        _type: "PARTY_IDENTIFIED",
      }) as RmObject;
      composer.external_ref = {
        _type: "PARTY_REF",
        id: { _type: "GENERIC_ID", value: String(id) },
        type: "PARTY",
      };
      comp.composer = composer;
      return;
    }
    case "language": {
      comp.language = {
        _type: "CODE_PHRASE",
        terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
        code_string: String(bare(fields) ?? "en"),
      };
      return;
    }
    case "territory": {
      comp.territory = {
        _type: "CODE_PHRASE",
        terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_3166-1" },
        code_string: String(bare(fields) ?? "US"),
      };
      return;
    }
    case "time": {
      const t = bare(fields);
      if (t != null) {
        ensureContext().start_time = {
          _type: "DV_DATE_TIME",
          value: String(t),
        };
      }
      return;
    }
    case "end_time": {
      const t = bare(fields);
      if (t != null) {
        ensureContext().end_time = { _type: "DV_DATE_TIME", value: String(t) };
      }
      return;
    }
    case "location": {
      const loc = bare(fields);
      if (loc != null) ensureContext().location = String(loc);
      return;
    }
    case "category": {
      comp.category = buildRmValue("DV_CODED_TEXT", normalizeCoded(fields));
      return;
    }
    case "setting": {
      ensureContext().setting = buildRmValue(
        "DV_CODED_TEXT",
        normalizeCoded(fields),
      );
      return;
    }
    case "health_care_facility": {
      const name = fields.name ?? bare(fields);
      const id = fields.id;
      if (name == null && id == null) return;
      const facility: RmObject = { _type: "PARTY_IDENTIFIED" };
      if (name != null) facility.name = String(name);
      if (id != null) {
        facility.external_ref = {
          _type: "PARTY_REF",
          id: { _type: "GENERIC_ID", value: String(id) },
          type: "ORGANISATION",
        };
      }
      ensureContext().health_care_facility = facility;
      return;
    }
  }
}

/** Accept `ctx/setting: "other care"` (bare value only) as coded-text value. */
function normalizeCoded(fields: Fields): Fields {
  if (fields.code != null || fields.value != null) return fields;
  const b = bare(fields);
  return b != null ? { ...fields, value: b } : fields;
}
