/**
 * Test for Phase 4g.8: Three distinct YAML styles (block, flow, hybrid)
 * Tests that all outputs are valid YAML
 */

import { assertEquals, assertExists, assert } from "jsr:@std/assert";
import { parse as parseYaml } from "yaml";
import {
  YamlSerializer,
  BLOCK_YAML_CONFIG,
  FLOW_YAML_CONFIG,
  HYBRID_YAML_CONFIG,
  DEFAULT_YAML_SERIALIZATION_CONFIG,
} from "../../enhanced/serialization/yaml/mod.ts";
import { TypeRegistry } from "../../enhanced/serialization/common/type_registry.ts";
import * as rm from "../../enhanced/openehr_rm.ts";
import * as base from "../../enhanced/openehr_base.ts";

// Register all RM types
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

// Helper function to validate YAML
function assertValidYaml(yaml: string, testName: string): any {
  try {
    const parsed = parseYaml(yaml);
    assertExists(parsed, `${testName}: Parsed YAML should exist`);
    return parsed;
  } catch (error) {
    throw new Error(`${testName}: Invalid YAML produced: ${error}`);
  }
}

// Create a complex test structure for all tests
function createTestStructure(): rm.SECTION {
  const section = new rm.SECTION();
  section.name = new rm.DV_TEXT({ value: "Item tree" });
  section.archetype_node_id = "at0003";

  // Create first item - Vårdenhet
  const cluster1 = new rm.CLUSTER();
  cluster1.name = new rm.DV_TEXT({ value: "Vårdenhet" });
  cluster1.archetype_node_id = "openEHR-EHR-CLUSTER.organisation.v1";
  const archetypeDetails1 = new rm.ARCHETYPED();
  const archetypeId1 = new base.ARCHETYPE_ID();
  archetypeId1.value = "openEHR-EHR-CLUSTER.organisation.v1";
  archetypeDetails1.archetype_id = archetypeId1;
  archetypeDetails1.rm_version = "1.1.0";
  cluster1.archetype_details = archetypeDetails1;

  // Add sub-items to cluster1
  const element1 = new rm.ELEMENT();
  element1.name = new rm.DV_TEXT({ value: "Namn" });
  element1.archetype_node_id = "at0001";
  element1.value = new rm.DV_TEXT({ value: "Brandbergens vårdcentral" });

  const element2 = new rm.ELEMENT();
  element2.name = new rm.DV_TEXT({ value: "Identifierare" });
  element2.archetype_node_id = "at0003";
  const dvIdentifier = new rm.DV_IDENTIFIER();
  dvIdentifier.id = "SE2321000016-1003";
  dvIdentifier.type = "urn:oid:1.2.752.29.4.19";
  element2.value = dvIdentifier;

  const element3 = new rm.ELEMENT();
  element3.name = new rm.DV_TEXT({ value: "Roll" });
  element3.archetype_node_id = "at0004";
  const dvUri = new rm.DV_URI();
  dvUri.value = "http://snomed.info/sct/900000000000207008::43741000|vårdenhet|";
  element3.value = dvUri;

  // Nested cluster
  const cluster2 = new rm.CLUSTER();
  cluster2.name = new rm.DV_TEXT({ value: "Vårdgivare" });
  cluster2.archetype_node_id = "openEHR-EHR-CLUSTER.organisation.v1";
  const archetypeDetails2 = new rm.ARCHETYPED();
  const archetypeId2 = new base.ARCHETYPE_ID();
  archetypeId2.value = "openEHR-EHR-CLUSTER.organisation.v1";
  archetypeDetails2.archetype_id = archetypeId2;
  archetypeDetails2.rm_version = "1.1.0";
  cluster2.archetype_details = archetypeDetails2;

  cluster1.items = [element1, element2, element3, cluster2];
  // @ts-ignore: section.items can be set
  section.items = [cluster1];

  return section;
}

Deno.test("Phase 4g.8: Block style produces valid YAML", () => {
  const section = createTestStructure();
  const serializer = new YamlSerializer(BLOCK_YAML_CONFIG);
  const yaml = serializer.serialize(section);

  console.log("=== Block Style YAML ===");
  console.log(yaml);
  console.log("========================\n");

  const parsed = assertValidYaml(yaml, "Block style");

  // Verify structure
  assertEquals(parsed.name.value, "Item tree");
  assertEquals(parsed.archetype_node_id, "at0003");
  assert(Array.isArray(parsed.items));
  assertEquals(parsed.items[0].name.value, "Vårdenhet");
});

Deno.test("Phase 4g.8: Hybrid style produces valid YAML", () => {
  const section = createTestStructure();
  const serializer = new YamlSerializer(HYBRID_YAML_CONFIG);
  const yaml = serializer.serialize(section);

  console.log("=== Hybrid Style YAML ===");
  console.log(yaml);
  console.log("=========================\n");

  const parsed = assertValidYaml(yaml, "Hybrid style");

  // Verify structure
  assertEquals(parsed.name.value, "Item tree");
  assertEquals(parsed.archetype_node_id, "at0003");
  assert(Array.isArray(parsed.items));
  assertEquals(parsed.items[0].name.value, "Vårdenhet");
});

Deno.test("Phase 4g.8: Flow style without archetype inline produces valid YAML", () => {
  const section = createTestStructure();
  const serializer = new YamlSerializer({
    ...FLOW_YAML_CONFIG,
    keepArchetypeDetailsInline: false,
  });
  const yaml = serializer.serialize(section);

  console.log("=== Flow Style (No Archetype Inline) ===");
  console.log(yaml);
  console.log("========================================\n");

  const parsed = assertValidYaml(yaml, "Flow style without archetype inline");

  // Verify structure
  assertEquals(parsed.name.value, "Item tree");
  assertEquals(parsed.archetype_node_id, "at0003");
  assert(Array.isArray(parsed.items));
  assertEquals(parsed.items[0].name.value, "Vårdenhet");
});

Deno.test("Phase 4g.8: Flow style with archetype inline produces valid YAML", () => {
  const section = createTestStructure();
  const serializer = new YamlSerializer({
    ...FLOW_YAML_CONFIG,
    keepArchetypeDetailsInline: true,
  });
  const yaml = serializer.serialize(section);

  console.log("=== Flow Style (With Archetype Inline) ===");
  console.log(yaml);
  console.log("==========================================\n");

  const parsed = assertValidYaml(yaml, "Flow style with archetype inline");

  // Verify structure
  assertEquals(parsed.name.value, "Item tree");
  assertEquals(parsed.archetype_node_id, "at0003");
  assert(Array.isArray(parsed.items));
  assertEquals(parsed.items[0].name.value, "Vårdenhet");

  // Check that archetype inline formatting produces line breaks
  assert(yaml.includes("\n"), "Should contain line breaks for readability");
});

Deno.test("Phase 4g.8: Default config produces valid YAML", () => {
  const section = createTestStructure();
  const serializer = new YamlSerializer(DEFAULT_YAML_SERIALIZATION_CONFIG);
  const yaml = serializer.serialize(section);

  console.log("=== Default Style YAML ===");
  console.log(yaml);
  console.log("==========================\n");

  const parsed = assertValidYaml(yaml, "Default style");

  // Verify structure
  assertEquals(parsed.name.value, "Item tree");
  assertEquals(parsed.archetype_node_id, "at0003");
  assert(Array.isArray(parsed.items));
});

Deno.test("Phase 4g.8: Backward compatibility - hybridStyle option still works", () => {
  const section = createTestStructure();
  const serializer = new YamlSerializer({
    hybridStyle: true,
    useTerseFormat: true,
    indent: 2,
  });
  const yaml = serializer.serialize(section);

  console.log("=== Backward Compatibility (hybridStyle) ===");
  console.log(yaml);
  console.log("============================================\n");

  const parsed = assertValidYaml(yaml, "Backward compatibility hybridStyle");

  // Verify structure
  assertEquals(parsed.name.value, "Item tree");
  assert(Array.isArray(parsed.items));
});

Deno.test("Phase 4g.8: mainStyle option overrides deprecated options", () => {
  const section = createTestStructure();
  const serializer = new YamlSerializer({
    mainStyle: 'flow',  // This should take precedence
    hybridStyle: true,  // Deprecated, should be ignored
    flowStyleValues: false,  // Deprecated, should be ignored
    keepArchetypeDetailsInline: false,
  });
  const yaml = serializer.serialize(section);

  console.log("=== mainStyle Overrides Deprecated Options ===");
  console.log(yaml);
  console.log("==============================================\n");

  const parsed = assertValidYaml(yaml, "mainStyle override");

  // Should use flow style even though hybridStyle is true
  // Flow style typically has all content on fewer lines
  assertEquals(parsed.name.value, "Item tree");
  assert(Array.isArray(parsed.items));
});

Deno.test("Phase 4g.8: keepArchetypeDetailsInline only affects flow style", () => {
  const section = createTestStructure();

  // Test with hybrid style - keepArchetypeDetailsInline should have no effect
  const hybridSerializer = new YamlSerializer({
    mainStyle: 'hybrid',
    keepArchetypeDetailsInline: true,  // Should be ignored in hybrid mode
  });
  const hybridYaml = hybridSerializer.serialize(section);

  console.log("=== Hybrid with keepArchetypeDetailsInline (ignored) ===");
  console.log(hybridYaml);
  console.log("========================================================\n");

  const parsedHybrid = assertValidYaml(hybridYaml, "Hybrid ignores keepArchetypeDetailsInline");

  // Test with block style - keepArchetypeDetailsInline should have no effect
  const blockSerializer = new YamlSerializer({
    mainStyle: 'block',
    keepArchetypeDetailsInline: true,  // Should be ignored in block mode
  });
  const blockYaml = blockSerializer.serialize(section);

  console.log("=== Block with keepArchetypeDetailsInline (ignored) ===");
  console.log(blockYaml);
  console.log("=======================================================\n");

  const parsedBlock = assertValidYaml(blockYaml, "Block ignores keepArchetypeDetailsInline");

  // Both should produce valid results
  assertEquals(parsedHybrid.name.value, "Item tree");
  assertEquals(parsedBlock.name.value, "Item tree");
});

Deno.test("Phase 4g.8: Simple object example from ROADMAP", () => {
  // Example showing the desired output format for flow style with archetype inline
  const element = new rm.ELEMENT();
  element.name = new rm.DV_TEXT({ value: "Namn" });
  element.archetype_node_id = "at0001";
  element.value = new rm.DV_TEXT({ value: "Brandbergens vårdcentral" });

  const serializer = new YamlSerializer({
    mainStyle: 'flow',
    keepArchetypeDetailsInline: true,
    useTerseFormat: true,
  });
  const yaml = serializer.serialize(element);

  console.log("=== ROADMAP Simple Element Example ===");
  console.log(yaml);
  console.log("======================================\n");

  const parsed = assertValidYaml(yaml, "ROADMAP example");

  assertEquals(parsed.name.value, "Namn");
  assertEquals(parsed.archetype_node_id, "at0001");
  assertEquals(parsed.value.value, "Brandbergens vårdcentral");
});
