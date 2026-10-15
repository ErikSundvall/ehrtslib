/**
 * Regression for https://github.com/ErikSundvall/ehrtslib/issues/114
 *
 * Archie-serialised ADL2 uses:
 *   items cardinality matches {1..*; unordered} matches { … }
 *   archetype_id/value matches {/openEHR-EHR-CLUSTER\..+\.v1/}
 * and DV_CODED_TEXT[id] matches { defining_code matches {[ac1]} }.
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseAdl } from "../../../parser/mod.ts";
import * as openehr_am from "../../../am/openehr_am.ts";

const CARD_AND_SLOT = `archetype (adl_version=2.0.6; rm_release=1.1.0)
\topenEHR-EHR-CLUSTER.archie_forms_probe.v1.0.0

language
\toriginal_language = <[ISO_639-1::en]>

definition
\tCLUSTER[id1] matches {
\t\titems cardinality matches {1..*; unordered} matches {
\t\t\tELEMENT[id2] occurrences matches {0..1} matches {
\t\t\t\tvalue matches {
\t\t\t\t\tDV_TEXT[id3]
\t\t\t\t}
\t\t\t}
\t\t\tallow_archetype CLUSTER[id4] occurrences matches {0..*} matches {
\t\t\t\tinclude
\t\t\t\t\tarchetype_id/value matches {/openEHR-EHR-CLUSTER\\\\.address(-[a-zA-Z0-9_]+)*\\\\.v1\\\\..*/}
\t\t\t}
\t\t\tELEMENT[id5] matches {
\t\t\t\tvalue matches {
\t\t\t\t\tDV_CODED_TEXT[id6] matches {
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
\t\t\t\ttext = <"Name">
\t\t\t\tdescription = <"Name">
\t\t\t>
\t\t\t["id3"] = <
\t\t\t\ttext = <"Value">
\t\t\t\tdescription = <"Value">
\t\t\t>
\t\t\t["id4"] = <
\t\t\t\ttext = <"Address slot">
\t\t\t\tdescription = <"Address slot">
\t\t\t>
\t\t\t["id5"] = <
\t\t\t\ttext = <"Coded">
\t\t\t\tdescription = <"Coded">
\t\t\t>
\t\t\t["id6"] = <
\t\t\t\ttext = <"Code">
\t\t\t\tdescription = <"Code">
\t\t\t>
\t\t\t["ac1"] = <
\t\t\t\ttext = <"Value set">
\t\t\t\tdescription = <"Value set">
\t\t\t>
\t\t>
\t>
`;

Deno.test("issue #114: cardinality matches {…; unordered} matches parses", () => {
  const result = parseAdl(CARD_AND_SLOT);
  assert(result.archetype?.definition);
  const items = result.archetype!.definition!.attributes![0];
  assertEquals(items.rm_attribute_name, "items");
  assert(items instanceof openehr_am.C_MULTIPLE_ATTRIBUTE);
  assert(items.cardinality);
  assertEquals(items.cardinality.is_ordered, false);
  assertEquals(items.cardinality.interval?.lower, 1);
  assertEquals(items.cardinality.interval?.upper, undefined);
});

Deno.test("issue #114: archetype_id/value matches {/regex/} slot parses", () => {
  const result = parseAdl(CARD_AND_SLOT);
  const items = result.archetype!.definition!.attributes![0];
  const slot = items.children!.find((c) =>
    c instanceof openehr_am.ARCHETYPE_SLOT
  ) as openehr_am.ARCHETYPE_SLOT;
  assert(slot, "expected ARCHETYPE_SLOT child");
  assertEquals(slot.rm_type_name, "CLUSTER");
  assertEquals(slot.node_id, "id4");
  const includes = (slot as { includes?: openehr_am.ARCHETYPE_ID_CONSTRAINT[] })
    .includes;
  assert(includes && includes.length >= 1);
  const pattern = includes![0].constraint?.pattern;
  assert(pattern, "expected regex pattern on include constraint");
  assert(
    pattern.includes("openEHR-EHR-CLUSTER") && pattern.includes("address"),
    `unexpected pattern: ${pattern}`,
  );
});

Deno.test("issue #114: DV_CODED_TEXT defining_code matches {[ac1]} parses", () => {
  const result = parseAdl(CARD_AND_SLOT);
  const items = result.archetype!.definition!.attributes![0];
  const codedEl = items.children!.find((c) =>
    c instanceof openehr_am.C_COMPLEX_OBJECT && c.node_id === "id5"
  ) as openehr_am.C_COMPLEX_OBJECT;
  assert(codedEl);
  const valueAttr = codedEl.attributes!.find((a) =>
    a.rm_attribute_name === "value"
  )!;
  const dv = valueAttr.children![0] as openehr_am.C_COMPLEX_OBJECT;
  assertEquals(dv.rm_type_name, "DV_CODED_TEXT");
  const defCode = dv.attributes!.find((a) =>
    a.rm_attribute_name === "defining_code"
  )!;
  const term = defCode.children![0] as openehr_am.C_TERMINOLOGY_CODE;
  assert(term instanceof openehr_am.C_TERMINOLOGY_CODE);
  assertEquals(term.constraint, "ac1");
});

Deno.test("issue #114: CKM organisation.v1.0.4 ADL2 parses with definition", async () => {
  const path =
    "/workspace/openehr-genomik-templates/archetypes/ckm-adl2/openEHR-EHR-CLUSTER.organisation.v1.0.4.adls";
  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch {
    // Fixture may be absent outside the genomik workspace; skip quietly.
    return;
  }
  const result = parseAdl(text);
  assertEquals(result.archetype?.definition?.rm_type_name, "CLUSTER");
  assertEquals(result.archetype?.definition?.node_id, "id1");
  const items = result.archetype!.definition!.attributes![0];
  assertEquals(items.rm_attribute_name, "items");
  const slots = (items.children ?? []).filter((c) =>
    c instanceof openehr_am.ARCHETYPE_SLOT
  );
  assert(slots.length >= 1, "organisation should have archetype slots");
});

Deno.test("issue #114: specialised id0.1 / path overlay / |>0| interval parse", async () => {
  const path =
    "/workspace/openehr-genomik-templates/archetypes/drafts/openEHR-EHR-CLUSTER.genomic_copy_number_variant-cancer.v1.0.0.adls";
  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch {
    return;
  }
  const result = parseAdl(text);
  assertEquals(result.archetype?.definition?.node_id, "id1.1");
  assertEquals(
    result.archetype?.parent_archetype_id?.value,
    "openEHR-EHR-CLUSTER.genomic_copy_number_variant.v1",
  );
});
