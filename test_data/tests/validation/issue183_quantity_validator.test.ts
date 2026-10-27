/**
 * #183: TemplateValidator enforces per-unit magnitude and precision from C_DV_QUANTITY.list.
 */

import { assert, assertEquals } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import * as openehr_base from "../../../base/openehr_base.ts";
import { TemplateValidator } from "../../../validation/template_validator.ts";

function archetypeWithDefinition(
  rmType: string,
  nodeId: string,
  build: (def: openehr_am.C_COMPLEX_OBJECT) => void,
): openehr_am.ARCHETYPE {
  const template = new openehr_am.ARCHETYPE();
  const definition = new openehr_am.C_COMPLEX_OBJECT();
  definition.rm_type_name = rmType;
  definition.node_id = nodeId;
  build(definition);
  template.definition = definition;
  return template;
}

function quantityConstraint(
  items: Array<{
    units: string;
    magnitude?: { lower: number; upper: number; upper_included?: boolean };
    precision?: { lower: number; upper: number };
  }>,
): openehr_am.C_QUANTITY {
  const q = new openehr_am.C_QUANTITY();
  q.rm_type_name = "DV_QUANTITY";
  (q as { list: unknown[] }).list = items.map((item) => {
    const row = new openehr_am.C_QUANTITY_ITEM();
    row.units = item.units;
    if (item.magnitude) {
      (row as { magnitude?: unknown }).magnitude = {
        lower_included: true,
        upper_included: item.magnitude.upper_included ?? true,
        ...item.magnitude,
      };
    }
    if (item.precision) {
      (row as { precision?: unknown }).precision = {
        lower_included: true,
        upper_included: true,
        ...item.precision,
      };
    }
    return row;
  });
  return q;
}

Deno.test("#183: TemplateValidator checks magnitude per unit in C_DV_QUANTITY.list", async () => {
  const template = archetypeWithDefinition("ELEMENT", "id1", (def) => {
    const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
    attr.rm_attribute_name = "value";
    attr.children = [quantityConstraint([
      { units: "mg", magnitude: { lower: 0, upper: 10 } },
      { units: "kg", magnitude: { lower: 0, upper: 1 } },
    ])];
    def.attributes = [attr];
  });

  const validator = new TemplateValidator({
    validateUnits: false,
    validateTerminology: false,
    validateIntervals: false,
    validateRMSpecification: false,
  });
  await validator.initialize();

  assertEquals(
    validator.validate(
      { value: { magnitude: 5, units: "mg" } },
      template,
    ).valid,
    true,
  );

  const result = validator.validate(
    { value: { magnitude: 50, units: "mg" } },
    template,
  );
  assertEquals(result.valid, false);
  assert(
    result.errors.some((m) => m.constraintType === "quantity_magnitude"),
    "expected quantity_magnitude error",
  );
});

Deno.test("#183: TemplateValidator rejects DV_ORDINAL outside tuple rows", async () => {
  const tuple = new openehr_am.C_ATTRIBUTE_TUPLE();
  tuple.members = ["value", "symbol"].map((name) => {
    const a = new openehr_am.C_SINGLE_ATTRIBUTE();
    a.rm_attribute_name = name;
    return a;
  });
  const row = new openehr_am.C_PRIMITIVE_TUPLE();
  const valueCell = new openehr_am.C_PRIMITIVE_OBJECT();
  valueCell.rm_type_name = "Integer";
  const int = new openehr_am.C_INTEGER();
  (int as { list?: number[] }).list = [0];
  valueCell.item = int;
  const sym = new openehr_am.C_TERMINOLOGY_CODE();
  sym.constraint = "at1";
  row.members = [valueCell, sym];
  tuple.tuples = [row];

  const template = archetypeWithDefinition("ELEMENT", "id1", (def) => {
    const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
    attr.rm_attribute_name = "value";
    const ord = new openehr_am.C_ORDINAL();
    ord.rm_type_name = "DV_ORDINAL";
    (ord as { attribute_tuples?: openehr_am.C_ATTRIBUTE_TUPLE[] }).attribute_tuples =
      [tuple];
    (ord as { list?: openehr_am.ORDINAL[] }).list = [{
      value: 0,
      symbol: openehr_base.CODE_PHRASE.from("local", "at1"),
    } as openehr_am.ORDINAL];
    attr.children = [ord];
    def.attributes = [attr];
  });

  const validator = new TemplateValidator({
    validateUnits: false,
    validateTerminology: false,
    validateIntervals: false,
    validateRMSpecification: false,
  });
  await validator.initialize();

  const bad = {
    value: {
      value: 2,
      symbol: { defining_code: { terminology_id: { value: "local" }, code_string: "at9" } },
    },
  };
  const result = validator.validate(bad, template);
  assertEquals(result.valid, false);
  assert(result.errors.some((m) => m.constraintType === "ordinal_list"));
});

Deno.test("#183: TemplateValidator checks precision per unit", async () => {
  const template = archetypeWithDefinition("ELEMENT", "id1", (def) => {
    const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
    attr.rm_attribute_name = "value";
    attr.children = [quantityConstraint([
      { units: "mg", precision: { lower: 0, upper: 1 } },
    ])];
    def.attributes = [attr];
  });

  const validator = new TemplateValidator({
    validateUnits: false,
    validateTerminology: false,
    validateIntervals: false,
    validateRMSpecification: false,
  });
  await validator.initialize();

  const result = validator.validate(
    { value: { magnitude: 1, units: "mg", precision: 3 } },
    template,
  );
  assertEquals(result.valid, false);
  assert(result.errors.some((m) => m.constraintType === "quantity_precision"));
});
