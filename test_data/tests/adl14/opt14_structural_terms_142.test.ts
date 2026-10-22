/**
 * #142: OPT 1.4 export keeps term_definitions for structural nodes
 * (HISTORY, ITEM_TREE), including nodes under ACTIVITY.description.
 * #145: when the ADL2 source has no term for a locatable node id, synthesise
 * one from the RM type and warn.
 */
import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { Adl2TemplateLibrary } from "../../../generation/opt14/adl2_template_library.ts";
import { exportAdl2TemplateToOpt14 } from "../../../generation/opt14/opt14_exporter.ts";

const LAB = `archetype (adl_version=1.4)
	openEHR-EHR-OBSERVATION.laboratory_test_result.v1

concept
	[at0000]

language
	original_language = <[ISO_639-1::en]>

definition
	OBSERVATION[at0000] matches {	-- Laboratory test result
		data matches {
			HISTORY[at0001] matches {	-- Event Series
				events cardinality matches {1..*; unordered} matches {
					EVENT[at0002] occurrences matches {0..*} matches {	-- Any event
						data matches {
							ITEM_TREE[at0003] matches {	-- Tree
								items cardinality matches {0..*; unordered} matches {
									ELEMENT[at0005] matches {	-- Test name
										value matches {
											DV_TEXT matches {*}
										}
									}
								}
							}
						}
					}
				}
			}
		}
		protocol matches {
			ITEM_TREE[at0004] matches {	-- Tree
				items cardinality matches {0..*; unordered} matches {
					ELEMENT[at0006] occurrences matches {0..1} matches {
						value matches {
							DV_TEXT matches {*}
						}
					}
				}
			}
		}
	}

ontology
	term_definitions = <
		["en"] = <
			items = <
				["at0000"] = <
					text = <"Laboratory test result">
					description = <"Result">
				>
				["at0001"] = <
					text = <"Event Series">
					description = <"@ internal @">
				>
				["at0002"] = <
					text = <"Any event">
					description = <"Any event">
				>
				["at0003"] = <
					text = <"Result tree">
					description = <"@ internal @">
				>
				["at0004"] = <
					text = <"Protocol tree">
					description = <"@ internal @">
				>
				["at0005"] = <
					text = <"Test name">
					description = <"Name of the test">
				>
				["at0006"] = <
					text = <"Lab id">
					description = <"Identifier">
				>
			>
		>
	>
`;

const REQUEST = `archetype (adl_version=1.4)
	openEHR-EHR-INSTRUCTION.service_request.v1

concept
	[at0000]

language
	original_language = <[ISO_639-1::en]>

definition
	INSTRUCTION[at0000] matches {	-- Service request
		activities cardinality matches {0..*; unordered} matches {
			ACTIVITY[at0001] occurrences matches {1..*} matches {	-- Current Activity
				description matches {
					ITEM_TREE[at0009] matches {	-- Tree
						items cardinality matches {0..*; unordered} matches {
							ELEMENT[at0121] matches {	-- Service name
								value matches {
									DV_TEXT matches {*}
								}
							}
						}
					}
				}
			}
		}
		protocol matches {
			ITEM_TREE[at0008] matches {	-- Tree
				items cardinality matches {0..*; unordered} matches {
					ELEMENT[at0010] occurrences matches {0..1} matches {	-- Requester order identifier
						value matches {
							DV_TEXT matches {*}
						}
					}
				}
			}
		}
	}

ontology
	term_definitions = <
		["en"] = <
			items = <
				["at0000"] = <
					text = <"Service request">
					description = <"Request">
				>
				["at0001"] = <
					text = <"Current Activity">
					description = <"Current Activity">
				>
				["at0008"] = <
					text = <"Order protocol">
					description = <"@ internal @">
				>
				["at0009"] = <
					text = <"Request tree">
					description = <"@ internal @">
				>
				["at0010"] = <
					text = <"Requester order identifier">
					description = <"Identifier">
				>
				["at0121"] = <
					text = <"Service name">
					description = <"Name">
				>
			>
		>
	>
`;

const TEMPLATE = `template (adl_version=2.0.6; rm_release=1.1.0)
	openEHR-EHR-COMPOSITION.t_struct_terms.v1.0.0

language
	original_language = <[ISO_639-1::en]>

description
	original_author = <
		["name"] = <"Test">
	>
	lifecycle_state = <"unmanaged">
	details = <
		["en"] = <
			language = <[ISO_639-1::en]>
			purpose = <"Structural term probe">
		>
	>

definition
	COMPOSITION[id1] matches {
		content matches {
			use_archetype OBSERVATION[id2, openEHR-EHR-OBSERVATION.laboratory_test_result.v1]
			use_archetype INSTRUCTION[id3, openEHR-EHR-INSTRUCTION.service_request.v1]
		}
	}

terminology
	term_definitions = <
		["en"] = <
			["id1"] = <text = <"Report"> description = <"Report">>
			["id2"] = <text = <"Lab result"> description = <"Lab result">>
			["id3"] = <text = <"Service request"> description = <"Service request">>
		>
	>
`;

function termsOn(xml: string, archetypeId: string): Map<string, string> {
  const marker = `>${archetypeId}<`;
  const at = xml.indexOf(marker);
  assert(at > 0, archetypeId);
  const start = xml.lastIndexOf("<archetype_id>", at);
  const end = xml.indexOf("</children>", at);
  const chunk = xml.slice(start, end);
  const out = new Map<string, string>();
  for (const m of chunk.matchAll(
    /<term_definitions code="([^"]+)">\s*<items id="text">([^<]*)</g,
  )) {
    out.set(m[1], m[2]);
  }
  return out;
}

function nodeId(xml: string, rmType: string, nth: number): string {
  const re = new RegExp(
    `<rm_type_name>${rmType}</rm_type_name>[\\s\\S]*?<node_id>([^<]*)</node_id>`,
    "g",
  );
  const hits = [...xml.matchAll(re)].map((m) => m[1]);
  assert(hits.length > nth, `${rmType} #${nth} missing in ${hits.join(",")}`);
  return hits[nth];
}

Deno.test("#142 OPT 1.4 emits terms for structural HISTORY and ITEM_TREE nodes", () => {
  const lib = new Adl2TemplateLibrary();
  lib.addSource(LAB, "lab.adl");
  lib.addSource(REQUEST, "request.adl");
  const [tid] = lib.addSource(TEMPLATE, "template.adls");
  const r = exportAdl2TemplateToOpt14(lib, tid);
  const collisions = r.warnings.filter((w) => w.includes("would collide"));
  assertEquals(collisions, [], collisions.join("\n"));

  const lab = termsOn(r.xml, "openEHR-EHR-OBSERVATION.laboratory_test_result.v1");
  assertEquals(lab.get("at0001"), "Event Series");
  assertEquals(lab.get("at0003"), "Result tree");
  assertEquals(lab.get("at0004"), "Protocol tree");
  assertEquals(nodeId(r.xml, "HISTORY", 0), "at0001");
  assertEquals(nodeId(r.xml, "ITEM_TREE", 0), "at0003");
  assertEquals(nodeId(r.xml, "ITEM_TREE", 1), "at0004");

  const req = termsOn(r.xml, "openEHR-EHR-INSTRUCTION.service_request.v1");
  assertEquals(req.get("at0008"), "Order protocol");
  assertEquals(req.get("at0009"), "Request tree");
  assertEquals(nodeId(r.xml, "ITEM_TREE", 2), "at0009");
  assertEquals(nodeId(r.xml, "ITEM_TREE", 3), "at0008");
});

const ADL2_LAB = `archetype (adl_version=2.0.6; rm_release=1.1.0)
    openEHR-EHR-OBSERVATION.laboratory_test_result.v1.2.8

language
    original_language = <[ISO_639-1::en]>

definition
    OBSERVATION[id1] matches {
        data matches {
            HISTORY[id2] matches {
                events matches {
                    EVENT[id3] matches {
                        data matches {
                            ITEM_TREE[id4] matches {
                                items matches {
                                    CLUSTER[id8] matches {
                                        items matches {
                                            ELEMENT[id6] matches {
                                                value matches {
                                                    DV_TEXT
                                                }
                                            }
                                        }
                                    }
                                    ITEM_LIST[id9] matches {
                                        items matches {
                                            ELEMENT[id10] matches {
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
        protocol matches {
            ITEM_TREE[id5] matches {
                items matches {
                    ELEMENT[id7] matches {
                        value matches {
                            DV_TEXT
                        }
                    }
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <text = <"Laboratory test result"> description = <"Result">>
            ["id3"] = <text = <"Any event"> description = <"Any event">>
            ["id6"] = <text = <"Test name"> description = <"Name">>
            ["id7"] = <text = <"Lab id"> description = <"Identifier">>
            ["id10"] = <text = <"List item"> description = <"Item">>
        >
    >
`;

const ADL2_TEMPLATE = `template (adl_version=2.0.6; rm_release=1.1.0)
    openEHR-EHR-COMPOSITION.t_missing_terms.v1.0.0

language
    original_language = <[ISO_639-1::en]>

description
    original_author = <
        ["name"] = <"Test">
    >
    lifecycle_state = <"unmanaged">
    details = <
        ["en"] = <
            language = <[ISO_639-1::en]>
            purpose = <"Missing structural terms">
        >
    >

definition
    COMPOSITION[id1] matches {
        content matches {
            use_archetype OBSERVATION[id2, openEHR-EHR-OBSERVATION.laboratory_test_result.v1]
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <text = <"Report"> description = <"Report">>
            ["id2"] = <text = <"Lab result"> description = <"Lab result">>
        >
    >
`;

Deno.test("#145 OPT 1.4 synthesises terms for locatable nodes the ADL2 source omitted", () => {
  const lib = new Adl2TemplateLibrary();
  lib.addSource(ADL2_LAB, "lab.adls");
  const [tid] = lib.addSource(ADL2_TEMPLATE, "template.adls");
  const r = exportAdl2TemplateToOpt14(lib, tid);
  const lab = termsOn(r.xml, "openEHR-EHR-OBSERVATION.laboratory_test_result.v1");

  assertEquals(lab.get("at0000"), "Lab result");
  assertEquals(lab.get("at0001"), "History");
  assertEquals(lab.get("at0002"), "Any event");
  assertEquals(lab.get("at0003"), "Tree");
  assertEquals(lab.get("at0004"), "Tree");
  assertEquals(lab.get("at0005"), "Test name");
  assertEquals(lab.get("at0007"), "Cluster");
  assertEquals(lab.get("at0008"), "List");
  assertEquals(nodeId(r.xml, "HISTORY", 0), "at0001");
  assertEquals(nodeId(r.xml, "ITEM_TREE", 0), "at0003");
  assertEquals(nodeId(r.xml, "ITEM_TREE", 1), "at0004");
  assertEquals(nodeId(r.xml, "CLUSTER", 0), "at0007");
  assertEquals(nodeId(r.xml, "ITEM_LIST", 0), "at0008");

  const warnings = r.warnings.join("\n");
  for (const rm of [
    "HISTORY[id2 → at0001]",
    "ITEM_TREE[id4 → at0003]",
    "ITEM_TREE[id5 → at0004]",
    "CLUSTER[id8 → at0007]",
    "ITEM_LIST[id9 → at0008]",
  ]) {
    assert(warnings.includes(rm) && warnings.includes("synthesised"), warnings);
  }
  assert(!warnings.includes("EVENT["), warnings);
  assert(!warnings.includes("ELEMENT["), warnings);
  assert(!warnings.includes("OBSERVATION["), warnings);
});
