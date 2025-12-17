/**
 * Tests for Constructor-Based Initialization
 * 
 * Tests the simplified object creation pattern using constructors.
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import { COMPOSITION, DV_TEXT, DV_CODED_TEXT, CODE_PHRASE } from "../../enhanced/openehr_rm.ts";

// ============================================================================
// DV_TEXT Constructor Tests
// ============================================================================

Deno.test("DV_TEXT: constructor with string", () => {
  const text = new DV_TEXT("Hello world");
  
  assertEquals(text.value, "Hello world");
});

Deno.test("DV_TEXT: constructor with object (value only)", () => {
  const text = new DV_TEXT({ value: "Hello world" });
  
  assertEquals(text.value, "Hello world");
});

Deno.test("DV_TEXT: constructor with object (value and language)", () => {
  const text = new DV_TEXT({
    value: "Hello",
    language: "ISO_639-1::en"
  });
  
  assertEquals(text.value, "Hello");
  assertExists(text.language);
  assertEquals(text.language?.code_string, "en");
  assertEquals(text.language?.terminology_id?.value, "ISO_639-1");
});

Deno.test("DV_TEXT: constructor with empty init", () => {
  const text = new DV_TEXT();
  
  assertEquals(text.value, undefined);
});

// ============================================================================
// CODE_PHRASE Constructor Tests
// ============================================================================

Deno.test("CODE_PHRASE: constructor with terse format", () => {
  const cp = new CODE_PHRASE("ISO_639-1::en");
  
  assertEquals(cp.code_string, "en");
  assertEquals(cp.terminology_id?.value, "ISO_639-1");
});

Deno.test("CODE_PHRASE: constructor with object", () => {
  const cp = new CODE_PHRASE({
    code_string: "en",
    terminology_id: "ISO_639-1"
  });
  
  assertEquals(cp.code_string, "en");
  assertEquals(cp.terminology_id?.value, "ISO_639-1");
});

Deno.test("CODE_PHRASE: constructor with empty init", () => {
  const cp = new CODE_PHRASE();
  
  assertEquals(cp.code_string, undefined);
  assertEquals(cp.terminology_id, undefined);
});

// ============================================================================
// DV_CODED_TEXT Constructor Tests
// ============================================================================

Deno.test("DV_CODED_TEXT: constructor with terse format", () => {
  const dct = new DV_CODED_TEXT("openehr::433|event|");
  
  assertEquals(dct.value, "event");
  assertEquals(dct.defining_code?.code_string, "433");
  assertEquals(dct.defining_code?.terminology_id?.value, "openehr");
});

Deno.test("DV_CODED_TEXT: constructor with object", () => {
  const dct = new DV_CODED_TEXT({
    value: "event",
    defining_code: {
      code_string: "433",
      terminology_id: "openehr"
    }
  });
  
  assertEquals(dct.value, "event");
  assertEquals(dct.defining_code?.code_string, "433");
  assertEquals(dct.defining_code?.terminology_id?.value, "openehr");
});

Deno.test("DV_CODED_TEXT: constructor with object and terse defining_code", () => {
  const dct = new DV_CODED_TEXT({
    value: "persistent",
    defining_code: "openehr::431"
  });
  
  assertEquals(dct.value, "persistent");
  assertEquals(dct.defining_code?.code_string, "431");
  assertEquals(dct.defining_code?.terminology_id?.value, "openehr");
});

Deno.test("DV_CODED_TEXT: constructor with empty init", () => {
  const dct = new DV_CODED_TEXT();
  
  assertEquals(dct.value, undefined);
  assertEquals(dct.defining_code, undefined);
});

// ============================================================================
// COMPOSITION Constructor Tests
// ============================================================================

Deno.test("COMPOSITION: constructor with minimal required fields", () => {
  const comp = new COMPOSITION({
    archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
    name: "Test Composition"
  });
  
  assertEquals(comp.archetype_node_id, "openEHR-EHR-COMPOSITION.encounter.v1");
  assertEquals(comp.name?.value, "Test Composition");
});

Deno.test("COMPOSITION: constructor with terse formats", () => {
  const comp = new COMPOSITION({
    archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
    name: "Blood Pressure Reading",
    language: "ISO_639-1::en",
    territory: "ISO_3166-1::GB",
    category: "openehr::433|event|"
  });
  
  assertEquals(comp.name?.value, "Blood Pressure Reading");
  assertEquals(comp.language?.code_string, "en");
  assertEquals(comp.territory?.code_string, "GB");
  assertEquals(comp.category?.value, "event");
  assertEquals(comp.category?.defining_code?.code_string, "433");
});

Deno.test("COMPOSITION: constructor with object formats", () => {
  const comp = new COMPOSITION({
    archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
    name: { value: "Test" },
    language: {
      code_string: "en",
      terminology_id: "ISO_639-1"
    },
    category: {
      value: "event",
      defining_code: {
        code_string: "433",
        terminology_id: "openehr"
      }
    }
  });
  
  assertEquals(comp.name?.value, "Test");
  assertEquals(comp.language?.code_string, "en");
  assertEquals(comp.category?.value, "event");
});

Deno.test("COMPOSITION: constructor with composer object", () => {
  const comp = new COMPOSITION({
    archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
    name: "Test",
    composer: {
      name: "Dr. Smith"
    }
  });
  
  assertExists(comp.composer);
  assertEquals(comp.composer?.name, "Dr. Smith");
});

Deno.test("COMPOSITION: constructor with uid string", () => {
  const comp = new COMPOSITION({
    archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
    name: "Test",
    uid: "8849182c-82ad-4088-a07f-48ead4180515::uk.nhs.example::1"
  });
  
  assertExists(comp.uid);
  assertEquals(comp.uid?.value, "8849182c-82ad-4088-a07f-48ead4180515::uk.nhs.example::1");
});

Deno.test("COMPOSITION: constructor with archetype_details", () => {
  const comp = new COMPOSITION({
    archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
    name: "Test",
    archetype_details: {
      archetype_id: "openEHR-EHR-COMPOSITION.encounter.v1",
      rm_version: "1.1.0"
    }
  });
  
  assertExists(comp.archetype_details);
  assertEquals(comp.archetype_details?.archetype_id?.value, "openEHR-EHR-COMPOSITION.encounter.v1");
  assertEquals(comp.archetype_details?.rm_version, "1.1.0");
});

Deno.test("COMPOSITION: constructor with empty init", () => {
  const comp = new COMPOSITION();
  
  assertEquals(comp.name, undefined);
  assertEquals(comp.language, undefined);
});

// ============================================================================
// Integration Tests - Complete COMPOSITION Creation
// ============================================================================

Deno.test("COMPOSITION: complete creation with compact syntax", () => {
  const comp = new COMPOSITION({
    archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
    name: "Blood Pressure Recording",
    uid: "8849182c-82ad-4088-a07f-48ead4180515::uk.nhs.example::1",
    language: "ISO_639-1::en",
    territory: "ISO_3166-1::GB",
    category: "openehr::433|event|",
    composer: { name: "Dr. Smith" },
    archetype_details: {
      archetype_id: "openEHR-EHR-COMPOSITION.encounter.v1",
      rm_version: "1.1.0"
    }
  });
  
  // Verify all properties are set correctly
  assertEquals(comp.archetype_node_id, "openEHR-EHR-COMPOSITION.encounter.v1");
  assertEquals(comp.name?.value, "Blood Pressure Recording");
  assertEquals(comp.uid?.value, "8849182c-82ad-4088-a07f-48ead4180515::uk.nhs.example::1");
  assertEquals(comp.language?.code_string, "en");
  assertEquals(comp.language?.terminology_id?.value, "ISO_639-1");
  assertEquals(comp.territory?.code_string, "GB");
  assertEquals(comp.territory?.terminology_id?.value, "ISO_3166-1");
  assertEquals(comp.category?.value, "event");
  assertEquals(comp.category?.defining_code?.code_string, "433");
  assertEquals(comp.category?.defining_code?.terminology_id?.value, "openehr");
  assertEquals(comp.composer?.name, "Dr. Smith");
  assertEquals(comp.archetype_details?.archetype_id?.value, "openEHR-EHR-COMPOSITION.encounter.v1");
  assertEquals(comp.archetype_details?.rm_version, "1.1.0");
});

// ============================================================================
// Direct Property Assignment Tests (Alternative 4 from PRD)
// ============================================================================

Deno.test("COMPOSITION: constructor + direct property assignment", () => {
  // Create with required properties
  const comp = new COMPOSITION({
    archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
    name: "Test Composition",
    language: "ISO_639-1::en"
  });
  
  // Add optional properties using direct assignment
  comp.territory = new CODE_PHRASE("ISO_3166-1::GB");
  comp.category = new DV_CODED_TEXT("openehr::433|event|");
  
  // Verify all properties
  assertEquals(comp.archetype_node_id, "openEHR-EHR-COMPOSITION.encounter.v1");
  assertEquals(comp.name?.value, "Test Composition");
  assertEquals(comp.language?.code_string, "en");
  assertEquals(comp.territory?.code_string, "GB");
  assertEquals(comp.category?.value, "event");
});

Deno.test("COMPOSITION: incremental building with property assignment", () => {
  const comp = new COMPOSITION();
  
  // Build incrementally
  comp.archetype_node_id = "openEHR-EHR-COMPOSITION.encounter.v1";
  comp.name = new DV_TEXT("Test");
  comp.language = new CODE_PHRASE("ISO_639-1::en");
  comp.territory = new CODE_PHRASE("ISO_3166-1::GB");
  
  // Verify
  assertEquals(comp.archetype_node_id, "openEHR-EHR-COMPOSITION.encounter.v1");
  assertEquals(comp.name?.value, "Test");
  assertEquals(comp.language?.code_string, "en");
  assertEquals(comp.territory?.code_string, "GB");
});
