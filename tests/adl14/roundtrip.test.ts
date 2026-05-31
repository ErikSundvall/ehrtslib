/**
 * ADL 1.4 round-trip and template input detection tests.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  parseAdl,
  parseTemplateInput,
  detectTemplateInputFormat,
} from "../../enhanced/parser/mod.ts";
import {
  ADL14Serializer,
  adl14RoundTripMetrics,
} from "../../enhanced/generation/adl14_serializer.ts";
import { ArchetypeValidator } from "../../enhanced/validation/archetype_validator.ts";

const TEST_DATA = new URL("../../test_data/", import.meta.url);

Deno.test("detectTemplateInputFormat - OPT XML", async () => {
  const xml = await Deno.readTextFile(new URL("opt14/minimal_evaluation.opt", TEST_DATA));
  assertEquals(detectTemplateInputFormat(xml), "opt_xml");
});

Deno.test("parseTemplateInput - OPT returns operational_template", async () => {
  const xml = await Deno.readTextFile(new URL("opt14/minimal_evaluation.opt", TEST_DATA));
  const result = parseTemplateInput(xml);
  assertEquals(result.format, "opt_xml");
  assertEquals(result.kind, "operational_template");
  assert(result.operationalTemplate?.definition);
});

Deno.test("ADL 1.4 round-trip - most_minimal fixture", async () => {
  const original = await Deno.readTextFile(
    new URL("adl14/openEHR-TEST_PKG-WHOLE.most_minimal.v1.adl", TEST_DATA),
  );
  const parsed = parseAdl(original);
  assert(parsed.archetype);

  const serializer = new ADL14Serializer();
  const adl14 = serializer.serialize(parsed.archetype!);
  const metrics = adl14RoundTripMetrics(original, adl14);

  assert(adl14.includes("ontology"));
  assert(adl14.includes("[at0001]"));
  assert(metrics.nodeIdAtCodes >= 1);

  const reparsed = parseAdl(adl14);
  assertEquals(reparsed.archetype?.definition?.rm_type_name, "WHOLE");
  const check = new ArchetypeValidator().validate(reparsed.archetype!);
  assertEquals(check.valid, true);
});
