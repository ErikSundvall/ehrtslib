/**
 * ADL2 annotations and rm_overlay section tests.
 */

import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Tokenizer } from "../../enhanced/parser/adl2_tokenizer.ts";
import { ADL2Parser } from "../../enhanced/parser/adl2_parser.ts";
import { ADL2Serializer } from "../../enhanced/generation/adl2_serializer.ts";
import {
  getAnnotationsDocumentation,
  getRmOverlayVisibility,
} from "../../enhanced/parser/aom_odin_sections.ts";

const TEST_DATA = new URL("../../test_data/", import.meta.url);

async function readTestAdl2(relativePath: string): Promise<string> {
  return await Deno.readTextFile(new URL(relativePath, TEST_DATA));
}

Deno.test("ADL2 - parse annotations and rm_overlay", async () => {
  const path = "adl2/openEHR-TEST_PKG-annotations_overlay.v1.0.0.adls";
  const text = await readTestAdl2(path);
  const result = new ADL2Parser(new ADL2Tokenizer(text).tokenize()).parse();

  const doc = getAnnotationsDocumentation(result.archetype!);
  assertEquals(doc?.en?.["/data[id2]"]?.ui, "passthrough");

  const vis = getRmOverlayVisibility(result.archetype!);
  const entry = vis?.["/data[id2]/value"] as Record<string, string> | undefined;
  assertEquals(entry?.visibility, "show");
});

Deno.test("ADL2 - annotations and rm_overlay round-trip", async () => {
  const path = "adl2/openEHR-TEST_PKG-annotations_overlay.v1.0.0.adls";
  const text = await readTestAdl2(path);
  const parsed = new ADL2Parser(new ADL2Tokenizer(text).tokenize()).parse();
  const serialized = new ADL2Serializer().serialize(parsed.archetype!);

  assertEquals(serialized.includes("annotations"), true);
  assertEquals(serialized.includes("rm_overlay"), true);
  assertEquals(serialized.includes("passthrough"), true);

  const reparsed = new ADL2Parser(new ADL2Tokenizer(serialized).tokenize())
    .parse();
  assertEquals(
    getAnnotationsDocumentation(reparsed.archetype!)?.en?.["/data[id2]"]?.ui,
    "passthrough",
  );
});
