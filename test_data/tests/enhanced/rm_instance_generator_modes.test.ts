import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import * as openehr_am from "../../../enhanced/openehr_am.ts";
import {
  assertTemplateInstanceCoverage,
  expectedTemplateSlots,
  RMInstanceGenerator,
  templateInstanceCoverage,
  type GenerationMode,
} from "../../../enhanced/generation/mod.ts";
import { parseOptXml } from "../../../enhanced/parser/legacy/opt_xml_parser.ts";

const OPT_DIR = new URL("../../opt14/", import.meta.url);

function createOperationalTemplate(): openehr_am.OPERATIONAL_TEMPLATE {
  const template = new openehr_am.OPERATIONAL_TEMPLATE();
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "COMPOSITION";
  definition.node_id = "id1";

  const contentAttr = new openehr_am.C_MULTIPLE_ATTRIBUTE();
  contentAttr.rm_attribute_name = "content";
  const section = new openehr_am.C_COMPLEX_OBJECT();
  section.rm_type_name = "SECTION";
  section.node_id = "id2";
  (section as { occurrences?: { lower: number; upper: number } }).occurrences =
    { lower: 0, upper: 1 };
  contentAttr.children = [section];

  const itemsAttr = new openehr_am.C_MULTIPLE_ATTRIBUTE();
  itemsAttr.rm_attribute_name = "items";
  (itemsAttr as { cardinality?: { interval: { lower: number; upper: number } } })
    .cardinality = { interval: { lower: 0, upper: 3 } };
  const element = new openehr_am.C_COMPLEX_OBJECT();
  element.rm_type_name = "ELEMENT";
  element.node_id = "id3";
  const valueAttr = new openehr_am.C_SINGLE_ATTRIBUTE();
  valueAttr.rm_attribute_name = "value";
  const value = new openehr_am.C_COMPLEX_OBJECT();
  value.rm_type_name = "DV_TEXT";
  const primitiveValueAttr = new openehr_am.C_SINGLE_ATTRIBUTE();
  primitiveValueAttr.rm_attribute_name = "value";
  const primitiveValue = new openehr_am.C_STRING();
  primitiveValue.rm_type_name = "STRING";
  primitiveValueAttr.children = [primitiveValue];
  value.attributes = [primitiveValueAttr];
  valueAttr.children = [value];
  element.attributes = [valueAttr];
  itemsAttr.children = [element];
  section.attributes = [itemsAttr];

  definition.attributes = [contentAttr];
  template.definition = definition;
  return template;
}

function generateForMode(
  template: openehr_am.OPERATIONAL_TEMPLATE,
  mode: GenerationMode,
) {
  return new RMInstanceGenerator({ mode }).generate(template);
}

Deno.test("RMInstanceGenerator minimal mode includes mandatory RM fields and omits optional content", () => {
  const template = createOperationalTemplate();
  const instance = generateForMode(template, "minimal");

  assertEquals(instance._type, "COMPOSITION");
  assert("language" in instance);
  assert("territory" in instance);
  assert("category" in instance);
  assert("composer" in instance);
  assert(!("content" in instance));
  assertTemplateInstanceCoverage(instance, template, "minimal");
});

Deno.test("RMInstanceGenerator example mode includes every template-mentioned optional field once", () => {
  const template = createOperationalTemplate();
  const instance = generateForMode(template, "example");

  assert(instance.content);
  assertEquals(instance.content.length, 1);
  assertEquals(instance.content[0]._type, "SECTION");
  assert(Array.isArray(instance.content[0].items));
  assertEquals(instance.content[0].items.length, 1);
  assertEquals(instance.content[0].items[0].value._type, "DV_TEXT");
  assertEquals(instance.content[0].items[0].value.value, "Example value");
  assertTemplateInstanceCoverage(instance, template, "example");
});

Deno.test("RMInstanceGenerator maximal mode fills optional fields and cardinality upper bound", () => {
  const template = createOperationalTemplate();
  const instance = generateForMode(template, "maximal");

  assert(instance.content);
  assertEquals(instance.content[0]._type, "SECTION");
  assert(Array.isArray(instance.content[0].items));
  assertEquals(instance.content[0].items.length, 3);
  assertTemplateInstanceCoverage(instance, template, "maximal");
});

Deno.test("RMInstanceGenerator fillOptional override works independently of mode", () => {
  const template = createOperationalTemplate();
  const generator = new RMInstanceGenerator({
    mode: "minimal",
    fillOptional: true,
  });
  const instance = generator.generate(template);

  assert(instance.content);
  assertTemplateInstanceCoverage(instance, template, "example");
});

Deno.test("RMInstanceGenerator example mode always includes mandatory descendants under optional attributes", () => {
  const template = new openehr_am.OPERATIONAL_TEMPLATE();
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = "COMPOSITION";
  definition.node_id = "id1";

  const contentAttr = new openehr_am.C_MULTIPLE_ATTRIBUTE();
  contentAttr.rm_attribute_name = "content";
  (contentAttr as { existence?: { lower: number; upper: number } }).existence =
    { lower: 0, upper: 1 };

  const observation = new openehr_am.C_COMPLEX_OBJECT();
  observation.rm_type_name = "OBSERVATION";
  observation.node_id = "id2";
  (observation as { occurrences?: { lower: number; upper: number } }).occurrences =
    { lower: 1, upper: 1 };

  const dataAttr = new openehr_am.C_SINGLE_ATTRIBUTE();
  dataAttr.rm_attribute_name = "data";
  (dataAttr as { existence?: { lower: number; upper: number } }).existence = {
    lower: 1,
    upper: 1,
  };
  const history = new openehr_am.C_COMPLEX_OBJECT();
  history.rm_type_name = "HISTORY";
  history.node_id = "id3";
  (history as { occurrences?: { lower: number; upper: number } }).occurrences =
    { lower: 1, upper: 1 };
  dataAttr.children = [history];
  observation.attributes = [dataAttr];
  contentAttr.children = [observation];
  definition.attributes = [contentAttr];
  template.definition = definition;

  const instance = generateForMode(template, "minimal");
  assertEquals(instance.content.length, 1);
  assertEquals(instance.content[0]._type, "OBSERVATION");
  assertEquals(instance.content[0].data._type, "HISTORY");
  assertTemplateInstanceCoverage(instance, template, "minimal");
});

const OPT_FIXTURES = [
  "minimal_evaluation.opt",
  "ehrbase_blood_pressure_simple.de.v0.opt",
  "Test_all_types.opt",
  "minimal_instruction.opt",
  "nested.en.v1.opt",
];

for (const fixture of OPT_FIXTURES) {
  for (const mode of ["minimal", "example", "maximal"] as const) {
    Deno.test(`RMInstanceGenerator ${mode} mode covers ${fixture}`, async () => {
      const xml = await Deno.readTextFile(new URL(fixture, OPT_DIR));
      const { operationalTemplate } = parseOptXml(xml);
      const instance = new RMInstanceGenerator({ mode }).generate(
        operationalTemplate,
      );
      assertEquals(instance._type, "COMPOSITION");
      assertTemplateInstanceCoverage(instance, operationalTemplate, mode);

      const coverage = templateInstanceCoverage(
        instance,
        operationalTemplate,
        mode,
      );
      assert(coverage.expected.length > 0);
      if (mode === "minimal") {
        const optionalOnly = coverage.expected.filter((slot) => !slot.required);
        const presentOptional = optionalOnly.filter(
          (slot) => !coverage.missing.includes(slot),
        );
        assertEquals(
          presentOptional.length,
          0,
          "minimal mode should not include optional-only template slots",
        );
      }
      if (mode === "example") {
        const optionalSlots = expectedTemplateSlots(operationalTemplate, "example")
          .filter((slot) => !slot.required);
        assert(optionalSlots.length > 0, `${fixture} should have optional slots`);
      }
    });
  }
}
