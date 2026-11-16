/**
 * #313: OPT 1.4 export keeps a DV_DURATION range as C_DURATION and a
 * DV_BOOLEAN True constraint as C_BOOLEAN.
 */
import { assert, assertEquals } from "@std/assert";
import { Adl2TemplateLibrary } from "../../../generation/opt14/adl2_template_library.ts";
import { exportAdl2TemplateToOpt14 } from "../../../generation/opt14/opt14_exporter.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { TemplateValidator } from "../../../validation/template_validator.ts";
import * as openehr_am from "../../../am/openehr_am.ts";

const ARCHETYPE = `
archetype (adl_version=2.0.6; rm_release=1.1.0)
	openEHR-EHR-OBSERVATION.duration_bool.v1.0.0

language
	original_language = <[ISO_639-1::en]>

description
	lifecycle_state = <"unmanaged">
	original_author = <
		["name"] = <"ehrtslib test">
	>

definition
	OBSERVATION[id1] matches {
		data matches {
			HISTORY[id2] matches {
				events matches {
					EVENT[id3] matches {
						data matches {
							ITEM_TREE[id4] matches {
								items matches {
									ELEMENT[id5] occurrences matches {0..1} matches {
										value matches {
											DV_DURATION[id6] matches {
												value matches {|>=PT0S|}
											}
										}
									}
									ELEMENT[id7] occurrences matches {0..1} matches {
										value matches {
											DV_BOOLEAN[id8] matches {
												value matches {True}
											}
										}
									}
									ELEMENT[id9] occurrences matches {0..1} matches {
										value matches {
											DV_COUNT[id10] matches {
												magnitude matches {|>=0|}
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

terminology
	term_definitions = <
		["en"] = <
			["id1"] = <text = <"Duration and boolean">>
			["id2"] = <text = <"History">>
			["id3"] = <text = <"Event">>
			["id4"] = <text = <"Tree">>
			["id5"] = <text = <"How long">>
			["id6"] = <text = <"Duration value">>
			["id7"] = <text = <"Examination not done">>
			["id8"] = <text = <"Not done flag">>
			["id9"] = <text = <"Count">>
			["id10"] = <text = <"Count value">>
		>
	>
`;

const TEMPLATE = `
template (adl_version=2.0.6; rm_release=1.1.0)
	openEHR-EHR-OBSERVATION.t_duration_bool.v1.0.0

specialize
	openEHR-EHR-OBSERVATION.duration_bool.v1

language
	original_language = <[ISO_639-1::en]>

description
	lifecycle_state = <"unmanaged">
	original_author = <
		["name"] = <"ehrtslib test">
	>

definition
	OBSERVATION[id1.1] matches {	-- Duration and boolean
	}

terminology
	term_definitions = <
		["en"] = <
			["id1.1"] = <text = <"Duration and boolean">>
		>
	>
`;

function exportXml(): string {
  const lib = new Adl2TemplateLibrary();
  lib.addSource(ARCHETYPE, "archetype");
  const [tid] = lib.addSource(TEMPLATE, "template");
  const { xml, warnings } = exportAdl2TemplateToOpt14(lib, tid);
  assertEquals(warnings.filter((w) => /duration|boolean/i.test(w)), []);
  return xml;
}

function sliceAround(xml: string, marker: string): string {
  const at = xml.indexOf(marker);
  assert(at > 0, marker);
  return xml.slice(at, at + 2200);
}

Deno.test("#313 duration constraint is C_DURATION, not an empty C_INTEGER", () => {
  const xml = exportXml();
  const duration = sliceAround(xml, "<rm_type_name>DV_DURATION</rm_type_name>");
  assert(duration.includes('xsi:type="C_DURATION"'), duration);
  assert(duration.includes("<lower>PT0S</lower>"), duration);
  assert(!duration.includes('xsi:type="C_INTEGER"'), duration);
  assert(!duration.includes("<rm_type_name>INTEGER</rm_type_name>"), duration);

  const count = sliceAround(xml, "<rm_type_name>DV_COUNT</rm_type_name>");
  assert(count.includes('xsi:type="C_INTEGER"'), count);
  assert(count.includes("<lower>0</lower>"), count);
});

Deno.test("#313 boolean True constraint is C_BOOLEAN, not dropped", () => {
  const xml = exportXml();
  const bool = sliceAround(xml, "<rm_type_name>DV_BOOLEAN</rm_type_name>");
  assert(bool.includes("<rm_type_name>BOOLEAN</rm_type_name>"), bool);
  assert(bool.includes('xsi:type="C_BOOLEAN"'), bool);
  assert(bool.includes("<true_valid>true</true_valid>"), bool);
  assert(bool.includes("<false_valid>false</false_valid>"), bool);
  assert(!bool.includes("<pattern>True</pattern>"), bool);
});

Deno.test("#313 exported OPT accepts P2W and rejects a negative duration", () => {
  const xml = exportXml();
  const { operationalTemplate } = parseOptXml(xml);
  const duration = findRm(operationalTemplate!.definition, "DV_DURATION");
  assert(duration);
  const validator = new TemplateValidator({ validateRMSpecification: false });
  const ok = validator.validateObject(
    { _type: "DV_DURATION", value: "P2W" },
    duration,
  );
  assertEquals(ok.errors, []);
  const negative = validator.validateObject(
    { _type: "DV_DURATION", value: "-P1D" },
    duration,
  );
  assert(negative.errors.some((m) => m.constraintType === "temporal_range"));
});

function findRm(
  node: openehr_am.C_OBJECT | undefined,
  rmType: string,
): openehr_am.C_OBJECT | undefined {
  if (!node) return undefined;
  if (node.rm_type_name === rmType) return node;
  const attrs = (node as { attributes?: openehr_am.C_ATTRIBUTE[] }).attributes ??
    [];
  for (const attr of attrs) {
    for (const child of attr.children ?? []) {
      const found = findRm(child, rmType);
      if (found) return found;
    }
  }
  return undefined;
}
