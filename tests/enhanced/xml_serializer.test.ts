// Deno test suite for XML serialization

import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";

import { XmlSerializer } from "../../enhanced/serialization/xml/xml_serializer.ts";
import { TypeRegistry } from "../../enhanced/serialization/common/type_registry.ts";
import { DV_TEXT, CODE_PHRASE, TERMINOLOGY_ID } from "../../enhanced/openehr_rm.ts";

// Register types for testing
TypeRegistry.clear();
TypeRegistry.register("DV_TEXT", DV_TEXT);
TypeRegistry.register("CODE_PHRASE", CODE_PHRASE);
TypeRegistry.register("TERMINOLOGY_ID", TERMINOLOGY_ID);

Deno.test("XmlSerializer - serialize simple DV_TEXT", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Hello World";
  
  const serializer = new XmlSerializer({ includeDeclaration: false });
  const xml = serializer.serialize(dvText);
  
  assertStringIncludes(xml, "<dv_text");
  assertStringIncludes(xml, "<value>Hello World</value>");
  assertStringIncludes(xml, "xsi:type=\"DV_TEXT\"");
});

Deno.test("XmlSerializer - includes XML declaration when configured", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Test";
  
  const serializer = new XmlSerializer({ includeDeclaration: true });
  const xml = serializer.serialize(dvText);
  
  assertStringIncludes(xml, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
});

Deno.test("XmlSerializer - omits XML declaration when configured", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Test";
  
  const serializer = new XmlSerializer({ includeDeclaration: false });
  const xml = serializer.serialize(dvText);
  
  assert(!xml.includes("<?xml"));
});

Deno.test("XmlSerializer - uses namespace when configured", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Test";
  
  const serializer = new XmlSerializer({ 
    useNamespaces: true,
    includeDeclaration: false 
  });
  const xml = serializer.serialize(dvText);
  
  assertStringIncludes(xml, "xmlns=\"http://schemas.openehr.org/v1\"");
  assertStringIncludes(xml, "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"");
});

Deno.test("XmlSerializer - omits namespace when configured", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Test";
  
  const serializer = new XmlSerializer({ 
    useNamespaces: false,
    includeDeclaration: false 
  });
  const xml = serializer.serialize(dvText);
  
  assert(!xml.includes("xmlns="));
});

Deno.test("XmlSerializer - pretty print formats output", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Test";
  
  const serializer = new XmlSerializer({ 
    prettyPrint: true,
    includeDeclaration: false 
  });
  const xml = serializer.serialize(dvText);
  
  // Pretty printed XML should have line breaks
  assert(xml.includes("\n"));
});

Deno.test("XmlSerializer - serialize nested object CODE_PHRASE", () => {
  const codePhrase = new CODE_PHRASE();
  codePhrase.code_string = "en";
  
  const terminologyId = new TERMINOLOGY_ID();
  terminologyId.value = "ISO_639-1";
  codePhrase.terminology_id = terminologyId;
  
  const serializer = new XmlSerializer({ 
    includeDeclaration: false,
    prettyPrint: true 
  });
  const xml = serializer.serialize(codePhrase);
  
  assertStringIncludes(xml, "<code_phrase");
  assertStringIncludes(xml, "<code_string>en</code_string>");
  assertStringIncludes(xml, "<terminology_id");
  assertStringIncludes(xml, "<value>ISO_639-1</value>");
  assertStringIncludes(xml, "xsi:type=\"CODE_PHRASE\"");
  assertStringIncludes(xml, "xsi:type=\"TERMINOLOGY_ID\"");
});

Deno.test("XmlSerializer - skips null and undefined values", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Test";
  // Don't set mappings or other optional fields
  
  const serializer = new XmlSerializer({ includeDeclaration: false });
  const xml = serializer.serialize(dvText);
  
  // Should not contain mappings or other undefined fields
  assert(!xml.includes("<mappings"));
  assert(!xml.includes("<language"));
});

Deno.test("XmlSerializer - custom root element name", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Test";
  
  const serializer = new XmlSerializer();
  const xml = serializer.serializeWith(dvText, { 
    rootElement: "custom_root",
    includeDeclaration: false 
  });
  
  assertStringIncludes(xml, "<custom_root");
  assertStringIncludes(xml, "</custom_root>");
});

Deno.test("XmlSerializer - custom namespace", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Test";
  
  const serializer = new XmlSerializer({ 
    useNamespaces: true,
    namespace: "http://example.com/custom",
    includeDeclaration: false 
  });
  const xml = serializer.serialize(dvText);
  
  assertStringIncludes(xml, "xmlns=\"http://example.com/custom\"");
});
