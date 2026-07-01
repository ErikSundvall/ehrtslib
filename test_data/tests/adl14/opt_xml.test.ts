/**
 * ADL 1.4 OPT XML parse tests — test_data/opt14/
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../enhanced/parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "../../enhanced/generation/rm_instance_generator.ts";

const OPT_DIR = new URL("../../test_data/opt14/", import.meta.url);

async function listOptFiles(): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(OPT_DIR)) {
    if (entry.isFile && entry.name.endsWith(".opt")) files.push(entry.name);
  }
  return files.sort();
}

Deno.test("parseOptXml - all test_data/opt14 fixtures", async () => {
  const files = await listOptFiles();
  assert(files.length >= 15, `expected >=15 OPT files, got ${files.length}`);

  const failures: string[] = [];
  for (const name of files) {
    const xml = await Deno.readTextFile(new URL(name, OPT_DIR));
    try {
      const { operationalTemplate } = parseOptXml(xml);
      assert(operationalTemplate.definition?.rm_type_name, `${name}: missing root rm_type`);
      assert(operationalTemplate.archetype_id?.value, `${name}: missing template/archetype id`);
    } catch (e) {
      failures.push(`${name}: ${(e as Error).message}`);
    }
  }

  if (failures.length) {
    throw new Error(`OPT parse failures (${failures.length}/${files.length}):\n` +
      failures.join("\n"));
  }
});

Deno.test("parseOptXml - minimal_evaluation generates instance", async () => {
  const xml = await Deno.readTextFile(new URL("minimal_evaluation.opt", OPT_DIR));
  const { operationalTemplate } = parseOptXml(xml);
  const gen = new RMInstanceGenerator({ mode: "minimal" });
  const instance = gen.generate(operationalTemplate);
  assertEquals(instance._type, "COMPOSITION");
});

Deno.test("parseOptXml - blood pressure template structure", async () => {
  const xml = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", OPT_DIR),
  );
  const { operationalTemplate } = parseOptXml(xml);
  assertEquals(operationalTemplate.definition?.rm_type_name, "COMPOSITION");
  const content = operationalTemplate.definition?.attributes?.find(
    (a) => a.rm_attribute_name === "content",
  );
  assert(content, "expected content attribute");
});

Deno.test("parseOptXml - blood pressure terminology uses archetype text not RM type names", async () => {
  const xml = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", OPT_DIR),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const terms = operationalTemplate.ontology?.term_definitions?.en;
  assert(terms?.at0005?.text, "expected parsed term text for at0005");
  assert(
    terms.at0005.text !== "[object Object]",
    "term text must not be a broken object stringification",
  );
  assertEquals(terms.at0005.text, "Diastolic");

  const instance = new RMInstanceGenerator({ mode: "example" }).generate(
    operationalTemplate,
  );
  const observation = instance.content?.[0];
  assertEquals(observation?._type, "OBSERVATION");
  assertEquals(
    observation?.name?.value,
    "Blood pressure (Training sample)",
    "observation name should come from template terminology",
  );
});
