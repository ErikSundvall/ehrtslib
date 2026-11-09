import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  buildMetadataPanelHtml,
  splitAsciidocForDocumentView,
  splitMarkdownForDocumentView,
} from "./document-view-split.ts";

Deno.test("splitMarkdownForDocumentView pulls YAML front matter out of body", () => {
  const source = `---
uid: abc-123
template_id: tmpl.v1
---

# Clinical note

Body text.
`;
  const { metadata, body } = splitMarkdownForDocumentView(source);
  assertEquals(metadata.uid, "abc-123");
  assertEquals(metadata.template_id, "tmpl.v1");
  assertStringIncludes(body, "# Clinical note");
  assertEquals(body.trimStart().startsWith("---"), false);
});

Deno.test("buildMetadataPanelHtml returns empty when no keys", () => {
  assertEquals(buildMetadataPanelHtml({}), "");
});
