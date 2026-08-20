/**
 * Simplified format tests — Web Template, FLAT, STRUCTURED.
 */

import { assert, assertEquals, assertExists } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "../../../../generation/rm_instance_generator.ts";
import {
  buildWebTemplate,
  serializeToFlat,
  serializeToFlatJson,
  serializeToStructured,
  validateFlatPayload,
} from "../../../../serialization/simplified/mod.ts";

const OPT_DIR = new URL("../../../opt14/", import.meta.url);

Deno.test("buildWebTemplate - minimal_evaluation", async () => {
  const xml = await Deno.readTextFile(new URL("minimal_evaluation.opt", OPT_DIR));
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate);

  assertEquals(wt.templateId, "minimal_evaluation.en.v1");
  assertExists(wt.tree);
  assertEquals(wt.tree.rmType, "COMPOSITION");
});

Deno.test("serializeToFlat - minimal_evaluation instance", async () => {
  const xml = await Deno.readTextFile(new URL("minimal_evaluation.opt", OPT_DIR));
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate);
  const instance = new RMInstanceGenerator({ mode: "maximal" }).generate(operationalTemplate);

  const flat = serializeToFlat(instance, wt);
  assertEquals(flat["ctx/language"], "en");
  assertEquals(flat["ctx/territory"], "US");
  assert("ctx/composer_name" in flat);

  const json = serializeToFlatJson(instance, wt, { prettyPrint: true });
  assert(json.includes("ctx/language"));
});

Deno.test("serializeToStructured - minimal_evaluation instance", async () => {
  const xml = await Deno.readTextFile(new URL("minimal_evaluation.opt", OPT_DIR));
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate);
  const instance = new RMInstanceGenerator({ mode: "maximal" }).generate(operationalTemplate);

  const structured = serializeToStructured(instance, wt);
  assert("minimal_evaluation" in structured || "ctx" in structured);
});

Deno.test("validateFlatPayload - round-trip keys", async () => {
  const xml = await Deno.readTextFile(new URL("minimal_evaluation.opt", OPT_DIR));
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate);
  const instance = new RMInstanceGenerator({ mode: "maximal" }).generate(operationalTemplate);
  const flat = serializeToFlat(instance, wt);

  const result = validateFlatPayload(flat, wt);
  assertEquals(result.errors.length, 0);
});

Deno.test("buildWebTemplate - blood pressure template", async () => {
  const xml = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", OPT_DIR),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate);
  const instance = new RMInstanceGenerator({ mode: "minimal" }).generate(operationalTemplate);
  const flat = serializeToFlat(instance, wt);

  assert(wt.tree.children?.some((c) => !c.inContext));
  assert("ctx/language" in flat || Object.keys(flat).length > 0);
});

function walkWebTemplateNodes(
  node: { nodeId?: string; name?: string; children?: unknown[] },
  visit: (n: { nodeId?: string; name?: string }) => void,
): void {
  visit(node);
  for (const child of node.children ?? []) {
    walkWebTemplateNodes(child as { nodeId?: string; name?: string; children?: unknown[] }, visit);
  }
}

Deno.test("buildWebTemplate - colliding at0001 names stay archetype-local", async () => {
  const xml = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", OPT_DIR),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate);

  const pairs: Array<{ nodeId: string; name?: string }> = [];
  walkWebTemplateNodes(wt.tree, (n) => {
    if (n.nodeId) pairs.push({ nodeId: n.nodeId, name: n.name });
  });

  assertEquals(
    pairs.find((p) =>
      p.nodeId === "openEHR-EHR-OBSERVATION.sample_blood_pressure.v1"
    )?.name,
    "Blood pressure (Training sample)",
  );
  // Composition and observation both use at0000; scoped lookup must not
  // rename the composition to the observation rubric.
  assertEquals(wt.tree.name, "Encounter (training sample)");
  assert(
    pairs.some((p) => p.nodeId === "at0004" && p.name === "Systolic"),
    "expected systolic element from the observation terminology",
  );
});

