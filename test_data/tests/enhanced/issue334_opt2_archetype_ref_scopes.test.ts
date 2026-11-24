/**
 * Regression tests for #334:
 * OPT2 flattened definition nodes must preserve `C_ARCHETYPE_ROOT` /
 * `archetype_ref` / term scopes linking to `component_terminologies` across
 * flattening, OPT2 serialization, OPT2 parsing, `applyOperationalTemplateTermScopes`,
 * `createTemplateLabelResolver`, and `buildWebTemplate`.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import { parseTemplateInput } from "../../../parser/mod.ts";
import { ArchetypeRepository } from "../../../parser/legacy/archetype_repository.ts";
import {
  createTemplateLabelResolver,
  isPathArchetypeRef,
  OPT2Serializer,
  TERM_ARCHETYPE_SCOPE_KEY,
  TERM_NAME_FALLBACK_NODE_ID_KEY,
  termCodeCandidates,
  type TermScopeMeta,
} from "../../../generation/mod.ts";
import { buildWebTemplate } from "../../../serialization/simplified/mod.ts";
import type { WebTemplateNode } from "../../../serialization/simplified/types.ts";

function findCObjects(
  root: openehr_am.C_OBJECT | undefined,
  pred: (obj: openehr_am.C_OBJECT) => boolean,
  out: openehr_am.C_OBJECT[] = [],
): openehr_am.C_OBJECT[] {
  if (!root) return out;
  if (pred(root)) out.push(root);
  if (root instanceof openehr_am.C_COMPLEX_OBJECT) {
    for (const attr of root.attributes ?? []) {
      const children = (attr as { children?: openehr_am.C_OBJECT[] }).children ??
        [];
      for (const child of children) findCObjects(child, pred, out);
    }
  }
  return out;
}

function findWebNodes(
  root: WebTemplateNode,
  pred: (node: WebTemplateNode) => boolean,
  out: WebTemplateNode[] = [],
): WebTemplateNode[] {
  if (pred(root)) out.push(root);
  for (const child of root.children ?? []) findWebNodes(child, pred, out);
  return out;
}

Deno.test("#334: termCodeCandidates steps through multi-level specialized parent codes", () => {
  assertEquals(termCodeCandidates("at0011.1"), ["at0011.1", "at0011"]);
  assertEquals(termCodeCandidates("at0011.1.2"), [
    "at0011.1.2",
    "at0011.1",
    "at0011",
  ]);
  assertEquals(termCodeCandidates("at0000.1.1"), [
    "at0000.1.1",
    "at0000.1",
    "at0000",
  ]);
  const idCands = termCodeCandidates("id11.1.2");
  assert(idCands.includes("id11.1.2"));
  assert(idCands.includes("id11.1"));
  assert(idCands.includes("id11"));
  assert(idCands.includes("at0010.1.2"));
  assert(idCands.includes("at0010.1"));
  assert(idCands.includes("at0010"));
});

Deno.test("#334: isPathArchetypeRef distinguishes OPT 1.4 roots from slot/overlay/nested-template roots", () => {
  const opt14Root = new openehr_am.C_ARCHETYPE_ROOT();
  opt14Root.node_id = "at0000";
  opt14Root.archetype_ref = "openEHR-EHR-OBSERVATION.blood_pressure.v2";
  assertEquals(isPathArchetypeRef(opt14Root), true);

  const idCodedOpt14Root = new openehr_am.C_ARCHETYPE_ROOT();
  idCodedOpt14Root.node_id = "id1";
  idCodedOpt14Root.archetype_ref = "openEHR-EHR-OBSERVATION.blood_pressure.v2";
  assertEquals(isPathArchetypeRef(idCodedOpt14Root), true);

  const ovlRoot = new openehr_am.C_ARCHETYPE_ROOT();
  ovlRoot.node_id = "at0.6";
  ovlRoot.archetype_ref = "openEHR-EHR-SECTION.ovl-adhoc-003.v1";
  assertEquals(isPathArchetypeRef(ovlRoot), false);

  const nestedTemplateRoot = new openehr_am.C_ARCHETYPE_ROOT();
  nestedTemplateRoot.node_id = "at0002.3";
  nestedTemplateRoot.archetype_ref = "Care unit v2";
  assertEquals(isPathArchetypeRef(nestedTemplateRoot), false);

  const slotCodedStandard = new openehr_am.C_ARCHETYPE_ROOT();
  slotCodedStandard.node_id = "id2.1";
  slotCodedStandard.archetype_ref = "openEHR-EHR-OBSERVATION.faeces.v1";
  assertEquals(isPathArchetypeRef(slotCodedStandard), false);
});

Deno.test("#334: parseTemplateInput on OPT2 preserves use_archetype scopes, quoted/spaced/namespaced refs, overlay root fallbacks, and specialized parent codes", () => {
  const opt2 = `operational_template (adl_version=2.4.0; rm_release=1.0.4)
    MHV1-_Prenatal_visit.encounter.v1

specialize
    openEHR-EHR-COMPOSITION.encounter.v1

language
    original_language = <[ISO_639-1::en]>

definition
    COMPOSITION[at0000.1] matches {
        context matches {
            EVENT_CONTEXT matches {
                other_context matches {
                    ITEM_TREE[at0001] matches {
                        items cardinality matches {0..*} matches {
                            use_archetype CLUSTER[at0002.3, "Care unit v2"] occurrences matches {0..1} matches {
                                items cardinality matches {1..*; unordered} matches {
                                    ELEMENT[at0001.1] occurrences matches {1..1} matches {
                                        value matches {
                                            DV_TEXT
                                        }
                                    }
                                    use_archetype CLUSTER[at0021.1, openEHR-EHR-CLUSTER.ovl-organisation-001.v1] occurrences matches {0..1} matches {
                                        items cardinality matches {1..*; unordered} matches {
                                            ELEMENT[at0003.1] occurrences matches {0..1} matches {
                                                value matches {
                                                    DV_TEXT
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        content existence matches {0..1} matches {
            use_archetype SECTION[at0.6, openEHR-EHR-SECTION.ovl-adhoc-003.v1] occurrences matches {0..1} matches {
                items existence matches {0..1} matches {
                    use_archetype OBSERVATION[at0.2, org.openehr::openEHR-EHR-OBSERVATION.ovl-body_weight-001.v2] occurrences matches {0..1} matches {
                        data matches {
                            HISTORY[at0002] matches {
                                events cardinality matches {0..*} matches {
                                    POINT_EVENT[at0003.1] occurrences matches {0..1} matches {
                                        data matches {
                                            ITEM_TREE[at0001.1] matches {
                                                items cardinality matches {0..*} matches {
                                                    ELEMENT[at0004.1] occurrences matches {0..1} matches {
                                                        value matches {
                                                            DV_QUANTITY
                                                        }
                                                    }
                                                    ELEMENT[at0011.1] occurrences matches {0..1} matches {
                                                        value matches {
                                                            DV_TEXT
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            use_archetype SECTION[at0.20, openEHR-EHR-SECTION.ovl-adhoc-009.v1] occurrences matches {0..1} matches {
                items existence matches {0..1} matches {
                    use_archetype CLUSTER[at0005.2, openEHR-EHR-CLUSTER.ovl-exam-uterus-001.v0] occurrences matches {0..1} matches {
                        items cardinality matches {0..*} matches {
                            ELEMENT[at0.1.1] occurrences matches {0..1} matches {
                                value matches {
                                    DV_TEXT
                                }
                            }
                        }
                    }
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["at0000"] = <
                text = <"Encounter">
            >
            ["at0000.1"] = <
                text = <"MHV1- Encounter.v1">
            >
            ["at0001"] = <
                text = <"Tree">
            >
        >
        ["sv"] = <
            ["at0000"] = <
                text = <"Vårdkontakt">
            >
            ["at0000.1"] = <
                text = <"MHV1- Vårdkontakt.v1">
            >
            ["at0001"] = <
                text = <"Tree">
            >
        >
    >

component_terminologies
    <
        ["Care unit v2"] = <
            term_definitions = <
                ["en"] = <
                    ["at0000"] = <
                        text = <"Organisation">
                    >
                    ["at0000.1"] = <
                        text = <"Care unit">
                    >
                    ["at0001"] = <
                        text = <"Name">
                    >
                >
                ["sv"] = <
                    ["at0000"] = <
                        text = <"Organisation">
                    >
                    ["at0000.1"] = <
                        text = <"Vårdenhet">
                    >
                    ["at0001"] = <
                        text = <"Namn">
                    >
                >
            >
        >
        ["openEHR-EHR-CLUSTER.ovl-organisation-001.v1"] = <
            term_definitions = <
                ["en"] = <
                    ["at0000"] = <
                        text = <"Organisation">
                    >
                    ["at0000.1"] = <
                        text = <"Care provider">
                    >
                    ["at0003"] = <
                        text = <"Identifier">
                    >
                    ["at0021"] = <
                        text = <"Parent organisation">
                    >
                >
                ["sv"] = <
                    ["at0000"] = <
                        text = <"Organisation">
                    >
                    ["at0000.1"] = <
                        text = <"Vårdgivare">
                    >
                    ["at0003"] = <
                        text = <"Identifierare">
                    >
                    ["at0021"] = <
                        text = <"Överordnad organisation">
                    >
                >
            >
        >
        ["openEHR-EHR-SECTION.ovl-adhoc-003.v1"] = <
            term_definitions = <
                ["en"] = <
                    ["at0000"] = <
                        text = <"Ad hoc heading">
                    >
                    ["at0000.1"] = <
                        text = <"General information">
                    >
                >
                ["sv"] = <
                    ["at0000"] = <
                        text = <"Rubrik">
                    >
                    ["at0000.1"] = <
                        text = <"Allmän information">
                    >
                >
            >
        >
        ["openEHR-EHR-SECTION.ovl-adhoc-009.v1"] = <
            term_definitions = <
                ["en"] = <
                    ["at0000"] = <
                        text = <"Ad hoc heading">
                    >
                    ["at0000.1"] = <
                        text = <"Social summary">
                    >
                >
                ["sv"] = <
                    ["at0000"] = <
                        text = <"Rubrik">
                    >
                    ["at0000.1"] = <
                        text = <"Sociala förhållanden">
                    >
                >
            >
        >
        ["org.openehr::openEHR-EHR-OBSERVATION.ovl-body_weight-001.v2"] = <
            term_definitions = <
                ["en"] = <
                    ["at0000"] = <
                        text = <"Body weight">
                    >
                    ["at0000.1"] = <
                        text = <"Maternal weight">
                    >
                    ["at0004"] = <
                        text = <"Weight">
                    >
                    ["at0011"] = <
                        text = <"Comment">
                    >
                >
                ["sv"] = <
                    ["at0000"] = <
                        text = <"Kroppsvikt">
                    >
                    ["at0000.1"] = <
                        text = <"Moderns vikt">
                    >
                    ["at0004"] = <
                        text = <"Vikt">
                    >
                    ["at0011"] = <
                        text = <"Kommentar">
                    >
                >
            >
        >
        ["openEHR-EHR-CLUSTER.ovl-exam-uterus-001.v0"] = <
            term_definitions = <
                ["en"] = <
                    ["at0000"] = <
                        text = <"Examination findings">
                    >
                    ["at0000.1"] = <
                        text = <"Examination of the uterus">
                    >
                    ["at0000.1.1"] = <
                        text = <"Uterus examination">
                    >
                    ["at0.1"] = <
                        text = <"Length">
                    >
                >
                ["sv"] = <
                    ["at0000"] = <
                        text = <"Undersökningsfynd">
                    >
                    ["at0000.1.1"] = <
                        text = <"Uterusundersökning">
                    >
                    ["at0.1"] = <
                        text = <"Längd">
                    >
                >
            >
        >
    >
`;

  const parsed = parseTemplateInput(opt2);
  assertEquals(parsed.warnings, []);
  const opt = parsed.operationalTemplate!;
  assert(opt.definition);

  const archRoots = findCObjects(
    opt.definition,
    (n) => n instanceof openehr_am.C_ARCHETYPE_ROOT,
  ) as openehr_am.C_ARCHETYPE_ROOT[];
  assertEquals(archRoots.length, 6);
  assertEquals(
    archRoots.map((r) => r.archetype_ref),
    [
      "Care unit v2",
      "openEHR-EHR-CLUSTER.ovl-organisation-001.v1",
      "openEHR-EHR-SECTION.ovl-adhoc-003.v1",
      "org.openehr::openEHR-EHR-OBSERVATION.ovl-body_weight-001.v2",
      "openEHR-EHR-SECTION.ovl-adhoc-009.v1",
      "openEHR-EHR-CLUSTER.ovl-exam-uterus-001.v0",
    ],
  );

  const resolver = createTemplateLabelResolver(opt, {
    languages: ["en", "sv"],
  });

  // 1. Ad-hoc sections resolve to overlay at0000.1, never root "Encounter" or "Ad hoc heading".
  const sec03 = archRoots.find((r) =>
    r.archetype_ref === "openEHR-EHR-SECTION.ovl-adhoc-003.v1"
  )!;
  assertEquals(
    (sec03 as TermScopeMeta)[TERM_NAME_FALLBACK_NODE_ID_KEY],
    "at0000.1",
  );
  const sec03Label = resolver.resolveNode(sec03);
  assertEquals(sec03Label.localizedNames?.en, "General information");
  assertEquals(sec03Label.localizedNames?.sv, "Allmän information");

  const sec09 = archRoots.find((r) =>
    r.archetype_ref === "openEHR-EHR-SECTION.ovl-adhoc-009.v1"
  )!;
  const sec09Label = resolver.resolveNode(sec09);
  assertEquals(sec09Label.localizedNames?.en, "Social summary");
  assertEquals(sec09Label.localizedNames?.sv, "Sociala förhållanden");

  // 2. Quoted spaced template id ("Care unit v2") and nested ovl-organisation-001
  //    whose slot id at0021.1 must resolve to at0000.1 ("Care provider"), NOT at0021 ("Parent organisation").
  const careUnit = archRoots.find((r) => r.archetype_ref === "Care unit v2")!;
  assertEquals(resolver.resolveNode(careUnit).localizedNames?.en, "Care unit");
  assertEquals(resolver.resolveNode(careUnit).localizedNames?.sv, "Vårdenhet");

  const careProvider = archRoots.find((r) =>
    r.archetype_ref === "openEHR-EHR-CLUSTER.ovl-organisation-001.v1"
  )!;
  assertEquals(
    resolver.resolveNode(careProvider).localizedNames?.en,
    "Care provider",
  );
  assertEquals(
    resolver.resolveNode(careProvider).localizedNames?.sv,
    "Vårdgivare",
  );

  // 3. Namespaced overlay + specialized parent code fallback (at0011.1 -> at0011, at0004.1 -> at0004).
  const weightObs = archRoots.find((r) =>
    r.archetype_ref ===
      "org.openehr::openEHR-EHR-OBSERVATION.ovl-body_weight-001.v2"
  )!;
  assertEquals(
    resolver.resolveNode(weightObs).localizedNames?.en,
    "Maternal weight",
  );
  const commentEl = findCObjects(
    weightObs,
    (n) => n.rm_type_name === "ELEMENT" && n.node_id === "at0011.1",
  )[0];
  assert(commentEl);
  assertEquals(
    (commentEl as TermScopeMeta)[TERM_ARCHETYPE_SCOPE_KEY],
    "org.openehr::openEHR-EHR-OBSERVATION.ovl-body_weight-001.v2",
  );
  assertEquals(resolver.resolveNode(commentEl).localizedNames?.en, "Comment");
  assertEquals(resolver.resolveNode(commentEl).localizedNames?.sv, "Kommentar");

  // 4. Multi-level root concept fallback (at0000.1.1) and zero-prefix specialized element (at0.1.1 -> at0.1).
  const uterus = archRoots.find((r) =>
    r.archetype_ref === "openEHR-EHR-CLUSTER.ovl-exam-uterus-001.v0"
  )!;
  assertEquals(
    (uterus as TermScopeMeta)[TERM_NAME_FALLBACK_NODE_ID_KEY],
    "at0000.1.1",
  );
  assertEquals(
    resolver.resolveNode(uterus).localizedNames?.en,
    "Uterus examination",
  );
  assertEquals(
    resolver.resolveNode(uterus).localizedNames?.sv,
    "Uterusundersökning",
  );
  const lengthEl = findCObjects(
    uterus,
    (n) => n.rm_type_name === "ELEMENT" && n.node_id === "at0.1.1",
  )[0];
  assert(lengthEl);
  assertEquals(resolver.resolveNode(lengthEl).localizedNames?.en, "Length");
  assertEquals(resolver.resolveNode(lengthEl).localizedNames?.sv, "Längd");

  // 5. Web Template keeps slot nodeIds / AQL paths and resolves localized names.
  const wt = buildWebTemplate(opt, { languages: ["en", "sv"] });
  const wtSec03 = findWebNodes(
    wt.tree,
    (n) => n.rmType === "SECTION" && n.nodeId === "at0.6",
  )[0];
  assert(wtSec03);
  assertEquals(wtSec03.aqlPath, "/content[at0.6]");
  assertEquals(wtSec03.name, "General information");
  assertEquals(wtSec03.localizedNames?.sv, "Allmän information");

  const wtCareUnit = findWebNodes(
    wt.tree,
    (n) => n.rmType === "CLUSTER" && n.nodeId === "at0002.3",
  )[0];
  assert(wtCareUnit);
  assertEquals(
    wtCareUnit.aqlPath,
    "/context/other_context[at0001]/items[at0002.3]",
  );
  assertEquals(wtCareUnit.name, "Care unit");
  assertEquals(wtCareUnit.localizedNames?.sv, "Vårdenhet");
});

Deno.test("#334: flattenToOperationalTemplate -> OPT2Serializer -> parseTemplateInput round-trips C_ARCHETYPE_ROOT scopes for Better overlays and spaced nested template ids", () => {
  const careUnitTemplate = JSON.stringify({
    "@type": "TEMPLATE",
    templateId: "Care unit v2",
    archetypeId: { value: "openEHR-EHR-CLUSTER.t_organisation.v1" },
    originalLanguage: { terminologyId: { value: "ISO_639-1" }, codeString: "en" },
    definition: {
      "@type": "C_COMPLEX_OBJECT",
      rmTypeName: "CLUSTER",
      nodeId: "at0000.1",
      attributes: [
        {
          "@type": "C_ATTRIBUTE",
          rmAttributeName: "items",
          children: [
            {
              "@type": "C_COMPLEX_OBJECT",
              rmTypeName: "ELEMENT",
              nodeId: "at0001.1",
              attributes: [
                {
                  "@type": "C_ATTRIBUTE",
                  rmAttributeName: "value",
                  children: [
                    { "@type": "C_COMPLEX_OBJECT", rmTypeName: "DV_TEXT" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    terminology: {
      termDefinitions: {
        en: {
          at0000: { text: "Organisation" },
          "at0000.1": { text: "Care unit" },
          at0001: { text: "Organisation name" },
        },
        sv: {
          at0000: { text: "Organisation" },
          "at0000.1": { text: "Vårdenhet" },
          at0001: { text: "Organisationsnamn" },
        },
      },
    },
  });

  const rootTemplate = JSON.stringify({
    "@type": "TEMPLATE",
    templateId: "Prenatal visit.v1",
    archetypeId: { value: "openEHR-EHR-COMPOSITION.t_encounter.v1" },
    originalLanguage: { terminologyId: { value: "ISO_639-1" }, codeString: "en" },
    definition: {
      "@type": "C_COMPLEX_OBJECT",
      rmTypeName: "COMPOSITION",
      nodeId: "at0000.1",
      attributes: [
        {
          "@type": "C_ATTRIBUTE",
          rmAttributeName: "content",
          children: [
            {
              "@type": "C_ARCHETYPE_ROOT",
              rmTypeName: "SECTION",
              nodeId: "at0.6",
              archetypeRef: "openEHR-EHR-SECTION.ovl-adhoc-003.v1",
            },
          ],
        },
      ],
    },
    templateOverlays: [
      {
        "@type": "TEMPLATE_OVERLAY",
        archetypeId: { value: "openEHR-EHR-SECTION.ovl-adhoc-003.v1" },
        definition: {
          "@type": "C_COMPLEX_OBJECT",
          rmTypeName: "SECTION",
          nodeId: "at0000.1",
          attributes: [
            {
              "@type": "C_ATTRIBUTE",
              rmAttributeName: "items",
              children: [
                {
                  "@type": "C_ARCHETYPE_ROOT",
                  rmTypeName: "CLUSTER",
                  nodeId: "at0002.3",
                  archetypeRef: "Care unit v2",
                },
              ],
            },
          ],
        },
        terminology: {
          termDefinitions: {
            en: {
              at0000: { text: "Ad hoc heading" },
              "at0000.1": { text: "General information" },
            },
            sv: {
              at0000: { text: "Rubrik" },
              "at0000.1": { text: "Allmän information" },
            },
          },
        },
      },
    ],
    terminology: {
      termDefinitions: {
        en: {
          at0000: { text: "Encounter" },
          "at0000.1": { text: "Prenatal visit" },
        },
        sv: {
          at0000: { text: "Vårdkontakt" },
          "at0000.1": { text: "Graviditetsbesök" },
        },
      },
    },
  });

  const repo = ArchetypeRepository.fromEntries([
    { path: "Prenatal visit.v1.t.json", content: rootTemplate },
    { path: "local/Care unit v2.t.json", content: careUnitTemplate },
  ]);
  const flattened = repo.flattenTemplate(repo.getTemplate("Prenatal visit.v1")!);

  // 1. Flattened OPT keeps C_ARCHETYPE_ROOT & archetype_ref on inlined subtrees.
  const flatRoots = findCObjects(
    flattened.definition,
    (n) => n instanceof openehr_am.C_ARCHETYPE_ROOT,
  ) as openehr_am.C_ARCHETYPE_ROOT[];
  assertEquals(
    flatRoots.map((r) => `${r.rm_type_name}[${r.node_id}, ${r.archetype_ref}]`),
    [
      "SECTION[at0.6, openEHR-EHR-SECTION.ovl-adhoc-003.v1]",
      "CLUSTER[at0002.3, Care unit v2]",
    ],
  );

  // 2. OPT2 serialization emits use_archetype (bare for HRID, quoted for spaced template id).
  const opt2Text = new OPT2Serializer().serializeOperationalTemplate(flattened);
  assertStringIncludes(
    opt2Text,
    "use_archetype SECTION[at0.6, openEHR-EHR-SECTION.ovl-adhoc-003.v1]",
  );
  assertStringIncludes(
    opt2Text,
    'use_archetype CLUSTER[at0002.3, "Care unit v2"]',
  );

  // 3. Re-parsing the OPT2 restores all scopes and clinical labels identically.
  const reparsed = parseTemplateInput(opt2Text);
  assertEquals(reparsed.warnings, []);
  const opt2 = reparsed.operationalTemplate!;
  const parsedRoots = findCObjects(
    opt2.definition,
    (n) => n instanceof openehr_am.C_ARCHETYPE_ROOT,
  ) as openehr_am.C_ARCHETYPE_ROOT[];
  assertEquals(
    parsedRoots.map((r) => `${r.rm_type_name}[${r.node_id}, ${r.archetype_ref}]`),
    [
      "SECTION[at0.6, openEHR-EHR-SECTION.ovl-adhoc-003.v1]",
      "CLUSTER[at0002.3, Care unit v2]",
    ],
  );

  const resolver = createTemplateLabelResolver(opt2, {
    languages: ["en", "sv"],
  });
  const sec = parsedRoots[0];
  const cluster = parsedRoots[1];
  const nameEl = findCObjects(
    cluster,
    (n) => n.rm_type_name === "ELEMENT" && n.node_id === "at0001.1",
  )[0];
  assert(nameEl);
  assertEquals(resolver.resolveNode(sec).localizedNames?.en, "General information");
  assertEquals(resolver.resolveNode(sec).localizedNames?.sv, "Allmän information");
  assertEquals(resolver.resolveNode(cluster).localizedNames?.en, "Care unit");
  assertEquals(resolver.resolveNode(cluster).localizedNames?.sv, "Vårdenhet");
  assertEquals(
    resolver.resolveNode(nameEl).localizedNames?.en,
    "Organisation name",
  );
  assertEquals(
    resolver.resolveNode(nameEl).localizedNames?.sv,
    "Organisationsnamn",
  );

  // 4. Web Template before and after OPT2 round-trip matches nodeIds, paths, and names.
  const wtBefore = buildWebTemplate(flattened, { languages: ["en", "sv"] });
  const wtAfter = buildWebTemplate(opt2, { languages: ["en", "sv"] });
  const sig = (wt: { tree: WebTemplateNode }) =>
    findWebNodes(wt.tree, () => true).map((n) =>
      `${n.aqlPath} | ${n.rmType} | ${n.nodeId} | ${n.name} | ${
        n.localizedNames?.sv ?? ""
      }`
    );
  assertEquals(sig(wtAfter), sig(wtBefore));
});
