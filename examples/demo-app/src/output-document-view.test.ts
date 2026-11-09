import { assert, assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
import { Window } from "npm:happy-dom@21.0.4";

const happyDomWindow = new Window();
(globalThis as unknown as { window: Window }).window = happyDomWindow;
(globalThis as unknown as { document: Document }).document =
  happyDomWindow.document;
import {
  isRenderableOutputFormat,
  stripAsciidocDisplayComments,
  stripMarkdownDisplayComments,
} from "./output-render-sources.ts";
import { renderMarkdownDocumentHtml } from "./output-document-view-markdown.ts";
import {
  formatKeysWithDocumentToggle,
  initOutputDocumentViews,
  outputDocumentViewShowsToggle,
} from "./output-document-view.ts";

Deno.test("stripMarkdownDisplayComments removes HTML node-id annotations", () => {
  const input = "# Vitals <!-- openEHR-EHR-OBSERVATION.v1 -->\n\nLine";
  const out = stripMarkdownDisplayComments(input);
  assertEquals(out, "# Vitals \n\nLine");
  assertFalse(out.includes("<!--"));
});

Deno.test("stripAsciidocDisplayComments removes // lines and trailing node ids", () => {
  const input = `= Title
// openEHR Composition
== Section
* Systolic: 120 // at0004
`;
  const out = stripAsciidocDisplayComments(input);
  assertFalse(out.includes("// openEHR"));
  assertFalse(out.includes("// at0004"));
  assertStringIncludes(out, "Systolic: 120");
});

Deno.test("isRenderableOutputFormat matches serializer outputs with document views", () => {
  assert(isRenderableOutputFormat("markdown"));
  assert(isRenderableOutputFormat("asciidoc"));
  assert(isRenderableOutputFormat("zipehr.html5.emoji"));
  assert(isRenderableOutputFormat("opt.html5.short"));
  assertFalse(isRenderableOutputFormat("json"));
  assertFalse(isRenderableOutputFormat("yaml"));
});

Deno.test("markdown pipeline strips comments and markdown-it emits GFM tables", async () => {
  const md = `| A | B |
|---|---|
| 1 | 2 | <!-- at0001 -->`;
  const cleaned = stripMarkdownDisplayComments(md);
  assertFalse(cleaned.includes("<!--"));
  const MarkdownIt = (await import("markdown-it")).default;
  const rendered = new MarkdownIt("default", { html: false, linkify: true })
    .render(cleaned);
  assertStringIncludes(rendered, "<table");
  assertStringIncludes(rendered, "<td");
  const html = await renderMarkdownDocumentHtml(md);
  assertFalse(html.includes("at0001"));
  assertFalse(html.includes("<!--"));
});

Deno.test("document view toggle appears only for renderable output hosts", () => {
  happyDomWindow.document.body.innerHTML = `
    <div class="editor-block">
      <div class="output-info"></div>
      <div id="output-json-content" class="demo-editor-host"></div>
    </div>
    <div class="editor-block">
      <div class="output-info"></div>
      <div id="output-markdown-content" class="demo-editor-host"></div>
    </div>
  `;

  initOutputDocumentViews();

  assertFalse(outputDocumentViewShowsToggle("json"));
  assert(outputDocumentViewShowsToggle("markdown"));
  assertEquals(formatKeysWithDocumentToggle().includes("markdown"), true);
  assertEquals(formatKeysWithDocumentToggle().includes("json"), false);
});
