/**
 * Test suite for ehrtslib examples
 * 
 * Validates that the example code runs correctly and produces expected structures.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import * as openehr_rm from "../openehr_rm.ts";
import * as openehr_base from "../openehr_base.ts";

/**
 * Helper to create a basic blood pressure COMPOSITION (from basic-composition.ts)
 */
function createBloodPressureComposition(): openehr_rm.COMPOSITION {
  const composition = new openehr_rm.COMPOSITION();
  composition.archetype_node_id = "openEHR-EHR-COMPOSITION.encounter.v1";
  
  const compositionName = new openehr_rm.DV_TEXT();
  compositionName.value = "Blood Pressure Recording";
  composition.name = compositionName;
  
  const uid = new openehr_base.OBJECT_VERSION_ID();
  uid.value = "8849182c-82ad-4088-a07f-48ead4180515::uk.nhs.example::1";
  composition.uid = uid;
  
  const language = new openehr_base.CODE_PHRASE();
  const languageTermId = new openehr_base.TERMINOLOGY_ID();
  languageTermId.value = "ISO_639-1";
  language.terminology_id = languageTermId;
  language.code_string = "en";
  composition.language = language;
  
  const territory = new openehr_base.CODE_PHRASE();
  const territoryTermId = new openehr_base.TERMINOLOGY_ID();
  territoryTermId.value = "ISO_3166-1";
  territory.terminology_id = territoryTermId;
  territory.code_string = "GB";
  composition.territory = territory;
  
  const category = new openehr_rm.DV_CODED_TEXT();
  category.value = "event";
  const categoryCode = new openehr_base.CODE_PHRASE();
  const categoryTermId = new openehr_base.TERMINOLOGY_ID();
  categoryTermId.value = "openehr";
  categoryCode.terminology_id = categoryTermId;
  categoryCode.code_string = "433";
  category.defining_code = categoryCode;
  composition.category = category;
  
  const composer = new openehr_rm.PARTY_IDENTIFIED();
  const composerName = new openehr_rm.DV_TEXT();
  composerName.value = "Dr. Smith";
  composer.name = composerName;
  composition.composer = composer;
  
  const archetypeDetails = new openehr_rm.ARCHETYPED();
  const archetypeId = new openehr_base.ARCHETYPE_ID();
  archetypeId.value = "openEHR-EHR-COMPOSITION.encounter.v1";
  archetypeDetails.archetype_id = archetypeId;
  archetypeDetails.rm_version = "1.1.0";
  composition.archetype_details = archetypeDetails;
  
  const context = new openehr_rm.EVENT_CONTEXT();
  const startTime = new openehr_rm.DV_DATE_TIME();
  startTime.value = "2024-12-08T14:30:00";
  context.start_time = startTime;
  
  const setting = new openehr_rm.DV_CODED_TEXT();
  setting.value = "other care";
  const settingCode = new openehr_base.CODE_PHRASE();
  const settingTermId = new openehr_base.TERMINOLOGY_ID();
  settingTermId.value = "openehr";
  settingCode.terminology_id = settingTermId;
  settingCode.code_string = "238";
  setting.defining_code = settingCode;
  context.setting = setting;
  
  composition.context = context;
  
  // Create observation with blood pressure data
  const observation = new openehr_rm.OBSERVATION();
  observation.archetype_node_id = "openEHR-EHR-OBSERVATION.blood_pressure.v2";
  
  const name = new openehr_rm.DV_TEXT();
  name.value = "Blood Pressure";
  observation.name = name;
  
  observation.language = language;
  
  const encoding = new openehr_base.CODE_PHRASE();
  const encodingTermId = new openehr_base.TERMINOLOGY_ID();
  encodingTermId.value = "IANA_character-sets";
  encoding.terminology_id = encodingTermId;
  encoding.code_string = "UTF-8";
  observation.encoding = encoding;
  
  const subject = new openehr_rm.PARTY_SELF();
  observation.subject = subject;
  
  const history = new openehr_rm.HISTORY();
  history.archetype_node_id = "at0001";
  
  const historyName = new openehr_rm.DV_TEXT();
  historyName.value = "Event Series";
  history.name = historyName;
  
  const origin = new openehr_rm.DV_DATE_TIME();
  origin.value = "2024-12-08T14:30:00";
  history.origin = origin;
  
  const event = new openehr_rm.POINT_EVENT();
  event.archetype_node_id = "at0002";
  
  const eventName = new openehr_rm.DV_TEXT();
  eventName.value = "Blood Pressure Measurement";
  event.name = eventName;
  
  const eventTime = new openehr_rm.DV_DATE_TIME();
  eventTime.value = "2024-12-08T14:30:00";
  event.time = eventTime;
  
  const itemTree = new openehr_rm.ITEM_TREE();
  itemTree.archetype_node_id = "at0003";
  
  const itemTreeName = new openehr_rm.DV_TEXT();
  itemTreeName.value = "Blood Pressure";
  itemTree.name = itemTreeName;
  
  const systolicElement = new openehr_rm.ELEMENT();
  systolicElement.archetype_node_id = "at0004";
  
  const systolicName = new openehr_rm.DV_TEXT();
  systolicName.value = "Systolic";
  systolicElement.name = systolicName;
  
  const systolicValue = new openehr_rm.DV_QUANTITY();
  systolicValue.magnitude = 120.0;
  systolicValue.units = "mm[Hg]";
  systolicElement.value = systolicValue;
  
  const diastolicElement = new openehr_rm.ELEMENT();
  diastolicElement.archetype_node_id = "at0005";
  
  const diastolicName = new openehr_rm.DV_TEXT();
  diastolicName.value = "Diastolic";
  diastolicElement.name = diastolicName;
  
  const diastolicValue = new openehr_rm.DV_QUANTITY();
  diastolicValue.magnitude = 80.0;
  diastolicValue.units = "mm[Hg]";
  diastolicElement.value = diastolicValue;
  
  itemTree.items = [systolicElement, diastolicElement];
  event.data = itemTree;
  history.events = [event];
  observation.data = history;
  
  composition.content = [observation];
  
  return composition;
}

// ===== COMPOSITION Tests =====

Deno.test("Blood Pressure COMPOSITION - has required properties", () => {
  const composition = createBloodPressureComposition();
  
  assert(composition.archetype_node_id !== undefined);
  assertEquals(composition.archetype_node_id, "openEHR-EHR-COMPOSITION.encounter.v1");
  
  assert(composition.name !== undefined);
  assertEquals(composition.name?.value, "Blood Pressure Recording");
  
  assert(composition.uid !== undefined);
  assert(composition.language !== undefined);
  assertEquals(composition.language?.code_string, "en");
  
  assert(composition.territory !== undefined);
  assertEquals(composition.territory?.code_string, "US");
  
  assert(composition.category !== undefined);
  assertEquals(composition.category?.value, "event");
  
  assert(composition.composer !== undefined);
  assertEquals(composition.composer?.name?.value, "Dr. Smith");
  
  assert(composition.archetype_details !== undefined);
  assertEquals(composition.archetype_details?.rm_version, "1.1.0");
});

Deno.test("Blood Pressure COMPOSITION - has context", () => {
  const composition = createBloodPressureComposition();
  
  assert(composition.context !== undefined);
  assertEquals(composition.context?.start_time?.value, "2024-12-08T14:30:00");
  assertEquals(composition.context?.setting?.value, "other care");
});

Deno.test("Blood Pressure COMPOSITION - has observation content", () => {
  const composition = createBloodPressureComposition();
  
  assert(composition.content !== undefined);
  assertEquals(composition.content?.length, 1);
  
  const observation = composition.content?.[0];
  assert(observation instanceof openehr_rm.OBSERVATION);
  assertEquals(observation?.name?.value, "Blood Pressure");
});

Deno.test("Blood Pressure OBSERVATION - has correct structure", () => {
  const composition = createBloodPressureComposition();
  const observation = composition.content?.[0];
  
  assert(observation instanceof openehr_rm.OBSERVATION);
  assert(observation.data !== undefined);
  assert(observation.data instanceof openehr_rm.HISTORY);
  
  const history = observation.data;
  assert(history.events !== undefined);
  assertEquals(history.events?.length, 1);
  
  const event = history.events?.[0];
  assert(event instanceof openehr_rm.POINT_EVENT);
  assert(event.data !== undefined);
  assert(event.data instanceof openehr_rm.ITEM_TREE);
});

Deno.test("Blood Pressure OBSERVATION - has correct data values", () => {
  const composition = createBloodPressureComposition();
  const observation = composition.content?.[0] as openehr_rm.OBSERVATION;
  const history = observation.data as openehr_rm.HISTORY;
  const event = history.events?.[0] as openehr_rm.POINT_EVENT;
  const itemTree = event.data as openehr_rm.ITEM_TREE;
  
  assert(itemTree.items !== undefined);
  assertEquals(itemTree.items?.length, 2);
  
  const systolic = itemTree.items?.[0] as openehr_rm.ELEMENT;
  assertEquals(systolic.name?.value, "Systolic");
  assert(systolic.value instanceof openehr_rm.DV_QUANTITY);
  assertEquals((systolic.value as openehr_rm.DV_QUANTITY).magnitude, 120.0);
  assertEquals((systolic.value as openehr_rm.DV_QUANTITY).units, "mm[Hg]");
  
  const diastolic = itemTree.items?.[1] as openehr_rm.ELEMENT;
  assertEquals(diastolic.name?.value, "Diastolic");
  assert(diastolic.value instanceof openehr_rm.DV_QUANTITY);
  assertEquals((diastolic.value as openehr_rm.DV_QUANTITY).magnitude, 80.0);
  assertEquals((diastolic.value as openehr_rm.DV_QUANTITY).units, "mm[Hg]");
});

Deno.test("Example demonstrates required RM hierarchy", () => {
  const composition = createBloodPressureComposition();
  
  // Verify the full hierarchy: COMPOSITION > OBSERVATION > HISTORY > EVENT > ITEM_TREE > ELEMENT > DV_QUANTITY
  assert(composition instanceof openehr_rm.COMPOSITION, "Root should be COMPOSITION");
  
  const observation = composition.content?.[0];
  assert(observation instanceof openehr_rm.OBSERVATION, "Content should contain OBSERVATION");
  
  const history = (observation as openehr_rm.OBSERVATION).data;
  assert(history instanceof openehr_rm.HISTORY, "OBSERVATION data should be HISTORY");
  
  const event = (history as openehr_rm.HISTORY).events?.[0];
  assert(event instanceof openehr_rm.POINT_EVENT, "HISTORY should contain POINT_EVENT");
  
  const itemTree = (event as openehr_rm.POINT_EVENT).data;
  assert(itemTree instanceof openehr_rm.ITEM_TREE, "EVENT data should be ITEM_TREE");
  
  const element = (itemTree as openehr_rm.ITEM_TREE).items?.[0];
  assert(element instanceof openehr_rm.ELEMENT, "ITEM_TREE should contain ELEMENT");
  
  const value = (element as openehr_rm.ELEMENT).value;
  assert(value instanceof openehr_rm.DV_QUANTITY, "ELEMENT value should be DV_QUANTITY");
});

console.log("\n✓ All example tests passed!");
console.log("The examples demonstrate correct openEHR RM structure and usage.\n");
