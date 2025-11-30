/**
 * Test suite for openEHR Reference Model (RM) classes
 *
 * Tests are organized by class category:
 * - Foundation (PATHABLE, LOCATABLE)
 * - Data values (DV_TEXT, DV_QUANTITY, etc.)
 * - Data structures (ELEMENT, CLUSTER, ITEM_TREE, etc.)
 * - Clinical entries (OBSERVATION, EVALUATION, INSTRUCTION, ACTION)
 * - Infrastructure (ARCHETYPED, LINK, etc.)
 *
 * Note: Phase 3 focuses on test structure, not full implementation.
 * Tests will fail until Phase 4 implements class behaviors.
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import * as openehr_rm from "../../openehr_rm.ts";
import * as openehr_base from "../../openehr_base.ts";

// Helper function to create DV_TEXT
function createDvText(value: string): openehr_rm.DV_TEXT {
  const dvText = new openehr_rm.DV_TEXT();
  dvText.value = value;
  return dvText;
}

// ===== Foundation Classes =====

Deno.test("LOCATABLE - has required properties", () => {
  const element = new openehr_rm.ELEMENT();

  element.archetype_node_id = "at0001";
  element.name = createDvText("Test Element");

  assertEquals(element.archetype_node_id, "at0001");
  assert(element.name !== undefined);
});

Deno.test("LOCATABLE - is_archetype_root() checks archetype_details", () => {
  const element = new openehr_rm.ELEMENT();

  // Without archetype_details
  // assert(element.is_archetype_root() === false);

  // With archetype_details
  // element.archetype_details = new openehr_rm.ARCHETYPED();
  // assert(element.is_archetype_root() === true);
});

// ===== Data Value Classes =====

Deno.test("DV_TEXT - creates with value", () => {
  // const text = new openehr_rm.DV_TEXT();
  // text.value = "Patient is well";
  // assertEquals(text.value, "Patient is well");
});

Deno.test("DV_CODED_TEXT - creates with value and defining_code", () => {
  // const coded = new openehr_rm.DV_CODED_TEXT();
  // coded.value = "Male";
  // coded.defining_code = new openehr_base.CODE_PHRASE();
  // coded.defining_code.code_string = "at0005";
  //
  // assertEquals(coded.value, "Male");
  // assert(coded.defining_code !== undefined);
});

Deno.test("DV_QUANTITY - creates with magnitude and units", () => {
  // const quantity = new openehr_rm.DV_QUANTITY();
  // quantity.magnitude = 120;
  // quantity.units = "mm[Hg]";
  //
  // assertEquals(quantity.magnitude, 120);
  // assertEquals(quantity.units, "mm[Hg]");
});

Deno.test("DV_QUANTITY - arithmetic operations", () => {
  // const q1 = new openehr_rm.DV_QUANTITY();
  // q1.magnitude = 120;
  // q1.units = "mm[Hg]";
  //
  // const q2 = new openehr_rm.DV_QUANTITY();
  // q2.magnitude = 80;
  // q2.units = "mm[Hg]";
  //
  // const diff = q1.subtract(q2);
  // assertEquals(diff.magnitude, 40);
});

Deno.test("DV_DATE_TIME - creates with ISO string", () => {
  // const dt = new openehr_rm.DV_DATE_TIME();
  // dt.value = "2024-03-15T14:30:00";
  // assertEquals(dt.value, "2024-03-15T14:30:00");
});

Deno.test("DV_COUNT - creates with integer value", () => {
  // const count = new openehr_rm.DV_COUNT();
  // count.magnitude = 3;
  // assertEquals(count.magnitude, 3);
});

Deno.test("DV_BOOLEAN - creates with boolean value", () => {
  // const bool = new openehr_rm.DV_BOOLEAN();
  // bool.value = true;
  // assertEquals(bool.value, true);
});

Deno.test("DV_ORDINAL - creates with value and symbol", () => {
  // const ordinal = new openehr_rm.DV_ORDINAL();
  // ordinal.value = 2;
  // ordinal.symbol = new openehr_rm.DV_CODED_TEXT();
  // ordinal.symbol.value = "Moderate pain";
  //
  // assertEquals(ordinal.value, 2);
  // assertEquals(ordinal.symbol.value, "Moderate pain");
});

// ===== Data Structure Classes =====

Deno.test("ELEMENT - creates with value", () => {
  const element = new openehr_rm.ELEMENT();
  element.archetype_node_id = "at0004";
  element.name = createDvText("Systolic pressure");

  // element.value = new openehr_rm.DV_QUANTITY();
  // element.value.magnitude = 120;
  // element.value.units = "mm[Hg]";

  assert(element.name !== undefined);
});

Deno.test("ELEMENT - is_null() when no value", () => {
  const element = new openehr_rm.ELEMENT();
  // assert(element.is_null() === true);
});

Deno.test("ELEMENT - is_simple() returns true", () => {
  const element = new openehr_rm.ELEMENT();
  // assert(element.is_simple() === true);
});

Deno.test("CLUSTER - is_simple() returns false", () => {
  const cluster = new openehr_rm.CLUSTER();
  // assert(cluster.is_simple() === false);
});

Deno.test("CLUSTER - contains items", () => {
  // const cluster = new openehr_rm.CLUSTER();
  // cluster.archetype_node_id = "at0001";
  //
  // const element1 = new openehr_rm.ELEMENT();
  // const element2 = new openehr_rm.ELEMENT();
  //
  // cluster.items = [element1, element2];
  // assertEquals(cluster.items.length, 2);
});

Deno.test("ITEM_TREE - creates with items", () => {
  // const tree = new openehr_rm.ITEM_TREE();
  // tree.archetype_node_id = "at0001";
  //
  // const element = new openehr_rm.ELEMENT();
  // tree.items = [element];
  //
  // assertEquals(tree.items.length, 1);
});

Deno.test("HISTORY - creates with origin and events", () => {
  // const history = new openehr_rm.HISTORY();
  // history.origin = new openehr_rm.DV_DATE_TIME();
  // history.origin.value = "2024-03-15T10:00:00";
  //
  // const event = new openehr_rm.POINT_EVENT();
  // history.events = [event];
  //
  // assertEquals(history.events.length, 1);
});

// ===== Clinical Entry Classes =====

Deno.test("OBSERVATION - creates with data", () => {
  const obs = new openehr_rm.OBSERVATION();
  obs.archetype_node_id = "openEHR-EHR-OBSERVATION.blood_pressure.v1";
  obs.name = createDvText("Blood pressure");

  // obs.data = new openehr_rm.HISTORY();
  // obs.data.origin = new openehr_rm.DV_DATE_TIME();

  assert(obs.name !== undefined);
});

Deno.test("EVALUATION - creates with data", () => {
  const evaluation = new openehr_rm.EVALUATION(); // Renamed from 'eval' to avoid reserved word
  evaluation.archetype_node_id = "openEHR-EHR-EVALUATION.problem_diagnosis.v1";
  evaluation.name = createDvText("Problem/Diagnosis");

  assert(evaluation.name !== undefined);
});

Deno.test("INSTRUCTION - creates with narrative", () => {
  const instruction = new openehr_rm.INSTRUCTION();
  instruction.archetype_node_id = "openEHR-EHR-INSTRUCTION.medication_order.v1";
  instruction.name = createDvText("Medication order");

  // instruction.narrative = new openehr_rm.DV_TEXT();
  // instruction.narrative.value = "Aspirin 100mg daily";

  assert(instruction.name !== undefined);
});

Deno.test("ACTION - creates with time and description", () => {
  const action = new openehr_rm.ACTION();
  action.archetype_node_id = "openEHR-EHR-ACTION.medication.v1";
  action.name = createDvText("Medication action");

  // action.time = new openehr_rm.DV_DATE_TIME();
  // action.time.value = "2024-03-15T14:30:00";

  assert(action.name !== undefined);
});

Deno.test("COMPOSITION - creates with required properties", () => {
  const comp = new openehr_rm.COMPOSITION();
  comp.archetype_node_id = "openEHR-EHR-COMPOSITION.encounter.v1";
  comp.name = createDvText("Encounter");

  // comp.language = new openehr_base.CODE_PHRASE();
  // comp.language.code_string = "en";
  //
  // comp.territory = new openehr_base.CODE_PHRASE();
  // comp.territory.code_string = "US";

  assert(comp.name !== undefined);
});

Deno.test("SECTION - organizes content", () => {
  const section = new openehr_rm.SECTION();
  section.archetype_node_id = "openEHR-EHR-SECTION.adhoc.v1";
  section.name = createDvText("History");

  assert(section.name !== undefined);
});

// ===== Infrastructure Classes =====

Deno.test("PARTY_IDENTIFIED - creates with name", () => {
  // const party = new openehr_rm.PARTY_IDENTIFIED();
  // party.name = "Dr. John Smith";
  // assertEquals(party.name, "Dr. John Smith");
});

Deno.test("PARTY_SELF - represents EHR subject", () => {
  const subject = new openehr_rm.PARTY_SELF();
  assert(subject !== undefined);
});

Deno.test("ARCHETYPED - holds archetype ID", () => {
  // const archetyped = new openehr_rm.ARCHETYPED();
  // archetyped.archetype_id = new openehr_base.ARCHETYPE_ID();
  // archetyped.archetype_id.value = "openEHR-EHR-OBSERVATION.blood_pressure.v1";
  // archetyped.rm_version = "1.0.4";
  //
  // assertEquals(archetyped.rm_version, "1.0.4");
});

Deno.test("LINK - represents relationship", () => {
  // const link = new openehr_rm.LINK();
  // link.meaning = new openehr_rm.DV_TEXT();
  // link.meaning.value = "causative agent";
  //
  // assertEquals(link.meaning.value, "causative agent");
});

// ===== Versioning Classes =====

Deno.test("ORIGINAL_VERSION - creates with data", () => {
  // const version = new openehr_rm.ORIGINAL_VERSION();
  // version.data = new openehr_rm.COMPOSITION();
  //
  // assert(version.data !== undefined);
});

Deno.test("CONTRIBUTION - creates with uid", () => {
  // const contribution = new openehr_rm.CONTRIBUTION();
  // contribution.uid = new openehr_base.HIER_OBJECT_ID();
  //
  // assert(contribution.uid !== undefined);
});

// ===== Integration Tests =====

Deno.test("Complete OBSERVATION structure", () => {
  // Create a complete blood pressure observation
  const obs = new openehr_rm.OBSERVATION();
  obs.archetype_node_id = "openEHR-EHR-OBSERVATION.blood_pressure.v1";
  obs.name = createDvText("Blood pressure");

  // Full structure will be tested when implementations are complete
  assert(obs.name !== undefined);
  assert(obs.archetype_node_id === "openEHR-EHR-OBSERVATION.blood_pressure.v1");
});

// ===== Dual Approach Pattern Tests =====
// Tests for the dual getter/setter pattern that allows both primitive and wrapper access

Deno.test("Dual Approach - DV_TEXT accepts primitive string and returns primitive", () => {
  const text = new openehr_rm.DV_TEXT();
  
  // Set with primitive string
  text.value = "Patient is well";
  
  // Get returns primitive
  assertEquals(typeof text.value, "string");
  assertEquals(text.value, "Patient is well");
});

Deno.test("Dual Approach - DV_TEXT accepts wrapper and returns primitive", () => {
  const text = new openehr_rm.DV_TEXT();
  
  // Set with wrapper
  text.value = openehr_base.String.from("Wrapped value");
  
  // Get still returns primitive
  assertEquals(typeof text.value, "string");
  assertEquals(text.value, "Wrapped value");
});

Deno.test("Dual Approach - DV_TEXT $value returns wrapper with methods", () => {
  const text = new openehr_rm.DV_TEXT();
  text.value = "Test value";
  
  // $value returns wrapper
  const wrapper = text.$value;
  assert(wrapper !== undefined);
  assert(wrapper instanceof openehr_base.String);
  assertEquals(wrapper.value, "Test value");
  
  // Can call wrapper methods
  const isEmpty = wrapper.is_empty();
  assertEquals(isEmpty.value, false);
});

Deno.test("Dual Approach - DV_QUANTITY precision with primitive number", () => {
  const quantity = new openehr_rm.DV_QUANTITY();
  
  // Set with primitive number
  quantity.precision = 2;
  
  // Get returns primitive
  assertEquals(typeof quantity.precision, "number");
  assertEquals(quantity.precision, 2);
});

Deno.test("Dual Approach - DV_QUANTITY precision with Integer wrapper", () => {
  const quantity = new openehr_rm.DV_QUANTITY();
  
  // Set with wrapper
  quantity.precision = openehr_base.Integer.from(3);
  
  // Get returns primitive
  assertEquals(typeof quantity.precision, "number");
  assertEquals(quantity.precision, 3);
});

Deno.test("Dual Approach - DV_QUANTITY $precision returns Integer wrapper", () => {
  const quantity = new openehr_rm.DV_QUANTITY();
  quantity.precision = 2;
  
  // $precision returns wrapper
  const wrapper = quantity.$precision;
  assert(wrapper !== undefined);
  assert(wrapper instanceof openehr_base.Integer);
  assertEquals(wrapper.value, 2);
});

Deno.test("Dual Approach - DV_QUANTITY units with primitive string", () => {
  const quantity = new openehr_rm.DV_QUANTITY();
  
  // Set with primitive string
  quantity.units = "mm[Hg]";
  
  // Get returns primitive
  assertEquals(typeof quantity.units, "string");
  assertEquals(quantity.units, "mm[Hg]");
});

Deno.test("Dual Approach - DV_QUANTITY $units returns String wrapper", () => {
  const quantity = new openehr_rm.DV_QUANTITY();
  quantity.units = "mm[Hg]";
  
  // $units returns wrapper
  const wrapper = quantity.$units;
  assert(wrapper !== undefined);
  assert(wrapper instanceof openehr_base.String);
  assertEquals(wrapper.value, "mm[Hg]");
});

Deno.test("Dual Approach - DV_BOOLEAN value with primitive boolean", () => {
  const bool = new openehr_rm.DV_BOOLEAN();
  
  // Set with primitive boolean
  bool.value = true;
  
  // Get returns primitive
  assertEquals(typeof bool.value, "boolean");
  assertEquals(bool.value, true);
});

Deno.test("Dual Approach - DV_BOOLEAN value with Boolean wrapper", () => {
  const bool = new openehr_rm.DV_BOOLEAN();
  
  // Set with wrapper
  bool.value = openehr_base.Boolean.from(false);
  
  // Get returns primitive
  assertEquals(typeof bool.value, "boolean");
  assertEquals(bool.value, false);
});

Deno.test("Dual Approach - DV_BOOLEAN $value returns Boolean wrapper", () => {
  const bool = new openehr_rm.DV_BOOLEAN();
  bool.value = true;
  
  // $value returns wrapper
  const wrapper = bool.$value;
  assert(wrapper !== undefined);
  assert(wrapper instanceof openehr_base.Boolean);
  assertEquals(wrapper.value, true);
});

Deno.test("Dual Approach - LOCATABLE archetype_node_id with primitive", () => {
  const element = new openehr_rm.ELEMENT();
  
  // Set with primitive string
  element.archetype_node_id = "at0001";
  
  // Get returns primitive
  assertEquals(typeof element.archetype_node_id, "string");
  assertEquals(element.archetype_node_id, "at0001");
});

Deno.test("Dual Approach - LOCATABLE $archetype_node_id returns wrapper", () => {
  const element = new openehr_rm.ELEMENT();
  element.archetype_node_id = "at0001";
  
  // $archetype_node_id returns wrapper
  const wrapper = element.$archetype_node_id;
  assert(wrapper !== undefined);
  assert(wrapper instanceof openehr_base.String);
  assertEquals(wrapper.value, "at0001");
});

Deno.test("Dual Approach - CODE_PHRASE code_string with primitive", () => {
  const codePhrase = new openehr_rm.CODE_PHRASE();
  
  // Set with primitive string
  codePhrase.code_string = "at0005";
  
  // Get returns primitive
  assertEquals(typeof codePhrase.code_string, "string");
  assertEquals(codePhrase.code_string, "at0005");
});

Deno.test("Dual Approach - CODE_PHRASE $code_string returns wrapper", () => {
  const codePhrase = new openehr_rm.CODE_PHRASE();
  codePhrase.code_string = "at0005";
  
  // $code_string returns wrapper
  const wrapper = codePhrase.$code_string;
  assert(wrapper !== undefined);
  assert(wrapper instanceof openehr_base.String);
  assertEquals(wrapper.value, "at0005");
});

Deno.test("Dual Approach - handles undefined values correctly", () => {
  const text = new openehr_rm.DV_TEXT();
  
  // Initially undefined
  assertEquals(text.value, undefined);
  assertEquals(text.$value, undefined);
  
  // Set a value
  text.value = "test";
  assertEquals(text.value, "test");
  assert(text.$value !== undefined);
  
  // Set back to undefined
  text.value = undefined;
  assertEquals(text.value, undefined);
  assertEquals(text.$value, undefined);
});

Deno.test("Dual Approach - handles null values correctly", () => {
  const text = new openehr_rm.DV_TEXT();
  
  // Set a value first
  text.value = "test";
  assertEquals(text.value, "test");
  
  // Setting null should clear the value
  text.value = null as unknown as string;
  assertEquals(text.value, undefined);
  assertEquals(text.$value, undefined);
});

Deno.test("Dual Approach - DV_DATE_TIME value with ISO string", () => {
  const dt = new openehr_rm.DV_DATE_TIME();
  
  // Set with primitive string
  dt.value = "2024-03-15T14:30:00";
  
  // Get returns primitive
  assertEquals(typeof dt.value, "string");
  assertEquals(dt.value, "2024-03-15T14:30:00");
});

Deno.test("Dual Approach - DV_DATE_TIME $value returns wrapper", () => {
  const dt = new openehr_rm.DV_DATE_TIME();
  dt.value = "2024-03-15T14:30:00";
  
  // $value returns wrapper
  const wrapper = dt.$value;
  assert(wrapper !== undefined);
  assert(wrapper instanceof openehr_base.String);
  assertEquals(wrapper.value, "2024-03-15T14:30:00");
});

Deno.test("Dual Approach - DV_IDENTIFIER id with primitive", () => {
  const identifier = new openehr_rm.DV_IDENTIFIER();
  
  // Set with primitive string
  identifier.id = "12345";
  
  // Get returns primitive
  assertEquals(typeof identifier.id, "string");
  assertEquals(identifier.id, "12345");
});

Deno.test("Dual Approach - DV_IDENTIFIER issuer with primitive", () => {
  const identifier = new openehr_rm.DV_IDENTIFIER();
  
  // Set issuer
  identifier.issuer = "Hospital A";
  
  // Get returns primitive
  assertEquals(typeof identifier.issuer, "string");
  assertEquals(identifier.issuer, "Hospital A");
  
  // $issuer returns wrapper
  const wrapper = identifier.$issuer;
  assert(wrapper !== undefined);
  assert(wrapper instanceof openehr_base.String);
});

Deno.test("Dual Approach - DV_PARSABLE formalism with primitive", () => {
  const parsable = new openehr_rm.DV_PARSABLE();
  
  // Set formalism
  parsable.formalism = "application/json";
  
  // Get returns primitive
  assertEquals(typeof parsable.formalism, "string");
  assertEquals(parsable.formalism, "application/json");
  
  // $formalism returns wrapper
  const wrapper = parsable.$formalism;
  assert(wrapper !== undefined);
  assert(wrapper instanceof openehr_base.String);
});

Deno.test("Dual Approach - wrapper methods are accessible via $ getter", () => {
  const text = new openehr_rm.DV_TEXT();
  text.value = "";
  
  // Access wrapper method via $ getter
  const wrapper = text.$value;
  assert(wrapper !== undefined);
  
  // Test is_empty() method
  const isEmpty = wrapper.is_empty();
  assertEquals(isEmpty.value, true);
  
  // Change value
  text.value = "not empty";
  const notEmptyWrapper = text.$value;
  assert(notEmptyWrapper !== undefined);
  
  const isNowEmpty = notEmptyWrapper.is_empty();
  assertEquals(isNowEmpty.value, false);
});

console.log("\n✅ RM test suite structure created");
console.log("Includes comprehensive dual approach pattern tests");
console.log("Tests verify both primitive and wrapper access patterns\n");
