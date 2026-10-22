/**
 * #147: a local value set that carries term bindings stays `local` at-codes.
 * Synthetic at9xxx placeholders are still replaced by the external code.
 * OBO bindings export as a CURIE (`SO:0001583`).
 */
import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { Adl2TemplateLibrary } from "../../../generation/opt14/adl2_template_library.ts";
import { exportAdl2TemplateToOpt14 } from "../../../generation/opt14/opt14_exporter.ts";

const MISSENSE = "http://purl.obolibrary.org/obo/SO_0001583";
const SYNONYMOUS = "http://purl.obolibrary.org/obo/SO_0001819";
const STOP = "http://purl.obolibrary.org/obo/SO_0001587";
const FRAMESHIFT = "http://purl.obolibrary.org/obo/SO_0001589";

const ARCHETYPE = `archetype (adl_version=2.0.6; rm_release=1.1.0)
    openEHR-EHR-CLUSTER.consequence_probe.v1.0.0

language
    original_language = <[ISO_639-1::en]>

definition
    CLUSTER[id1] matches {
        items matches {
            ELEMENT[id2] matches {
                value matches {
                    DV_CODED_TEXT matches {
                        defining_code matches {[ac0.1]}
                    }
                }
            }
            ELEMENT[id3] matches {
                value matches {
                    DV_CODED_TEXT matches {
                        defining_code matches {[at9000]}
                    }
                }
            }
            ELEMENT[id4] matches {
                value matches {
                    DV_CODED_TEXT matches {
                        defining_code matches {[ac0.2]}
                    }
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <text = <"Probe"> description = <"Probe">>
            ["id2"] = <text = <"Molecular consequence"> description = <"Consequence">>
            ["id3"] = <text = <"Placeholder"> description = <"Placeholder">>
            ["id4"] = <text = <"Synthetic set"> description = <"Synthetic set">>
            ["at0.40"] = <text = <"missense_variant"> description = <"missense_variant">>
            ["at0.41"] = <text = <"synonymous_variant"> description = <"synonymous_variant">>
            ["ac0.1"] = <text = <"Consequences"> description = <"Consequences">>
            ["ac0.2"] = <text = <"Synthetic"> description = <"Synthetic">>
        >
    >
    value_sets = <
        ["ac0.1"] = <
            id = <"ac0.1">
            members = <"at0.40", "at0.41">
        >
        ["ac0.2"] = <
            id = <"ac0.2">
            members = <"at9001", "at9002">
        >
    >
    term_bindings = <
        ["SO"] = <
            ["at0.40"] = <${MISSENSE}>
            ["at0.41"] = <${SYNONYMOUS}>
            ["at9000"] = <${STOP}>
            ["at9001"] = <${STOP}>
            ["at9002"] = <${FRAMESHIFT}>
        >
    >
`;

const TEMPLATE = `template (adl_version=2.0.6; rm_release=1.1.0)
    openEHR-EHR-COMPOSITION.t_consequence.v1.0.0

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
            purpose = <"Value set probe">
        >
    >

definition
    COMPOSITION[id1] matches {
        content matches {
            use_archetype CLUSTER[id2, openEHR-EHR-CLUSTER.consequence_probe.v1]
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

function codePhrases(xml: string): Array<{ terminology: string; codes: string[] }> {
  const out = [];
  const re =
    /<terminology_id>\s*<value>([^<]*)<\/value>\s*<\/terminology_id>((?:\s*<code_list>[^<]*<\/code_list>)+)/g;
  for (const m of xml.matchAll(re)) {
    const codes = [...m[2].matchAll(/<code_list>([^<]*)<\/code_list>/g)].map((c) => c[1]);
    out.push({ terminology: m[1], codes });
  }
  return out;
}

Deno.test("#147 local value sets keep at-codes; at9xxx placeholders are substituted", () => {
  const lib = new Adl2TemplateLibrary();
  lib.addSource(ARCHETYPE, "probe.adls");
  const [tid] = lib.addSource(TEMPLATE, "template.adls");
  const r = exportAdl2TemplateToOpt14(lib, tid);
  const phrases = codePhrases(r.xml);

  assertEquals(
    phrases.find((p) => p.codes.includes("at0.40")),
    { terminology: "local", codes: ["at0.40", "at0.41"] },
  );
  assert(
    phrases.some((p) => p.terminology === "SO" && p.codes.join() === "SO:0001587"),
    JSON.stringify(phrases),
  );
  assert(
    phrases.some((p) =>
      p.terminology === "SO" && p.codes.join() === "SO:0001587,SO:0001589"
    ),
    JSON.stringify(phrases),
  );
  assert(r.xml.includes(">missense_variant<"), r.xml);
  assert(r.xml.includes("<code_string>SO:0001583</code_string>"), r.xml);
  assert(r.xml.includes("<code_string>SO:0001819</code_string>"), r.xml);
  assert(!r.xml.includes("<code_list>0001583</code_list>"), r.xml);
});

Deno.test("#147 substituteBoundValueSets replaces a fully bound local value set", () => {
  const lib = new Adl2TemplateLibrary();
  lib.addSource(ARCHETYPE, "probe.adls");
  const [tid] = lib.addSource(TEMPLATE, "template.adls");
  const r = exportAdl2TemplateToOpt14(lib, tid, { substituteBoundValueSets: true });
  const phrases = codePhrases(r.xml);
  assertEquals(
    phrases.find((p) => p.codes.includes("SO:0001583")),
    { terminology: "SO", codes: ["SO:0001583", "SO:0001819"] },
  );
  assert(!phrases.some((p) => p.codes.includes("at0.40")), JSON.stringify(phrases));
});
