import { assertEquals } from "jsr:@std/assert";
import { relativeImportClosure } from "../../../scripts/library_package.ts";
import { join, dirname } from "jsr:@std/path";

const root = join(dirname(new URL(import.meta.url).pathname), "../../..");

Deno.test("default mod.ts closure excludes optional Markdown/AsciiDoc codecs", async () => {
  const closure = await relativeImportClosure(root, ["mod.ts"]);
  const hits = [...closure].filter((rel) =>
    rel.startsWith("serialization/markdown/") ||
    rel.startsWith("serialization/asciidoc/") ||
    rel.startsWith("serialization/documents_common/")
  );
  assertEquals(hits, []);
});

Deno.test("optional markdown entry includes codec tree", async () => {
  const closure = await relativeImportClosure(root, ["serialization/markdown/mod.ts"]);
  assertEquals(closure.has("serialization/markdown/markdown_serializer.ts"), true);
  assertEquals(closure.has("serialization/documents_common/document_to_rm.ts"), true);
});
