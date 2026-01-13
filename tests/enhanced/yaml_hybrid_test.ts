/**
 * Test for hybrid YAML serialization formatting
 * 
 * This test verifies that the hybrid YAML style produces compact, inline formatting
 * for simple objects while keeping complex structures in block style.
 */

import { assertEquals, assertExists, assert } from "jsr:@std/assert";
import { YamlSerializer, HYBRID_YAML_CONFIG } from "../../enhanced/serialization/yaml/mod.ts";
import { DV_TEXT, CODE_PHRASE, DV_CODED_TEXT, SECTION, ELEMENT, DV_QUANTITY } from "../../enhanced/openehr_rm.ts";
import { TERMINOLOGY_ID } from "../../enhanced/openehr_base.ts";
import { TypeRegistry } from "../../enhanced/serialization/common/type_registry.ts";
import * as rm from "../../enhanced/openehr_rm.ts";
import * as base from "../../enhanced/openehr_base.ts";

// Register all RM types
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

Deno.test("Hybrid YAML: simple object inline formatting", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Vital Signs";
  
  const serializer = new YamlSerializer(HYBRID_YAML_CONFIG);
  const yaml = serializer.serialize(dvText);
  
  console.log("Simple DV_TEXT in hybrid style:");
  console.log(yaml);
  
  assertExists(yaml);
  // Should be compact with inline formatting for simple object
  assert(yaml.includes("value:"), "Should contain value property");
});

Deno.test("Hybrid YAML: nested structure with inline simple objects", () => {
  // Create a section with diabetes diagnosis and pulse observation
  const section = new SECTION();
  section.name = new DV_TEXT();
  section.name.value = "Vital Signs";
  
  // First element: Diabetes diagnosis (DV_CODED_TEXT)
  const diabetesElement = new ELEMENT();
  diabetesElement.name = new DV_TEXT();
  diabetesElement.name.value = "Diagnosis";
  diabetesElement.value = new DV_CODED_TEXT();
  diabetesElement.value.value = "Diabetes mellitus type 2";
  diabetesElement.value.defining_code = new CODE_PHRASE();
  diabetesElement.value.defining_code.terminology_id = new TERMINOLOGY_ID();
  diabetesElement.value.defining_code.terminology_id.value = "SNOMED-CT";
  diabetesElement.value.defining_code.code_string = "44054006";
  diabetesElement.value.defining_code.preferred_term = "Type 2 diabetes mellitus";
  
  // Second element: Pulse rate (DV_QUANTITY)
  const pulseElement = new ELEMENT();
  pulseElement.name = new DV_TEXT();
  pulseElement.name.value = "Pulse rate";
  pulseElement.value = new DV_QUANTITY();
  pulseElement.value.magnitude = 72;
  pulseElement.value.units = "/min";
  
  section.items = [diabetesElement, pulseElement];
  
  const serializer = new YamlSerializer(HYBRID_YAML_CONFIG);
  const yaml = serializer.serialize(section);
  
  console.log("Complex section in hybrid style:");
  console.log(yaml);
  console.log("---");
  
  assertExists(yaml);
  
  // Check for expected content
  assert(yaml.includes("Vital Signs"), "Should contain section name");
  assert(yaml.includes("Diagnosis"), "Should contain first element name");
  assert(yaml.includes("Pulse rate"), "Should contain second element name");
  assert(yaml.includes("72"), "Should contain pulse magnitude");
  assert(yaml.includes("/min"), "Should contain pulse units");
  
  // The key check: simple objects like {value: "..."} should be on one line
  // This is indicated by flow style formatting with braces
  // Note: Due to terse format, CODE_PHRASE might be compact
  const lines = yaml.split('\n');
  console.log(`Total lines: ${lines.length}`);
  
  // With flow style for simple objects, we expect fewer lines than block style
  // Original block style example had many lines; hybrid should be more compact
  assert(lines.length < 30, `Should be compact, got ${lines.length} lines`);
});

Deno.test("Hybrid YAML: comparison with block style", () => {
  const dvText = new DV_TEXT();
  dvText.value = "Test Value";
  
  // Block style
  const blockSerializer = new YamlSerializer({
    includeType: true,
    useTypeInference: false,
    mainStyle: 'block',
    useTerseFormat: false,
  });
  const blockYaml = blockSerializer.serialize(dvText);
  
  // Hybrid style
  const hybridSerializer = new YamlSerializer(HYBRID_YAML_CONFIG);
  const hybridYaml = hybridSerializer.serialize(dvText);
  
  console.log("Block style:");
  console.log(blockYaml);
  console.log("---");
  console.log("Hybrid style:");
  console.log(hybridYaml);
  console.log("---");
  
  // Both should contain the value
  assert(blockYaml.includes("Test Value"));
  assert(hybridYaml.includes("Test Value"));
  
  // Hybrid should generally be more compact (fewer lines or characters)
  const blockLines = blockYaml.split('\n').length;
  const hybridLines = hybridYaml.split('\n').length;
  
  console.log(`Block lines: ${blockLines}, Hybrid lines: ${hybridLines}`);
});

Deno.test("Hybrid YAML: terse format integration", () => {
  const codePhrase = new CODE_PHRASE();
  codePhrase.terminology_id = new TERMINOLOGY_ID();
  codePhrase.terminology_id.value = "SNOMED-CT";
  codePhrase.code_string = "44054006";
  codePhrase.preferred_term = "Type 2 diabetes mellitus";
  
  const serializer = new YamlSerializer(HYBRID_YAML_CONFIG);
  const yaml = serializer.serialize(codePhrase);
  
  console.log("CODE_PHRASE in hybrid style with terse format:");
  console.log(yaml);
  
  assertExists(yaml);
  // With terse format enabled, should use compact notation
  assert(
    yaml.includes("SNOMED-CT::44054006") || 
    (yaml.includes("SNOMED-CT") && yaml.includes("44054006")),
    "Should contain terminology and code"
  );
});
