import { assert, assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
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

/** Cluster tree similar to Swedish ChemoForm health_care_facility extension. */
function chemoContextComposition(): Record<string, unknown> {
  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "ChemoForm-MBA.v7" },
    context: {
      _type: "EVENT_CONTEXT",
      start_time: { _type: "DV_DATE_TIME", value: "2023-08-31T18:31:16.004+02:00" },
      setting: {
        _type: "DV_CODED_TEXT",
        value: "other care",
        defining_code: {
          _type: "CODE_PHRASE",
          terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
          code_string: "238",
        },
      },
      other_context: {
        _type: "ITEM_TREE",
        items: [{
          _type: "CLUSTER",
          name: { _type: "DV_TEXT", value: "Vårdenhet" },
          items: [
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Namn" },
              value: { _type: "DV_TEXT", value: "Brandbergens vårdcentral" },
            },
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Identifierare" },
              value: {
                _type: "DV_IDENTIFIER",
                id: "556677-8899",
                issuer: "HSA-ID",
                assigner: "Stockholm",
                type: "ORG",
              },
            },
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Roll" },
              value: {
                _type: "DV_CODED_TEXT",
                value: "vårdenhet",
                defining_code: {
                  _type: "CODE_PHRASE",
                  terminology_id: { _type: "TERMINOLOGY_ID", value: "local" },
                  code_string: "care_unit",
                },
              },
            },
            {
              _type: "CLUSTER",
              name: { _type: "DV_TEXT", value: "Vårdgivare" },
              items: [
                {
                  _type: "ELEMENT",
                  name: { _type: "DV_TEXT", value: "Namn" },
                  value: { _type: "DV_TEXT", value: "Stockholms läns sjukvårdsområde" },
                },
                {
                  _type: "ELEMENT",
                  name: { _type: "DV_TEXT", value: "Identifierare" },
                  value: {
                    _type: "DV_IDENTIFIER",
                    id: { _type: "DV_TEXT", value: "2321000057" },
                    issuer: { _type: "DV_TEXT", value: "HSA-ID" },
                  },
                },
              ],
            },
          ],
        }],
      },
    },
    content: [],
  };
}

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

  const html = Asciidoctor().convert(ad, {
    safe: "secure",
    attributes: { showtitle: true },
  }) as string;
  assertStringIncludes(html, "<dl");
  assertStringIncludes(html, "Brandbergens");
  assertFalse(html.includes("(complex value)"));
});
