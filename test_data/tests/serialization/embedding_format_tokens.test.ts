import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { countTokens } from "gpt-tokenizer/encoding/o200k_base";
import {
  AsciidocSerializer,
  EMBEDDING_ASCIIDOC_CONFIG,
} from "../../../serialization/asciidoc/mod.ts";
import {
  EMBEDDING_MARKDOWN_CONFIG,
  MarkdownSerializer,
} from "../../../serialization/markdown/mod.ts";

const LITERAL_OPTS = { disallowedSpecial: new Set<string>() };

function vitalSignsComposition(): Record<string, unknown> {
  const eventData = (spo: number) => ({
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

  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Vital signs" },
    content: [{
      _type: "SECTION",
      name: { _type: "DV_TEXT", value: "Measurements" },
      items: [{
        _type: "OBSERVATION",
        name: { _type: "DV_TEXT", value: "Pulse oximetry" },
        data: {
          _type: "HISTORY",
          origin: { _type: "DV_DATE_TIME", value: "2026-08-02T10:10:00Z" },
          events: [{
            _type: "POINT_EVENT",
            name: { _type: "DV_TEXT", value: "Any event" },
            time: { _type: "DV_DATE_TIME", value: "2026-08-02T10:10:00Z" },
            data: eventData(98),
          }],
        },
      }],
    }],
  };
}

function accidentReportComposition(): Record<string, unknown> {
  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Accident report including vital signs" },
    context: {
      _type: "EVENT_CONTEXT",
      start_time: { _type: "DV_DATE_TIME", value: "2026-08-02T10:15:00Z" },
      setting: {
        _type: "DV_CODED_TEXT",
        value: "secondary medical care",
      },
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

function stats(label: string, text: string): { label: string; chars: number; tokens: number } {
  const out = { label, chars: text.length, tokens: countTokens(text, LITERAL_OPTS) };
  console.log(`${label}: chars=${out.chars} tokens=${out.tokens}`);
  return out;
}

/** Approximate pre-compact embedding Markdown (bulleted metadata lines). */
function legacyBulletEmbeddingMarkdown(md: string): string {
  return md
    .replace(/^(\s*)origin: /gm, "$1- _origin:_ ")
    .replace(/^(\s*)time: /gm, "$1- _time:_ ")
    .replace(/^(\s*)([A-Za-z][^:\n]+): /gm, "$1- _$1_ ");
}

/** Approximate pre-compact embedding AsciiDoc (asterisk list metadata). */
function legacyListEmbeddingAsciidoc(ad: string): string {
  return ad
    .replace(/^origin:: /gm, "* _origin:_ ")
    .replace(/^time:: /gm, "* _time:_ ")
    .replace(/^([A-Za-z][^:\n]+):: /gm, "* _$1:_ ");
}

Deno.test("embedding serializers: compact def-list style and lower token count", () => {
  for (const comp of [
    ["vital-signs", vitalSignsComposition()],
    ["accident-report", accidentReportComposition()],
  ] as const) {
    const [name, composition] = comp;
    const md = new MarkdownSerializer(EMBEDDING_MARKDOWN_CONFIG).serialize(composition);
    const ad = new AsciidocSerializer(EMBEDDING_ASCIIDOC_CONFIG).serialize(composition);

    if (name === "vital-signs") {
      assertEquals(md.includes("origin:"), false);
      assertEquals(md.includes("- _origin:_"), false);
      assertEquals(ad.includes("origin::"), false);
      assertEquals(ad.includes(".Any event"), false);
      assertEquals(ad.includes("* _time:_"), false);
    } else {
      assertStringIncludes(md, "Date: ");
      assertStringIncludes(ad, "Date:: ");
      assertEquals(ad.includes("* _time:_"), false);
    }

    const mdStat = stats(`embedding-markdown-${name}`, md);
    const adStat = stats(`embedding-asciidoc-${name}`, ad);
    const mdLegacy = legacyBulletEmbeddingMarkdown(md);
    const adLegacy = legacyListEmbeddingAsciidoc(ad);
    const mdBefore = stats(`legacy-markdown-${name}`, mdLegacy);
    const adBefore = stats(`legacy-asciidoc-${name}`, adLegacy);
    assert(mdStat.tokens <= mdBefore.tokens);
    assert(adStat.tokens <= adBefore.tokens);
    assert(mdStat.tokens > 0 && adStat.tokens > 0);
  }
});
