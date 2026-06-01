/**
 * Basic integration test for YAML serialization
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import { YamlSerializer, YamlDeserializer } from "../../enhanced/serialization/yaml/mod.ts";
import { DV_TEXT, CODE_PHRASE, DV_CODED_TEXT } from "../../enhanced/openehr_rm.ts";
import { TERMINOLOGY_ID } from "../../enhanced/openehr_base.ts";
import { TypeRegistry } from "../../enhanced/serialization/common/type_registry.ts";
import * as rm from "../../enhanced/openehr_rm.ts";
import * as base from "../../enhanced/openehr_base.ts";

// Register all RM types
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

Deno.test("YamlSerializer: serialize simple DV_TEXT", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Hello YAML";
  
  const serializer = new YamlSerializer();
  const yaml = serializer.serialize(dvText);
  
  assertExists(yaml);
  console.log("Serialized DV_TEXT to YAML:\n", yaml);
  
  // Should contain the value
  assertEquals(yaml.includes("Hello YAML"), true);
  // Note: Default config has includeType: false, so _type is not included
  assertEquals(yaml.includes("value:"), true);
});

Deno.test("YamlSerializer: serialize CODE_PHRASE", () => {
  const codePhrase = new CODE_PHRASE();
  codePhrase.terminology_id = new TERMINOLOGY_ID();
  codePhrase.terminology_id.value = "ISO_639-1";
  codePhrase.code_string = "en";
  
  const serializer = new YamlSerializer();
  const yaml = serializer.serialize(codePhrase);
  
  assertExists(yaml);
  console.log("Serialized CODE_PHRASE to YAML:\n", yaml);
  
  assertEquals(yaml.includes("ISO_639-1"), true);
  assertEquals(yaml.includes("en"), true);
});

Deno.test("YamlDeserializer: deserialize simple DV_TEXT", () => {
  const yaml = `
_type: DV_TEXT
value: Test YAML Value
`;
  
  const deserializer = new YamlDeserializer();
  const obj = deserializer.deserialize(yaml);
  
  assertExists(obj);
  assertEquals(obj.value, "Test YAML Value");
  console.log("Deserialized YAML object:", obj);
});

Deno.test("YAML Round-trip: DV_TEXT", () => {
  const original = new DV_TEXT();
  original.value = "Round trip YAML test";
  
  const serializer = new YamlSerializer();
  const yaml = serializer.serialize(original);
  
  const deserializer = new YamlDeserializer();
  const restored = deserializer.deserialize(yaml);
  
  assertExists(restored);
  assertEquals(restored.value, original.value);
  console.log("YAML Round-trip successful");
});

Deno.test("YamlSerializer: terse format for CODE_PHRASE", () => {
  const codePhrase = new CODE_PHRASE();
  codePhrase.terminology_id = new TERMINOLOGY_ID();
  codePhrase.terminology_id.value = "openehr";
  codePhrase.code_string = "433";
  
  const serializer = new YamlSerializer({ useTerseFormat: true });
  const yaml = serializer.serialize(codePhrase);
  
  assertExists(yaml);
  console.log("Terse format CODE_PHRASE:\n", yaml);
  
  // Should be in terse format
  assertEquals(yaml.includes("openehr::433"), true);
});
