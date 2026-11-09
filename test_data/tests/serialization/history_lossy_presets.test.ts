/**
 * Lossy presets: single-event HISTORY omits event titles; origin omitted when
 * equal to sole/earliest event time (structural unchanged).
 */
import { assert, assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
import { countTokens } from "gpt-tokenizer/encoding/o200k_base";
import {
  AsciidocSerializer,
  COMPACT_ASCIIDOC_CONFIG,
  EMBEDDING_ASCIIDOC_CONFIG,
  STRUCTURAL_ASCIIDOC_CONFIG,
  WIKILINK_ASCIIDOC_CONFIG,
} from "../../../serialization/asciidoc/mod.ts";
import {
  COMPACT_MARKDOWN_CONFIG,
  EMBEDDING_MARKDOWN_CONFIG,
  MarkdownSerializer,
  STRUCTURAL_MARKDOWN_CONFIG,
  WIKILINK_MARKDOWN_CONFIG,
} from "../../../serialization/markdown/mod.ts";

const LITERAL_OPTS = { disallowedSpecial: new Set<string>() };

const LOSSY_MD = [
  ["compact", COMPACT_MARKDOWN_CONFIG],
  ["embedding", EMBEDDING_MARKDOWN_CONFIG],
  ["wikilink", WIKILINK_MARKDOWN_CONFIG],
] as const;

const LOSSY_AD = [
  ["compact", COMPACT_ASCIIDOC_CONFIG],
  ["embedding", EMBEDDING_ASCIIDOC_CONFIG],
  ["wikilink", WIKILINK_ASCIIDOC_CONFIG],
] as const;

function spoItem(spo: number): Record<string, unknown> {
  return {
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
  };
}

function observationHistory(
  opts: {
    origin?: string;
    events: Array<{
      name: string;
      time: string;
      type?: "POINT_EVENT" | "INTERVAL_EVENT";
      width?: string;
    }>;
  },
): Record<string, unknown> {
  return {
    _type: "OBSERVATION",
    name: { _type: "DV_TEXT", value: "Pulse oximetry" },
    data: {
      _type: "HISTORY",
      ...(opts.origin
        ? { origin: { _type: "DV_DATE_TIME", value: opts.origin } }
        : {}),
      events: opts.events.map((e) => ({
        _type: e.type ?? "POINT_EVENT",
        name: { _type: "DV_TEXT", value: e.name },
        time: { _type: "DV_DATE_TIME", value: e.time },
        ...(e.width ? { width: { _type: "DV_DURATION", value: e.width } } : {}),
        data: spoItem(98),
      })),
    },
  };
}

function compositionWithObs(obs: Record<string, unknown>): Record<string, unknown> {
  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Vital signs" },
    content: [{ _type: "SECTION", name: { _type: "DV_TEXT", value: "Measurements" }, items: [obs] }],
  };
}

/** Fixture used for token savings (equal origin + single Any event). */
function vitalSignsComposition(): Record<string, unknown> {
  return compositionWithObs(observationHistory({
    origin: "2026-08-02T10:10:00Z",
    events: [{ name: "Any event", time: "2026-08-02T10:10:00Z" }],
  }));
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
      _type: "EVALUATION",
      name: { _type: "DV_TEXT", value: "Problem/Diagnosis" },
      data: {
        _type: "ITEM_TREE",
        items: [{
          _type: "ELEMENT",
          name: { _type: "DV_TEXT", value: "Injury" },
          value: { _type: "DV_TEXT", value: "Ankle sprain" },
        }],
      },
    }],
  };
}

function assertNoEventTitleMarkdown(md: string): void {
  assertFalse(md.includes("**Any event**"));
  assertFalse(/\*\*[^*]+\*\*\s*_\(?interval\)?_?/.test(md));
}

function assertNoEventTitleAsciidoc(ad: string): void {
  assertFalse(/^\*Any event\*/m.test(ad));
  assertFalse(/^\.Any event/m.test(ad));
}

for (const [preset, config] of LOSSY_MD) {
  Deno.test(`Markdown ${preset}: single event drops title and redundant origin`, () => {
    const comp = compositionWithObs(observationHistory({
      origin: "2026-08-02T10:10:00Z",
      events: [{ name: "Any event", time: "2026-08-02T10:10:00Z" }],
    }));
    const md = new MarkdownSerializer(config).serialize(comp);
    assertNoEventTitleMarkdown(md);
    assertFalse(/^origin:/m.test(md));
    assertStringIncludes(md, "SpO₂");
  });
}

for (const [preset, config] of LOSSY_AD) {
  Deno.test(`AsciiDoc ${preset}: single event drops title and redundant origin`, () => {
    const comp = compositionWithObs(observationHistory({
      origin: "2026-08-02T10:10:00Z",
      events: [{ name: "Any event", time: "2026-08-02T10:10:00Z" }],
    }));
    const ad = new AsciidocSerializer(config).serialize(comp);
    assertNoEventTitleAsciidoc(ad);
    assertFalse(/^origin::/m.test(ad));
    assertStringIncludes(ad, "SpO₂");
  });
}

for (const [preset, config] of LOSSY_MD) {
  Deno.test(`Markdown ${preset}: origin kept when before sole event`, () => {
    const comp = compositionWithObs(observationHistory({
      origin: "2026-08-02T10:00:00Z",
      events: [{ name: "Any event", time: "2026-08-02T10:10:00Z" }],
    }));
    const md = new MarkdownSerializer(config).serialize(comp);
    assertNoEventTitleMarkdown(md);
    assertStringIncludes(md, "origin: 2026-08-02T10:00:00Z");
  });
}

for (const [preset, config] of LOSSY_AD) {
  Deno.test(`AsciiDoc ${preset}: origin kept when before sole event`, () => {
    const comp = compositionWithObs(observationHistory({
      origin: "2026-08-02T10:00:00Z",
      events: [{ name: "Any event", time: "2026-08-02T10:10:00Z" }],
    }));
    const ad = new AsciidocSerializer(config).serialize(comp);
    assertNoEventTitleAsciidoc(ad);
    assertStringIncludes(ad, "origin:: 2026-08-02T10:00:00Z");
  });
}

for (const [preset, config] of LOSSY_MD) {
  Deno.test(`Markdown ${preset}: multi-event keeps titles`, () => {
    const comp = compositionWithObs(observationHistory({
      origin: "2026-08-02T10:00:00Z",
      events: [
        { name: "Morning", time: "2026-08-02T08:00:00Z" },
        { name: "Evening", time: "2026-08-02T20:00:00Z" },
      ],
    }));
    const md = new MarkdownSerializer(config).serialize(comp);
    assertStringIncludes(md, "**Morning**");
    assertStringIncludes(md, "**Evening**");
    assertStringIncludes(md, "origin: 2026-08-02T10:00:00Z");
  });
}

for (const [preset, config] of LOSSY_AD) {
  Deno.test(`AsciiDoc ${preset}: multi-event keeps titles`, () => {
    const comp = compositionWithObs(observationHistory({
      origin: "2026-08-02T10:00:00Z",
      events: [
        { name: "Morning", time: "2026-08-02T08:00:00Z" },
        { name: "Evening", time: "2026-08-02T20:00:00Z" },
      ],
    }));
    const ad = new AsciidocSerializer(config).serialize(comp);
    if (preset === "embedding") {
      assertStringIncludes(ad, ".Morning");
      assertStringIncludes(ad, ".Evening");
    } else {
      assertStringIncludes(ad, "*Morning*");
      assertStringIncludes(ad, "*Evening*");
    }
    assertStringIncludes(ad, "origin:: 2026-08-02T10:00:00Z");
  });
}

for (const [preset, config] of LOSSY_MD) {
  Deno.test(`Markdown ${preset}: multi-event drops origin when equals earliest event`, () => {
    const comp = compositionWithObs(observationHistory({
      origin: "2026-08-02T08:00:00Z",
      events: [
        { name: "Morning", time: "2026-08-02T08:00:00Z" },
        { name: "Evening", time: "2026-08-02T20:00:00Z" },
      ],
    }));
    const md = new MarkdownSerializer(config).serialize(comp);
    assertFalse(/^origin:/m.test(md));
    assertStringIncludes(md, "**Morning**");
  });
}

Deno.test("structural: single event still emits title and origin", () => {
  const comp = vitalSignsComposition();
  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(comp);
  const ad = new AsciidocSerializer(STRUCTURAL_ASCIIDOC_CONFIG).serialize(comp);
  assertStringIncludes(md, "**Any event**");
  assertStringIncludes(md, "_origin:_");
  assertStringIncludes(ad, "*Any event*");
  assertStringIncludes(ad, "_origin:_");
});

function legacyLossyMarkdownApprox(md: string): string {
  return md
    + "\norigin: 2026-08-02T10:10:00Z\n**Any event**\n";
}

function legacyLossyAsciidocApprox(ad: string): string {
  return ad
    + "\norigin:: 2026-08-02T10:10:00Z\n.Any event\n";
}

function reportTokens(label: string, text: string): number {
  const t = countTokens(text, LITERAL_OPTS);
  console.log(`${label}: chars=${text.length} tokens=${t}`);
  return t;
}

Deno.test("lossy HISTORY trim: token savings on vital-signs and accident-report fixtures", () => {
  for (const [name, composition] of [
    ["vital-signs", vitalSignsComposition()],
    ["accident-report", accidentReportComposition()],
  ] as const) {
    const md = new MarkdownSerializer(COMPACT_MARKDOWN_CONFIG).serialize(composition);
    const ad = new AsciidocSerializer(COMPACT_ASCIIDOC_CONFIG).serialize(composition);
    const mdEmb = new MarkdownSerializer(EMBEDDING_MARKDOWN_CONFIG).serialize(composition);
    const adEmb = new AsciidocSerializer(EMBEDDING_ASCIIDOC_CONFIG).serialize(composition);

    const mdTok = reportTokens(`compact-md-${name}`, md);
    const adTok = reportTokens(`compact-ad-${name}`, ad);
    const mdEmbTok = reportTokens(`embedding-md-${name}`, mdEmb);
    const adEmbTok = reportTokens(`embedding-ad-${name}`, adEmb);

    if (name === "vital-signs") {
      const mdLegacyTok = reportTokens(
        `legacy-approx-md-${name}`,
        legacyLossyMarkdownApprox(md),
      );
      const adLegacyTok = reportTokens(
        `legacy-approx-ad-${name}`,
        legacyLossyAsciidocApprox(ad),
      );
      assert(mdTok < mdLegacyTok);
      assert(adTok < adLegacyTok);
      assert(mdEmbTok < mdLegacyTok);
      assert(adEmbTok < adLegacyTok);
      assertFalse(mdEmb.includes("origin:"));
      assertFalse(adEmb.includes(".Any event"));
    }

    assert(mdTok > 0 && adTok > 0);
  }
});
