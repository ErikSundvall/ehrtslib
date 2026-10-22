/**
 * Regression for https://github.com/ErikSundvall/ehrtslib/issues/115
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseAdl } from "../../../parser/mod.ts";
import { ADL14Serializer } from "../../../generation/adl14_serializer.ts";
import { GENOMIC_CNV_CANCER_ADL2 } from "../fixtures/adl2_issue155.ts";

const BILINGUAL = `archetype (adl_version=2.0.6; rm_release=1.1.0)
\topenEHR-EHR-CLUSTER.header_probe.v1.0.0

specialize
\topenEHR-EHR-CLUSTER.header_parent.v1

language
\toriginal_language = <[ISO_639-1::en]>
\ttranslations = <
\t\t["sv"] = <
\t\t\tlanguage = <[ISO_639-1::sv]>
\t\t\tauthor = <
\t\t\t\t["name"] = <"Test Author">
\t\t\t>
\t\t>
\t>

description
\toriginal_author = <
\t\t["name"] = <"Tester">
\t\t["organisation"] = <"Org">
\t>
\tlifecycle_state = <"unmanaged">
\tdetails = <
\t\t["en"] = <
\t\t\tlanguage = <[ISO_639-1::en]>
\t\t\tpurpose = <"Purpose">
\t\t>
\t\t["sv"] = <
\t\t\tlanguage = <[ISO_639-1::sv]>
\t\t\tpurpose = <"Syfte">
\t\t>
\t>

definition
\tCLUSTER[id1] matches {
\t\titems cardinality matches {1..*; unordered} matches {
\t\t\tELEMENT[id2] matches {
\t\t\t\tvalue matches {
\t\t\t\t\tDV_TEXT[id3]
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
\t\t\t\ttext = <"Item">
\t\t\t\tdescription = <"Item">
\t\t\t>
\t\t\t["id3"] = <
\t\t\t\ttext = <"Value">
\t\t\t\tdescription = <"Value">
\t\t\t>
\t\t>
\t\t["sv"] = <
\t\t\t["id1"] = <
\t\t\t\ttext = <"Prob">
\t\t\t\tdescription = <"Prob">
\t\t\t>
\t\t\t["id2"] = <
\t\t\t\ttext = <"Objekt">
\t\t\t\tdescription = <"Objekt">
\t\t\t>
\t\t\t["id3"] = <
\t\t\t\ttext = <"Värde">
\t\t\t\tdescription = <"Värde">
\t\t\t>
\t\t>
\t>
`;

Deno.test("issue #115: ADL14Serializer emits concept, language, specialize, quoted ODIN", () => {
  const parsed = parseAdl(BILINGUAL);
  assert(parsed.archetype);
  assertEquals(
    parsed.archetype!.parent_archetype_id?.value,
    "openEHR-EHR-CLUSTER.header_parent.v1",
  );

  const adl14 = new ADL14Serializer().serialize(parsed.archetype!);
  assert(adl14.split('\n').some(l => /^concept\b/.test(l)), "missing concept section");
  assert(adl14.includes("[at0001]"), `concept/at codes missing:\n${adl14.slice(0, 400)}`);
  assert(adl14.split('\n').some(l => /^specialize\b/.test(l)), "missing specialize");
  assert(
    adl14.includes("openEHR-EHR-CLUSTER.header_parent.v1"),
    "parent id lost",
  );
  assert(adl14.split('\n').some(l => /^language\b/.test(l)), "missing language");
  assert(
    adl14.includes("[ISO_639-1::en]"),
    `language code phrase missing:\n${adl14.slice(0, 500)}`,
  );
  assert(adl14.includes('["sv"]'), "sv translation missing");
  assert(
    adl14.includes('["name"]'),
    `original_author keys not quoted:\n${adl14.slice(0, 800)}`,
  );
  assert(adl14.includes('["sv"] = <') || adl14.includes("Prob"), "sv terms");
});

Deno.test("issue #115: specialised bilingual draft keeps specialize + sv", async () => {
  const text = await Deno.readTextFile(GENOMIC_CNV_CANCER_ADL2);
  const parsed = parseAdl(text);
  const adl14 = new ADL14Serializer().serialize(parsed.archetype!);
  assert(adl14.split('\n').some(l => /^concept\b/.test(l)));
  assert(adl14.split('\n').some(l => /^specialize\b/.test(l)));
  assert(adl14.split('\n').some(l => /^language\b/.test(l)));
  assert(adl14.includes("[ISO_639-1::en]"));
  assert(adl14.includes("sv") || adl14.includes('["sv"]'));
});
