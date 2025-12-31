/**
 * Basic integration test for JSON serialization
 * Tests that the serializers can be imported and basic functionality works
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import { JsonSerializer, JsonDeserializer } from "../../enhanced/serialization/json/mod.ts";
import { DV_TEXT, CODE_PHRASE } from "../../enhanced/openehr_rm.ts";
import { TERMINOLOGY_ID } from "../../enhanced/openehr_base.ts";
import { TypeRegistry } from "../../enhanced/serialization/common/type_registry.ts";
import * as rm from "../../enhanced/openehr_rm.ts";
import * as base from "../../enhanced/openehr_base.ts";

// Register all RM types
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

Deno.test("JsonSerializer: serialize simple DV_TEXT", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Hello World";
  
  const serializer = new JsonSerializer({ prettyPrint: true });
  const json = serializer.serialize(dvText);
  
  assertExists(json);
  console.log("Serialized DV_TEXT:", json);
  
  // Should contain the value
  assertEquals(json.includes("Hello World"), true);
});

Deno.test("JsonSerializer: serialize CODE_PHRASE with type", () => {
  const codePhrase = new CODE_PHRASE();
  codePhrase.terminology_id = new TERMINOLOGY_ID();
  codePhrase.terminology_id.value = "ISO_639-1";
  codePhrase.code_string = "en";
  
  const serializer = new JsonSerializer({ 
    alwaysIncludeType: true,
    prettyPrint: true 
  });
  const json = serializer.serialize(codePhrase);
  
  assertExists(json);
  console.log("Serialized CODE_PHRASE:", json);
  
  // Should contain _type
  assertEquals(json.includes("_type"), true);
  assertEquals(json.includes("CODE_PHRASE"), true);
  assertEquals(json.includes("ISO_639-1"), true);
  assertEquals(json.includes("en"), true);
});

Deno.test("JsonDeserializer: deserialize simple DV_TEXT", () => {
  const json = '{"_type":"DV_TEXT","value":"Test Value"}';
  
  const deserializer = new JsonDeserializer();
  const obj = deserializer.deserialize(json);
  
  assertExists(obj);
  assertEquals(obj.value, "Test Value");
  console.log("Deserialized object:", obj);
});

Deno.test("JSON Round-trip: DV_TEXT", () => {
  const original = new DV_TEXT();
  original.value = "Round trip test";
  
  const serializer = new JsonSerializer({ alwaysIncludeType: true });
  const json = serializer.serialize(original);
  
  const deserializer = new JsonDeserializer();
  const restored = deserializer.deserialize(json);
  
  assertExists(restored);
  assertEquals(restored.value, original.value);
  console.log("Round-trip successful");
});
