/**
 * OPT XML serialize → parse round-trip tests.
 */

import { assert, assertEquals, assertStringIncludes } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../../parser/mod.ts";
import { OptXmlSerializer } from "../../../generation/opt_xml_serializer.ts";
import type { OperationalTemplateWithTermScopes } from "../../../generation/term_scope.ts";

const TEST_DATA = new URL("../../opt14/", import.meta.url);

Deno.test("OPT XML round-trip - minimal_evaluation", async () => {
  const original = await Deno.readTextFile(new URL("minimal_evaluation.opt", TEST_DATA));
  const { operationalTemplate } = parseOptXml(original);
  const xml = new OptXmlSerializer().serialize(operationalTemplate);
  assert(xml.includes("<template"));
  assert(xml.includes("minimal_evaluation.en.v1"));

  const reparsed = parseOptXml(xml);
  assertEquals(
    reparsed.operationalTemplate.definition?.rm_type_name,
    operationalTemplate.definition?.rm_type_name,
  );
  assertEquals(
    reparsed.operationalTemplate.archetype_id?.value,
    operationalTemplate.archetype_id?.value,
  );
});

Deno.test("OPT XML round-trip - sample from opt14 corpus", async () => {
  const serializer = new OptXmlSerializer();
  let count = 0;
  for await (const entry of Deno.readDir(TEST_DATA)) {
    if (!entry.name.endsWith(".opt")) continue;
    const original = await Deno.readTextFile(new URL(entry.name, TEST_DATA));
    const first = parseOptXml(original);
    const xml = serializer.serialize(first.operationalTemplate);
    const second = parseOptXml(xml);
    assertEquals(
      second.operationalTemplate.definition?.rm_type_name,
      first.operationalTemplate.definition?.rm_type_name,
    );
    count++;
    if (count >= 5) break;
  }
  assert(count >= 1);
});

Deno.test("OPT XML serialize emits C_ARCHETYPE_ROOT and per-root term_definitions", async () => {
  const original = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", TEST_DATA),
  );
  const { operationalTemplate } = parseOptXml(original);
  const xml = new OptXmlSerializer().serialize(operationalTemplate);

  assertStringIncludes(xml, 'xsi:type="C_ARCHETYPE_ROOT"');
  assertStringIncludes(xml, "openEHR-EHR-CLUSTER.sample_device.v1");
  assertStringIncludes(xml, 'code="at0001"');
  assertStringIncludes(xml, "Device details (training sample)");

  const reparsed = parseOptXml(xml);
  const scoped = (reparsed.operationalTemplate as OperationalTemplateWithTermScopes)
    .archetype_term_definitions ?? {};
  assertEquals(
    scoped["openEHR-EHR-CLUSTER.sample_device.v1"]?.en?.at0001?.text,
    "Name",
  );
  assertEquals(
    scoped["openEHR-EHR-OBSERVATION.sample_blood_pressure.v1"]?.en?.at0001?.text,
    "history",
  );
});

