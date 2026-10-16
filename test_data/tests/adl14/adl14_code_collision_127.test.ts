/**
 * https://github.com/ErikSundvall/ehrtslib/issues/127
 * id-coded ADL2 → ADL 1.4: node/value code collisions.
 *
 * Spec evidence: ADL2 master09.09-spec_terminology.adoc gives the same
 * archetype in both coding systems — id-coded `DV_CODED_TEXT[id4]` and value
 * `at4` (l.103, l.124) correspond to at-coded `DV_CODED_TEXT[at9000]` and
 * `at0003` (l.31, l.52). Value codes keep the shifted code; the node moves.
 */
import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseAdl } from "../../../parser/mod.ts";
import { ADL14Serializer } from "../../../generation/adl14_serializer.ts";
import { buildAdl14CodeMap } from "../../../generation/id_to_at_code.ts";

const SPEC = new URL(
  "../../adl2/code_collision_127/openEHR-EHR-EVALUATION.code_list_parent.v1.0.0.adls",
  import.meta.url,
);

const atCodes = (s: string) =>
  [...s.matchAll(/\[(at[0-9.]+)\]/g)].map((m) => m[1]);

Deno.test("#127 spec 9.9 example: value codes keep shift, colliding node → at9000", () => {
  // deno-lint-ignore no-explicit-any
  const r: any = parseAdl(Deno.readTextFileSync(SPEC));
  const ser = new ADL14Serializer();
  const adl = ser.serialize(r.archetype);
  assert(adl.includes("EVALUATION[at0000]"), adl);
  assert(adl.includes("ITEM_TREE[at0001]"), adl);
  assert(adl.includes("ELEMENT[at0002]"), adl);
  assert(adl.includes("DV_CODED_TEXT[at9000]"), adl); // as in the at-coded spec example
  assert(/\[local::at0003, at0004, at0005, at0006, at0009, at0012, at0013, at0010, at0011, at0007, at0008\]/.test(adl), adl);
  assert(adl.includes('["at0003"]') && adl.includes("No significant illness"), adl);
  assertEquals(ser.warnings.length, 1, ser.warnings.join("\n"));
  assert(ser.warnings[0].includes("id4") && ser.warnings[0].includes("at9000"));
});

Deno.test("#127 node and value from the same 1.4 code (identical terms) share it", () => {
  const term = { text: "Present", description: "Present" };
  const warns: string[] = [];
  const map = buildAdl14CodeMap(["id1", "id5", "at5", "at6"], {
    terms: { en: { id1: { text: "Root" }, id5: term, at5: term, at6: { text: "Absent" } } },
    warn: (m) => warns.push(m),
  });
  assertEquals(map.get("id5"), "at0004");
  assertEquals(map.get("at5"), "at0004");
  assertEquals(map.get("at6"), "at0005");
  assertEquals(warns, []);
});

Deno.test("#127 different terms: value keeps code, node renumbered with warning", () => {
  const warns: string[] = [];
  const map = buildAdl14CodeMap(["id1", "id2", "at2"], {
    terms: { en: { id2: { text: "Node" }, at2: { text: "Value" } } },
    warn: (m) => warns.push(m),
  });
  assertEquals(map.get("at2"), "at0001");
  assertEquals(map.get("id2"), "at9000");
  assertEquals(warns.length, 1);
});

Deno.test("#127 synthetic id9000+ without term is dropped, not at8999", () => {
  const map = buildAdl14CodeMap(["id1", "id9000", "id9001"], { terms: { en: { id1: {} } } });
  assertEquals(map.get("id9000"), "");
  assertEquals(map.get("id9001"), "");
  const adl = `archetype (adl_version=2.0.6; rm_release=1.1.0)
    openEHR-EHR-CLUSTER.syn_probe.v1.0.0

language
    original_language = <[ISO_639-1::en]>

definition
    CLUSTER[id1] matches {
        items matches {
            ELEMENT[id2] matches {
                value matches {
                    DV_TEXT[id9000]
                    DV_IDENTIFIER[id9001]
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <text = <"Probe"> description = <"Probe">>
            ["id2"] = <text = <"E"> description = <"E">>
        >
    >
`;
  // deno-lint-ignore no-explicit-any
  const r: any = parseAdl(adl);
  const out = new ADL14Serializer().serialize(r.archetype);
  assert(!/at899\d|at900\d/.test(out), out);
  assert(/DV_TEXT\s/.test(out) && /DV_IDENTIFIER\s/.test(out), out);
});

Deno.test("#127 CKM organisation: 1.4 → Archie ADL2 → Ehrtslib 1.4 keeps CKM at-codes", () => {
  const G = "/workspace/openehr-genomik-templates/archetypes";
  let ckm: string, adl2: string;
  try {
    ckm = Deno.readTextFileSync(`${G}/ckm/openEHR-EHR-CLUSTER.organisation.v1.adl`);
    adl2 = Deno.readTextFileSync(`${G}/ckm-adl2/openEHR-EHR-CLUSTER.organisation.v1.0.4.adls`);
  } catch {
    return; // fixtures not available outside the genomics workspace
  }
  // deno-lint-ignore no-explicit-any
  const r: any = parseAdl(adl2);
  const out = new ADL14Serializer().serialize(r.archetype);
  assertEquals([...new Set(atCodes(out))].sort(), [...new Set(atCodes(ckm))].sort());
});

Deno.test("#127 specialised archetype: colliding new node moves to at0.9000+", () => {
  const map = buildAdl14CodeMap(["id1.1", "id0.3", "id0.10", "at0.3", "at0.10"], {
    terms: { en: { "id0.3": { text: "N3" }, "at0.3": { text: "V3" }, "id0.10": { text: "N10" }, "at0.10": { text: "V10" } } },
  });
  assertEquals(map.get("at0.3"), "at0.3");
  assertEquals(map.get("id0.3"), "at0.9000");
  assertEquals(map.get("id0.10"), "at0.9001"); // segment-wise numeric order: 0.3 < 0.10
  assertEquals(map.get("id1.1"), "at0000.1");
});
