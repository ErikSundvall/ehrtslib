/**
 * Compact Markdown / AsciiDoc tables: implicit header, Time column, no [cols=…].
 */
import { assert, assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
import MarkdownIt from "markdown-it";
import {
  AsciidocSerializer,
  COMPACT_ASCIIDOC_CONFIG,
} from "../../../serialization/asciidoc/mod.ts";
import {
  COMPACT_MARKDOWN_CONFIG,
  MarkdownSerializer,
} from "../../../serialization/markdown/mod.ts";
import { countTokens } from "gpt-tokenizer/encoding/o200k_base";

const LITERAL_OPTS = { disallowedSpecial: new Set<string>() };

function vitalSignsComposition(): Record<string, unknown> {
  const spoData = (spo: number) => ({
    _type: "ITEM_TREE",
    items: [{
      _type: "ELEMENT",
      name: { _type: "DV_TEXT", value: "SpO₂" },
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
      value: {
        _type: "DV_QUANTITY",
        magnitude: rate,
        units: "/min",
      },
    }],
  });

  const observation = (
    title: string,
    time: string,
    data: Record<string, unknown>,
  ): Record<string, unknown> => ({
    _type: "OBSERVATION",
    name: { _type: "DV_TEXT", value: title },
    data: {
      _type: "HISTORY",
      events: [{
        _type: "POINT_EVENT",
        name: { _type: "DV_TEXT", value: "Any event" },
        time: { _type: "DV_DATE_TIME", value: time },
        data,
      }],
    },
  });

  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Vital signs" },
    content: [
      {
        _type: "SECTION",
        name: { _type: "DV_TEXT", value: "Measurements" },
        items: [
          observation("Pulse oximetry", "2026-08-02T10:10:00Z", spoData(98)),
          observation("Respiration", "2026-08-02T10:11:00Z", rateData(18)),
        ],
      },
    ],
  };
}

function accidentReportComposition(): Record<string, unknown> {
  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Accident report including vital signs" },
    context: {
      _type: "EVENT_CONTEXT",
      start_time: { _type: "DV_DATE_TIME", value: "2026-08-02T10:15:00Z" },
      setting: { _type: "DV_CODED_TEXT", value: "secondary medical care" },
    },
    content: [{
      _type: "OBSERVATION",
      name: { _type: "DV_TEXT", value: "Pulse oximetry" },
      data: {
        _type: "HISTORY",
        events: [{
          _type: "POINT_EVENT",
          name: { _type: "DV_TEXT", value: "Any event" },
          time: { _type: "DV_DATE_TIME", value: "2026-08-02T10:10:00Z" },
          data: {
            _type: "ITEM_TREE",
            items: [{
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "SpO₂" },
              value: {
                _type: "DV_PROPORTION",
                numerator: 98,
                denominator: 100,
                type: 2,
              },
            }],
          },
        }],
      },
    }],
  };
}

Deno.test("compact AsciiDoc tables: no format line, Time column, implicit header", async () => {
  const ad = new AsciidocSerializer(COMPACT_ASCIIDOC_CONFIG).serialize(
    vitalSignsComposition(),
  );
  assertFalse(ad.includes("[cols="));
  assertFalse(ad.includes('options="header"'));
  assertStringIncludes(ad, "| Item | Value | Time");
  assertStringIncludes(ad, "| SpO₂ | 98% | 2026-08-02T10:10:00Z");
  assertEquals(ad.includes("* _time:_"), false);

  const Asciidoctor = (await import("@asciidoctor/core")).default;
  const html = Asciidoctor().convert(ad, {
    safe: "secure",
    attributes: { showtitle: true },
  }) as string;
  assertStringIncludes(html, "<th");
  assertStringIncludes(html, "Time");
  assertStringIncludes(html, "2026-08-02T10:10:00Z");
});

Deno.test("compact Markdown tables: GFM header, Time column", () => {
  const md = new MarkdownSerializer(COMPACT_MARKDOWN_CONFIG).serialize(
    vitalSignsComposition(),
  );
  assertStringIncludes(md, "| Item | Value | Time |");
  assertStringIncludes(md, "| --- | --- | --- |");
  assertStringIncludes(md, "| SpO₂ | 98% | 2026-08-02T10:10:00Z |");
  assertEquals(md.includes("- _time:_"), false);

  const html = new MarkdownIt("default", { html: false, linkify: true }).render(md);
  assertStringIncludes(html, "<th");
  assertStringIncludes(html, "Time");
});

Deno.test("compact fixtures: multiple events yield distinct Time cells", () => {
  const ad = new AsciidocSerializer(COMPACT_ASCIIDOC_CONFIG).serialize(
    vitalSignsComposition(),
  );
  assertStringIncludes(ad, "2026-08-02T10:10:00Z");
  assertStringIncludes(ad, "2026-08-02T10:11:00Z");

  const md = new MarkdownSerializer(COMPACT_MARKDOWN_CONFIG).serialize(
    vitalSignsComposition(),
  );
  assertStringIncludes(md, "2026-08-02T10:10:00Z");
  assertStringIncludes(md, "2026-08-02T10:11:00Z");
});

Deno.test("compact token/char stats on demo fixtures", () => {
  for (const [name, comp] of [
    ["vital-signs", vitalSignsComposition()],
    ["accident-report", accidentReportComposition()],
  ] as const) {
    const md = new MarkdownSerializer(COMPACT_MARKDOWN_CONFIG).serialize(comp);
    const ad = new AsciidocSerializer(COMPACT_ASCIIDOC_CONFIG).serialize(comp);
    console.log(
      `compact-${name}: md chars=${md.length} tokens=${countTokens(md, LITERAL_OPTS)} ad chars=${ad.length} tokens=${countTokens(ad, LITERAL_OPTS)}`,
    );
    assert(md.includes("| Time"));
    assert(ad.includes("| Time"));
  }
});
