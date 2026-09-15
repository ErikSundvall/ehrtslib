/**
 * Clinical model annotation helpers and definition tree tests.
 */

import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Tokenizer } from "../../../parser/adl2_tokenizer.ts";
import { ADL2Parser } from "../../../parser/adl2_parser.ts";
import { ADL2Serializer } from "../../../generation/adl2_serializer.ts";
import { ArchetypeRepository } from "../../../parser/legacy/archetype_repository.ts";
import {
  annotationPathOf,
  buildDefinitionTree,
  countAnnotationKeysAtPath,
  flattenDefinitionTree,
  getPathAnnotations,
  getResourceDocumentation,
  joinConstraintPath,
  listAnnotatedPaths,
  pillsAtPath,
  removePathAnnotation,
  setPathAnnotation,
} from "../../../parser/mod.ts";

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
  const got = getPathAnnotations(
    getResourceDocumentation(archetype),
    "/data[id2]",
  );
  assertEquals(got.comment, "test note");
  assertEquals(
    countAnnotationKeysAtPath(
      getResourceDocumentation(archetype),
      "/data[id2]",
    ),
    2,
  );

  removePathAnnotation(archetype, "/data[id2]", "comment", "en");
  assertEquals(
    getPathAnnotations(getResourceDocumentation(archetype), "/data[id2]")
      .comment,
    undefined,
  );
});

Deno.test("buildDefinitionTree marks annotated paths", async () => {
  const path = "adl2/openEHR-TEST_PKG-annotations_overlay.v1.0.0.adls";
  const text = await readTestAdl2(path);
  const parsed = new ADL2Parser(new ADL2Tokenizer(text).tokenize()).parse();
  const archetype = parsed.archetype!;
  const tree = buildDefinitionTree(archetype);

  assertEquals(tree?.label.includes("WHOLE"), true);
  assertEquals(
    listAnnotatedPaths(getResourceDocumentation(archetype)).includes(
      "/data[id2]",
    ),
    true,
  );

  const serialized = new ADL2Serializer().serialize(archetype);
  assertEquals(
    serialized.includes("test note") || serialized.includes("passthrough"),
    true,
  );
});

Deno.test("buildDefinitionTree grafts overlay children and L10n pills", async () => {
  const text = await Deno.readTextFile(
    new URL("tjson/Care unit v2.t.json", TEST_DATA),
  );
  const repo = new ArchetypeRepository();
  const loaded = repo.loadFile("Care unit v2.t.json", text);
  const template = repo.getTemplate(loaded.archetypeId ?? "");
  assertEquals(!!template, true);
  const tree = buildDefinitionTree(template!, {
    resolveArchetype: (id) => repo.get(id),
  });
  assertEquals(!!tree, true);
  const nodes = flattenDefinitionTree(tree!);
  const grafted = nodes.find((n) =>
    n.overlayId?.includes("ovl-organisation") &&
    (n.annotationPath === "/items[at0003.1]" ||
      n.path.endsWith("/items[at0003.1]"))
  );
  assertEquals(!!grafted, true);
  const overlay = repo.get(grafted!.overlayId!);
  const pills = pillsAtPath(
    getResourceDocumentation(overlay!),
    annotationPathOf(grafted!),
  );
  assertEquals(
    pills.some((p) => p.key === "L10n.en" && p.language === "en"),
    true,
  );
  assertEquals(
    pills.some((p) => p.key === "L10n.de" && p.language === "sv"),
    true,
  );
});
