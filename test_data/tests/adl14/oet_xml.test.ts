/**
 * OET XML parse tests.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOetXml, isOetXml } from "../../enhanced/parser/legacy/oet_xml_parser.ts";

const OET_DIR = new URL("../../test_data/oet14/", import.meta.url);

Deno.test("isOetXml distinguishes OET from OPT", async () => {
  const opt = await Deno.readTextFile(new URL("../opt14/minimal_evaluation.opt", OET_DIR));
  assertEquals(isOetXml(opt), false);
});

Deno.test("parseOetXml - Imaging.oet when present", async () => {
  const path = new URL("Imaging.oet", OET_DIR);
  try {
    await Deno.stat(path);
  } catch {
    console.warn("Skip: run download_fixtures.ts to fetch oet14/");
    return;
  }
  const xml = await Deno.readTextFile(path);
  assertEquals(isOetXml(xml), true);
  const { document } = parseOetXml(xml);
  assertEquals(document.definitionArchetypeId?.includes("OBSERVATION"), true);
  assert(document.items.length > 0 || document.rules.length > 0);
});
