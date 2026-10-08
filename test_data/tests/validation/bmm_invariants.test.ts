/**
 * BMM class invariants on RM instances (issue #93).
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ELEMENT } from "../../../rm/data_structures/representation.ts";
import { catalogueFromBmm } from "../../../tasks/bmm_invariant_catalogue.ts";
import { BMM_INVARIANTS } from "../../../validation/bmm_invariants.generated.ts";
import { RMSpecificationValidator } from "../../../validation/rm_specification_validator.ts";

const ELEMENT_INVARIANTS = [
  "Inv_is_null_valid",
  "Inv_null_flavour_indicated",
  "Inv_null_flavour_valid",
  "Inv_null_reason_valid",
];

Deno.test("BMM catalogue includes every ELEMENT invariant and skips classes without one", () => {
  const element = BMM_INVARIANTS.filter((row) =>
    row.schema === "rm" && row.className === "ELEMENT"
  );
  assertEquals(
    element.map((row) => row.name).sort(),
    [...ELEMENT_INVARIANTS].sort(),
  );
  assertEquals(
    BMM_INVARIANTS.some((row) => row.className === "CLUSTER"),
    false,
  );
  assert(
    BMM_INVARIANTS.some((row) => row.schema === "am"),
    "AM invariants are emitted for the same generator",
  );
  assert(
    BMM_INVARIANTS.some((row) => row.schema === "base"),
    "BASE invariants are emitted",
  );
});

Deno.test("codegen picks up a new invariant without editing RM_CONSTRAINTS", () => {
  const catalogue = catalogueFromBmm({
    schema_name: "rm",
    rm_release: "9.9.9",
    class_definitions: {
      WIDGET: {
        name: "WIDGET",
        invariants: { Added_upstream: "value /= Void", Blank: "" },
      },
      PLAIN: { name: "PLAIN" },
    },
  });
  assertEquals(catalogue.invariants.map((row) => row.name), [
    "Added_upstream",
    "Blank",
  ]);
  assertEquals(catalogue.invariants[1].expression, "");
  assertEquals(
    catalogue.invariants.some((row) => row.className === "PLAIN"),
    false,
  );
});

Deno.test("ELEMENT.is_null matches Inv_is_null_valid", () => {
  const both = new ELEMENT();
  both.value = { _type: "DV_TEXT" } as ELEMENT["value"];
  both.null_flavour = { _type: "DV_CODED_TEXT" } as ELEMENT["null_flavour"];
  assertEquals(both.is_null().value, false);

  const neither = new ELEMENT();
  assertEquals(neither.is_null().value, true);

  const valueOnly = new ELEMENT();
  valueOnly.value = { _type: "DV_TEXT" } as ELEMENT["value"];
  assertEquals(valueOnly.is_null().value, false);
});

Deno.test("ELEMENT with both value and null_flavour fails Inv_null_flavour_indicated", () => {
  const validator = new RMSpecificationValidator();
  const messages = validator.validateInstance({
    _type: "ELEMENT",
    value: { _type: "DV_TEXT", value: "present" },
    null_flavour: {
      _type: "DV_CODED_TEXT",
      defining_code: {
        terminology_id: { value: "openehr" },
        code_string: "271",
      },
    },
  }, "ELEMENT");
  const hit = messages.filter((m) =>
    m.message.includes("Inv_null_flavour_indicated")
  );
  assertEquals(hit.length, 1);
  assertEquals(hit[0].constraintType, "rm_invariant");
});

Deno.test("ELEMENT with neither value nor null_flavour fails Inv_null_flavour_indicated", () => {
  const validator = new RMSpecificationValidator();
  const messages = validator.validateInstance({ _type: "ELEMENT" }, "ELEMENT");
  const hit = messages.filter((m) =>
    m.message.includes("Inv_null_flavour_indicated")
  );
  assertEquals(hit.length, 1);
});

Deno.test("a value-only ELEMENT satisfies the null-flavour xor", () => {
  const validator = new RMSpecificationValidator();
  const messages = validator.validateInstance({
    _type: "ELEMENT",
    value: { _type: "DV_TEXT", value: "present" },
  }, "ELEMENT");
  assertEquals(
    messages.some((m) => m.message.includes("Inv_null_flavour_indicated")),
    false,
  );
});

Deno.test("a type with no BMM invariants gains no invariant messages", () => {
  const validator = new RMSpecificationValidator();
  const messages = validator.validateInstance({
    _type: "NOT_A_CLASS",
    value: "",
  }, "NOT_A_CLASS");
  assertEquals(messages.filter((m) => m.constraintType === "rm_invariant"), []);
});
