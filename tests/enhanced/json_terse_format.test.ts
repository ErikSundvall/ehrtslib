/**
 * Tests for JSON serialization with terse format
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import { JsonSerializer, JsonDeserializer, INTERNAL_JSON_CONFIG } from "../../enhanced/serialization/json/mod.ts";
import { CODE_PHRASE, DV_CODED_TEXT } from "../../enhanced/openehr_rm.ts";
import { TERMINOLOGY_ID } from "../../enhanced/openehr_base.ts";
import { TypeRegistry } from "../../enhanced/serialization/common/type_registry.ts";
import * as rm from "../../enhanced/openehr_rm.ts";
import * as base from "../../enhanced/openehr_base.ts";

// Register all RM types
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

Deno.test("JSON Terse: serialize CODE_PHRASE", () => {
  const codePhrase = new CODE_PHRASE();
  codePhrase.terminology_id = new TERMINOLOGY_ID();
  codePhrase.terminology_id.value = "ISO_639-1";
  codePhrase.code_string = "en";
  
  const serializer = new JsonSerializer({ useTerseFormat: true, prettyPrint: true });
  const json = serializer.serialize(codePhrase);
  
  assertExists(json);
  console.log("Terse CODE_PHRASE JSON:", json);
  
  // Should be in terse format string
  assertEquals(json, '"ISO_639-1::en"');
});

Deno.test("JSON Terse: serialize DV_CODED_TEXT", () => {
  const codedText = new DV_CODED_TEXT();
  codedText.value = "event";
  codedText.defining_code = new CODE_PHRASE();
  codedText.defining_code.terminology_id = new TERMINOLOGY_ID();
  codedText.defining_code.terminology_id.value = "openehr";
  codedText.defining_code.code_string = "433";
  
  const serializer = new JsonSerializer({ useTerseFormat: true });
  const json = serializer.serialize(codedText);
  
  assertExists(json);
  console.log("Terse DV_CODED_TEXT JSON:", json);
  
  // Should be in terse format string
  assertEquals(json, '"openehr::433|event|"');
});

Deno.test("JSON Terse: deserialize CODE_PHRASE", () => {
  const json = '"ISO_639-1::en"';
  
  const deserializer = new JsonDeserializer({ parseTerseFormat: true });
  const obj = deserializer.deserialize(json);
  
  assertExists(obj);
  assertEquals(obj.terminology_id.value, "ISO_639-1");
  assertEquals(obj.code_string, "en");
  console.log("Deserialized from terse:", obj);
});

Deno.test("JSON Terse: deserialize DV_CODED_TEXT", () => {
  const json = '"openehr::433|event|"';
  
  const deserializer = new JsonDeserializer({ parseTerseFormat: true });
  const obj = deserializer.deserialize(json);
  
  assertExists(obj);
  assertEquals(obj.value, "event");
  assertEquals(obj.defining_code.code_string, "433");
  console.log("Deserialized from terse:", obj);
});

Deno.test("JSON Terse: round-trip CODE_PHRASE", () => {
  const original = new CODE_PHRASE();
  original.terminology_id = new TERMINOLOGY_ID();
  original.terminology_id.value = "SNOMED-CT";
  original.code_string = "12345";
  
  const serializer = new JsonSerializer({ useTerseFormat: true });
  const json = serializer.serialize(original);
  
  const deserializer = new JsonDeserializer({ parseTerseFormat: true });
  const restored = deserializer.deserialize(json);
  
  assertEquals(restored.terminology_id.value, original.terminology_id.value);
  assertEquals(restored.code_string, original.code_string);
  console.log("Terse round-trip successful");
});

Deno.test("JSON: compact config with type inference", () => {
  const codePhrase = new CODE_PHRASE();
  codePhrase.terminology_id = new TERMINOLOGY_ID();
  codePhrase.terminology_id.value = "ISO_639-1";
  codePhrase.code_string = "en";
  
  // Serialize with INTERNAL_JSON_CONFIG (compact + terse)
  const serializer = new JsonSerializer(INTERNAL_JSON_CONFIG);
  const json = serializer.serialize(codePhrase);
  
  console.log("Compact JSON:", json);
  
  // Deserialize
  const deserializer = new JsonDeserializer({ parseTerseFormat: true });
  const restored = deserializer.deserialize(json);
  
  assertEquals(restored.code_string, "en");
});
