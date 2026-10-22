/**
 * #141: OPT 1.4 and ADL 1.4 keep FHIR, OBO, and /id/ term bindings,
 * and warn when a target cannot be exported.
 */
import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseAdl } from "../../../parser/mod.ts";
import { ADL14Serializer } from "../../../generation/adl14_serializer.ts";
import { Adl2TemplateLibrary } from "../../../generation/opt14/adl2_template_library.ts";
import { exportAdl2TemplateToOpt14 } from "../../../generation/opt14/opt14_exporter.ts";
import { parseTermBinding } from "../../../generation/term_binding.ts";

const FHIR =
  "http://hl7.org/fhir/uv/genomics-reporting/CodeSystem/genomic-study-type-cs#cnv";
const OBO = "http://purl.obolibrary.org/obo/SO_0001583";
const SNOMED = "http://snomed.info/id/258435002";
const UNKNOWN = "http://example.org/codes/not-a-binding";
const QUERY = "http://terminology.example/query?id=1";

const ARCHETYPE = `archetype (adl_version=2.0.6; rm_release=1.1.0)
    openEHR-EHR-CLUSTER.binding_probe.v1.0.0

language
    original_language = <[ISO_639-1::en]>

definition
    CLUSTER[id1] matches {
        items matches {
            ELEMENT[id2] matches {
                value matches {
                    DV_TEXT
                }
            }
            ELEMENT[id3] matches {
                value matches {
                    DV_TEXT
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <text = <"Probe"> description = <"Probe">>
            ["id2"] = <text = <"A"> description = <"A">>
            ["id3"] = <text = <"B"> description = <"B">>
            ["at0.10"] = <text = <"CNV"> description = <"CNV">>
            ["at0.20"] = <text = <"SO term"> description = <"SO term">>
            ["at0.30"] = <text = <"SNOMED"> description = <"SNOMED">>
            ["at0.40"] = <text = <"Unknown"> description = <"Unknown">>
            ["at0.50"] = <text = <"Phrase"> description = <"Phrase">>
        >
    >
    term_bindings = <
        ["HL7"] = <
            ["at0.10"] = <${FHIR}>
        >
        ["SO"] = <
            ["at0.20"] = <${OBO}>
        >
        ["SNOMED-CT"] = <
            ["at0.30"] = <${SNOMED}>
            ["ac0.1"] = <http://snomed.info/id/999>
        >
        ["EXAMPLE"] = <
            ["at0.40"] = <${UNKNOWN}>
        >
        ["ICD10"] = <
            ["at0.50"] = <[ICD10::A00]>
        >
        ["LOINC"] = <
            ["/data[id2]/items[id3]"] = <http://loinc.org/id/1234-5>
        >
        ["QUERY"] = <
            ["ac0.2"] = <${QUERY}>
        >
    >
`;

const TEMPLATE = `template (adl_version=2.0.6; rm_release=1.1.0)
    openEHR-EHR-COMPOSITION.t_bindings.v1.0.0

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
            purpose = <"Binding probe">
        >
    >

definition
    COMPOSITION[id1] matches {
        content matches {
            use_archetype CLUSTER[id2, openEHR-EHR-CLUSTER.binding_probe.v1]
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <text = <"T"> description = <"T">>
            ["id2"] = <text = <"Probe"> description = <"Probe">>
        >
    >
`;

function codeString(xml: string, terminology: string, code: string): string | undefined {
  const re = new RegExp(
    `<term_bindings terminology="${terminology}">[\\s\\S]*?<items code="${code}">[\\s\\S]*?<code_string>([^<]*)</code_string>`,
  );
  return xml.match(re)?.[1];
}

Deno.test("parseTermBinding maps FHIR, OBO, /id/ and [t::c] (#141)", () => {
  assertEquals(parseTermBinding("HL7", FHIR), {
    binding: { terminology: "HL7", code: "cnv" },
  });
  assertEquals(parseTermBinding("SO", OBO), {
    binding: { terminology: "SO", code: "0001583" },
  });
  assertEquals(parseTermBinding("SNOMED-CT", SNOMED), {
    binding: { terminology: "SNOMED-CT", code: "258435002" },
  });
  assertEquals(parseTermBinding("snomed", "http://snomedct.info/id/123"), {
    binding: { terminology: "SNOMED-CT", code: "123" },
  });
  assertEquals(parseTermBinding("ICD10", "[ICD10::A00]"), {
    binding: { terminology: "ICD10", code: "A00" },
  });
  const unknown = parseTermBinding("EXAMPLE", UNKNOWN);
  assertEquals(unknown.binding, undefined);
  assert(unknown.warning?.includes("unrecognized"));
});

Deno.test("#141 ADL 1.4 serializer emits term_bindings and constraint_bindings", () => {
  const parsed = parseAdl(ARCHETYPE);
  assert(parsed.archetype, parsed.errors?.map((e) => e.message).join("\n"));
  const serializer = new ADL14Serializer();
  const adl = serializer.serialize(parsed.archetype);
  assert(adl.includes('["at0.10"] = <[HL7::cnv]>'), adl);
  assert(adl.includes('["at0.20"] = <[SO::0001583]>'), adl);
  assert(adl.includes('["at0.30"] = <[SNOMED-CT::258435002]>'), adl);
  assert(adl.includes('["at0.50"] = <[ICD10::A00]>'), adl);
  assert(adl.includes('["/data[at0001]/items[at0002]"] = <[LOINC::1234-5]>'), adl);
  assert(adl.includes("constraint_bindings"));
  assert(adl.includes('["ac0.1"] = <[SNOMED-CT::999]>'), adl);
  assert(adl.includes(`["ac0.2"] = <${QUERY}>`), adl);
  assert(!adl.includes("example.org"), adl);
  assert(
    serializer.warnings.some((w) => w.includes("at0.40") && w.includes("unrecognized")),
    serializer.warnings.join("\n"),
  );
});

Deno.test("#141 OPT 1.4 export keeps mapped bindings and warns on the rest", () => {
  const lib = new Adl2TemplateLibrary();
  lib.addSource(ARCHETYPE, "probe.adls");
  const [tid] = lib.addSource(TEMPLATE, "template.adls");
  const r = exportAdl2TemplateToOpt14(lib, tid);
  assertEquals(codeString(r.xml, "HL7", "at0.10"), "cnv");
  assertEquals(codeString(r.xml, "SO", "at0.20"), "0001583");
  assertEquals(codeString(r.xml, "SNOMED-CT", "at0.30"), "258435002");
  assertEquals(codeString(r.xml, "ICD10", "at0.50"), "A00");
  assert(!r.xml.includes("example.org"), r.xml);
  assert(!r.xml.includes("1234-5"), r.xml);
  assert(!r.xml.includes(">999<"), r.xml);
  const warnings = r.warnings.join("\n");
  assert(warnings.includes("at0.40") && warnings.includes("unrecognized"), warnings);
  assert(warnings.includes("Skipped path term binding"), warnings);
  assert(warnings.includes("Skipped constraint binding"), warnings);
  assert(warnings.includes("ac0.1"), warnings);
  assert(warnings.includes("ac0.2"), warnings);
});
