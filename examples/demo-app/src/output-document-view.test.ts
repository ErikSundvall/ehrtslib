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
import {
  preprocessMarkdownWikilinks,
  renderMarkdownDocumentHtml,
} from "./output-document-view-markdown.ts";
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

Deno.test("wikilink preprocessor yields GFM links without stray brackets", () => {
  const md = "Term [[SNOMED-CT::73211009|Diabetes mellitus]] in text.";
  const out = preprocessMarkdownWikilinks(md);
  assertStringIncludes(out, "[Diabetes mellitus](SNOMED-CT::73211009)");
  assertEquals(out.includes("[["), false);
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

Deno.test("wikilink markdown renders as anchor in document HTML", async () => {
  const md = "# Note\n\n- Dx: [[SNOMED-CT::44054006|Type 2 diabetes]]";
  const html = await renderMarkdownDocumentHtml(md);
  assertStringIncludes(html, "<a ");
  assertStringIncludes(html, "Type 2 diabetes");
  assertEquals(html.includes("[["), false);
});

Deno.test("document view: front matter in metadata panel not setext heading", async () => {
  const source = `---
uid: x1
---

# Title

Paragraph.
`;
  const html = await renderMarkdownDocumentHtml(source);
  assertStringIncludes(html, "doc-metadata-panel");
  assertStringIncludes(html, "x1");
  assertEquals(html.includes("<h1>uid:"), false);
  assertStringIncludes(html, "Title");
});

Deno.test("document view: asciidoc title and header attrs", async () => {
  const source = `:uid: y2

= Accident report including vital signs

*Date:* 2026-08-02T10:15:00Z +

== Problem/Diagnosis
`;
  const { renderAsciidocDocumentHtml } = await import(
    "./output-document-view-asciidoc.ts"
  );
  const html = await renderAsciidocDocumentHtml(source);
  assertStringIncludes(html, "doc-metadata-panel");
  assertStringIncludes(html, "y2");
  assertStringIncludes(html, "Accident report including vital signs");
});

Deno.test("wikilink heading label appears once in rendered HTML", async () => {
  const md = "## [[urn:openehr:aom:org.openehr::openEHR-EHR-OBSERVATION.blood_pressure.v2|Blood pressure]]\n";
  const html = await renderMarkdownDocumentHtml(md);
  const count = (html.match(/Blood pressure/g) ?? []).length;
  assertEquals(count, 1, "heading label must not duplicate in HTML");
});

Deno.test("active output view tab uses light text on dark code background", async () => {
  const cssUrl = new URL("../public/styles.css", import.meta.url);
  const css = await Deno.readTextFile(cssUrl);
  assertStringIncludes(css, ".output-view-tab.active");
  assertStringIncludes(css, "color: var(--text-code)");
  assertStringIncludes(css, "background: var(--bg-code)");
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
