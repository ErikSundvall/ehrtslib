/**
 * Veredictum composition fixtures vs ehrtslib RM / template validation.
 *
 * Invalid payloads that encode RM/AM semantic errors should be rejected.
 * Happy-path minimal_event.v2 should be accepted against the matching OPT.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import {
  TemplateValidator,
} from "../../../validation/template_validator.ts";
import { VEREDICTUM_ROOT } from "./veredictum_harness.ts";

const REJECT_FIXTURES: Array<{ file: string; reason: string }> = [
  {
    file: "minimal_event.category_invalid.json",
    reason: "COMPOSITION.category 999 is not in composition_category",
  },
  {
    file: "minimal_event.setting_invalid.json",
    reason: "EVENT_CONTEXT.setting out of group",
  },
  {
    file: "minimal_event.language_invalid.json",
    reason: "invalid language code",
  },
  {
    file: "minimal_event.territory_invalid.json",
    reason: "invalid territory code",
  },
  {
    file: "minimal_event.missing_mandatory.json",
    reason: "missing RM-mandatory attributes",
  },
  {
    file: "minimal_event.root_archetype_id_mismatch.json",
    reason: "root archetype_id mismatch",
  },
];

async function loadJson(name: string): Promise<Record<string, unknown>> {
  const text = await Deno.readTextFile(
    new URL(`compositions/${name}`, VEREDICTUM_ROOT),
  );
  return JSON.parse(text) as Record<string, unknown>;
}

Deno.test("Veredictum RM fixtures — invalid compositions are rejected", async () => {
  const xml = await Deno.readTextFile(
    new URL("templates/minimal_event.opt", VEREDICTUM_ROOT),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const validator = new TemplateValidator({
    validateUnits: false,
    validateIntervals: false,
    validateRMSpecification: true,
    validateTerminology: true,
  });
  const accepted: string[] = [];
  for (const { file, reason } of REJECT_FIXTURES) {
    const instance = await loadJson(file);
    const result = validator.validate(instance, operationalTemplate);
    if (result.valid) accepted.push(`${file} (${reason})`);
  }
  assertEquals(
    accepted,
    [],
    `expected RM/AM rejection:\n${accepted.join("\n")}`,
  );
});

Deno.test("Veredictum RM fixtures — valid minimal_event.v2 is accepted", async () => {
  const xml = await Deno.readTextFile(
    new URL("templates/minimal_event.opt", VEREDICTUM_ROOT),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const instance = await loadJson("minimal_event.v2.json");
  const result = new TemplateValidator({
    validateUnits: false,
    validateIntervals: false,
    validateRMSpecification: true,
  }).validate(instance, operationalTemplate);
  if (!result.valid) {
    console.log(result.errors);
  }
  assert(result.valid, result.errors.map((e) => e.message).join("; "));
});
