/**
 * Tests for TypeScript Constructor Serializer
 */

import { assert, assertEquals, assertExists } from "jsr:@std/assert";
import {
  DEFAULT_TYPESCRIPT_CONSTRUCTOR_CONFIG,
  TypeScriptConstructorSerializer,
} from "../../../serialization/typescript/mod.ts";
import {
  CODE_PHRASE,
  COMPOSITION,
  DV_CODED_TEXT,
  DV_QUANTITY,
  DV_TEXT,
  ELEMENT,
  PARTY_IDENTIFIED,
  SECTION,
} from "../../../rm/openehr_rm.ts";
import {
  ARCHETYPE_ID,
  OBJECT_VERSION_ID,
  TERMINOLOGY_ID,
} from "../../../base/openehr_base.ts";
import { TypeRegistry } from "../../../serialization/common/type_registry.ts";
import * as rm from "../../../rm/openehr_rm.ts";
import * as base from "../../../base/openehr_base.ts";

// Register all RM types
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

Deno.test("TypeScript Constructor: simple DV_TEXT with primitive constructor", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Test value";

  const serializer = new TypeScriptConstructorSerializer();
  const code = serializer.serialize(dvText);

  console.log("DV_TEXT with primitive constructor:");
  console.log(code);

  assertExists(code);
  // With primitive constructor, root DV_TEXT collapses to the string (no import)
  assert(
    code.includes('const dvText = "Test value"'),
    "Should use primitive value directly",
  );
});

Deno.test("TypeScript Constructor: DV_TEXT without primitive constructor", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Test value";

  const serializer = new TypeScriptConstructorSerializer({
    usePrimitiveConstructors: false,
  });
  const code = serializer.serialize(dvText);

  console.log("DV_TEXT without primitive constructor:");
  console.log(code);

  assertExists(code);
  assert(
    code.includes('value: "Test value"'),
    "Should have explicit value property",
  );
});

Deno.test("TypeScript Constructor: CODE_PHRASE with terse format", () => {
  const codePhrase = new CODE_PHRASE();
  codePhrase.terminology_id = new TERMINOLOGY_ID();
  codePhrase.terminology_id.value = "ISO_639-1";
  codePhrase.code_string = "en";

  const serializer = new TypeScriptConstructorSerializer({
    useTerseFormat: true,
  });
  const code = serializer.serialize(codePhrase);

  console.log("CODE_PHRASE with terse format:");
  console.log(code);

  assertExists(code);
  assert(code.includes('"ISO_639-1::en"'), "Should use terse format");
});

Deno.test("TypeScript Constructor: CODE_PHRASE without terse format", () => {
  const codePhrase = new CODE_PHRASE();
  codePhrase.terminology_id = new TERMINOLOGY_ID();
  codePhrase.terminology_id.value = "ISO_639-1";
  codePhrase.code_string = "en";

  const serializer = new TypeScriptConstructorSerializer({
    useTerseFormat: false,
  });
  const code = serializer.serialize(codePhrase);

  console.log("CODE_PHRASE without terse format:");
  console.log(code);

  assertExists(code);
  assert(code.includes('code_string: "en"'), "Should have explicit properties");
  assert(
    code.includes("terminology_id"),
    "Should have terminology_id property",
  );
});

Deno.test("TypeScript Constructor: DV_CODED_TEXT with terse format", () => {
  const dvCodedText = new DV_CODED_TEXT();
  dvCodedText.value = "event";
  dvCodedText.defining_code = new CODE_PHRASE();
  dvCodedText.defining_code.terminology_id = new TERMINOLOGY_ID();
  dvCodedText.defining_code.terminology_id.value = "openehr";
  dvCodedText.defining_code.code_string = "433";

  const serializer = new TypeScriptConstructorSerializer({
    useTerseFormat: true,
  });
  const code = serializer.serialize(dvCodedText);

  console.log("DV_CODED_TEXT with terse format:");
  console.log(code);

  assertExists(code);
  assert(code.includes('"openehr::433|event|"'), "Should use terse format");
});

Deno.test("TypeScript Constructor: COMPOSITION with archetype_node_id after name", () => {
  const composition = new COMPOSITION();
  composition.name = new DV_TEXT();
  composition.name.value = "Test Composition";
  composition.archetype_node_id = "openEHR-EHR-COMPOSITION.encounter.v1";
  composition.language = new CODE_PHRASE();
  composition.language.terminology_id = new TERMINOLOGY_ID();
  composition.language.terminology_id.value = "ISO_639-1";
  composition.language.code_string = "en";

  const serializer = new TypeScriptConstructorSerializer({
    archetypeNodeIdLocation: "after_name",
  });
  const code = serializer.serialize(composition);

  console.log("COMPOSITION with archetype_node_id after name:");
  console.log(code);

  assertExists(code);
  assert(code.includes("COMPOSITION"), "Should have COMPOSITION type");

  // Check that name comes before archetype_node_id
  const nameIndex = code.indexOf("name:");
  const archetypeIndex = code.indexOf("archetype_node_id:");
  assert(nameIndex > 0 && archetypeIndex > 0, "Should have both properties");
  assert(
    nameIndex < archetypeIndex,
    "name should come before archetype_node_id",
  );
});

Deno.test("TypeScript Constructor: COMPOSITION with archetype_node_id at beginning", () => {
  const composition = new COMPOSITION();
  composition.name = new DV_TEXT();
  composition.name.value = "Test Composition";
  composition.archetype_node_id = "openEHR-EHR-COMPOSITION.encounter.v1";

  const serializer = new TypeScriptConstructorSerializer({
    archetypeNodeIdLocation: "beginning",
  });
  const code = serializer.serialize(composition);

  console.log("COMPOSITION with archetype_node_id at beginning:");
  console.log(code);

  assertExists(code);

  // Check that archetype_node_id comes before name
  const nameIndex = code.indexOf("name:");
  const archetypeIndex = code.indexOf("archetype_node_id:");
  assert(nameIndex > 0 && archetypeIndex > 0, "Should have both properties");
  assert(
    archetypeIndex < nameIndex,
    "archetype_node_id should come before name",
  );
});

Deno.test("TypeScript Constructor: COMPOSITION with archetype_node_id at end", () => {
  const composition = new COMPOSITION();
  composition.name = new DV_TEXT();
  composition.name.value = "Test Composition";
  composition.archetype_node_id = "openEHR-EHR-COMPOSITION.encounter.v1";
  composition.language = new CODE_PHRASE();
  composition.language.terminology_id = new TERMINOLOGY_ID();
  composition.language.terminology_id.value = "ISO_639-1";
  composition.language.code_string = "en";

  const serializer = new TypeScriptConstructorSerializer({
    archetypeNodeIdLocation: "end",
  });
  const code = serializer.serialize(composition);

  console.log("COMPOSITION with archetype_node_id at end:");
  console.log(code);

  assertExists(code);

  // Check that name comes before archetype_node_id and language comes before archetype_node_id
  const nameIndex = code.indexOf("name:");
  const languageIndex = code.indexOf("language:");
  const archetypeIndex = code.indexOf("archetype_node_id:");
  assert(
    nameIndex > 0 && archetypeIndex > 0 && languageIndex > 0,
    "Should have all properties",
  );
  assert(
    nameIndex < archetypeIndex,
    "name should come before archetype_node_id",
  );
  assert(
    languageIndex < archetypeIndex,
    "language should come before archetype_node_id",
  );
});

Deno.test("TypeScript Constructor: complex nested structure", () => {
  const section = new SECTION();
  section.name = new DV_TEXT();
  section.name.value = "Vital Signs";

  // First element
  const element1 = new ELEMENT();
  element1.name = new DV_TEXT();
  element1.name.value = "Pulse rate";
  element1.value = new DV_QUANTITY();
  element1.value.magnitude = 72;
  element1.value.units = "/min";

  // Second element
  const element2 = new ELEMENT();
  element2.name = new DV_TEXT();
  element2.name.value = "Temperature";
  element2.value = new DV_QUANTITY();
  element2.value.magnitude = 37.5;
  element2.value.units = "°C";

  section.items = [element1, element2];

  const serializer = new TypeScriptConstructorSerializer();
  const code = serializer.serialize(section);

  console.log("Complex nested structure:");
  console.log(code);
  console.log("---");

  assertExists(code);
  assert(code.includes("SECTION"), "Should have SECTION type");
  assert(code.includes("ELEMENT"), "Should have ELEMENT type");
  assert(code.includes("DV_QUANTITY"), "Should have DV_QUANTITY type");
  assert(code.includes("Pulse rate"), "Should contain pulse rate");
  assert(code.includes("Temperature"), "Should contain temperature");
  assert(code.includes("72"), "Should contain pulse value");
  assert(code.includes("37.5"), "Should contain temperature value");
});

Deno.test("TypeScript Constructor: custom variable name", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Custom";

  const serializer = new TypeScriptConstructorSerializer();
  const code = serializer.serialize(dvText, "myCustomVariable");

  console.log("Custom variable name:");
  console.log(code);

  assertExists(code);
  assert(
    code.includes("const myCustomVariable"),
    "Should use custom variable name",
  );
});

Deno.test("TypeScript Constructor: array handling", () => {
  const composition = new COMPOSITION();
  composition.name = new DV_TEXT();
  composition.name.value = "Test";

  const composer = new PARTY_IDENTIFIED();
  composer.name = "Dr. Smith";
  composition.composer = composer;

  const serializer = new TypeScriptConstructorSerializer();
  const code = serializer.serialize(composition);

  console.log("With nested object:");
  console.log(code);

  assertExists(code);
  assert(code.includes("composer:"), "Should have composer property");
  assert(code.includes("Dr. Smith"), "Should contain composer name");
});

Deno.test("TypeScript Constructor: imports grouping", () => {
  const composition = new COMPOSITION();
  composition.name = new DV_TEXT();
  composition.name.value = "Test";
  composition.uid = new OBJECT_VERSION_ID();
  composition.uid.value = "test-uid";
  composition.archetype_details = new rm.ARCHETYPED();
  composition.archetype_details.archetype_id = new ARCHETYPE_ID();
  composition.archetype_details.archetype_id.value =
    "openEHR-EHR-COMPOSITION.encounter.v1";

  const serializer = new TypeScriptConstructorSerializer();
  const code = serializer.serialize(composition);

  console.log("Imports grouping:");
  console.log(code);

  assertExists(code);

  assert(code.includes("from './openehr_rm.ts'"), "Should have RM imports");
  assert(code.includes("archetype_details: {"), "ARCHETYPED uses a plain literal");
  assert(!code.includes("new ARCHETYPED"), "No nested ARCHETYPED constructor");
});

Deno.test("TypeScript Constructor: indent configuration", () => {
  const dvCodedText = new DV_CODED_TEXT();
  dvCodedText.value = "test";
  dvCodedText.defining_code = new CODE_PHRASE();
  dvCodedText.defining_code.terminology_id = new TERMINOLOGY_ID();
  dvCodedText.defining_code.terminology_id.value = "local";
  dvCodedText.defining_code.code_string = "at0001";

  const serializer4 = new TypeScriptConstructorSerializer({
    indent: 4,
    useTerseFormat: false,
  });
  const code4 = serializer4.serialize(dvCodedText);

  console.log("With 4-space indent:");
  console.log(code4);

  assertExists(code4);
  // Check for 4-space indentation
  assert(code4.includes("    "), "Should have 4-space indentation");
});

Deno.test("TypeScript Constructor: undefined comments include RM multiplicity", () => {
  const composition = new COMPOSITION();
  composition.archetype_node_id = "openEHR-EHR-COMPOSITION.encounter.v1";

  const serializer = new TypeScriptConstructorSerializer({
    includeComments: true,
    includeUndefinedAttributes: true,
    useTerseFormat: false,
    usePrimitiveConstructors: false,
  });
  const code = serializer.serialize(composition);

  assert(code.includes("links: undefined"), "Should emit undefined links");
  assert(
    code.includes("[0..*] optional - TODO: set value or remove if not needed"),
    "Optional repeating attributes should describe multiplicity",
  );
  assert(
    code.includes("language: undefined"),
    "Should list mandatory composition attributes",
  );
  assert(
    code.includes("[1..1] required - TODO: set value"),
    "Mandatory attributes should say required",
  );
});

Deno.test("TypeScript Constructor: nested literals without redundant new()", () => {
  const composition = new COMPOSITION();
  composition.archetype_node_id = "openEHR-EHR-COMPOSITION.encounter.v1";
  composition.name = new DV_TEXT();
  composition.name.value = "Visit";
  composition.language = new CODE_PHRASE();
  composition.language.terminology_id = new TERMINOLOGY_ID();
  composition.language.terminology_id.value = "ISO_639-1";
  composition.language.code_string = "en";
  composition.territory = new CODE_PHRASE();
  composition.territory.terminology_id = new TERMINOLOGY_ID();
  composition.territory.terminology_id.value = "ISO_3166-1";
  composition.territory.code_string = "GB";
  composition.category = new DV_CODED_TEXT();
  composition.category.value = "event";
  composition.category.defining_code = new CODE_PHRASE();
  composition.category.defining_code.terminology_id = new TERMINOLOGY_ID();
  composition.category.defining_code.terminology_id.value = "openehr";
  composition.category.defining_code.code_string = "433";
  const composer = new PARTY_IDENTIFIED();
  composer.name = "Dr. Smith";
  composition.composer = composer;

  const serializer = new TypeScriptConstructorSerializer({
    useTerseFormat: false,
    usePrimitiveConstructors: false,
    useNestedObjectLiterals: true,
  });
  const code = serializer.serialize(composition);

  assert(code.includes("new COMPOSITION"), "Root should use constructor");
  assert(
    !code.includes("new DV_TEXT"),
    "DV_TEXT name should be a plain literal",
  );
  assert(
    code.includes("new PARTY_IDENTIFIED"),
    "PARTY_PROXY composer stays explicit",
  );
});
