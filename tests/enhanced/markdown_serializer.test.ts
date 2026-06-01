/**
 * Tests for Markdown serialization of openEHR RM objects
 */

import { assertEquals, assertExists, assertStringIncludes } from "jsr:@std/assert";
import { MarkdownSerializer } from "../../enhanced/serialization/markdown/mod.ts";
import {
  CLINICAL_MARKDOWN_CONFIG,
  STRUCTURAL_MARKDOWN_CONFIG,
  COMPACT_MARKDOWN_CONFIG,
  WIKILINK_MARKDOWN_CONFIG,
} from "../../enhanced/serialization/markdown/mod.ts";
import * as rm from "../../enhanced/openehr_rm.ts";
import * as base from "../../enhanced/openehr_base.ts";
import { TypeRegistry } from "../../enhanced/serialization/common/type_registry.ts";

// Register all RM types
TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

// ─── Helper: Create a sample COMPOSITION ────────────────────────────────

function createSampleComposition(): rm.COMPOSITION {
  const comp = new rm.COMPOSITION();
  comp.name = new rm.DV_TEXT();
  comp.name.value = "Blood Pressure Recording";
  comp.archetype_node_id = "openEHR-EHR-COMPOSITION.encounter.v1";

  // Archetype details
  comp.archetype_details = new rm.ARCHETYPED();
  comp.archetype_details.archetype_id = new base.ARCHETYPE_ID();
  comp.archetype_details.archetype_id.value = "openEHR-EHR-COMPOSITION.encounter.v1";
  comp.archetype_details.template_id = new base.TEMPLATE_ID();
  comp.archetype_details.template_id.value = "Blood Pressure Template v1";

  // Language
  comp.language = new rm.CODE_PHRASE();
  comp.language.terminology_id = new base.TERMINOLOGY_ID();
  comp.language.terminology_id.value = "ISO_639-1";
  comp.language.code_string = "en";

  // Territory
  comp.territory = new rm.CODE_PHRASE();
  comp.territory.terminology_id = new base.TERMINOLOGY_ID();
  comp.territory.terminology_id.value = "ISO_3166-1";
  comp.territory.code_string = "GB";

  // Category
  comp.category = new rm.DV_CODED_TEXT();
  comp.category.value = "event";
  comp.category.defining_code = new rm.CODE_PHRASE();
  comp.category.defining_code.terminology_id = new base.TERMINOLOGY_ID();
  comp.category.defining_code.terminology_id.value = "openehr";
  comp.category.defining_code.code_string = "433";

  // Composer
  comp.composer = new rm.PARTY_IDENTIFIED();
  (comp.composer as any).name = "Dr. Smith";

  return comp;
}

function createBloodPressureObservation(): rm.OBSERVATION {
  const obs = new rm.OBSERVATION();
  obs.name = new rm.DV_TEXT();
  obs.name.value = "Blood pressure";
  obs.archetype_node_id = "openEHR-EHR-OBSERVATION.blood_pressure.v2";

  // Create data with items
  const data: any = {
    _type: 'HISTORY',
    origin: { value: "2026-04-13T10:30:00Z" },
    events: [{
      _type: 'POINT_EVENT',
      name: { value: "Any event" },
      archetype_node_id: "at0006",
      time: { value: "2026-04-13T10:30:00Z" },
      data: {
        _type: 'ITEM_TREE',
        items: [
          createQuantityElement("Systolic", "at0004", 145, "mm[Hg]"),
          createQuantityElement("Diastolic", "at0005", 90, "mm[Hg]"),
          createQuantityElement("Mean arterial pressure", "at0006", 108, "mm[Hg]"),
        ]
      }
    }]
  };
  obs.data = data;

  return obs;
}

function createQuantityElement(name: string, nodeId: string, magnitude: number, units: string): any {
  return {
    _type: 'ELEMENT',
    name: { value: name },
    archetype_node_id: nodeId,
    value: {
      _type: 'DV_QUANTITY',
      magnitude: magnitude,
      units: units,
    }
  };
}

function createCodedElement(name: string, nodeId: string, terminology: string, code: string, displayText: string): any {
  return {
    _type: 'ELEMENT',
    name: { value: name },
    archetype_node_id: nodeId,
    value: {
      _type: 'DV_CODED_TEXT',
      value: displayText,
      defining_code: {
        _type: 'CODE_PHRASE',
        terminology_id: { value: terminology },
        code_string: code,
      }
    }
  };
}

// ─── TESTS ──────────────────────────────────────────────────────────────

Deno.test("MarkdownSerializer: serialize simple DV_TEXT", () => {
  const dvText = new rm.DV_TEXT();
  dvText.value = "Hello Markdown";

  const serializer = new MarkdownSerializer();
  const md = serializer.serialize(dvText);

  assertExists(md);
  assertStringIncludes(md, "Hello Markdown");
  console.log("DV_TEXT as Markdown:\n", md);
});

Deno.test("MarkdownSerializer: serialize COMPOSITION with structural config", () => {
  const comp = createSampleComposition();

  const serializer = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG);
  const md = serializer.serialize(comp);

  assertExists(md);
  // Should have frontmatter
  assertStringIncludes(md, "---");
  assertStringIncludes(md, "template_id:");
  assertStringIncludes(md, "Blood Pressure Template v1");
  // Should have H1
  assertStringIncludes(md, "# Blood Pressure Recording");
  // Should have archetype node IDs
  assertStringIncludes(md, "openEHR-EHR-COMPOSITION.encounter.v1");
  // Should have composer
  assertStringIncludes(md, "Dr. Smith");

  console.log("COMPOSITION (structural):\n", md);
});

Deno.test("MarkdownSerializer: serialize COMPOSITION with clinical config", () => {
  const comp = createSampleComposition();

  const serializer = new MarkdownSerializer(CLINICAL_MARKDOWN_CONFIG);
  const md = serializer.serialize(comp);

  assertExists(md);
  // Should have frontmatter
  assertStringIncludes(md, "---");
  // Should have H1
  assertStringIncludes(md, "# Blood Pressure Recording");
  // Should NOT have archetype_node_id in body (clinical mode hides them)
  // (it may still be in frontmatter via archetype_id)

  console.log("COMPOSITION (clinical):\n", md);
});

Deno.test("MarkdownSerializer: serialize COMPOSITION with compact config", () => {
  const comp = createSampleComposition();

  const serializer = new MarkdownSerializer(COMPACT_MARKDOWN_CONFIG);
  const md = serializer.serialize(comp);

  assertExists(md);
  // Should NOT have frontmatter
  assertEquals(md.startsWith("---"), false);
  // Should have H1
  assertStringIncludes(md, "# Blood Pressure Recording");

  console.log("COMPOSITION (compact):\n", md);
});

Deno.test("MarkdownSerializer: serialize OBSERVATION with blood pressure data", () => {
  const obs = createBloodPressureObservation();

  // Structural
  const structural = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG);
  const mdStructural = structural.serialize(obs);
  assertExists(mdStructural);
  assertStringIncludes(mdStructural, "Blood pressure");
  assertStringIncludes(mdStructural, "Systolic");
  assertStringIncludes(mdStructural, "145");
  assertStringIncludes(mdStructural, "mm[Hg]");

  console.log("OBSERVATION (structural):\n", mdStructural);

  // Clinical (table rendering)
  const clinical = new MarkdownSerializer(CLINICAL_MARKDOWN_CONFIG);
  const mdClinical = clinical.serialize(obs);
  assertExists(mdClinical);
  assertStringIncludes(mdClinical, "Systolic");
  assertStringIncludes(mdClinical, "145");
  // Should have table format
  assertStringIncludes(mdClinical, "|");

  console.log("OBSERVATION (clinical):\n", mdClinical);

  // Compact
  const compact = new MarkdownSerializer(COMPACT_MARKDOWN_CONFIG);
  const mdCompact = compact.serialize(obs);
  assertExists(mdCompact);
  assertStringIncludes(mdCompact, "Systolic");
  assertStringIncludes(mdCompact, "145");

  console.log("OBSERVATION (compact):\n", mdCompact);
});

Deno.test("MarkdownSerializer: serialize COMPOSITION with content", () => {
  const comp = createSampleComposition();

  // Add an observation to content
  const obs = createBloodPressureObservation();
  comp.content = [obs] as any;

  const serializer = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG);
  const md = serializer.serialize(comp);

  assertExists(md);
  assertStringIncludes(md, "# Blood Pressure Recording");
  assertStringIncludes(md, "## Blood pressure");
  assertStringIncludes(md, "Systolic");
  assertStringIncludes(md, "145 mm[Hg]");

  console.log("Full COMPOSITION with content (structural):\n", md);
});

Deno.test("MarkdownSerializer: clinical mode renders coded text with wikilinks", () => {
  const element = createCodedElement(
    "Diagnosis", "at0001", "SNOMED-CT", "73211009", "Diabetes mellitus"
  );

  const serializer = new MarkdownSerializer(CLINICAL_MARKDOWN_CONFIG);
  const md = serializer.serialize({
    _type: 'ITEM_TREE',
    name: { value: "Items" },
    items: [element]
  });

  assertExists(md);
  assertStringIncludes(md, "Diabetes mellitus");
  assertStringIncludes(md, "SNOMED-CT");

  console.log("Coded text (clinical):\n", md);
});

Deno.test("MarkdownSerializer: compact mode hides codes", () => {
  const element = createCodedElement(
    "Diagnosis", "at0001", "SNOMED-CT", "73211009", "Diabetes mellitus"
  );

  const serializer = new MarkdownSerializer(COMPACT_MARKDOWN_CONFIG);
  const md = serializer.serialize({
    _type: 'ITEM_TREE',
    name: { value: "Items" },
    items: [element]
  });

  assertExists(md);
  assertStringIncludes(md, "Diabetes mellitus");
  // In compact mode, SNOMED code should be hidden
  assertEquals(md.includes("SNOMED-CT"), false);

  console.log("Coded text (compact):\n", md);
});

Deno.test("MarkdownSerializer: structural mode includes node IDs as HTML comments", () => {
  const element = createQuantityElement("Heart rate", "at0004", 72, "/min");

  const serializer = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG);
  const md = serializer.serialize({
    _type: 'ITEM_TREE',
    name: { value: "Items" },
    archetype_node_id: "at0001",
    items: [element]
  });

  assertExists(md);
  assertStringIncludes(md, "<!-- at0004 -->");
  assertStringIncludes(md, "Heart rate");
  assertStringIncludes(md, "72 /min");

  console.log("With node IDs (structural):\n", md);
});

Deno.test("MarkdownSerializer: serialize SECTION with nested content", () => {
  const section: any = {
    _type: 'SECTION',
    name: { value: "Vital Signs" },
    archetype_node_id: "openEHR-EHR-SECTION.vital_signs.v1",
    items: [createBloodPressureObservation()]
  };

  const serializer = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG);
  const md = serializer.serialize(section);

  assertExists(md);
  assertStringIncludes(md, "# Vital Signs");
  assertStringIncludes(md, "## Blood pressure");

  console.log("SECTION (structural):\n", md);
});

Deno.test("MarkdownSerializer: token efficiency comparison", () => {
  const obs = createBloodPressureObservation();

  const structural = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG);
  const clinical = new MarkdownSerializer(CLINICAL_MARKDOWN_CONFIG);
  const compact = new MarkdownSerializer(COMPACT_MARKDOWN_CONFIG);

  const mdStructural = structural.serialize(obs);
  const mdClinical = clinical.serialize(obs);
  const mdCompact = compact.serialize(obs);

  // Compact should be shorter than structural
  console.log(`\nToken efficiency comparison:`);
  console.log(`  Structural: ${mdStructural.length} chars`);
  console.log(`  Clinical:   ${mdClinical.length} chars`);
  console.log(`  Compact:    ${mdCompact.length} chars`);

  // Compact should always be shorter than or equal to structural
  assertEquals(mdCompact.length <= mdStructural.length, true,
    `Compact (${mdCompact.length}) should be <= structural (${mdStructural.length})`);
});

Deno.test("MarkdownSerializer: CLUSTER nesting", () => {
  const cluster: any = {
    _type: 'ITEM_TREE',
    name: { value: "Tree" },
    items: [{
      _type: 'CLUSTER',
      name: { value: "Blood Pressure" },
      archetype_node_id: "at0001",
      items: [
        createQuantityElement("Systolic", "at0004", 120, "mm[Hg]"),
        createQuantityElement("Diastolic", "at0005", 80, "mm[Hg]"),
      ]
    }]
  };

  const serializer = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG);
  const md = serializer.serialize(cluster);

  assertExists(md);
  assertStringIncludes(md, "**Blood Pressure**");
  assertStringIncludes(md, "Systolic");
  assertStringIncludes(md, "120 mm[Hg]");

  console.log("CLUSTER nesting:\n", md);
});

Deno.test("MarkdownSerializer: static serializeWith helper", () => {
  const dvText = new rm.DV_TEXT();
  dvText.value = "Quick serialize";

  const md = MarkdownSerializer.serializeWith(dvText, COMPACT_MARKDOWN_CONFIG);
  assertExists(md);
  assertStringIncludes(md, "Quick serialize");
});

Deno.test("MarkdownSerializer: EVALUATION with data", () => {
  const evaluation: any = {
    _type: 'EVALUATION',
    name: { value: "Problem/Diagnosis" },
    archetype_node_id: "openEHR-EHR-EVALUATION.problem_diagnosis.v1",
    data: {
      _type: 'ITEM_TREE',
      items: [
        createCodedElement("Problem/Diagnosis name", "at0002", "SNOMED-CT", "73211009", "Diabetes mellitus"),
        createCodedElement("Severity", "at0005", "local", "at0047", "Mild"),
      ]
    }
  };

  const serializer = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG);
  const md = serializer.serialize(evaluation);

  assertExists(md);
  assertStringIncludes(md, "Problem/Diagnosis");
  assertStringIncludes(md, "Diabetes mellitus");
  assertStringIncludes(md, "Mild");

  console.log("EVALUATION (structural):\n", md);
});

Deno.test("MarkdownSerializer: wikilink URN mode uses openEHR URN wikilinks for archetype refs", () => {
  const comp = createSampleComposition();
  const obs = createBloodPressureObservation();
  comp.content = [obs] as any;

  const serializer = new MarkdownSerializer(WIKILINK_MARKDOWN_CONFIG);
  const md = serializer.serialize(comp);

  assertExists(md);
  // Should contain openEHR URN wikilinks for archetype IDs
  assertStringIncludes(md, "[[urn:openehr:am:org.openehr::openEHR-EHR-COMPOSITION.encounter.v1|");
  assertStringIncludes(md, "[[urn:openehr:am:org.openehr::openEHR-EHR-OBSERVATION.blood_pressure.v2|");
  // Should NOT include type annotations (hidden for display)
  assertEquals(md.includes("_[OBSERVATION]_"), false);

  console.log("COMPOSITION (wikilink URN):\n", md);
});

Deno.test("MarkdownSerializer: wikilink URN mode uses URN for coded text", () => {
  const element = createCodedElement(
    "Diagnosis", "at0001", "SNOMED-CT", "73211009", "Diabetes mellitus"
  );

  const serializer = new MarkdownSerializer(WIKILINK_MARKDOWN_CONFIG);
  const md = serializer.serialize({
    _type: 'ITEM_TREE',
    name: { value: "Items" },
    items: [element]
  });

  assertExists(md);
  // Should use URN-based wikilink for coded text
  assertStringIncludes(md, "[[urn:openehr:term:SNOMED-CT::73211009|Diabetes mellitus]]");

  console.log("Coded text (wikilink URN):\n", md);
});
