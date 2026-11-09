/**
 * Regression: block-level Markdown / AsciiDoc must be separated by blank lines
 * so GFM / AsciiDoctor render headings, tables, and event titles correctly.
 */
import { assert, assertEquals, assertMatch, assertStringIncludes } from "@std/assert";
import MarkdownIt from "markdown-it";
import {
  AsciidocDeserializer,
  AsciidocSerializer,
  COMPACT_ASCIIDOC_CONFIG,
  EMBEDDING_ASCIIDOC_CONFIG,
  LOSSLESS_ASCIIDOC_CONFIG,
} from "../../../serialization/asciidoc/mod.ts";
import {
  CLINICAL_MARKDOWN_CONFIG,
  COMPACT_MARKDOWN_CONFIG,
  EMBEDDING_MARKDOWN_CONFIG,
  MarkdownDeserializer,
  MarkdownSerializer,
  STRUCTURAL_MARKDOWN_CONFIG,
  WIKILINK_MARKDOWN_CONFIG,
} from "../../../serialization/markdown/mod.ts";
import { rmTreesSemanticallyEqual } from "../../../serialization/documents_common/mod.ts";

function vitalSignsComposition(): Record<string, unknown> {
  const eventData = (spo: number) => ({
    _type: "ITEM_TREE",
    items: [{
      _type: "ELEMENT",
      name: { _type: "DV_TEXT", value: "SpO₂" },
      archetype_node_id: "at0004",
      value: {
        _type: "DV_PROPORTION",
        numerator: spo,
        denominator: 100,
        type: 2,
      },
    }],
  });

  const rateData = (rate: number) => ({
    _type: "ITEM_TREE",
    items: [{
      _type: "ELEMENT",
      name: { _type: "DV_TEXT", value: "Rate" },
      archetype_node_id: "at0004",
      value: {
        _type: "DV_QUANTITY",
        magnitude: rate,
        units: "/min",
      },
    }],
  });

  const observation = (
    title: string,
    archetype: string,
    data: Record<string, unknown>,
  ): Record<string, unknown> => ({
    _type: "OBSERVATION",
    name: { _type: "DV_TEXT", value: title },
    archetype_node_id: archetype,
    data: {
      _type: "HISTORY",
      origin: { _type: "DV_DATE_TIME", value: "2026-08-02T10:10:00Z" },
      events: [{
        _type: "POINT_EVENT",
        name: { _type: "DV_TEXT", value: "Any event" },
        archetype_node_id: "at0006",
        time: { _type: "DV_DATE_TIME", value: "2026-08-02T10:10:00Z" },
        data,
      }],
    },
  });

  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Vital signs" },
    archetype_node_id: "openEHR-EHR-COMPOSITION.report.v1",
    language: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
      code_string: "en",
    },
    territory: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_3166-1" },
      code_string: "GB",
    },
    category: {
      _type: "DV_CODED_TEXT",
      value: "event",
      defining_code: {
        _type: "CODE_PHRASE",
        terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
        code_string: "433",
      },
    },
    composer: { _type: "PARTY_IDENTIFIED", name: "Nurse" },
    content: [
      observation(
        "Pulse oximetry",
        "openEHR-EHR-OBSERVATION.pulse_oximetry.v1",
        eventData(98),
      ),
      observation(
        "Respiration",
        "openEHR-EHR-OBSERVATION.respiration.v1",
        rateData(16),
      ),
    ],
  };
}

function assertNoTripleNewlines(text: string): void {
  assert(!/\n{3,}/.test(text), "document must not contain 3+ consecutive newlines");
}

function assertBlankBeforePattern(text: string, pattern: RegExp, label: string): void {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(":---")) continue;
    if (!pattern.test(line)) continue;
    if (i === 0) continue;
    assertEquals(
      lines[i - 1].trim(),
      "",
      `${label}: line ${i + 1} must follow a blank line: ${lines[i]}`,
    );
  }
}

const markdownHeadingPattern = /^#{2,6}\s/;
const markdownTablePattern = /^\| Item \|/;
const asciidocHeadingPattern = /^={2,6}\s/;
const asciidocTablePattern = /^\[cols=/;
const asciidocEventTitlePattern = /^\*[^*\s]/;

const markdownConfigs = [
  ["structural", STRUCTURAL_MARKDOWN_CONFIG],
  ["clinical", CLINICAL_MARKDOWN_CONFIG],
  ["compact", COMPACT_MARKDOWN_CONFIG],
  ["embedding", EMBEDDING_MARKDOWN_CONFIG],
  ["wikilink", WIKILINK_MARKDOWN_CONFIG],
] as const;

const asciidocConfigs = [
  ["lossless", LOSSLESS_ASCIIDOC_CONFIG],
  ["compact", COMPACT_ASCIIDOC_CONFIG],
  ["embedding", EMBEDDING_ASCIIDOC_CONFIG],
] as const;

const composition = vitalSignsComposition();

for (const [name, config] of markdownConfigs) {
  Deno.test(`Markdown (${name}): blank lines before block elements`, () => {
    const md = new MarkdownSerializer({ ...config, dataValueRendering: "table" })
      .serialize(composition);
    assertNoTripleNewlines(md);
    assertBlankBeforePattern(md, markdownHeadingPattern, `markdown-${name}-heading`);
    if (name === "clinical" || name === "wikilink") {
      assertBlankBeforePattern(md, markdownTablePattern, `markdown-${name}-table`);
    }
    const html = new MarkdownIt("default", { html: false, linkify: true }).render(md);
    assertMatch(html, /<h2[\s>]/);
    const h2Count = (html.match(/<h2[\s>]/g) ?? []).length;
    assert(h2Count >= 2, `expected multiple h2 headings, got ${h2Count}`);
    if (name === "clinical" || name === "wikilink") {
      assertStringIncludes(html, "<table");
    }
  });
}

for (const [name, config] of asciidocConfigs) {
  Deno.test(`AsciiDoc (${name}): blank lines before block elements`, async () => {
    const ad = new AsciidocSerializer({ ...config, dataValueRendering: "table" })
      .serialize(composition);
    assertNoTripleNewlines(ad);
    assertBlankBeforePattern(ad, asciidocHeadingPattern, `asciidoc-${name}-heading`);
    assertBlankBeforePattern(ad, asciidocEventTitlePattern, `asciidoc-${name}-event`);
    if (name === "compact") {
      assertBlankBeforePattern(ad, asciidocTablePattern, `asciidoc-${name}-table`);
    }
    const Asciidoctor = (await import("@asciidoctor/core")).default;
    const html = Asciidoctor().convert(ad, {
      safe: "secure",
      attributes: { showtitle: true },
    }) as string;
    assertMatch(html, /<h2[\s>]/i);
    const h2Count = (html.match(/<h2[\s>]/gi) ?? []).length;
    assert(h2Count >= 2, `expected multiple h2 headings, got ${h2Count}`);
  });
}

Deno.test("lossless codecs: vital signs round-trip after spacing fix", () => {
  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(composition);
  const fromMd = new MarkdownDeserializer().deserialize(md);
  assert(rmTreesSemanticallyEqual(composition, fromMd));

  const ad = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG).serialize(composition);
  const fromAd = new AsciidocDeserializer().deserialize(ad);
  assert(rmTreesSemanticallyEqual(composition, fromAd));
});
