/**
 * Spot-check RM attribute introspection against known BMM facts (issue #63).
 */
import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  ancestorsOf,
  attributesFor,
  hasRmType,
  isDataValueType,
  isSubtypeOf,
  ownAttributesFor,
  RM_META_RM_RELEASE,
  RM_META_SCHEMA_NAME,
  subtypesOf,
} from "../../../enhanced/meta/mod.ts";

Deno.test("meta header records RM BMM release", () => {
  assertEquals(RM_META_SCHEMA_NAME, "rm");
  assert(RM_META_RM_RELEASE.length > 0);
});

Deno.test("ELEMENT.value is optional DATA_VALUE", () => {
  const value = attributesFor("ELEMENT").find((a) => a.name === "value");
  assertExists(value);
  assertEquals(value.typeName, "DATA_VALUE");
  assertEquals(value.mandatory, false);
  assertEquals(value.multiplicity, { min: 0, max: 1 });
  assertEquals(value.declaredIn, "ELEMENT");
  assertEquals(value.polymorphic, true);
});

Deno.test("LOCATABLE feeder_audit and links multiplicities", () => {
  const attrs = attributesFor("LOCATABLE");
  const feeder = attrs.find((a) => a.name === "feeder_audit");
  assertExists(feeder);
  assertEquals(feeder.typeName, "FEEDER_AUDIT");
  assertEquals(feeder.multiplicity, { min: 0, max: 1 });
  assertEquals(feeder.mandatory, false);

  const links = attrs.find((a) => a.name === "links");
  assertExists(links);
  assertEquals(links.typeName, "List<LINK>");
  assertEquals(links.multiplicity, { min: 0, max: null });
  assertEquals(links.mandatory, false);
});

Deno.test("LOCATABLE mandatory name / archetype_node_id", () => {
  const attrs = attributesFor("LOCATABLE");
  const name = attrs.find((a) => a.name === "name");
  assertExists(name);
  assertEquals(name.mandatory, true);
  assertEquals(name.typeName, "DV_TEXT");

  const nodeId = attrs.find((a) => a.name === "archetype_node_id");
  assertExists(nodeId);
  assertEquals(nodeId.mandatory, true);
});

Deno.test("COMPOSITION inherits LOCATABLE attributes", () => {
  const attrs = attributesFor("COMPOSITION");
  assert(attrs.some((a) => a.name === "feeder_audit" && a.declaredIn === "LOCATABLE"));
  assert(attrs.some((a) => a.name === "category" && a.declaredIn === "COMPOSITION"));
  const own = ownAttributesFor("COMPOSITION");
  assert(!own.some((a) => a.name === "feeder_audit"));
});

Deno.test("DV_QUANTITY magnitude and units are mandatory", () => {
  const attrs = attributesFor("DV_QUANTITY");
  const magnitude = attrs.find((a) => a.name === "magnitude");
  assertExists(magnitude);
  assertEquals(magnitude.mandatory, true);
  assertEquals(magnitude.multiplicity, { min: 1, max: 1 });

  const units = attrs.find((a) => a.name === "units");
  assertExists(units);
  assertEquals(units.mandatory, true);
});

Deno.test("isDataValueType and isSubtypeOf", () => {
  assertEquals(isDataValueType("DV_CODED_TEXT"), true);
  assertEquals(isDataValueType("DV_QUANTITY"), true);
  assertEquals(isDataValueType("COMPOSITION"), false);
  assertEquals(isSubtypeOf("DV_CODED_TEXT", "DV_TEXT"), true);
  assertEquals(isSubtypeOf("DV_CODED_TEXT", "DATA_VALUE"), true);
  assertEquals(isSubtypeOf("DV_TEXT", "DV_CODED_TEXT"), false);
});

Deno.test("subtypesOf DATA_VALUE returns concrete DV_* leaves", () => {
  const concrete = subtypesOf("DATA_VALUE");
  assert(concrete.includes("DV_QUANTITY"));
  assert(concrete.includes("DV_CODED_TEXT"));
  assert(!concrete.includes("DATA_VALUE"));
  // abstract intermediates excluded by default
  assert(!concrete.includes("DV_ORDERED"));
  assert(!concrete.includes("DV_QUANTIFIED"));

  const all = subtypesOf("DATA_VALUE", { concreteOnly: false });
  assert(all.includes("DV_ORDERED"));
});

Deno.test("ancestorsOf: most-specific first, root last", () => {
  const chain = ancestorsOf("DV_QUANTITY");
  assertEquals(chain[0], "DV_QUANTITY");
  assert(chain.includes("DV_AMOUNT"));
  assert(chain.includes("DATA_VALUE"));
  assertEquals(chain[chain.length - 1], "Any");
});

Deno.test("hasRmType", () => {
  assertEquals(hasRmType("ELEMENT"), true);
  assertEquals(hasRmType("NOT_A_REAL_TYPE"), false);
});

Deno.test("attributesFor unknown type is empty", () => {
  assertEquals(attributesFor("NOT_A_REAL_TYPE"), []);
});
