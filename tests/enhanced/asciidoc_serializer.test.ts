/**
 * Tests for AsciiDoc serialization of openEHR RM objects
 */

import { assertEquals, assertExists, assertStringIncludes } from "jsr:@std/assert";
import { AsciidocSerializer } from "../../enhanced/serialization/asciidoc/mod.ts";
import {
  COMPACT_ASCIIDOC_CONFIG,
  LOSSLESS_ASCIIDOC_CONFIG,
} from "../../enhanced/serialization/asciidoc/mod.ts";
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

Deno.test("AsciidocSerializer: serialize simple DV_TEXT", () => {
  const dvText = new rm.DV_TEXT();
  dvText.value = "Hello AsciiDoc";

  const serializer = new AsciidocSerializer();
  const adoc = serializer.serialize(dvText);

  assertExists(adoc);
  assertStringIncludes(adoc, "Hello AsciiDoc");
  console.log("DV_TEXT as AsciiDoc:\n", adoc);
});

Deno.test("AsciidocSerializer: serialize COMPOSITION with lossless config", () => {
  const comp = createSampleComposition();

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize(comp);

  assertExists(adoc);
  // Should have document attributes
  assertStringIncludes(adoc, ":template-id: Blood Pressure Template v1");
  assertStringIncludes(adoc, ":archetype-id: openEHR-EHR-COMPOSITION.encounter.v1");
  // Should have heading
  assertStringIncludes(adoc, "= Blood Pressure Recording");
  // Should have openEHR URN comment
  assertStringIncludes(adoc, "urn:openehr:am:org.openehr::openEHR-EHR-COMPOSITION.encounter.v1");
  // Should have composer
  assertStringIncludes(adoc, ":composer: Dr. Smith");

  console.log("COMPOSITION (lossless):\n", adoc);
});

Deno.test("AsciidocSerializer: serialize COMPOSITION with compact config", () => {
  const comp = createSampleComposition();

  const serializer = new AsciidocSerializer(COMPACT_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize(comp);

  assertExists(adoc);
  // Should have heading
  assertStringIncludes(adoc, "= Blood Pressure Recording");
  // Should NOT have archetype node IDs (compact hides them)
  assertEquals(adoc.includes("// openEHR-EHR-COMPOSITION"), false);
  // Should NOT have language/territory in compact
  assertEquals(adoc.includes(":language:"), false);

  console.log("COMPOSITION (compact):\n", adoc);
});

Deno.test("AsciidocSerializer: serialize OBSERVATION with blood pressure data", () => {
  const obs = createBloodPressureObservation();

  // Lossless
  const lossless = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adocLossless = lossless.serialize(obs);
  assertExists(adocLossless);
  assertStringIncludes(adocLossless, "Blood pressure");
  assertStringIncludes(adocLossless, "Systolic");
  assertStringIncludes(adocLossless, "145");
  assertStringIncludes(adocLossless, "mm[Hg]");
  // Should include node IDs as comments
  assertStringIncludes(adocLossless, "// urn:openehr:am:org.openehr::openEHR-EHR-OBSERVATION.blood_pressure.v2");

  console.log("OBSERVATION (lossless):\n", adocLossless);

  // Compact (table rendering)
  const compact = new AsciidocSerializer(COMPACT_ASCIIDOC_CONFIG);
  const adocCompact = compact.serialize(obs);
  assertExists(adocCompact);
  assertStringIncludes(adocCompact, "Systolic");
  assertStringIncludes(adocCompact, "145");
  // Should have AsciiDoc table syntax
  assertStringIncludes(adocCompact, "|===");

  console.log("OBSERVATION (compact):\n", adocCompact);
});

Deno.test("AsciidocSerializer: serialize COMPOSITION with content", () => {
  const comp = createSampleComposition();
  const obs = createBloodPressureObservation();
  comp.content = [obs] as any;

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize(comp);

  assertExists(adoc);
  assertStringIncludes(adoc, "= Blood Pressure Recording");
  assertStringIncludes(adoc, "== Blood pressure");
  assertStringIncludes(adoc, "Systolic");
  assertStringIncludes(adoc, "145 mm[Hg]");

  console.log("Full COMPOSITION with content (lossless):\n", adoc);
});

Deno.test("AsciidocSerializer: lossless mode includes type annotations", () => {
  const obs = createBloodPressureObservation();

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize(obs);

  assertExists(adoc);
  assertStringIncludes(adoc, "_[OBSERVATION]_");

  console.log("With type annotation:\n", adoc);
});

Deno.test("AsciidocSerializer: compact mode hides type annotations", () => {
  const obs = createBloodPressureObservation();

  const serializer = new AsciidocSerializer(COMPACT_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize(obs);

  assertExists(adoc);
  assertEquals(adoc.includes("_[OBSERVATION]_"), false);
});

Deno.test("AsciidocSerializer: coded text with inline_bracket codes", () => {
  const element = createCodedElement(
    "Diagnosis", "at0001", "SNOMED-CT", "73211009", "Diabetes mellitus"
  );

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize({
    _type: 'ITEM_TREE',
    name: { value: "Items" },
    items: [element]
  });

  assertExists(adoc);
  assertStringIncludes(adoc, "Diabetes mellitus");
  assertStringIncludes(adoc, "[SNOMED-CT::73211009]");

  console.log("Coded text (lossless):\n", adoc);
});

Deno.test("AsciidocSerializer: compact mode hides codes", () => {
  const element = createCodedElement(
    "Diagnosis", "at0001", "SNOMED-CT", "73211009", "Diabetes mellitus"
  );

  const serializer = new AsciidocSerializer(COMPACT_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize({
    _type: 'ITEM_TREE',
    name: { value: "Items" },
    items: [element]
  });

  assertExists(adoc);
  assertStringIncludes(adoc, "Diabetes mellitus");
  assertEquals(adoc.includes("SNOMED-CT"), false);

  console.log("Coded text (compact):\n", adoc);
});

Deno.test("AsciidocSerializer: SECTION with nested content", () => {
  const section: any = {
    _type: 'SECTION',
    name: { value: "Vital Signs" },
    archetype_node_id: "openEHR-EHR-SECTION.vital_signs.v1",
    items: [createBloodPressureObservation()]
  };

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize(section);

  assertExists(adoc);
  assertStringIncludes(adoc, "== Vital Signs");
  assertStringIncludes(adoc, "=== Blood pressure");

  console.log("SECTION (lossless):\n", adoc);
});

Deno.test("AsciidocSerializer: CLUSTER nesting uses nested lists", () => {
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

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize(cluster);

  assertExists(adoc);
  assertStringIncludes(adoc, "*Blood Pressure*");
  assertStringIncludes(adoc, "Systolic");
  assertStringIncludes(adoc, "120 mm[Hg]");

  console.log("CLUSTER nesting:\n", adoc);
});

Deno.test("AsciidocSerializer: static serializeWith helper", () => {
  const dvText = new rm.DV_TEXT();
  dvText.value = "Quick serialize";

  const adoc = AsciidocSerializer.serializeWith(dvText, COMPACT_ASCIIDOC_CONFIG);
  assertExists(adoc);
  assertStringIncludes(adoc, "Quick serialize");
});

Deno.test("AsciidocSerializer: EVALUATION with data", () => {
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

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize(evaluation);

  assertExists(adoc);
  assertStringIncludes(adoc, "Problem/Diagnosis");
  assertStringIncludes(adoc, "Diabetes mellitus");
  assertStringIncludes(adoc, "Mild");

  console.log("EVALUATION (lossless):\n", adoc);
});

Deno.test("AsciidocSerializer: openEHR URN links in lossless mode", () => {
  const comp = createSampleComposition();
  const obs = createBloodPressureObservation();
  comp.content = [obs] as any;

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize(comp);

  assertExists(adoc);
  // Should contain URN for composition archetype
  assertStringIncludes(adoc, "urn:openehr:am:org.openehr::openEHR-EHR-COMPOSITION.encounter.v1");
  // Should contain URN for observation archetype
  assertStringIncludes(adoc, "urn:openehr:am:org.openehr::openEHR-EHR-OBSERVATION.blood_pressure.v2");
  // Should NOT contain URN for local at-codes
  assertEquals(adoc.includes("urn:openehr:am:org.openehr::at0"), false);

  console.log("openEHR URN links:\n", adoc);
});

Deno.test("AsciidocSerializer: token efficiency comparison", () => {
  const obs = createBloodPressureObservation();

  const lossless = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const compact = new AsciidocSerializer(COMPACT_ASCIIDOC_CONFIG);

  const adocLossless = lossless.serialize(obs);
  const adocCompact = compact.serialize(obs);

  console.log(`\nAsciiDoc token efficiency comparison:`);
  console.log(`  Lossless: ${adocLossless.length} chars`);
  console.log(`  Compact:  ${adocCompact.length} chars`);

  // Compact should always be shorter than lossless
  assertEquals(adocCompact.length <= adocLossless.length, true,
    `Compact (${adocCompact.length}) should be <= lossless (${adocLossless.length})`);
});

// ─── ADDITIONAL DATA TYPE TESTS ─────────────────────────────────────────

Deno.test("AsciidocSerializer: DV_STATE formatting", () => {
  const element: any = {
    _type: 'ELEMENT',
    name: { value: "Current state" },
    archetype_node_id: "at0010",
    value: {
      _type: 'DV_STATE',
      value: {
        _type: 'DV_CODED_TEXT',
        value: "active",
        defining_code: { _type: 'CODE_PHRASE', terminology_id: { value: "openehr" }, code_string: "532" }
      },
      is_terminal: false,
    }
  };

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize({ _type: 'ITEM_TREE', items: [element] });
  assertStringIncludes(adoc, "active");
  console.log("DV_STATE:\n", adoc);
});

Deno.test("AsciidocSerializer: DV_INTERVAL formatting", () => {
  const element: any = {
    _type: 'ELEMENT',
    name: { value: "Normal range" },
    archetype_node_id: "at0011",
    value: {
      _type: 'DV_INTERVAL',
      lower: { _type: 'DV_QUANTITY', magnitude: 60, units: "mm[Hg]" },
      upper: { _type: 'DV_QUANTITY', magnitude: 90, units: "mm[Hg]" },
      lower_included: true,
      upper_included: true,
    }
  };

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize({ _type: 'ITEM_TREE', items: [element] });
  assertStringIncludes(adoc, "60 mm[Hg]");
  assertStringIncludes(adoc, "90 mm[Hg]");
  assertStringIncludes(adoc, "[");
  assertStringIncludes(adoc, "]");
  console.log("DV_INTERVAL:\n", adoc);
});

Deno.test("AsciidocSerializer: DV_SCALE formatting", () => {
  const element: any = {
    _type: 'ELEMENT',
    name: { value: "Breathlessness" },
    archetype_node_id: "at0012",
    value: {
      _type: 'DV_SCALE',
      value: 3,
      symbol: {
        _type: 'DV_CODED_TEXT',
        value: "moderate",
        defining_code: { _type: 'CODE_PHRASE', terminology_id: { value: "local" }, code_string: "at0055" }
      }
    }
  };

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize({ _type: 'ITEM_TREE', items: [element] });
  assertStringIncludes(adoc, "3 - ");
  assertStringIncludes(adoc, "moderate");
  console.log("DV_SCALE:\n", adoc);
});

Deno.test("AsciidocSerializer: DV_PROPORTION types", () => {
  const createProportionElement = (name: string, num: number, den: number, type: number) => ({
    _type: 'ELEMENT',
    name: { value: name },
    archetype_node_id: "at0020",
    value: { _type: 'DV_PROPORTION', numerator: num, denominator: den, type: type }
  });

  const tree: any = {
    _type: 'ITEM_TREE',
    items: [
      createProportionElement("Ratio", 3, 4, 0),
      createProportionElement("Unitary", 0.75, 1, 1),
      createProportionElement("Percent", 75, 100, 2),
      createProportionElement("Fraction", 3, 4, 3),
    ]
  };

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize(tree);
  assertStringIncludes(adoc, "3:4");      // ratio
  assertStringIncludes(adoc, "0.75");     // unitary
  assertStringIncludes(adoc, "75%");      // percent
  assertStringIncludes(adoc, "3/4");      // fraction
  console.log("DV_PROPORTION types:\n", adoc);
});

Deno.test("AsciidocSerializer: DV_IDENTIFIER with all fields", () => {
  const element: any = {
    _type: 'ELEMENT',
    name: { value: "Patient ID" },
    archetype_node_id: "at0030",
    value: {
      _type: 'DV_IDENTIFIER',
      issuer: "NHS",
      assigner: "GP Practice",
      id: "123456789",
      type: "NHS Number",
    }
  };

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize({ _type: 'ITEM_TREE', items: [element] });
  assertStringIncludes(adoc, "NHS");
  assertStringIncludes(adoc, "GP Practice");
  assertStringIncludes(adoc, "123456789");
  assertStringIncludes(adoc, "NHS Number");
  console.log("DV_IDENTIFIER:\n", adoc);
});

Deno.test("AsciidocSerializer: DV_PARAGRAPH formatting", () => {
  const element: any = {
    _type: 'ELEMENT',
    name: { value: "Clinical narrative" },
    archetype_node_id: "at0040",
    value: {
      _type: 'DV_PARAGRAPH',
      items: [
        { _type: 'DV_TEXT', value: "Patient presents with chest pain." },
        { _type: 'DV_TEXT', value: "Pain started 2 hours ago." },
      ]
    }
  };

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize({ _type: 'ITEM_TREE', items: [element] });
  assertStringIncludes(adoc, "Patient presents with chest pain.");
  assertStringIncludes(adoc, "Pain started 2 hours ago.");
  console.log("DV_PARAGRAPH:\n", adoc);
});

Deno.test("AsciidocSerializer: DV_MULTIMEDIA with all fields", () => {
  const element: any = {
    _type: 'ELEMENT',
    name: { value: "Image" },
    archetype_node_id: "at0050",
    value: {
      _type: 'DV_MULTIMEDIA',
      media_type: { _type: 'CODE_PHRASE', code_string: "image/png" },
      size: 1024,
      alternate_text: "X-ray chest",
      uri: { _type: 'DV_URI', value: "https://example.com/xray.png" },
    }
  };

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize({ _type: 'ITEM_TREE', items: [element] });
  assertStringIncludes(adoc, "image/png");
  assertStringIncludes(adoc, "1024 bytes");
  assertStringIncludes(adoc, "X-ray chest");
  assertStringIncludes(adoc, "https://example.com/xray.png");
  console.log("DV_MULTIMEDIA:\n", adoc);
});

Deno.test("AsciidocSerializer: DV_BOOLEAN and DV_URI types", () => {
  const tree: any = {
    _type: 'ITEM_TREE',
    items: [
      {
        _type: 'ELEMENT',
        name: { value: "Is active" },
        archetype_node_id: "at0060",
        value: { _type: 'DV_BOOLEAN', value: true }
      },
      {
        _type: 'ELEMENT',
        name: { value: "Reference" },
        archetype_node_id: "at0061",
        value: { _type: 'DV_URI', value: "https://example.com/guideline" }
      },
      {
        _type: 'ELEMENT',
        name: { value: "EHR Link" },
        archetype_node_id: "at0062",
        value: { _type: 'DV_EHR_URI', value: "ehr://system/composition/12345" }
      },
    ]
  };

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize(tree);
  assertStringIncludes(adoc, "true");
  assertStringIncludes(adoc, "https://example.com/guideline");
  assertStringIncludes(adoc, "ehr://system/composition/12345");
  console.log("DV_BOOLEAN + DV_URI + DV_EHR_URI:\n", adoc);
});

Deno.test("AsciidocSerializer: DV_DATE, DV_TIME, DV_DURATION types", () => {
  const tree: any = {
    _type: 'ITEM_TREE',
    items: [
      {
        _type: 'ELEMENT',
        name: { value: "Birth date" },
        archetype_node_id: "at0070",
        value: { _type: 'DV_DATE', value: "1985-03-15" }
      },
      {
        _type: 'ELEMENT',
        name: { value: "Onset time" },
        archetype_node_id: "at0071",
        value: { _type: 'DV_TIME', value: "14:30:00" }
      },
      {
        _type: 'ELEMENT',
        name: { value: "Duration" },
        archetype_node_id: "at0072",
        value: { _type: 'DV_DURATION', value: "P3Y2M1D" }
      },
    ]
  };

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize(tree);
  assertStringIncludes(adoc, "1985-03-15");
  assertStringIncludes(adoc, "14:30:00");
  assertStringIncludes(adoc, "P3Y2M1D");
  console.log("DV_DATE + DV_TIME + DV_DURATION:\n", adoc);
});

Deno.test("AsciidocSerializer: DV_PARSABLE formatting", () => {
  const element: any = {
    _type: 'ELEMENT',
    name: { value: "Timing" },
    archetype_node_id: "at0080",
    value: {
      _type: 'DV_PARSABLE',
      value: "R5/2026-01-01T08:00:00Z/P1D",
      formalism: "timing",
    }
  };

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize({ _type: 'ITEM_TREE', items: [element] });
  assertStringIncludes(adoc, "R5/2026-01-01T08:00:00Z/P1D");
  assertStringIncludes(adoc, "timing");
  console.log("DV_PARSABLE:\n", adoc);
});

Deno.test("AsciidocSerializer: GENERIC_ENTRY handling", () => {
  const entry: any = {
    _type: 'GENERIC_ENTRY',
    name: { value: "Legacy data" },
    archetype_node_id: "openEHR-EHR-GENERIC_ENTRY.legacy.v1",
    data: {
      _type: 'ITEM_TREE',
      items: [
        { _type: 'ELEMENT', name: { value: "Note" }, archetype_node_id: "at0001", value: { _type: 'DV_TEXT', value: "Imported from old system" } }
      ]
    }
  };

  const serializer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const adoc = serializer.serialize(entry);
  assertStringIncludes(adoc, "Legacy data");
  assertStringIncludes(adoc, "Imported from old system");
  console.log("GENERIC_ENTRY:\n", adoc);
});
