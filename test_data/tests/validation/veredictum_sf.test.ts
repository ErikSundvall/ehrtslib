/**
 * Veredictum simplified-format reject/accept fixtures vs validateFlatPayload.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  validateFlatPayload,
} from "../../../serialization/simplified/mod.ts";
import { VEREDICTUM_ROOT } from "./veredictum_harness.ts";

async function loadJson(name: string): Promise<Record<string, unknown>> {
  const text = await Deno.readTextFile(
    new URL(`sf/${name}`, VEREDICTUM_ROOT),
  );
  return JSON.parse(text) as Record<string, unknown>;
}

Deno.test("Veredictum SF — FLAT reject fixtures", async () => {
  const xml = await Deno.readTextFile(
    new URL("templates/vitals.opt", VEREDICTUM_ROOT),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate);
  const rejects = [
    "flat.cardinality_violation.json",
    "flat.vitals.unknown_field.json",
  ];
  const accepted: string[] = [];
  for (const file of rejects) {
    const payload = await loadJson(file);
    const result = validateFlatPayload(payload as never, wt, {
      strictUnknownKeys: true,
    });
    if (result.valid) accepted.push(file);
  }
  assertEquals(accepted, [], `expected FLAT rejection: ${accepted.join(", ")}`);
});

Deno.test("Veredictum SF — FLAT valid vitals payload is accepted", async () => {
  const xml = await Deno.readTextFile(
    new URL("templates/vitals.opt", VEREDICTUM_ROOT),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate);
  const payload = await loadJson("flat.multi_event.json");
  const result = validateFlatPayload(payload as never, wt, {
    strictUnknownKeys: true,
  });
  if (!result.valid) {
    console.log(result.errors);
  }
  assert(result.valid, result.errors.map((e) => e.message).join("; "));
  assertEquals(wt.tree.rmType, "COMPOSITION");
});
