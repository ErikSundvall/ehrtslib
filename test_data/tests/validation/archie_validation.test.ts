/**
 * Archie-Inspired Validation Tests
 *
 * Uses real AOM constraint trees (same style as enhanced_validator.test.ts).
 * Patterns inspired by openEHR Archie RMObjectValidator tests.
 */

import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { TemplateValidator } from "../../enhanced/validation/template_validator.ts";
import * as openehr_am from "../../enhanced/openehr_am.ts";
import * as openehr_base from "../../enhanced/openehr_base.ts";

function archetypeWithDefinition(
  rmType: string,
  nodeId: string,
  build: (def: openehr_am.C_COMPLEX_OBJECT) => void
): openehr_am.ARCHETYPE {
  const template = new openehr_am.ARCHETYPE();
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = rmType;
  definition.node_id = nodeId;
  build(definition);
  template.definition = definition;
  return template;
}

Deno.test("Archie-Inspired - String Pattern Validation", () => {
  const validator = new TemplateValidator();
  const template = archetypeWithDefinition("ELEMENT", "id1", (def) => {
    const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
    attr.rm_attribute_name = "value";
    const strConstraint = new openehr_am.C_STRING();
    strConstraint.pattern = "^[A-Z]{3}$";
    attr.children = [strConstraint as openehr_am.C_OBJECT];
    def.attributes = [attr];
  });

  const validResult = validator.validate({ value: "ABC" }, template);
  assertEquals(validResult.valid, true);

  const invalidResult = validator.validate({ value: "abc" }, template);
  assertEquals(invalidResult.valid, false);
  assertEquals(invalidResult.errors[0]?.constraintType, "string_pattern");
});

Deno.test("Archie-Inspired - Integer Range Validation", () => {
  const validator = new TemplateValidator();
  const template = archetypeWithDefinition("ELEMENT", "id1", (def) => {
    const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
    attr.rm_attribute_name = "value";
    const intConstraint = new openehr_am.C_INTEGER();
    intConstraint.range = { lower: 0, upper: 100 } as openehr_base.Interval_integer;
    attr.children = [intConstraint as openehr_am.C_OBJECT];
    def.attributes = [attr];
  });

  assertEquals(validator.validate({ value: 50 }, template).valid, true);
  const invalid = validator.validate({ value: 150 }, template);
  assertEquals(invalid.valid, false);
  assertEquals(invalid.errors[0]?.constraintType, "integer_range");
});

Deno.test("Archie-Inspired - Occurrence Validation", () => {
  const validator = new TemplateValidator();
  const template = archetypeWithDefinition("OBSERVATION", "id1", (def) => {
    const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
    attr.rm_attribute_name = "data";
    const history = new openehr_am.C_COMPLEX_OBJECT();
    history.rm_type_name = "HISTORY";
    history.node_id = "id2";
    const occurrences = new openehr_base.Multiplicity_interval();
    occurrences.lower = 1;
    occurrences.upper = 1;
    history.occurrences = occurrences;
    attr.children = [history];
    def.attributes = [attr];
  });

  assertEquals(
    validator.validate({ data: { origin: {} } }, template).valid,
    true
  );
  const missing = validator.validate({}, template);
  assertEquals(missing.valid, false);
});

Deno.test("Archie-Inspired - DV_INTERVAL Bounds Validation", async () => {
  const validator = new TemplateValidator({ validateIntervals: true });
  await validator.initialize();

  const template = archetypeWithDefinition("OBSERVATION", "id1", (def) => {
    const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
    attr.rm_attribute_name = "range";
    const interval = new openehr_am.C_COMPLEX_OBJECT();
    interval.rm_type_name = "DV_INTERVAL";
    interval.node_id = "id2";
    attr.children = [interval];
    def.attributes = [attr];
  });

  const validResult = validator.validate(
    {
      range: {
        lower: { magnitude: 10 },
        upper: { magnitude: 100 },
        lower_included: true,
        upper_included: true,
      },
    },
    template
  );
  assertEquals(validResult.valid, true);

  const invalidResult = validator.validate(
    {
      range: {
        lower: { magnitude: 100 },
        upper: { magnitude: 10 },
        lower_included: true,
        upper_included: true,
      },
    },
    template
  );
  assertEquals(invalidResult.valid, false);
  assertEquals(invalidResult.errors[0]?.constraintType, "interval");
});

Deno.test("Archie-Inspired - COMPOSITION.category RM Constraint", async () => {
  const validator = new TemplateValidator({ validateRMSpecification: true });
  await validator.initialize();

  const template = archetypeWithDefinition("COMPOSITION", "id1", (def) => {
    const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
    attr.rm_attribute_name = "category";
    const coded = new openehr_am.C_COMPLEX_OBJECT();
    coded.rm_type_name = "DV_CODED_TEXT";
    coded.node_id = "id2";
    attr.children = [coded];
    def.attributes = [attr];
  });

  const validResult = validator.validate(
    {
      category: {
        value: "persistent",
        defining_code: {
          terminology_id: { value: "openehr" },
          code_string: "431",
        },
      },
    },
    template
  );
  assertEquals(validResult.valid, true);

  const invalidResult = validator.validate(
    {
      category: {
        value: "invalid",
        defining_code: {
          terminology_id: { value: "openehr" },
          code_string: "999",
        },
      },
    },
    template
  );
  assertEquals(invalidResult.valid, false);
  assertEquals(invalidResult.errors[0]?.constraintType, "rm_specification");
});

Deno.test("Archie-Inspired - UCUM Unit Validation", async () => {
  const validator = new TemplateValidator({ validateUnits: true });
  await validator.initialize();

  const template = archetypeWithDefinition("OBSERVATION", "id1", (def) => {
    const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
    attr.rm_attribute_name = "quantity";
    const qty = new openehr_am.C_COMPLEX_OBJECT();
    qty.rm_type_name = "DV_QUANTITY";
    qty.node_id = "id2";
    attr.children = [qty];
    def.attributes = [attr];
  });

  assertEquals(
    validator.validate({ quantity: { magnitude: 98.6, units: "[degF]" } }, template)
      .valid,
    true
  );
  const invalid = validator.validate(
    { quantity: { magnitude: 98.6, units: "degrees" } },
    template
  );
  assertEquals(invalid.valid, false);
  assertEquals(invalid.errors[0]?.constraintType, "ucum");
});

Deno.test("Archie-Inspired - DV_CODED_TEXT Terminology Structure", async () => {
  const validator = new TemplateValidator({ validateTerminology: true });
  await validator.initialize();

  const template = archetypeWithDefinition("DV_CODED_TEXT", "id1", () => {});

  assertEquals(
    validator.validate(
      {
        value: "Fever",
        defining_code: {
          terminology_id: { value: "snomed_ct" },
          code_string: "386661006",
        },
      },
      template
    ).valid,
    true
  );

  const invalid = validator.validate({ value: "Fever" }, template);
  assertEquals(invalid.valid, false);
  assertEquals(invalid.errors[0]?.constraintType, "terminology");
});

Deno.test("Archie-Inspired - Real Number Range Validation", () => {
  const validator = new TemplateValidator();
  const template = archetypeWithDefinition("ELEMENT", "id1", (def) => {
    const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
    attr.rm_attribute_name = "value";
    const realConstraint = new openehr_am.C_REAL();
    realConstraint.range = { lower: 35.0, upper: 42.0 } as openehr_base.Interval_real;
    attr.children = [realConstraint as openehr_am.C_OBJECT];
    def.attributes = [attr];
  });

  assertEquals(validator.validate({ value: 37.5 }, template).valid, true);
  const invalid = validator.validate({ value: 30.0 }, template);
  assertEquals(invalid.valid, false);
  assertEquals(invalid.errors[0]?.constraintType, "real_range");
});

Deno.test("Archie-Inspired - Boolean Constraint Validation", () => {
  const validator = new TemplateValidator();
  const template = archetypeWithDefinition("ELEMENT", "id1", (def) => {
    const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
    attr.rm_attribute_name = "value";
    const boolConstraint = new openehr_am.C_BOOLEAN();
    boolConstraint.true_valid = true;
    boolConstraint.false_valid = false;
    attr.children = [boolConstraint as openehr_am.C_OBJECT];
    def.attributes = [attr];
  });

  assertEquals(validator.validate({ value: true }, template).valid, true);
  const invalid = validator.validate({ value: false }, template);
  assertEquals(invalid.valid, false);
  assertEquals(invalid.errors[0]?.constraintType, "boolean_constraint");
});
