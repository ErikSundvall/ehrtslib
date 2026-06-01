// Deno test suite for XML deserialization

import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";

import { XmlDeserializer } from "../../enhanced/serialization/xml/xml_deserializer.ts";
import { TypeRegistry } from "../../enhanced/serialization/common/type_registry.ts";
import { TypeNotFoundError } from "../../enhanced/serialization/common/errors.ts";
import { DV_TEXT, CODE_PHRASE, TERMINOLOGY_ID } from "../../enhanced/openehr_rm.ts";

// Register types for testing
TypeRegistry.clear();
TypeRegistry.register("DV_TEXT", DV_TEXT);
TypeRegistry.register("CODE_PHRASE", CODE_PHRASE);
TypeRegistry.register("TERMINOLOGY_ID", TERMINOLOGY_ID);

Deno.test("XmlDeserializer - deserialize simple DV_TEXT", () => {
  // XML element names use lowercase (e.g., <dv_text>) by convention, while
  // xsi:type attribute uses uppercase openEHR type name (DV_TEXT) per spec.
  // The deserializer handles both: infers type from xsi:type or converts
  // element name to uppercase for type lookup.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<dv_text xmlns="http://schemas.openehr.org/v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="DV_TEXT">
  <value>Hello World</value>
</dv_text>`;
  
  const deserializer = new XmlDeserializer();
  const result = deserializer.deserialize<DV_TEXT>(xml);
  
  assertEquals(result.constructor.name, "DV_TEXT");
  assertEquals(result.value, "Hello World");
});

Deno.test("XmlDeserializer - deserialize without XML declaration", () => {
  const xml = `<dv_text xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="DV_TEXT">
  <value>Test</value>
</dv_text>`;
  
  const deserializer = new XmlDeserializer();
  const result = deserializer.deserialize<DV_TEXT>(xml);
  
  assertEquals(result.value, "Test");
});

Deno.test("XmlDeserializer - infer type from root element when xsi:type missing", () => {
  const xml = `<dv_text>
  <value>Inferred Type</value>
</dv_text>`;
  
  const deserializer = new XmlDeserializer();
  const result = deserializer.deserialize<DV_TEXT>(xml);
  
  assertEquals(result.constructor.name, "DV_TEXT");
  assertEquals(result.value, "Inferred Type");
});

Deno.test("XmlDeserializer - deserialize nested objects", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<code_phrase xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CODE_PHRASE">
  <code_string>en</code_string>
  <terminology_id xsi:type="TERMINOLOGY_ID">
    <value>ISO_639-1</value>
  </terminology_id>
</code_phrase>`;
  
  const deserializer = new XmlDeserializer();
  const result = deserializer.deserialize<CODE_PHRASE>(xml);
  
  assertEquals(result.constructor.name, "CODE_PHRASE");
  assertEquals(result.code_string, "en");
  assertEquals(result.terminology_id?.constructor.name, "TERMINOLOGY_ID");
  assertEquals(result.terminology_id?.value, "ISO_639-1");
});

Deno.test("XmlDeserializer - deserializeAs with explicit type", () => {
  const xml = `<dv_text>
  <value>Explicit Type</value>
</dv_text>`;
  
  const deserializer = new XmlDeserializer();
  const result = deserializer.deserializeAs(xml, DV_TEXT);
  
  assertEquals(result.constructor.name, "DV_TEXT");
  assertEquals(result.value, "Explicit Type");
});

Deno.test("XmlDeserializer - throws TypeNotFoundError for unknown type in strict mode", () => {
  const xml = `<unknown_type xsi:type="UNKNOWN_TYPE" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <value>Test</value>
</unknown_type>`;
  
  const deserializer = new XmlDeserializer({ strict: true });
  
  assertThrows(
    () => deserializer.deserialize(xml),
    TypeNotFoundError,
    "UNKNOWN_TYPE"
  );
});

Deno.test("XmlDeserializer - returns plain object for unknown type in non-strict mode", () => {
  const xml = `<unknown_type xsi:type="UNKNOWN_TYPE" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <value>Test</value>
</unknown_type>`;
  
  const deserializer = new XmlDeserializer({ strict: false });
  const result = deserializer.deserialize(xml);
  
  // Should return a plain object with properties
  assertEquals(result.value, "Test");
});

Deno.test("XmlDeserializer - round-trip DV_TEXT", () => {
  const original = new DV_TEXT();
  original.value = "Round Trip Test";
  
  // Import serializer for round-trip test
  const { XmlSerializer } = await import("../../enhanced/serialization/xml/xml_serializer.ts");
  
  const serializer = new XmlSerializer();
  const xml = serializer.serialize(original);
  
  const deserializer = new XmlDeserializer();
  const restored = deserializer.deserialize<DV_TEXT>(xml);
  
  assertEquals(restored.value, original.value);
});

Deno.test("XmlDeserializer - round-trip CODE_PHRASE with nested object", () => {
  const original = new CODE_PHRASE();
  original.code_string = "en";
  
  const terminologyId = new TERMINOLOGY_ID();
  terminologyId.value = "ISO_639-1";
  original.terminology_id = terminologyId;
  
  // Import serializer for round-trip test
  const { XmlSerializer } = await import("../../enhanced/serialization/xml/xml_serializer.ts");
  
  const serializer = new XmlSerializer();
  const xml = serializer.serialize(original);
  
  const deserializer = new XmlDeserializer();
  const restored = deserializer.deserialize<CODE_PHRASE>(xml);
  
  assertEquals(restored.code_string, original.code_string);
  assertEquals(restored.terminology_id?.value, original.terminology_id?.value);
});
