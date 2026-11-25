/**
 * #336: XmlDeserializer must coerce integer/real RM leaves to JS numbers
 * so an XML round-trip validates like the JSON path.
 */

import { assert, assertEquals, assertFalse } from "@std/assert";
import * as openehr_am from "../../../../am/openehr_am.ts";
import { registerOpenEhrModelTypes } from "../../../../serialization/common/openehr_model_registry.ts";
import {
  JsonCanonicalDeserializer,
  JsonCanonicalSerializer,
} from "../../../../serialization/json/mod.ts";
import { XmlDeserializer } from "../../../../serialization/xml/xml_deserializer.ts";
import { XmlSerializer } from "../../../../serialization/xml/xml_serializer.ts";
import { RMSpecificationValidator } from "../../../../validation/rm_specification_validator.ts";
import { TemplateValidator } from "../../../../validation/template_validator.ts";

function registerTypes() {
  registerOpenEhrModelTypes();
}

function xmlRoundTrip<T>(value: T): T {
  const xml = new XmlSerializer({ prettyPrint: true }).serialize(value);
  return new XmlDeserializer().deserialize<T>(xml);
}

function jsonRoundTrip<T>(value: T): T {
  const json = new JsonCanonicalSerializer().serialize(value);
  return new JsonCanonicalDeserializer().deserialize<T>(json);
}

function deserializeXml(xml: string) {
  return new XmlDeserializer().deserialize(xml);
}

function coded(terminology: string, code: string, value?: string) {
  const defining = {
    _type: "CODE_PHRASE",
    terminology_id: { _type: "TERMINOLOGY_ID", value: terminology },
    code_string: code,
  };
  if (value === undefined) return defining;
  return { _type: "DV_CODED_TEXT", value, defining_code: defining };
}

function rmErrors(instance: unknown, rmType?: string) {
  return new RMSpecificationValidator().validateInstance(instance, rmType)
    .filter((m) => m.severity === "error");
}

function assertRmValid(instance: unknown, rmType?: string, label = "instance") {
  const errors = rmErrors(instance, rmType);
  assertEquals(
    errors.map((e) => `${e.path}: ${e.message}`),
    [],
    `${label} should pass RMSpecificationValidator`,
  );
}

function quantityTemplate(range: { lower: number; upper: number }) {
  const template = new openehr_am.ARCHETYPE();
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "ELEMENT";
  definition.node_id = "at0001";
  const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
  attr.rm_attribute_name = "value";
  const quantity = new openehr_am.C_QUANTITY();
  quantity.rm_type_name = "DV_QUANTITY";
  const row = new openehr_am.C_QUANTITY_ITEM();
  row.units = "mm[Hg]";
  (row as { magnitude?: unknown }).magnitude = {
    lower: range.lower,
    upper: range.upper,
    lower_included: true,
    upper_included: true,
  };
  (quantity as { list: unknown[] }).list = [row];
  attr.children = [quantity];
  definition.attributes = [attr];
  template.definition = definition;
  return template;
}

function numericComposition(): Record<string, unknown> {
  const entry = {
    language: coded("ISO_639-1", "en"),
    encoding: coded("IANA_character-sets", "UTF-8"),
    subject: { _type: "PARTY_SELF" },
  };
  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Numeric types" },
    archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
    language: coded("ISO_639-1", "en"),
    territory: coded("ISO_3166-1", "GB"),
    category: coded("openehr", "433", "event"),
    composer: { _type: "PARTY_IDENTIFIED", name: "Dr. Test" },
    context: {
      _type: "EVENT_CONTEXT",
      start_time: { _type: "DV_DATE_TIME", value: "2026-11-25T14:00:00Z" },
      setting: coded("openehr", "228", "primary medical care"),
    },
    content: [
      {
        _type: "EVALUATION",
        ...entry,
        name: { _type: "DV_TEXT", value: "Findings" },
        archetype_node_id: "openEHR-EHR-EVALUATION.clinical_synopsis.v1",
        data: {
          _type: "ITEM_TREE",
          name: { _type: "DV_TEXT", value: "Tree" },
          archetype_node_id: "at0001",
          items: [
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Systolic" },
              archetype_node_id: "at0002",
              value: {
                _type: "DV_QUANTITY",
                magnitude: 120,
                units: "mm[Hg]",
                precision: 0,
                accuracy: 1.5,
                normal_range: {
                  _type: "DV_INTERVAL",
                  lower: {
                    _type: "DV_QUANTITY",
                    magnitude: 90,
                    units: "mm[Hg]",
                  },
                  upper: {
                    _type: "DV_QUANTITY",
                    magnitude: 140,
                    units: "mm[Hg]",
                  },
                  lower_included: true,
                  upper_included: true,
                  lower_unbounded: false,
                  upper_unbounded: false,
                },
              },
            },
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Pulse" },
              archetype_node_id: "at0003",
              value: { _type: "DV_COUNT", magnitude: 72 },
            },
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Severity" },
              archetype_node_id: "at0004",
              value: {
                _type: "DV_ORDINAL",
                value: 2,
                symbol: coded("local", "at0005", "Moderate"),
              },
            },
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Score" },
              archetype_node_id: "at0006",
              value: {
                _type: "DV_SCALE",
                value: 7.5,
                symbol: coded("local", "at0007", "7.5"),
              },
            },
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Ratio" },
              archetype_node_id: "at0008",
              value: {
                _type: "DV_PROPORTION",
                numerator: 40,
                denominator: 100,
                type: 2,
                precision: 0,
              },
            },
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Photo" },
              archetype_node_id: "at0009",
              value: {
                _type: "DV_MULTIMEDIA",
                media_type: coded("IANA_media-types", "image/png"),
                size: 2048,
              },
            },
          ],
        },
      },
    ],
  };
}

function fromCanonical(data: Record<string, unknown>) {
  const serializer = new JsonCanonicalSerializer();
  // Materialise through JSON so constructors and type registry apply.
  return new JsonCanonicalDeserializer().deserialize(
    serializer.serialize(data),
  );
}

Deno.test("#336: XML round-trip keeps DV_QUANTITY magnitude and precision as numbers", () => {
  registerTypes();
  const original = fromCanonical({
    _type: "DV_QUANTITY",
    magnitude: 120.5,
    units: "mm[Hg]",
    precision: 1,
    accuracy: 0.5,
  });
  const restored = xmlRoundTrip(original);
  assertEquals(typeof restored.magnitude, "number");
  assertEquals(restored.magnitude, 120.5);
  assertEquals(typeof restored.precision, "number");
  assertEquals(restored.precision, 1);
  assertEquals(typeof restored.accuracy, "number");
  assertEquals(restored.accuracy, 0.5);
  assertEquals(typeof restored.units, "string");
  assertEquals(restored.units, "mm[Hg]");
  assertRmValid(restored, "DV_QUANTITY", "XML DV_QUANTITY");
});

Deno.test("#336: XML round-trip keeps DV_COUNT.magnitude as a number (not undefined)", () => {
  registerTypes();
  const original = fromCanonical({ _type: "DV_COUNT", magnitude: 5 });
  const restored = xmlRoundTrip(original);
  assertEquals(typeof restored.magnitude, "number");
  assertEquals(restored.magnitude, 5);
  assert(restored.magnitude !== undefined);
  assertRmValid(restored, "DV_COUNT", "XML DV_COUNT");
});

Deno.test("#336: XML round-trip keeps DV_ORDINAL.value, DV_SCALE.value, and DV_PROPORTION numerics", () => {
  registerTypes();
  const ordinal = xmlRoundTrip(fromCanonical({
    _type: "DV_ORDINAL",
    value: 2,
    symbol: coded("local", "at0001", "Moderate"),
  }));
  assertEquals(typeof ordinal.value, "number");
  assertEquals(ordinal.value, 2);
  assertEquals(typeof ordinal.symbol.value, "string");
  assertRmValid(ordinal, "DV_ORDINAL", "XML DV_ORDINAL");

  const scale = xmlRoundTrip(fromCanonical({
    _type: "DV_SCALE",
    value: 7.5,
    symbol: coded("local", "at0002", "7.5"),
  }));
  assertEquals(typeof scale.value, "number");
  assertEquals(scale.value, 7.5);
  assertRmValid(scale, "DV_SCALE", "XML DV_SCALE");

  const proportion = xmlRoundTrip(fromCanonical({
    _type: "DV_PROPORTION",
    numerator: 1,
    denominator: 128,
    type: 0,
    precision: -1,
  }));
  assertEquals(typeof proportion.numerator, "number");
  assertEquals(typeof proportion.denominator, "number");
  assertEquals(typeof proportion.type, "number");
  assertEquals(typeof proportion.precision, "number");
  assertEquals(proportion.numerator, 1);
  assertEquals(proportion.denominator, 128);
  assertEquals(proportion.type, 0);
  assertEquals(proportion.precision, -1);
  assertRmValid(proportion, "DV_PROPORTION", "XML DV_PROPORTION");
});

Deno.test("#336: XML round-trip keeps DV_INTERVAL normal_range bounds numeric", () => {
  registerTypes();
  const restored = xmlRoundTrip(fromCanonical({
    _type: "DV_QUANTITY",
    magnitude: 120,
    units: "mm[Hg]",
    normal_range: {
      _type: "DV_INTERVAL",
      lower: { _type: "DV_QUANTITY", magnitude: 90, units: "mm[Hg]" },
      upper: { _type: "DV_QUANTITY", magnitude: 140, units: "mm[Hg]" },
      lower_included: true,
      upper_included: true,
      lower_unbounded: false,
      upper_unbounded: false,
    },
  }));
  assertEquals(typeof restored.normal_range.lower.magnitude, "number");
  assertEquals(restored.normal_range.lower.magnitude, 90);
  assertEquals(typeof restored.normal_range.upper.magnitude, "number");
  assertEquals(restored.normal_range.upper.magnitude, 140);
  assertEquals(restored.normal_range.lower_included, true);
  assertEquals(restored.normal_range.upper_unbounded, false);
  assertRmValid(restored, "DV_QUANTITY", "XML DV_QUANTITY with normal_range");
});

Deno.test("#336: other Integer/Real RM attributes coerce on XML read", () => {
  registerTypes();
  const intervalEvent = xmlRoundTrip(fromCanonical({
    _type: "INTERVAL_EVENT",
    sample_count: 12,
  }));
  assertEquals(typeof intervalEvent.sample_count, "number");
  assertEquals(intervalEvent.sample_count, 12);

  const multimedia = xmlRoundTrip(fromCanonical({
    _type: "DV_MULTIMEDIA",
    media_type: coded("IANA_media-types", "image/png"),
    size: 2048,
  }));
  assertEquals(typeof multimedia.size, "number");
  assertEquals(multimedia.size, 2048);
  assertEquals(typeof multimedia.media_type.code_string, "string");

  const extract = xmlRoundTrip(
    fromCanonical({ _type: "EXTRACT", sequence_nr: 3 }),
  );
  assertEquals(typeof extract.sequence_nr, "number");
  assertEquals(extract.sequence_nr, 3);

  const spec = xmlRoundTrip(fromCanonical({
    _type: "EXTRACT_SPEC",
    link_depth: 2,
    priority: 9,
  }));
  assertEquals(typeof spec.link_depth, "number");
  assertEquals(typeof spec.priority, "number");
  assertEquals(spec.link_depth, 2);
  assertEquals(spec.priority, 9);

  const versioned = xmlRoundTrip(fromCanonical({
    _type: "X_VERSIONED_OBJECT",
    extract_version_count: 4,
    total_version_count: 10,
  }));
  assertEquals(typeof versioned.extract_version_count, "number");
  assertEquals(typeof versioned.total_version_count, "number");
  assertEquals(versioned.extract_version_count, 4);
  assertEquals(versioned.total_version_count, 10);

  const message = xmlRoundTrip(fromCanonical({
    _type: "ADDRESSED_MESSAGE",
    urgency: 1,
  }));
  assertEquals(typeof message.urgency, "number");
  assertEquals(message.urgency, 1);
});

Deno.test("#336: string RM fields stay strings, including numeric-looking codes and ids", () => {
  registerTypes();
  const phrase = xmlRoundTrip(fromCanonical({
    _type: "CODE_PHRASE",
    terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
    code_string: "433",
  }));
  assertEquals(typeof phrase.code_string, "string");
  assertEquals(phrase.code_string, "433");

  const text = xmlRoundTrip(fromCanonical({
    _type: "DV_TEXT",
    value: "120",
  }));
  assertEquals(typeof text.value, "string");
  assertEquals(text.value, "120");

  const identifier = xmlRoundTrip(fromCanonical({
    _type: "DV_IDENTIFIER",
    issuer: "NHS",
    assigner: "NHS",
    id: "12345",
    type: "NHSNBR",
  }));
  assertEquals(typeof identifier.id, "string");
  assertEquals(identifier.id, "12345");
  assertEquals(typeof identifier.issuer, "string");

  const objectId = xmlRoundTrip(fromCanonical({
    _type: "HIER_OBJECT_ID",
    value: "550e8400-e29b-41d4-a716-446655440000",
  }));
  assertEquals(typeof objectId.value, "string");
  assertEquals(objectId.value, "550e8400-e29b-41d4-a716-446655440000");
});

Deno.test("#336: invalid numeric XML text is not accepted as NaN and fails RM validation", () => {
  registerTypes();
  const validXml = new XmlSerializer({ prettyPrint: true }).serialize(
    fromCanonical({ _type: "DV_QUANTITY", magnitude: 120, units: "mm[Hg]" }),
  );
  const invalidXml = validXml.replace(
    /<magnitude>120<\/magnitude>/,
    "<magnitude>not-a-number</magnitude>",
  );
  const restored = deserializeXml(invalidXml);
  assertFalse(Number.isNaN(restored.magnitude), "must not store NaN");
  assertEquals(typeof restored.magnitude, "string");
  const errors = rmErrors(restored, "DV_QUANTITY");
  assert(
    errors.some((e) =>
      /magnitude/i.test(`${e.path} ${e.message}`) && /string/i.test(e.message)
    ),
    `expected a loud type error for magnitude, got: ${
      errors.map((e) => `${e.path}: ${e.message}`).join("; ")
    }`,
  );

  const countXml = new XmlSerializer({ prettyPrint: true }).serialize(
    fromCanonical({ _type: "DV_COUNT", magnitude: 5 }),
  ).replace(/<magnitude>5<\/magnitude>/, "<magnitude>12abc</magnitude>");
  const count = deserializeXml(countXml);
  assertFalse(Number.isNaN(count.magnitude));
  const countErrors = rmErrors(count, "DV_COUNT");
  assert(
    countErrors.length > 0,
    "invalid DV_COUNT.magnitude must fail RM validation",
  );
});

Deno.test("#336: composition XML round-trip passes RM and template validation like JSON", async () => {
  registerTypes();
  const original = fromCanonical(numericComposition());
  const viaJson = jsonRoundTrip(original);
  const viaXml = xmlRoundTrip(original);

  assertRmValid(original, "COMPOSITION", "original");
  assertRmValid(viaJson, "COMPOSITION", "JSON round-trip");
  assertRmValid(viaXml, "COMPOSITION", "XML round-trip");

  const systolic = viaXml.content[0].data.items[0].value;
  assertEquals(typeof systolic.magnitude, "number");
  assertEquals(systolic.magnitude, 120);
  assertEquals(typeof systolic.precision, "number");
  assertEquals(typeof systolic.accuracy, "number");
  assertEquals(typeof systolic.normal_range.lower.magnitude, "number");
  assertEquals(viaXml.content[0].data.items[1].value.magnitude, 72);
  assertEquals(
    typeof viaXml.content[0].data.items[1].value.magnitude,
    "number",
  );
  assertEquals(viaXml.content[0].data.items[2].value.value, 2);
  assertEquals(viaXml.content[0].data.items[3].value.value, 7.5);
  assertEquals(viaXml.content[0].data.items[4].value.numerator, 40);
  assertEquals(viaXml.content[0].data.items[4].value.type, 2);
  assertEquals(viaXml.content[0].data.items[5].value.size, 2048);
  assertEquals(typeof viaXml.language.code_string, "string");

  const template = new openehr_am.ARCHETYPE();
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "COMPOSITION";
  definition.node_id = "id1";
  definition.attributes = [];
  template.definition = definition;

  const validator = new TemplateValidator({
    validateUnits: false,
    validateTerminology: false,
    validateIntervals: false,
    validateInvariants: false,
    validateRMSpecification: true,
  });
  await validator.initialize();
  const jsonResult = validator.validate(viaJson, template);
  const xmlResult = validator.validate(viaXml, template);
  assertEquals(
    xmlResult.errors.map((e) => `${e.path}: ${e.message}`),
    jsonResult.errors.map((e) => `${e.path}: ${e.message}`),
    "XML and JSON round-trips should report the same template/RM errors",
  );
  assertEquals(jsonResult.valid, true, "JSON path should be valid");
  assertEquals(xmlResult.valid, true, "XML path should be valid");
});

Deno.test("#336: TemplateValidator unit-interval bounds pass after XML when magnitudes are numbers", async () => {
  registerTypes();
  const template = quantityTemplate({ lower: 30, upper: 500 });
  const validator = new TemplateValidator({
    validateUnits: false,
    validateTerminology: false,
    validateIntervals: true,
    validateInvariants: false,
    validateRMSpecification: false,
  });
  await validator.initialize();

  // Lexicographic traps if magnitude stays a string: "72" > "500", "120" < "30".
  for (const magnitude of [72, 120]) {
    const element = xmlRoundTrip(fromCanonical({
      _type: "ELEMENT",
      name: { _type: "DV_TEXT", value: "Systolic" },
      archetype_node_id: "at0001",
      value: { _type: "DV_QUANTITY", magnitude, units: "mm[Hg]" },
    }));
    assertEquals(typeof element.value.magnitude, "number");
    const result = validator.validate(element, template);
    assertEquals(
      result.errors.map((e) => `${e.path}: ${e.message}`),
      [],
      `magnitude ${magnitude} must stay inside [30, 500] after XML round-trip`,
    );
    assertEquals(result.valid, true);
  }
});
