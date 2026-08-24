/**
 * L10n annotation support for OPT XML (Better/AD workaround for multilingual
 * renamed/repeated archetype occurrences).
 *
 * @see https://discourse.openehr.org/t/limitation-preventing-multilingual-repeated-parts-in-the-opt-operational-template-export-format/2760
 */

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import { OptXmlSerializer } from "../../../../generation/opt_xml_serializer.ts";
import {
  extractL10nNames,
  flattenOptPathAnnotations,
  languageFromL10nKey,
  l10nAnnotationKey,
  normalizeAnnotationPath,
  setOptPathAnnotationItems,
  stripLeadingArchetypeId,
} from "../../../../generation/opt_l10n.ts";
import {
  buildWebTemplate,
  webTemplateToOpt,
} from "../../../../serialization/simplified/mod.ts";
import type { WebTemplate } from "../../../../serialization/simplified/types.ts";

Deno.test("L10n helpers - key parse/format and path normalize", () => {
  assertEquals(l10nAnnotationKey("sv"), "L10n.sv");
  assertEquals(languageFromL10nKey("L10n.sv"), "sv");
  assertEquals(languageFromL10nKey("L10n.EN"), "en");
  assertEquals(languageFromL10nKey("FHIR"), undefined);

  assertEquals(
    stripLeadingArchetypeId(
      "[openEHR-EHR-COMPOSITION.x.v1]/content[openEHR-EHR-SECTION.adhoc.v1]",
    ),
    "/content[openEHR-EHR-SECTION.adhoc.v1]",
  );
  assertEquals(
    normalizeAnnotationPath(
      "[openEHR-EHR-COMPOSITION.x.v1]/content[openEHR-EHR-SECTION.adhoc.v1,'Medication Summary']",
    ),
    "/content[openEHR-EHR-SECTION.adhoc.v1]",
  );
  assertEquals(
    extractL10nNames({
      "L10n.sv": "Utrustning",
      "L10n.en": "Equipment",
      FHIR: "Device",
    }),
    { sv: "Utrustning", en: "Equipment" },
  );
});

const SAMPLE_OPT_WITH_L10N = `<?xml version="1.0" encoding="UTF-8"?>
<template xmlns="http://schemas.openehr.org/v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <template_id><value>l10n_repeated_sections.v1</value></template_id>
  <language><code_string>en</code_string></language>
  <concept>l10n_repeated_sections</concept>
  <definition xsi:type="C_ARCHETYPE_ROOT">
    <rm_type_name>COMPOSITION</rm_type_name>
    <node_id>at0000</node_id>
    <archetype_id><value>openEHR-EHR-COMPOSITION.encounter.v1</value></archetype_id>
    <attributes xsi:type="C_MULTIPLE_ATTRIBUTE">
      <rm_attribute_name>content</rm_attribute_name>
      <children xsi:type="C_ARCHETYPE_ROOT">
        <rm_type_name>SECTION</rm_type_name>
        <node_id>at0000</node_id>
        <archetype_id><value>openEHR-EHR-SECTION.adhoc.v1</value></archetype_id>
        <term_definitions code="at0000">
          <items id="text">Medical equipment at home</items>
          <items id="description">First occurrence</items>
        </term_definitions>
      </children>
      <children xsi:type="C_ARCHETYPE_ROOT">
        <rm_type_name>SECTION</rm_type_name>
        <node_id>at0000</node_id>
        <archetype_id><value>openEHR-EHR-SECTION.adhoc.v1</value></archetype_id>
        <term_definitions code="at0000">
          <items id="text">Social situation</items>
          <items id="description">Second occurrence</items>
        </term_definitions>
      </children>
    </attributes>
    <term_definitions code="at0000">
      <items id="text">Encounter</items>
    </term_definitions>
  </definition>
  <annotations path="[openEHR-EHR-COMPOSITION.encounter.v1]/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']">
    <items id="L10n.en">Medical equipment at home</items>
    <items id="L10n.sv">Medicinsk utrustning i hemmet</items>
    <items id="L10n.fr">Équipement médical à domicile</items>
  </annotations>
  <annotations path="[openEHR-EHR-COMPOSITION.encounter.v1]/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Social situation']">
    <items id="L10n.en">Social situation</items>
    <items id="L10n.sv">Social situation</items>
    <items id="L10n.fr">Situation sociale</items>
  </annotations>
</template>
`;

Deno.test("parseOptXml - preserves L10n path annotations", () => {
  const { operationalTemplate } = parseOptXml(SAMPLE_OPT_WITH_L10N);
  const map = flattenOptPathAnnotations(operationalTemplate);
  const keys = Object.keys(map);
  assertEquals(keys.length >= 2, true);

  const first = Object.values(map).find((items) =>
    items["L10n.sv"] === "Medicinsk utrustning i hemmet"
  );
  assertExists(first);
  assertEquals(first["L10n.fr"], "Équipement médical à domicile");
});

Deno.test("OptXmlSerializer - round-trips L10n annotations", () => {
  const { operationalTemplate } = parseOptXml(SAMPLE_OPT_WITH_L10N);
  const xml = new OptXmlSerializer().serialize(operationalTemplate);
  assertStringIncludes(xml, 'id="L10n.sv"');
  assertStringIncludes(xml, "Medicinsk utrustning i hemmet");
  assertStringIncludes(xml, "<annotations");

  const reparsed = parseOptXml(xml);
  const map = flattenOptPathAnnotations(reparsed.operationalTemplate);
  const sv = Object.values(map).find((items) =>
    items["L10n.sv"] === "Medicinsk utrustning i hemmet"
  );
  assertExists(sv);
});

Deno.test("buildWebTemplate - promotes L10n annotations into localizedNames", () => {
  const { operationalTemplate } = parseOptXml(SAMPLE_OPT_WITH_L10N);
  // Annotations are keyed with name predicates; also set a path that matches
  // the builder's simpler AQL paths so promotion is exercised directly.
  setOptPathAnnotationItems(
    operationalTemplate,
    "/content[openEHR-EHR-SECTION.adhoc.v1]",
    {
      "L10n.en": "Medical equipment at home",
      "L10n.sv": "Medicinsk utrustning i hemmet",
      "L10n.fr": "Équipement médical à domicile",
    },
  );

  const wt = buildWebTemplate(operationalTemplate, { defaultLanguage: "en" });
  const section = wt.tree.children?.find((c) =>
    c.nodeId === "openEHR-EHR-SECTION.adhoc.v1"
  );
  assertExists(section);
  assertEquals(section.localizedNames?.sv, "Medicinsk utrustning i hemmet");
  assertEquals(section.localizedNames?.fr, "Équipement médical à domicile");
  assertEquals(
    (section.annotations as Record<string, string> | undefined)?.["L10n.sv"],
    "Medicinsk utrustning i hemmet",
  );
});

Deno.test("webTemplateToOpt + OptXmlSerializer - emit L10n from localizedNames", () => {
  const wt: WebTemplate = {
    templateId: "demo.v1",
    defaultLanguage: "en",
    tree: {
      id: "demo",
      rmType: "COMPOSITION",
      nodeId: "openEHR-EHR-COMPOSITION.encounter.v1",
      min: 1,
      max: 1,
      aqlPath: "/",
      localizedNames: { en: "Encounter" },
      children: [
        {
          id: "medical_equipment",
          name: "Medical equipment at home",
          rmType: "SECTION",
          nodeId: "openEHR-EHR-SECTION.adhoc.v1",
          min: 0,
          max: 1,
          aqlPath: "/content[openEHR-EHR-SECTION.adhoc.v1]",
          localizedNames: {
            en: "Medical equipment at home",
            sv: "Medicinsk utrustning i hemmet",
          },
        },
      ],
    },
  };

  const opt = webTemplateToOpt(wt);
  const map = flattenOptPathAnnotations(opt);
  assertEquals(
    map["/content[openEHR-EHR-SECTION.adhoc.v1]"]?.["L10n.sv"],
    "Medicinsk utrustning i hemmet",
  );

  const xml = new OptXmlSerializer({ l10nFromWebTemplate: wt }).serialize(opt);
  assertStringIncludes(xml, "L10n.sv");
  assertStringIncludes(xml, "Medicinsk utrustning i hemmet");
});

Deno.test("OptXmlSerializer - includeAnnotations false omits annotations", () => {
  const { operationalTemplate } = parseOptXml(SAMPLE_OPT_WITH_L10N);
  const xml = new OptXmlSerializer({ includeAnnotations: false }).serialize(
    operationalTemplate,
  );
  assertEquals(xml.includes("<annotations"), false);
});
