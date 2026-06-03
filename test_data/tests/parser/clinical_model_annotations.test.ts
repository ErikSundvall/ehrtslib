/**
 * Clinical model annotation helpers and definition tree tests.
 */

import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Tokenizer } from "../../../enhanced/parser/adl2_tokenizer.ts";
import { ADL2Parser } from "../../../enhanced/parser/adl2_parser.ts";
import { ADL2Serializer } from "../../../enhanced/generation/adl2_serializer.ts";
import {
  buildDefinitionTree,
  countAnnotationKeysAtPath,
  getPathAnnotations,
  getResourceDocumentation,
  joinConstraintPath,
  listAnnotatedPaths,
  removePathAnnotation,
  setPathAnnotation,
} from "../../../enhanced/parser/clinical_model_annotations.ts";

const TEST_DATA = new URL("../../", import.meta.url);

async function readTestAdl2(relativePath: string): Promise<string> {
  return await Deno.readTextFile(new URL(relativePath, TEST_DATA));
}

Deno.test("joinConstraintPath builds openEHR paths", () => {
  assertEquals(joinConstraintPath("", "data", "id2"), "/data[id2]");
  assertEquals(
    joinConstraintPath("/data[id2]", "items", "id3"),
    "/data[id2]/items[id3]",
  );
});

Deno.test("setPathAnnotation and getPathAnnotations round-trip", async () => {
  const path = "adl2/openEHR-TEST_PKG-annotations_overlay.v1.0.0.adls";
  const text = await readTestAdl2(path);
  const parsed = new ADL2Parser(new ADL2Tokenizer(text).tokenize()).parse();
  const archetype = parsed.archetype!;

  setPathAnnotation(archetype, "/data[id2]", "comment", "test note", "en");
  const got = getPathAnnotations(getResourceDocumentation(archetype), "/data[id2]");
  assertEquals(got.comment, "test note");
  assertEquals(countAnnotationKeysAtPath(getResourceDocumentation(archetype), "/data[id2]"), 2);

  removePathAnnotation(archetype, "/data[id2]", "comment", "en");
  assertEquals(
    getPathAnnotations(getResourceDocumentation(archetype), "/data[id2]").comment,
    undefined,
  );
});

Deno.test("buildDefinitionTree marks annotated paths", async () => {
  const path = "adl2/openEHR-TEST_PKG-annotations_overlay.v1.0.0.adls";
  const text = await readTestAdl2(path);
  const parsed = new ADL2Parser(new ADL2Tokenizer(text).tokenize()).parse();
  const archetype = parsed.archetype!;
  const tree = buildDefinitionTree(archetype, { labelMode: "id" });

  assertEquals(tree?.labelId.includes("WHOLE"), true);
  assertEquals(listAnnotatedPaths(getResourceDocumentation(archetype)).includes("/data[id2]"), true);

  const serialized = new ADL2Serializer().serialize(archetype);
  assertEquals(serialized.includes("test note") || serialized.includes("passthrough"), true);
});
