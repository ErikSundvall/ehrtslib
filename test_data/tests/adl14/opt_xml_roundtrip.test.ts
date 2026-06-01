/**
 * OPT XML serialize → parse round-trip tests.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../enhanced/parser/mod.ts";
import { OptXmlSerializer } from "../../enhanced/generation/opt_xml_serializer.ts";

const TEST_DATA = new URL("../../test_data/opt14/", import.meta.url);

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
