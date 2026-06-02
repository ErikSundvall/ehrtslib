/**
 * Better Archetype Designer `.t.json` parser tests.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.220.0/path/mod.ts";
import {
  ArchetypeRepository,
  isTemplateJson,
  parseTemplateJson,
} from "../../../enhanced/parser/mod.ts";

const CARE_UNIT = fromFileUrl(
  new URL("../../tjson/Care unit v2.t.json", import.meta.url),
);

Deno.test("isTemplateJson detects Archetype Designer TEMPLATE JSON", async () => {
  const text = await Deno.readTextFile(CARE_UNIT);
  assert(isTemplateJson(text));
});

Deno.test("parseTemplateJson loads template and overlays", async () => {
  const text = await Deno.readTextFile(CARE_UNIT);
  const { template, overlays } = parseTemplateJson(text);
  assertEquals(template.archetype_id?.value, "openEHR-EHR-CLUSTER.t_organisation.v1");
  assert(template.definition);
  assert(overlays.length >= 1);
  assertEquals(
    overlays[0].archetype_id?.value,
    "openEHR-EHR-CLUSTER.ovl-organisation-000.v1",
  );
});

Deno.test("ArchetypeRepository.loadFile classifies .t.json as template_json", async () => {
  const text = await Deno.readTextFile(CARE_UNIT);
  const repo = new ArchetypeRepository();
  const result = repo.loadFile("local/Care unit v2.t.json", text);
  assertEquals(result.kind, "template_json");
  assert(repo.getTemplate("openEHR-EHR-CLUSTER.t_organisation.v1"));
});
