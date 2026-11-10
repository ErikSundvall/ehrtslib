import { assert, assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
import { assertNoLeadingColonDlistLines } from "../../../serialization/documents_common/document_list_layout.ts";
import { chemoContextComposition } from "./document_audit_fixtures.ts";
import Asciidoctor from "@asciidoctor/core";
import {
  AsciidocSerializer,
  COMPACT_ASCIIDOC_CONFIG,
  EMBEDDING_ASCIIDOC_CONFIG,
  STRUCTURAL_ASCIIDOC_CONFIG,
} from "../../../serialization/asciidoc/mod.ts";
import {
  COMPACT_MARKDOWN_CONFIG,
  EMBEDDING_MARKDOWN_CONFIG,
  MarkdownSerializer,
  STRUCTURAL_MARKDOWN_CONFIG,
} from "../../../serialization/markdown/mod.ts";
import { assertNoForbiddenDocumentMarkers, renderRmValue } from "../../../serialization/documents_common/document_rm_render.ts";

const lossyOpts = {
  lossy: true,
  useTerseFormat: false,
  codeRendering: "hidden" as const,
  includeTypeAnnotations: false,
};

Deno.test("renderRmValue: DV_IDENTIFIER with nested text fields", () => {
  const s = renderRmValue({
    _type: "DV_IDENTIFIER",
    id: { _type: "DV_TEXT", value: "2321000057" },
    issuer: { _type: "DV_TEXT", value: "HSA-ID" },
  }, lossyOpts);
  assertStringIncludes(s, "2321000057");
  assertStringIncludes(s, "HSA-ID");
  assertFalse(s.includes("[object Object]"));
});

Deno.test("document output: no forbidden placeholders (ChemoForm-like context)", () => {
  const comp = chemoContextComposition();
  for (const Ser of [
    [MarkdownSerializer, EMBEDDING_MARKDOWN_CONFIG],
    [MarkdownSerializer, COMPACT_MARKDOWN_CONFIG],
    [AsciidocSerializer, EMBEDDING_ASCIIDOC_CONFIG],
    [AsciidocSerializer, COMPACT_ASCIIDOC_CONFIG],
    [MarkdownSerializer, STRUCTURAL_MARKDOWN_CONFIG],
    [AsciidocSerializer, STRUCTURAL_ASCIIDOC_CONFIG],
  ] as const) {
    const [Cls, cfg] = Ser;
    const text = new Cls(cfg).serialize(comp);
    assertNoForbiddenDocumentMarkers(text);
    assertStringIncludes(text, "Brandbergens");
    assertStringIncludes(text, "2321000057");
  }
});

Deno.test("AsciiDoc embedding: nested cluster uses block title and dlist terms", async () => {
  const ad = new AsciidocSerializer(EMBEDDING_ASCIIDOC_CONFIG).serialize(
    chemoContextComposition(),
  );
  assertFalse(/\*\*Namn::/.test(ad), "must not mix bullet markers with dlist");
  assertFalse(/^\* \*/m.test(ad));
  assertStringIncludes(ad, ".Vårdenhet");
  assertStringIncludes(ad, "Namn::");
  assertStringIncludes(ad, ".Vårdgivare");
  assertNoLeadingColonDlistLines(ad);
  assertStringIncludes(ad, "Namn:: Stockholms läns sjukvårdsområde");

  const html = Asciidoctor().convert(ad, {
    safe: "secure",
    attributes: { showtitle: true },
  }) as string;
  assertStringIncludes(html, "<dl");
  assertStringIncludes(html, "Brandbergens");
  assertFalse(html.includes("(complex value)"));
});
