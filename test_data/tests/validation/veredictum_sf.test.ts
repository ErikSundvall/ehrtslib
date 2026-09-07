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

/** Veredictum FLAT keys use the concept id (`vitals/…`); ehrtslib uses template_id (`cnf.vitals/…`). */
function withWebTemplateRoot(
  payload: Record<string, unknown>,
  rootId: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (
      key.startsWith("ctx/") || key.startsWith(`${rootId}/`) ||
      key.startsWith(`${rootId}|`)
    ) {
      out[key] = value;
      continue;
    }
    const slash = key.indexOf("/");
    const rest = slash >= 0 ? key.slice(slash) : `/${key}`;
    out[`${rootId}${rest}`] = value;
  }
  return out;
}

/** Veredictum FLAT omits HISTORY `data`; ehrtslib web templates keep it. */
function adaptVitalsFlat(
  payload: Record<string, unknown>,
  rootId: string,
): Record<string, unknown> {
  const withRoot = withWebTemplateRoot(payload, rootId);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(withRoot)) {
    if (key.startsWith("ctx/")) {
      out[key] = value;
      continue;
    }
    out[key.replace(
      /^([^/]+\/body_temperature(?::\d+)?)\/(any_event)/,
      "$1/data/$2",
    )] = value;
  }
  return out;
}

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
  const rootId = wt.tree.id;
  const rejects = [
    "flat.cardinality_violation.json",
    "flat.vitals.unknown_field.json",
  ];
  const accepted: string[] = [];
  const reasons: string[] = [];
  for (const file of rejects) {
    const payload = adaptVitalsFlat(await loadJson(file), rootId);
    const result = validateFlatPayload(payload as never, wt, {
      strictUnknownKeys: true,
    });
    if (result.valid) accepted.push(file);
    else reasons.push(`${file}: ${result.errors.map((e) => e.message).join("; ")}`);
  }
  console.log(reasons.join("\n"));
  assertEquals(accepted, [], `expected FLAT rejection: ${accepted.join(", ")}`);
});

Deno.test("Veredictum SF — FLAT valid vitals payload is accepted", async () => {
  const xml = await Deno.readTextFile(
    new URL("templates/vitals.opt", VEREDICTUM_ROOT),
  );
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate);
  const payload = adaptVitalsFlat(
    await loadJson("flat.multi_event.json"),
    wt.tree.id,
  );
  for (const key of Object.keys(payload)) {
    if (/\/time$/.test(key)) delete payload[key];
  }
  const result = validateFlatPayload(payload as never, wt, {
    strictUnknownKeys: true,
  });
  if (!result.valid) {
    console.log(result.errors);
  }
  assert(result.valid, result.errors.map((e) => e.message).join("; "));
  assertEquals(wt.tree.rmType, "COMPOSITION");
});
