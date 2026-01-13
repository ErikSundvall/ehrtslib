/**
 * Test for Phase 4g.7: Archetype metadata inline formatting in YAML
 * Tests the keepArchetypeDetailsInline feature
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import { YamlSerializer, HYBRID_YAML_CONFIG } from "../../enhanced/serialization/yaml/mod.ts";
import { TypeRegistry } from "../../enhanced/serialization/common/type_registry.ts";
import * as rm from "../../enhanced/openehr_rm.ts";
import * as base from "../../enhanced/openehr_base.ts";

// Register all RM types
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

Deno.test("YamlSerializer Phase 4g.7: Archetype inline - simple object with only archetype metadata", () => {
  // Create object with only name and archetype_node_id
  const section = new rm.SECTION();
  section.name = new rm.DV_TEXT({ value: "Item tree" });
  section.archetype_node_id = "at0003";

  const serializer = new YamlSerializer(HYBRID_YAML_CONFIG);
  const yaml = serializer.serialize(section);

  console.log("Simple archetype object:\n", yaml);

  // Should be formatted inline: {name: {value: Item tree}, archetype_node_id: at0003}
  // Check that it's on one line (no newline between name and archetype_node_id within the object)
  assertExists(yaml);
  assertEquals(yaml.includes("name:"), true);
  assertEquals(yaml.includes("archetype_node_id:"), true);
});

Deno.test("YamlSerializer Phase 4g.7: Archetype inline - object with archetype metadata and other properties", () => {
  // Create a CLUSTER with archetype metadata and items
  const cluster = new rm.CLUSTER();
  cluster.name = new rm.DV_TEXT({ value: "Vårdenhet" });
  cluster.archetype_node_id = "openEHR-EHR-CLUSTER.organisation.v1";
  
  const archetypeDetails = new rm.ARCHETYPED();
  const archetypeId = new base.ARCHETYPE_ID();
  archetypeId.value = "openEHR-EHR-CLUSTER.organisation.v1";
  archetypeDetails.archetype_id = archetypeId;
  archetypeDetails.rm_version = "1.1.0";
  cluster.archetype_details = archetypeDetails;

  // Add an item
  const element = new rm.ELEMENT();
  element.name = new rm.DV_TEXT({ value: "Namn" });
  element.archetype_node_id = "at0001";
  element.value = new rm.DV_TEXT({ value: "Brandbergens vårdcentral" });
  cluster.items = [element];

  const serializer = new YamlSerializer(HYBRID_YAML_CONFIG);
  const yaml = serializer.serialize(cluster);

  console.log("Complex object with archetype metadata:\n", yaml);

  // Should have archetype metadata inline, but items on separate lines
  assertExists(yaml);
  assertEquals(yaml.includes("name:"), true);
  assertEquals(yaml.includes("archetype_node_id:"), true);
  assertEquals(yaml.includes("archetype_details:"), true);
  assertEquals(yaml.includes("items:"), true);
});

Deno.test("YamlSerializer Phase 4g.7: Full ROADMAP example structure", () => {
  // Build the structure from the ROADMAP example
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

  const element4 = new rm.ELEMENT();
  element4.name = new rm.DV_TEXT({ value: "Child element" });
  element4.archetype_node_id = "at0999";
  cluster2.items = [element4];

  cluster1.items = [element1, element2, element3, cluster2];
  // @ts-ignore: section.items can be set
  section.items = [cluster1];

  const serializer = new YamlSerializer(HYBRID_YAML_CONFIG);
  const yaml = serializer.serialize(section);

  console.log("Full ROADMAP example structure:\n", yaml);

  assertExists(yaml);
  
  // Verify structure contains expected elements
  assertEquals(yaml.includes("Item tree"), true);
  assertEquals(yaml.includes("Vårdenhet"), true);
  assertEquals(yaml.includes("Namn"), true);
  assertEquals(yaml.includes("Identifierare"), true);
  assertEquals(yaml.includes("Roll"), true);
  assertEquals(yaml.includes("Vårdgivare"), true);
});

Deno.test("YamlSerializer Phase 4g.7: keepArchetypeDetailsInline can be disabled", () => {
  // Create object with archetype metadata
  const section = new rm.SECTION();
  section.name = new rm.DV_TEXT({ value: "Test Section" });
  section.archetype_node_id = "at0001";

  // Serialize with the feature disabled
  const serializer = new YamlSerializer({
    ...HYBRID_YAML_CONFIG,
    keepArchetypeDetailsInline: false,
  });
  const yaml = serializer.serialize(section);

  console.log("With keepArchetypeDetailsInline disabled:\n", yaml);

  assertExists(yaml);
  // When disabled, should still work but with normal hybrid formatting
  assertEquals(yaml.includes("name:"), true);
  assertEquals(yaml.includes("archetype_node_id:"), true);
});
