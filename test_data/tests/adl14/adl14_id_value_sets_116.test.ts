/**
 * Regression for https://github.com/ErikSundvall/ehrtslib/issues/116
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseAdl } from "../../../parser/mod.ts";
import { ADL14Serializer } from "../../../generation/adl14_serializer.ts";
import { idToAtCode } from "../../../generation/id_to_at_code.ts";

Deno.test("issue #116: idToAtCode mapping", () => {
  // ADL2 spec 9.3/9.5: [at0000] ([id1]), [at0001] ([id2]), [at0000.1] ([id1.1])
  assertEquals(idToAtCode("id1"), "at0000");
  assertEquals(idToAtCode("id2"), "at0001");
  assertEquals(idToAtCode("id12"), "at0011");
  assertEquals(idToAtCode("id0.1"), "at0.1");
  assertEquals(idToAtCode("id1.1"), "at0000.1");
  assertEquals(idToAtCode("id5.2"), "at0004.2");
  assertEquals(idToAtCode("at7"), "at0006");
  assertEquals(idToAtCode("ac1"), "ac1");
  assertEquals(idToAtCode("at0001"), "at0001");
});

const WITH_VALUE_SET = `archetype (adl_version=2.0.6; rm_release=1.1.0)
\topenEHR-EHR-CLUSTER.value_set_probe.v1.0.0

language
\toriginal_language = <[ISO_639-1::en]>

definition
\tCLUSTER[id1] matches {
\t\titems matches {
\t\t\tELEMENT[id2] matches {
\t\t\t\tvalue matches {
\t\t\t\t\tDV_CODED_TEXT[id3] matches {
\t\t\t\t\t\tdefining_code matches {[ac1]}
\t\t\t\t\t}
\t\t\t\t}
\t\t\t}
\t\t}
\t}

terminology
\tterm_definitions = <
\t\t["en"] = <
\t\t\t["id1"] = <
\t\t\t\ttext = <"Probe">
\t\t\t\tdescription = <"Probe">
\t\t\t>
\t\t\t["id2"] = <
\t\t\t\ttext = <"Coded">
\t\t\t\tdescription = <"Coded">
\t\t\t>
\t\t\t["id3"] = <
\t\t\t\ttext = <"Value">
\t\t\t\tdescription = <"Value">
\t\t\t>
\t\t\t["at1"] = <
\t\t\t\ttext = <"A">
\t\t\t\tdescription = <"A">
\t\t\t>
\t\t\t["at2"] = <
\t\t\t\ttext = <"B">
\t\t\t\tdescription = <"B">
\t\t\t>
\t\t\t["ac1"] = <
\t\t\t\ttext = <"VS">
\t\t\t\tdescription = <"VS">
\t\t\t>
\t\t>
\t>
\tvalue_sets = <
\t\t["ac1"] = <
\t\t\tid = <"ac1">
\t\t\tmembers = <"at1", "at2">
\t\t>
\t>
`;

Deno.test("issue #116: value_sets expand to local:: and id keys become at", () => {
  const parsed = parseAdl(WITH_VALUE_SET);
  const adl14 = new ADL14Serializer().serialize(parsed.archetype!);
  assert(adl14.includes("[at0000]"), adl14.slice(0, 300));
  // value codes at1/at2 would clash with node codes id1/id2 (→ at0000/at0001)
  // in the single ADL 1.4 at-code space, so they are renumbered.
  const m = /\[local::(at\d{4}), (at\d{4})\]/.exec(adl14);
  assert(m, `value set not expanded:\n${adl14}`);
  const nodes = [...adl14.matchAll(/\w\[(at\d{4})\]/g)].map((x) => x[1]);
  assert(!nodes.includes(m[1]) && !nodes.includes(m[2]), adl14);
  assert(!/value_sets\s*=/.test(adl14), "value_sets should be stripped");
  // ontology keys
  assert(
    adl14.includes('["at0000"]'),
    "ontology id keys should map",
  );
});

Deno.test("issue #116: specialised cancer CNV maps specialised codes", async () => {
  const path =
    "/workspace/openehr-genomik-templates/archetypes/drafts/openEHR-EHR-CLUSTER.genomic_copy_number_variant-cancer.v1.0.0.adls";
  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch {
    return;
  }
  const parsed = parseAdl(text);
  const adl14 = new ADL14Serializer().serialize(parsed.archetype!);
  assert(adl14.includes("[at0000.1]"), "id1.1 → at0000.1 (ADL2 spec 9.3)");
  assert(!/\[id1\.1\]/.test(adl14), "raw id1.1 should be mapped");
});

Deno.test("ADL2 spec code rule: shared id/at → 1.4 map is collision-free", async () => {
  const { buildAdl14CodeMap } = await import("../../../generation/id_to_at_code.ts");
  // Archetype converted from 1.4 (node at0000..at0002, value at0003/at0004):
  // id1..id3 and at4/at5 map back unchanged.
  const conv = buildAdl14CodeMap(["id1", "id2", "id3", "at4", "at5"]);
  assertEquals([...conv.values()], ["at0000", "at0001", "at0002", "at0003", "at0004"]);
  // Natively authored ADL2: at1/at2 would clash with id2/id3 → renumbered.
  const native = buildAdl14CodeMap(["id1", "id2", "id3", "at1", "at2"]);
  assertEquals(native.get("at1"), "at0003");
  assertEquals(native.get("at2"), "at0004");
});
