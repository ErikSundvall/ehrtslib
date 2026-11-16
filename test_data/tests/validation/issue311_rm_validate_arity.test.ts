/**
 * #311: RMSpecificationValidator.validate(instance) must not report valid
 * when the other arguments are omitted.
 */
import { assert, assertEquals, assertThrows } from "@std/assert";
import { RMSpecificationValidator } from "../../../validation/rm_specification_validator.ts";

const EMPTY_SECTION = {
  _type: "SECTION",
  name: { _type: "DV_TEXT", value: "Empty" },
  archetype_node_id: "at0001",
  items: [],
};

Deno.test("#311 validate(instance) checks the whole instance", () => {
  const validator = new RMSpecificationValidator();
  const walked = validator.validate(EMPTY_SECTION);
  const direct = validator.validateInstance(EMPTY_SECTION);
  assert(walked.some((m) => m.message.includes("SECTION.Items_valid")));
  assertEquals(
    walked.map((m) => m.message),
    direct.map((m) => m.message),
  );
});

Deno.test("#311 four-argument validate still checks one attribute", () => {
  const validator = new RMSpecificationValidator();
  const ok = validator.validate(
    "openehr::431|persistent|",
    "COMPOSITION",
    "category",
    "/category",
  );
  assertEquals(ok, []);
  const bad = validator.validate(
    "openehr::999|nope|",
    "COMPOSITION",
    "category",
    "/category",
  );
  assert(bad.length > 0);
});

Deno.test("#311 two or three arguments throw", () => {
  const validator = new RMSpecificationValidator();
  assertThrows(
    () =>
      (validator.validate as (a: unknown, b: unknown) => unknown)(
        EMPTY_SECTION,
        "SECTION",
      ),
    TypeError,
    "needs four arguments",
  );
  assertThrows(
    () =>
      (validator.validate as (a: unknown, b: unknown, c: unknown) => unknown)(
        EMPTY_SECTION,
        "SECTION",
        "items",
      ),
    TypeError,
    "needs four arguments",
  );
});

Deno.test("#311 disabled validator still returns no messages", () => {
  const validator = new RMSpecificationValidator(false);
  assertEquals(validator.validate(EMPTY_SECTION), []);
  assertEquals(
    validator.validate("openehr::999|nope|", "COMPOSITION", "category", "/category"),
    [],
  );
});
