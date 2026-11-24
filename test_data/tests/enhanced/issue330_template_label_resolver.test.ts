/**
 * Tests for issue #330:
 * 1. Unified `OPERATIONAL_TEMPLATE` node display-label resolver
 *    (`createTemplateLabelResolver` / `resolveTemplateNodeLabel`).
 * 2. `webTemplateToOpt()` → `buildWebTemplate()` preserving per-node names &
 *    scopes on OPT2-derived Web Templates without flat `at`-code collisions or
 *    `max === 0` / generic RM fallback pollution.
 * 3. `annotationsForAqlPath()` / `buildWebTemplate()` resolving `L10n.{lang}`
 *    on renamed nodes inside repeated renamed archetypes (MedKurdag pattern).
 * 4. Better `ovl-*` overlay fallback to parent archetype term bag in
 *    `resolveTermEntry()` and `ZipEhrDisplayLocalizer`.
 */

import { assertEquals, assertExists } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import type * as openehr_base from "../../../base/openehr_base.ts";
import {
  annotationsForAqlPath,
  createTemplateLabelResolver,
  fixedNameConstraint,
  flattenOptPathAnnotations,
  isGenericRmFallbackLabel,
  type OperationalTemplateWithTermScopes,
  overlayParentScopes,
  resolveLocatableLabel,
  resolveScopeChain,
  resolveTemplateNodeLabel,
  resolveTermEntry,
  setOptPathAnnotationItems,
  TERM_ARCHETYPE_SCOPE_KEY,
  TERM_OCCURRENCE_SCOPE_KEY,
  type TermScopeMeta,
} from "../../../generation/mod.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  type WebTemplate,
  type WebTemplateNode,
  webTemplateToOpt,
} from "../../../serialization/simplified/mod.ts";
import { createZipEhrDisplayLocalizer } from "../../../serialization/zipehr/display_l10n.ts";

// ---------------------------------------------------------------------------
// 4. Better `ovl-*` overlay fallback in generation/term_scope.ts
// ---------------------------------------------------------------------------

Deno.test("#330.4: overlayParentScopes derives exact and base-concept parent keys", () => {
  assertEquals(
    overlayParentScopes("openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v2"),
    ["openEHR-EHR-OBSERVATION.blood_pressure.v2"],
  );

  // Cross-version fallback when exact version is absent from availableScopes.
  assertEquals(
    overlayParentScopes("openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v1", [
      "openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v1",
      "openEHR-EHR-OBSERVATION.blood_pressure.v2",
      "openEHR-EHR-CLUSTER.device.v1",
    ]),
    [
      "openEHR-EHR-OBSERVATION.blood_pressure.v1",
      "openEHR-EHR-OBSERVATION.blood_pressure.v2",
    ],
  );

  // Namespaced overlay derives both namespaced and bare parent keys.
  assertEquals(
    overlayParentScopes(
      "org.openehr::openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v2",
    ),
    [
      "org.openehr::openEHR-EHR-OBSERVATION.blood_pressure.v2",
      "openEHR-EHR-OBSERVATION.blood_pressure.v2",
    ],
  );

  // Occurrence scope on overlay resolves through #2 -> overlay -> parent.
  assertEquals(
    resolveScopeChain("openEHR-EHR-CLUSTER.ovl-organisation-000.v1#2", [
      "openEHR-EHR-CLUSTER.ovl-organisation-000.v1#2",
      "openEHR-EHR-CLUSTER.ovl-organisation-000.v1",
      "openEHR-EHR-CLUSTER.organisation.v1",
    ]),
    [
      "openEHR-EHR-CLUSTER.ovl-organisation-000.v1#2",
      "openEHR-EHR-CLUSTER.ovl-organisation-000.v1",
      "openEHR-EHR-CLUSTER.organisation.v1",
    ],
  );
});

Deno.test("#330.4: resolveTermEntry falls back from ovl-* overlay to parent archetype bag", () => {
  const templateTerms = {
    at0004: { text: "Wrong flat collision" },
    at9999: { text: "Unrelated flat code" },
  };
  const archetypeTerms = {
    "openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v2": {
      at0000: { text: "Home blood pressure" },
    },
    "openEHR-EHR-OBSERVATION.blood_pressure.v2": {
      at0000: { text: "Blood pressure" },
      at0004: { text: "Systolic", description: "Peak arterial pressure" },
      at0005: { text: "Diastolic" },
    },
  };

  // Code overridden in overlay wins.
  assertEquals(
    resolveLocatableLabel(
      "at0000",
      undefined,
      templateTerms,
      archetypeTerms,
      "openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v2",
    ),
    "Home blood pressure",
  );

  // Code absent from overlay falls back to parent archetype bag (not flat templateTerms).
  const systolic = resolveTermEntry(
    "at0004",
    undefined,
    templateTerms,
    archetypeTerms,
    "openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v2",
  );
  assertEquals(systolic?.text, "Systolic");
  assertEquals(systolic?.description, "Peak arterial pressure");

  // Differential overlay with no bag of its own still falls back to parent concept.
  assertEquals(
    resolveLocatableLabel(
      "at0005",
      undefined,
      templateTerms,
      archetypeTerms,
      "openEHR-EHR-OBSERVATION.ovl-blood_pressure-002.v1",
    ),
    "Diastolic",
  );

  // Unknown archetype-local code does not leak from flat templateTerms when parent bag exists.
  assertEquals(
    resolveLocatableLabel(
      "at9999",
      undefined,
      templateTerms,
      archetypeTerms,
      "openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v2",
    ),
    undefined,
  );
});

Deno.test("#330.4: ZipEhrDisplayLocalizer falls back from ovl-* overlay to parent archetype bag", () => {
  const opt = new openehr_am.OPERATIONAL_TEMPLATE() as
    & openehr_am.OPERATIONAL_TEMPLATE
    & OperationalTemplateWithTermScopes;
  opt.archetype_term_definitions = {
    "openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v2": {
      sv: { at0000: { text: "Hemblodtryck" } },
    },
    "openEHR-EHR-OBSERVATION.blood_pressure.v2": {
      sv: { at0004: { text: "Systoliskt" } },
    },
  };
  const localizer = createZipEhrDisplayLocalizer({
    renderLang: "sv",
    operationalTemplate: opt,
  });
  assertEquals(
    localizer.localizeLocatableName({
      archetypeId: "openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v2",
      nodeId: "at0004",
    }),
    "Systoliskt",
  );
});

// ---------------------------------------------------------------------------
// 3. `annotationsForAqlPath()` & `buildWebTemplate()` on MedKurdag pattern
// ---------------------------------------------------------------------------

const MEDKURDAG_STYLE_OPT = `<?xml version="1.0" encoding="UTF-8"?>
<template xmlns="http://schemas.openehr.org/v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <template_id><value>MedKurdag_test.v1</value></template_id>
  <language><code_string>sv</code_string></language>
  <concept>MedKurdag_test</concept>
  <definition xsi:type="C_ARCHETYPE_ROOT">
    <rm_type_name>COMPOSITION</rm_type_name>
    <node_id>at0000</node_id>
    <archetype_id><value>openEHR-EHR-COMPOSITION.prescription.v0</value></archetype_id>
    <attributes xsi:type="C_SINGLE_ATTRIBUTE">
      <rm_attribute_name>context</rm_attribute_name>
      <children xsi:type="C_COMPLEX_OBJECT">
        <rm_type_name>EVENT_CONTEXT</rm_type_name>
        <attributes xsi:type="C_SINGLE_ATTRIBUTE">
          <rm_attribute_name>other_context</rm_attribute_name>
          <children xsi:type="C_COMPLEX_OBJECT">
            <rm_type_name>ITEM_TREE</rm_type_name>
            <node_id>at0001</node_id>
            <attributes xsi:type="C_MULTIPLE_ATTRIBUTE">
              <rm_attribute_name>items</rm_attribute_name>
              <children xsi:type="C_ARCHETYPE_ROOT">
                <rm_type_name>CLUSTER</rm_type_name>
                <node_id>at0000</node_id>
                <archetype_id><value>openEHR-EHR-CLUSTER.organisation.v1</value></archetype_id>
                <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                  <rm_attribute_name>name</rm_attribute_name>
                  <children xsi:type="C_COMPLEX_OBJECT">
                    <rm_type_name>DV_TEXT</rm_type_name>
                    <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                      <rm_attribute_name>value</rm_attribute_name>
                      <children xsi:type="C_PRIMITIVE_OBJECT">
                        <rm_type_name>STRING</rm_type_name>
                        <item xsi:type="C_STRING"><list>Vårdenhet</list></item>
                      </children>
                    </attributes>
                  </children>
                </attributes>
                <attributes xsi:type="C_MULTIPLE_ATTRIBUTE">
                  <rm_attribute_name>items</rm_attribute_name>
                  <children xsi:type="C_ARCHETYPE_ROOT">
                    <rm_type_name>CLUSTER</rm_type_name>
                    <node_id>at0000</node_id>
                    <archetype_id><value>openEHR-EHR-CLUSTER.organisation.v1</value></archetype_id>
                    <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                      <rm_attribute_name>name</rm_attribute_name>
                      <children xsi:type="C_COMPLEX_OBJECT">
                        <rm_type_name>DV_TEXT</rm_type_name>
                        <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                          <rm_attribute_name>value</rm_attribute_name>
                          <children xsi:type="C_PRIMITIVE_OBJECT">
                            <rm_type_name>STRING</rm_type_name>
                            <item xsi:type="C_STRING"><list>Vårdgivare</list></item>
                          </children>
                        </attributes>
                      </children>
                    </attributes>
                    <attributes xsi:type="C_MULTIPLE_ATTRIBUTE">
                      <rm_attribute_name>items</rm_attribute_name>
                      <children xsi:type="C_COMPLEX_OBJECT">
                        <rm_type_name>ELEMENT</rm_type_name>
                        <node_id>at0003</node_id>
                        <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                          <rm_attribute_name>name</rm_attribute_name>
                          <children xsi:type="C_COMPLEX_OBJECT">
                            <rm_type_name>DV_TEXT</rm_type_name>
                            <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                              <rm_attribute_name>value</rm_attribute_name>
                              <children xsi:type="C_PRIMITIVE_OBJECT">
                                <rm_type_name>STRING</rm_type_name>
                                <item xsi:type="C_STRING"><list>Organisationsnummer</list></item>
                              </children>
                            </attributes>
                          </children>
                        </attributes>
                        <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                          <rm_attribute_name>value</rm_attribute_name>
                          <children xsi:type="C_COMPLEX_OBJECT">
                            <rm_type_name>DV_IDENTIFIER</rm_type_name>
                          </children>
                        </attributes>
                      </children>
                      <children xsi:type="C_COMPLEX_OBJECT">
                        <rm_type_name>ELEMENT</rm_type_name>
                        <node_id>at0003</node_id>
                        <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                          <rm_attribute_name>name</rm_attribute_name>
                          <children xsi:type="C_COMPLEX_OBJECT">
                            <rm_type_name>DV_TEXT</rm_type_name>
                            <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                              <rm_attribute_name>value</rm_attribute_name>
                              <children xsi:type="C_PRIMITIVE_OBJECT">
                                <rm_type_name>STRING</rm_type_name>
                                <item xsi:type="C_STRING"><list>HSA-id</list></item>
                              </children>
                            </attributes>
                          </children>
                        </attributes>
                        <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                          <rm_attribute_name>value</rm_attribute_name>
                          <children xsi:type="C_COMPLEX_OBJECT">
                            <rm_type_name>DV_IDENTIFIER</rm_type_name>
                          </children>
                        </attributes>
                      </children>
                    </attributes>
                    <term_definitions code="at0000">
                      <items id="text">Organisation</items>
                    </term_definitions>
                    <term_definitions code="at0003">
                      <items id="text">Identifierare</items>
                    </term_definitions>
                  </children>
                </attributes>
                <term_definitions code="at0000">
                  <items id="text">Organisation</items>
                </term_definitions>
              </children>
            </attributes>
          </children>
        </attributes>
      </children>
    </attributes>
    <term_definitions code="at0000">
      <items id="text">Ordination</items>
    </term_definitions>
  </definition>
  <component_ontologies archetype_id="openEHR-EHR-CLUSTER.organisation.v1">
    <term_definitions language="en">
      <items code="at0000"><items id="text">Organisation</items></items>
      <items code="at0003"><items id="text">Identifier</items></items>
    </term_definitions>
    <term_definitions language="sv">
      <items code="at0000"><items id="text">Organisation</items></items>
      <items code="at0003"><items id="text">Identifierare</items></items>
    </term_definitions>
  </component_ontologies>
  <annotations path="[openEHR-EHR-COMPOSITION.prescription.v0]/context/other_context[at0001]/items[openEHR-EHR-CLUSTER.organisation.v1 and name/value='Vårdenhet']/items[openEHR-EHR-CLUSTER.organisation.v1 and name/value='Vårdgivare']/items[at0003, 'Organisationsnummer']">
    <items id="L10n.en">Organisational number</items>
  </annotations>
</template>
`;

function findNode(
  root: WebTemplateNode,
  pred: (n: WebTemplateNode) => boolean,
): WebTemplateNode | undefined {
  if (pred(root)) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, pred);
    if (found) return found;
  }
  return undefined;
}

Deno.test("#330.3: annotationsForAqlPath matches MedKurdag nested Organisationsnummer despite ancestor/language mismatch", () => {
  const { operationalTemplate: opt } = parseOptXml(MEDKURDAG_STYLE_OPT);
  const map = flattenOptPathAnnotations(opt);

  const aqlPath =
    "/context/other_context[at0001]/items[openEHR-EHR-CLUSTER.organisation.v1]/items[openEHR-EHR-CLUSTER.organisation.v1]/items[at0003 and name/value='Organisationsnummer']";

  // Direct lookup with English fallback nodeName ("Identifier") still matches via leaf name/value predicate.
  const matched = annotationsForAqlPath(map, aqlPath, "Identifier");
  assertEquals(matched?.["L10n.en"], "Organisational number");

  // Sibling HSA-id must NOT accidentally receive Organisationsnummer's L10n annotation.
  const hsaPath =
    "/context/other_context[at0001]/items[openEHR-EHR-CLUSTER.organisation.v1]/items[openEHR-EHR-CLUSTER.organisation.v1]/items[at0003 and name/value='HSA-id']";
  assertEquals(annotationsForAqlPath(map, hsaPath, "Identifier"), undefined);
});

Deno.test("#330.3: buildWebTemplate resolves L10n.en='Organisational number' on MedKurdag nested Organisationsnummer", () => {
  const { operationalTemplate: opt } = parseOptXml(MEDKURDAG_STYLE_OPT);
  const wt = buildWebTemplate(opt, { languages: ["en", "sv"] });

  const orgNr = findNode(
    wt.tree,
    (n) => n.aqlPath.includes("Organisationsnummer"),
  );
  assertExists(orgNr);
  assertEquals(orgNr.name, "Organisational number");
  assertEquals(orgNr.localizedName, "Organisational number");
  assertEquals(orgNr.localizedNames?.en, "Organisational number");
  assertEquals(orgNr.localizedNames?.sv, "Organisationsnummer");

  // Sibling HSA-id keeps its own names without cross-contamination.
  const hsa = findNode(wt.tree, (n) => n.aqlPath.includes("HSA-id"));
  assertExists(hsa);
  assertEquals(hsa.name, "Identifier");
  assertEquals(hsa.localizedNames?.en, "Identifier");
  assertEquals(hsa.localizedNames?.sv, "HSA-id");
});

Deno.test("#330.3: annotationsForAqlPath disambiguates repeated renamed ancestor archetypes when ancestorNames are provided", () => {
  const map = {
    "/context/other_context[at0001]/items[openEHR-EHR-CLUSTER.organisation.v1 and name/value='Vårdenhet']/items[at0003, 'Organisationsnummer']":
      { "L10n.en": "Care unit org number" },
    "/context/other_context[at0001]/items[openEHR-EHR-CLUSTER.organisation.v1 and name/value='Beställande enhet']/items[at0003, 'Organisationsnummer']":
      { "L10n.en": "Ordering unit org number" },
  };
  const aqlPath =
    "/context/other_context[at0001]/items[openEHR-EHR-CLUSTER.organisation.v1]/items[at0003 and name/value='Organisationsnummer']";

  assertEquals(
    annotationsForAqlPath(map, aqlPath, "Identifier", {
      ancestorNames: [undefined, undefined, "Vårdenhet"],
    })?.["L10n.en"],
    "Care unit org number",
  );
  assertEquals(
    annotationsForAqlPath(map, aqlPath, "Identifier", {
      ancestorNames: [undefined, undefined, "Beställande enhet"],
    })?.["L10n.en"],
    "Ordering unit org number",
  );
});

// ---------------------------------------------------------------------------
// 2. `webTemplateToOpt()` → `buildWebTemplate()` on OPT2-derived Web Templates
// ---------------------------------------------------------------------------

Deno.test("#330.2: webTemplateToOpt → buildWebTemplate preserves OPT2 bare at-code names without collisions or max===0 pollution", () => {
  // Modeled directly on Better / AD OPT2-derived Web Templates
  // (mhv1-prenatal-visit.encounter.v1.wt.json, partogram.v1.wt.json):
  // - No `openEHR-*` nodeIds anywhere (bare at0000, at0.2, at0002.3, at0003, at0001.1)
  // - Cross-subtree reuse of at0003 ("Identifier" vs "Comment") and at0001.1 ("Name" vs "Follow up")
  // - Parent CLUSTER and child ELEMENT sharing the same at0003
  // - Leaf `/value` paths and nodes where nodeId differs from aqlPath segment or is empty
  // - Prohibited (`max === 0`) nodes with colliding at-codes and generic RM fallback names
  // - Two coded elements reusing at0001/at0002 with different option labels
  const opt2Wt: WebTemplate = {
    templateId: "mhv1-prenatal-visit.encounter.v1",
    defaultLanguage: "en",
    languages: ["en", "sv"],
    tree: {
      id: "mhv1-prenatal-visit.encounter.v1",
      name: "Prenatal visit",
      localizedName: "Prenatal visit",
      rmType: "COMPOSITION",
      nodeId: "at0000",
      min: 1,
      max: 1,
      aqlPath: "/",
      localizedNames: { en: "Prenatal visit", sv: "Mödravårdsbesök" },
      children: [
        {
          id: "context",
          name: "Context",
          rmType: "EVENT_CONTEXT",
          min: 1,
          max: 1,
          aqlPath: "/context",
          children: [
            {
              id: "care_unit",
              name: "Care unit",
              localizedName: "Care unit",
              rmType: "CLUSTER",
              // Intentionally at0000 while aqlPath has at0002.3 (common in OPT2 WTs)
              nodeId: "at0000",
              min: 0,
              max: 1,
              aqlPath: "/context/other_context[at0001]/items[at0002.3]",
              localizedNames: { en: "Care unit", sv: "Vårdenhet" },
              children: [
                {
                  id: "identifier",
                  name: "Identifier",
                  localizedName: "Identifier",
                  rmType: "DV_IDENTIFIER",
                  nodeId: "at0003",
                  min: 0,
                  max: 1,
                  aqlPath:
                    "/context/other_context[at0001]/items[at0002.3]/items[at0003]/value",
                  localizedNames: { en: "Identifier", sv: "Identifierare" },
                  inputs: [{ suffix: "id", type: "TEXT" }],
                },
                {
                  id: "name",
                  name: "Name",
                  localizedName: "Name",
                  rmType: "DV_TEXT",
                  nodeId: "at0001.1",
                  min: 0,
                  max: 1,
                  aqlPath:
                    "/context/other_context[at0001]/items[at0002.3]/items[at0001.1]/value",
                  localizedNames: { en: "Name", sv: "Namn" },
                  // Omitted inputs on DV_TEXT leaf
                },
              ],
            },
          ],
        },
        {
          id: "antenatal_section",
          name: "Antenatal assessment",
          localizedName: "Antenatal assessment",
          rmType: "SECTION",
          nodeId: "at0.2",
          min: 0,
          max: 1,
          aqlPath: "/content[at0.2]",
          localizedNames: {
            en: "Antenatal assessment",
            sv: "Mödravårdsbedömning",
          },
          children: [
            {
              id: "notes_cluster",
              name: "Clinical notes",
              localizedName: "Clinical notes",
              rmType: "CLUSTER",
              nodeId: "at0003",
              min: 0,
              max: 1,
              aqlPath: "/content[at0.2]/items[at0003]",
              localizedNames: { en: "Clinical notes", sv: "Anteckningar" },
              children: [
                {
                  id: "comment",
                  name: "Comment",
                  localizedName: "Comment",
                  rmType: "DV_TEXT",
                  nodeId: "at0003",
                  min: 0,
                  max: 1,
                  aqlPath: "/content[at0.2]/items[at0003]/items[at0003]/value",
                  localizedNames: { en: "Comment", sv: "Kommentar" },
                  inputs: [{ type: "TEXT" }],
                },
                {
                  id: "follow_up",
                  name: "Follow up",
                  localizedName: "Follow up",
                  rmType: "DV_TEXT",
                  nodeId: "at0001.1",
                  min: 0,
                  max: 1,
                  aqlPath:
                    "/content[at0.2]/items[at0003]/items[at0001.1]/value",
                  localizedNames: { en: "Follow up", sv: "Uppföljning" },
                  inputs: [{ type: "TEXT" }],
                },
                {
                  id: "smoker",
                  name: "Smoker",
                  localizedName: "Smoker",
                  rmType: "DV_CODED_TEXT",
                  nodeId: "at0010",
                  min: 0,
                  max: 1,
                  aqlPath: "/content[at0.2]/items[at0003]/items[at0010]/value",
                  localizedNames: { en: "Smoker", sv: "Rökare" },
                  inputs: [
                    {
                      suffix: "code",
                      type: "CODED_TEXT",
                      list: [
                        {
                          value: "at0001",
                          label: "Yes",
                          localizedLabels: { en: "Yes", sv: "Ja" },
                        },
                        {
                          value: "at0002",
                          label: "No",
                          localizedLabels: { en: "No", sv: "Nej" },
                        },
                      ],
                    },
                  ],
                },
                {
                  id: "laterality",
                  name: "Laterality",
                  localizedName: "Laterality",
                  rmType: "DV_CODED_TEXT",
                  nodeId: "at0011",
                  min: 0,
                  max: 1,
                  aqlPath: "/content[at0.2]/items[at0003]/items[at0011]/value",
                  localizedNames: { en: "Laterality", sv: "Sida" },
                  inputs: [
                    {
                      suffix: "code",
                      type: "CODED_TEXT",
                      list: [
                        {
                          value: "at0001",
                          label: "Left",
                          localizedLabels: { en: "Left", sv: "Vänster" },
                        },
                        {
                          value: "at0002",
                          label: "Right",
                          localizedLabels: { en: "Right", sv: "Höger" },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              // Second slot reusing at0.2 at a deeper path
              id: "birth_plan",
              name: "Birth plan",
              localizedName: "Birth plan",
              rmType: "CLUSTER",
              nodeId: "at0.2",
              min: 0,
              max: 1,
              aqlPath: "/content[at0.2]/items[at0.2]",
              localizedNames: { en: "Birth plan", sv: "Förlossningsplan" },
              children: [],
            },
            {
              // Prohibited (max === 0) node with colliding at0003 & generic RM fallback name!
              id: "prohibited_element",
              name: "element",
              localizedName: "element",
              rmType: "DV_TEXT",
              nodeId: "at0003",
              min: 0,
              max: 0,
              aqlPath: "/content[at0.2]/items[at0003]/items[at0003]/value",
              localizedNames: { en: "element", sv: "element" },
              inputs: [{ type: "TEXT" }],
            },
            {
              // Prohibited container subtree reusing at0001.1 and at0002.3
              id: "prohibited_cluster",
              name: "cluster",
              rmType: "CLUSTER",
              nodeId: "at0002.3",
              min: 0,
              max: 0,
              aqlPath: "/content[at0.2]/items[at0002.3]",
              children: [
                {
                  id: "prohibited_child",
                  name: "element",
                  rmType: "DV_TEXT",
                  nodeId: "at0001.1",
                  min: 0,
                  max: 1,
                  aqlPath:
                    "/content[at0.2]/items[at0002.3]/items[at0001.1]/value",
                  inputs: [{ type: "TEXT" }],
                },
              ],
            },
          ],
        },
      ],
    },
  };

  const opt = webTemplateToOpt(opt2Wt) as
    & openehr_am.OPERATIONAL_TEMPLATE
    & OperationalTemplateWithTermScopes;

  // Scoped definitions are populated (not empty 0 keys).
  assertEquals(
    Object.keys(opt.archetype_term_definitions ?? {}).length > 0,
    true,
  );

  // Check both with L10n enabled AND with L10n disabled (pure scoped term bags!).
  for (const applyL10nAnnotations of [true, false]) {
    const rebuilt = buildWebTemplate(opt, {
      languages: ["en", "sv"],
      applyL10nAnnotations,
    });

    const byPath = (path: string) =>
      findNode(rebuilt.tree, (n) => n.aqlPath === path && n.max !== 0);

    const careUnit = byPath("/context/other_context[at0001]/items[at0002.3]");
    assertExists(careUnit);
    assertEquals(careUnit.name, "Care unit");
    assertEquals(careUnit.localizedNames?.sv, "Vårdenhet");

    const identifier = byPath(
      "/context/other_context[at0001]/items[at0002.3]/items[at0003]",
    );
    assertExists(identifier);
    assertEquals(identifier.name, "Identifier");
    assertEquals(identifier.localizedNames?.sv, "Identifierare");

    const nameLeaf = byPath(
      "/context/other_context[at0001]/items[at0002.3]/items[at0001.1]",
    );
    assertExists(nameLeaf);
    assertEquals(nameLeaf.name, "Name");
    assertEquals(nameLeaf.localizedNames?.sv, "Namn");

    const section = byPath("/content[at0.2]");
    assertExists(section);
    assertEquals(section.name, "Antenatal assessment");
    assertEquals(section.localizedNames?.sv, "Mödravårdsbedömning");

    const birthPlan = byPath("/content[at0.2]/items[at0.2]");
    assertExists(birthPlan);
    assertEquals(birthPlan.name, "Birth plan");
    assertEquals(birthPlan.localizedNames?.sv, "Förlossningsplan");

    const notesCluster = byPath("/content[at0.2]/items[at0003]");
    assertExists(notesCluster);
    assertEquals(notesCluster.name, "Clinical notes");

    const comment = byPath("/content[at0.2]/items[at0003]/items[at0003]");
    assertExists(comment);
    assertEquals(comment.name, "Comment");
    assertEquals(comment.localizedNames?.sv, "Kommentar");

    const followUp = byPath("/content[at0.2]/items[at0003]/items[at0001.1]");
    assertExists(followUp);
    assertEquals(followUp.name, "Follow up");
    assertEquals(followUp.localizedNames?.sv, "Uppföljning");

    // Coded option labels remain isolated per element even when codes collide (at0001/at0002).
    const smoker = byPath("/content[at0.2]/items[at0003]/items[at0010]");
    assertExists(smoker);
    assertEquals(
      smoker.inputs?.find((i) => i.suffix === "code")?.list?.map((x) =>
        x.label
      ),
      ["Yes", "No"],
    );
    assertEquals(
      smoker.inputs?.find((i) => i.suffix === "code")?.list?.[0]
        ?.localizedLabels?.sv,
      "Ja",
    );

    const laterality = byPath("/content[at0.2]/items[at0003]/items[at0011]");
    assertExists(laterality);
    assertEquals(
      laterality.inputs?.find((i) => i.suffix === "code")?.list?.map((x) =>
        x.label
      ),
      ["Left", "Right"],
    );
    assertEquals(
      laterality.inputs?.find((i) => i.suffix === "code")?.list?.[0]
        ?.localizedLabels?.sv,
      "Vänster",
    );
  }
});

// ---------------------------------------------------------------------------
// 1. Unified `OPERATIONAL_TEMPLATE` node display-label resolver
// ---------------------------------------------------------------------------

function makeCObjectWithFixedName(
  rmType: string,
  nodeId: string,
  fixedName?: string,
  meta?: TermScopeMeta,
): openehr_am.C_COMPLEX_OBJECT {
  const obj = new openehr_am.C_COMPLEX_OBJECT();
  obj.rm_type_name = rmType;
  obj.node_id = nodeId;
  if (fixedName) {
    const nameAttr = new openehr_am.C_SINGLE_ATTRIBUTE();
    nameAttr.rm_attribute_name = "name";
    const dv = new openehr_am.C_COMPLEX_OBJECT();
    dv.rm_type_name = "DV_TEXT";
    const valAttr = new openehr_am.C_SINGLE_ATTRIBUTE();
    valAttr.rm_attribute_name = "value";
    const prim = new openehr_am.C_PRIMITIVE_OBJECT();
    prim.rm_type_name = "STRING";
    const cstr = new openehr_am.C_STRING();
    (cstr as { list?: string[] }).list = [fixedName];
    prim.item = cstr;
    valAttr.children = [prim];
    dv.attributes = [valAttr];
    nameAttr.children = [dv];
    obj.attributes = [nameAttr];
  }
  if (meta) {
    Object.assign(obj, meta);
  }
  return obj;
}

Deno.test("#330.1: createTemplateLabelResolver enforces full 6-tier precedence and generic fallback guard", () => {
  const opt = new openehr_am.OPERATIONAL_TEMPLATE() as
    & openehr_am.OPERATIONAL_TEMPLATE
    & OperationalTemplateWithTermScopes;
  opt.original_language = "sv" as unknown as openehr_base.Terminology_code;
  const ontology = new openehr_am.ARCHETYPE_ONTOLOGY();
  ontology.term_definitions = {
    sv: {
      at0050: { text: "Mallterm", description: "Beskrivning från mall" },
    },
    en: {
      at0050: { text: "Template term", description: "Template description" },
      at0060: { text: "English-only fallback term" },
      at0070: { text: "element" },
    },
    de: {
      at0070: { text: "Klinisches Feld" },
    },
  };
  opt.ontology = ontology;
  opt.archetype_term_definitions = {
    "openEHR-EHR-OBSERVATION.blood_pressure.v2": {
      sv: {
        at0004: { text: "Systoliskt", description: "Högsta artärtryck" },
      },
      en: {
        at0004: { text: "Systolic", description: "Peak arterial pressure" },
      },
    },
    "openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v2": {
      sv: {
        at0000: { text: "Hemblodtryck" },
      },
    },
    "openEHR-EHR-SECTION.adhoc.v1": {
      sv: { at0000: { text: "Rubrik" } },
      en: { at0000: { text: "Adhoc heading" } },
    },
  };
  opt.occurrence_term_definitions = {
    "openEHR-EHR-SECTION.adhoc.v1#2": {
      sv: { at0000: { text: "Social situation" } },
      en: { at0000: { text: "Social situation (en)" } },
    },
  };

  setOptPathAnnotationItems(
    opt,
    "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Fast namn']",
    {
      "L10n.en": "L10n English label",
      "L10n.sv": "L10n Svensk etikett",
    },
  );
  setOptPathAnnotationItems(opt, "/items[at0050]", {
    "L10n.en": "element", // generic RM fallback must NOT downgrade real clinical label
  });

  const resolver = createTemplateLabelResolver(opt, {
    languages: ["en", "sv"],
  });

  // 1. L10n.{lang} wins over fixed name constraint & occurrence scope & archetype scope
  const nodeWithL10n = makeCObjectWithFixedName(
    "SECTION",
    "at0000",
    "Fast namn",
    {
      [TERM_ARCHETYPE_SCOPE_KEY]: "openEHR-EHR-SECTION.adhoc.v1",
      [TERM_OCCURRENCE_SCOPE_KEY]: "openEHR-EHR-SECTION.adhoc.v1#2",
    },
  );
  const resL10n = resolver.resolveNode(
    nodeWithL10n,
    "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Fast namn']",
  );
  assertEquals(resL10n.label, "L10n English label");
  assertEquals(resL10n.primaryName, "L10n English label");
  assertEquals(resL10n.localizedNames?.en, "L10n English label");
  assertEquals(resL10n.localizedNames?.sv, "L10n Svensk etikett");

  // 2. Fixed name/value constraint applies in original_language ("sv")
  assertEquals(fixedNameConstraint(nodeWithL10n), "Fast namn");
  const resFixed = resolver.resolveNode(nodeWithL10n, undefined, {
    languages: ["sv", "en"],
  });
  assertEquals(resFixed.label, "Fast namn");
  assertEquals(resFixed.localizedNames?.sv, "Fast namn");
  assertEquals(resFixed.localizedNames?.en, "Social situation (en)");

  // 3. Occurrence scope (#2) beats base archetype scope
  const nodeOcc = makeCObjectWithFixedName("SECTION", "at0000", undefined, {
    [TERM_ARCHETYPE_SCOPE_KEY]: "openEHR-EHR-SECTION.adhoc.v1",
    [TERM_OCCURRENCE_SCOPE_KEY]: "openEHR-EHR-SECTION.adhoc.v1#2",
  });
  const resOcc = resolver.resolveNode(nodeOcc);
  assertEquals(resOcc.label, "Social situation (en)");
  assertEquals(resOcc.localizedNames?.sv, "Social situation");

  // 4. Archetype scope with Better ovl-* fallback to parent archetype bag
  const nodeOvlParent = makeCObjectWithFixedName(
    "ELEMENT",
    "at0004",
    undefined,
    {
      [TERM_ARCHETYPE_SCOPE_KEY]:
        "openEHR-EHR-OBSERVATION.ovl-blood_pressure-001.v2",
    },
  );
  const resOvl = resolver.resolveNode(nodeOvlParent);
  assertEquals(resOvl.label, "Systolic");
  assertEquals(resOvl.description, "Peak arterial pressure");
  assertEquals(resOvl.localizedNames, { en: "Systolic", sv: "Systoliskt" });

  // 5. Template-level ontology.term_definitions with per-code language fallback
  const nodeTplFallback = makeCObjectWithFixedName("ELEMENT", "at0060");
  const resTpl = resolveTemplateNodeLabel(opt, nodeTplFallback, undefined, {
    languages: ["sv"],
  });
  assertEquals(resTpl.label, "English-only fallback term");
  assertEquals(resTpl.primaryName, "English-only fallback term");

  // 6a. Never downgrade a real clinical label to a generic RM fallback from L10n
  const nodeNoDowngradeL10n = makeCObjectWithFixedName("ELEMENT", "at0050");
  const resNoDowngrade = resolver.resolveNode(
    nodeNoDowngradeL10n,
    "/items[at0050]",
  );
  assertEquals(resNoDowngrade.label, "Template term");
  assertEquals(resNoDowngrade.localizedNames?.en, "Template term");

  // 6b. Never downgrade a real clinical label to a generic RM fallback across languages
  const nodeNoDowngradeLang = makeCObjectWithFixedName("ELEMENT", "at0070");
  const resNoDowngradeLang = resolver.resolveNode(nodeNoDowngradeLang);
  assertEquals(resNoDowngradeLang.label, "Klinisches Feld");

  // 6c. Fallback hint is used for `label` when nothing resolves, while `primaryName` stays undefined
  const nodeUnknown = makeCObjectWithFixedName("ELEMENT", "at9876");
  const resUnknown = resolver.resolveNode(nodeUnknown, undefined, {
    fallbackHint: "element",
  });
  assertEquals(resUnknown.label, "element");
  assertEquals(resUnknown.primaryName, undefined);

  // Sanity-check isGenericRmFallbackLabel helper directly
  assertEquals(isGenericRmFallbackLabel("element", "ELEMENT"), true);
  assertEquals(isGenericRmFallbackLabel("cluster"), true);
  assertEquals(isGenericRmFallbackLabel("section"), true);
  assertEquals(isGenericRmFallbackLabel("Action"), false);
  assertEquals(isGenericRmFallbackLabel("Organisational number"), false);
});

Deno.test("#330.2: webTemplateToOpt handles openEHR-* root with colliding bare at-code subtrees and empty root aqlPath", () => {
  const mixedWt: WebTemplate = {
    templateId: "partogram.v1",
    defaultLanguage: "en",
    tree: {
      id: "partogram.v1",
      name: "Partogram",
      rmType: "COMPOSITION",
      nodeId: "openEHR-EHR-COMPOSITION.encounter.v1",
      min: 1,
      max: 1,
      aqlPath: "",
      children: [
        {
          id: "section_a",
          name: "Labour observations",
          rmType: "SECTION",
          nodeId: "at0.2",
          min: 0,
          max: 1,
          aqlPath: "/content[at0.2]",
          children: [
            {
              id: "bp",
              name: "Blood pressure",
              rmType: "OBSERVATION",
              nodeId: "at0.3",
              min: 0,
              max: 1,
              aqlPath: "/content[at0.2]/items[at0.3]",
              children: [
                {
                  id: "systolic",
                  name: "Systolic",
                  rmType: "DV_QUANTITY",
                  nodeId: "at0004",
                  min: 0,
                  max: 1,
                  aqlPath:
                    "/content[at0.2]/items[at0.3]/data[at0001]/events[at0002]/data[at0003]/items[at0004]/value",
                  inputs: [{ suffix: "magnitude", type: "DECIMAL" }],
                },
              ],
            },
            {
              id: "pulse",
              name: "Pulse",
              rmType: "OBSERVATION",
              nodeId: "at0.4",
              min: 0,
              max: 1,
              aqlPath: "/content[at0.2]/items[at0.4]",
              children: [
                {
                  id: "rate",
                  name: "Rate",
                  rmType: "DV_QUANTITY",
                  nodeId: "at0004",
                  min: 0,
                  max: 1,
                  aqlPath:
                    "/content[at0.2]/items[at0.4]/data[at0001]/events[at0002]/data[at0003]/items[at0004]/value",
                  inputs: [{ suffix: "magnitude", type: "DECIMAL" }],
                },
              ],
            },
          ],
        },
      ],
    },
  };

  const opt = webTemplateToOpt(mixedWt);
  const rebuilt = buildWebTemplate(opt, {
    languages: ["en"],
    applyL10nAnnotations: false,
  });

  const systolic = findNode(
    rebuilt.tree,
    (n) =>
      n.aqlPath ===
        "/content[at0.2]/items[at0.3]/data[at0001]/events[at0002]/data[at0003]/items[at0004]",
  );
  const rate = findNode(
    rebuilt.tree,
    (n) =>
      n.aqlPath ===
        "/content[at0.2]/items[at0.4]/data[at0001]/events[at0002]/data[at0003]/items[at0004]",
  );
  assertExists(systolic);
  assertExists(rate);
  assertEquals(systolic.name, "Systolic");
  assertEquals(rate.name, "Rate");
});

Deno.test("#330.3: buildWebTemplate disambiguates L10n on non-colliding renamed leaf under sibling renamed ancestors", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<template xmlns="http://schemas.openehr.org/v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <template_id><value>two_org_branches.v1</value></template_id>
  <language><code_string>sv</code_string></language>
  <concept>two_org_branches</concept>
  <definition xsi:type="C_ARCHETYPE_ROOT">
    <rm_type_name>COMPOSITION</rm_type_name>
    <node_id>at0000</node_id>
    <archetype_id><value>openEHR-EHR-COMPOSITION.prescription.v0</value></archetype_id>
    <attributes xsi:type="C_SINGLE_ATTRIBUTE">
      <rm_attribute_name>context</rm_attribute_name>
      <children xsi:type="C_COMPLEX_OBJECT">
        <rm_type_name>EVENT_CONTEXT</rm_type_name>
        <attributes xsi:type="C_SINGLE_ATTRIBUTE">
          <rm_attribute_name>other_context</rm_attribute_name>
          <children xsi:type="C_COMPLEX_OBJECT">
            <rm_type_name>ITEM_TREE</rm_type_name>
            <node_id>at0001</node_id>
            <attributes xsi:type="C_MULTIPLE_ATTRIBUTE">
              <rm_attribute_name>items</rm_attribute_name>
              <children xsi:type="C_ARCHETYPE_ROOT">
                <rm_type_name>CLUSTER</rm_type_name>
                <node_id>at0000</node_id>
                <archetype_id><value>openEHR-EHR-CLUSTER.organisation.v1</value></archetype_id>
                <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                  <rm_attribute_name>name</rm_attribute_name>
                  <children xsi:type="C_COMPLEX_OBJECT">
                    <rm_type_name>DV_TEXT</rm_type_name>
                    <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                      <rm_attribute_name>value</rm_attribute_name>
                      <children xsi:type="C_PRIMITIVE_OBJECT">
                        <rm_type_name>STRING</rm_type_name>
                        <item xsi:type="C_STRING"><list>Vårdenhet</list></item>
                      </children>
                    </attributes>
                  </children>
                </attributes>
                <attributes xsi:type="C_MULTIPLE_ATTRIBUTE">
                  <rm_attribute_name>items</rm_attribute_name>
                  <children xsi:type="C_COMPLEX_OBJECT">
                    <rm_type_name>ELEMENT</rm_type_name>
                    <node_id>at0003</node_id>
                    <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                      <rm_attribute_name>name</rm_attribute_name>
                      <children xsi:type="C_COMPLEX_OBJECT">
                        <rm_type_name>DV_TEXT</rm_type_name>
                        <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                          <rm_attribute_name>value</rm_attribute_name>
                          <children xsi:type="C_PRIMITIVE_OBJECT">
                            <rm_type_name>STRING</rm_type_name>
                            <item xsi:type="C_STRING"><list>Organisationsnummer</list></item>
                          </children>
                        </attributes>
                      </children>
                    </attributes>
                    <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                      <rm_attribute_name>value</rm_attribute_name>
                      <children xsi:type="C_COMPLEX_OBJECT">
                        <rm_type_name>DV_IDENTIFIER</rm_type_name>
                      </children>
                    </attributes>
                  </children>
                </attributes>
                <term_definitions code="at0000"><items id="text">Organisation</items></term_definitions>
                <term_definitions code="at0003"><items id="text">Identifierare</items></term_definitions>
              </children>
              <children xsi:type="C_ARCHETYPE_ROOT">
                <rm_type_name>CLUSTER</rm_type_name>
                <node_id>at0000</node_id>
                <archetype_id><value>openEHR-EHR-CLUSTER.organisation.v1</value></archetype_id>
                <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                  <rm_attribute_name>name</rm_attribute_name>
                  <children xsi:type="C_COMPLEX_OBJECT">
                    <rm_type_name>DV_TEXT</rm_type_name>
                    <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                      <rm_attribute_name>value</rm_attribute_name>
                      <children xsi:type="C_PRIMITIVE_OBJECT">
                        <rm_type_name>STRING</rm_type_name>
                        <item xsi:type="C_STRING"><list>Beställande enhet</list></item>
                      </children>
                    </attributes>
                  </children>
                </attributes>
                <attributes xsi:type="C_MULTIPLE_ATTRIBUTE">
                  <rm_attribute_name>items</rm_attribute_name>
                  <children xsi:type="C_COMPLEX_OBJECT">
                    <rm_type_name>ELEMENT</rm_type_name>
                    <node_id>at0003</node_id>
                    <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                      <rm_attribute_name>name</rm_attribute_name>
                      <children xsi:type="C_COMPLEX_OBJECT">
                        <rm_type_name>DV_TEXT</rm_type_name>
                        <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                          <rm_attribute_name>value</rm_attribute_name>
                          <children xsi:type="C_PRIMITIVE_OBJECT">
                            <rm_type_name>STRING</rm_type_name>
                            <item xsi:type="C_STRING"><list>Organisationsnummer</list></item>
                          </children>
                        </attributes>
                      </children>
                    </attributes>
                    <attributes xsi:type="C_SINGLE_ATTRIBUTE">
                      <rm_attribute_name>value</rm_attribute_name>
                      <children xsi:type="C_COMPLEX_OBJECT">
                        <rm_type_name>DV_IDENTIFIER</rm_type_name>
                      </children>
                    </attributes>
                  </children>
                </attributes>
                <term_definitions code="at0000"><items id="text">Organisation</items></term_definitions>
                <term_definitions code="at0003"><items id="text">Identifierare</items></term_definitions>
              </children>
            </attributes>
          </children>
        </attributes>
      </children>
    </attributes>
    <term_definitions code="at0000"><items id="text">Ordination</items></term_definitions>
  </definition>
  <component_ontologies archetype_id="openEHR-EHR-CLUSTER.organisation.v1">
    <term_definitions language="en">
      <items code="at0000"><items id="text">Organisation</items></items>
      <items code="at0003"><items id="text">Identifier</items></items>
    </term_definitions>
    <term_definitions language="sv">
      <items code="at0000"><items id="text">Organisation</items></items>
      <items code="at0003"><items id="text">Identifierare</items></items>
    </term_definitions>
  </component_ontologies>
  <annotations path="[openEHR-EHR-COMPOSITION.prescription.v0]/context/other_context[at0001]/items[openEHR-EHR-CLUSTER.organisation.v1 and name/value='Vårdenhet']/items[at0003, 'Organisationsnummer']">
    <items id="L10n.en">Care unit org number</items>
  </annotations>
  <annotations path="[openEHR-EHR-COMPOSITION.prescription.v0]/context/other_context[at0001]/items[openEHR-EHR-CLUSTER.organisation.v1 and name/value='Beställande enhet']/items[at0003, 'Organisationsnummer']">
    <items id="L10n.en">Ordering unit org number</items>
  </annotations>
</template>`;
  const { operationalTemplate: opt } = parseOptXml(xml);
  const wt = buildWebTemplate(opt, { languages: ["en", "sv"] });

  const careUnitOrgNr = findNode(
    wt.tree,
    (n) =>
      n.aqlPath.includes("Vårdenhet") && n.aqlPath.endsWith("/items[at0003]"),
  );
  const orderingUnitOrgNr = findNode(
    wt.tree,
    (n) =>
      n.aqlPath.includes("Beställande enhet") &&
      n.aqlPath.endsWith("/items[at0003]"),
  );
  assertExists(careUnitOrgNr);
  assertExists(orderingUnitOrgNr);
  assertEquals(careUnitOrgNr.name, "Care unit org number");
  assertEquals(careUnitOrgNr.localizedNames?.sv, "Organisationsnummer");
  assertEquals(orderingUnitOrgNr.name, "Ordering unit org number");
  assertEquals(orderingUnitOrgNr.localizedNames?.sv, "Organisationsnummer");
});
