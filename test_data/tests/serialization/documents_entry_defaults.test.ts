/**
 * ENTRY language/encoding/subject defaults: once per composition, round-trip fill.
 */
import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import MarkdownIt from "markdown-it";
import {
  AsciidocDeserializer,
  AsciidocSerializer,
  STRUCTURAL_ASCIIDOC_CONFIG,
} from "../../../serialization/asciidoc/mod.ts";
import {
  MarkdownDeserializer,
  MarkdownSerializer,
  STRUCTURAL_MARKDOWN_CONFIG,
} from "../../../serialization/markdown/mod.ts";
import { rmTreesSemanticallyEqual } from "../../../serialization/documents_common/mod.ts";

const encoding = {
  _type: "CODE_PHRASE",
  terminology_id: { _type: "TERMINOLOGY_ID", value: "IANA_character-sets" },
  code_string: "UTF-8",
};

function vitalSignsWithUniformEntryMeta(): Record<string, unknown> {
  const observation = (title: string): Record<string, unknown> => ({
    _type: "OBSERVATION",
    name: { _type: "DV_TEXT", value: title },
    language: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
      code_string: "en",
    },
    encoding,
    subject: { _type: "PARTY_SELF" },
    data: {
      _type: "HISTORY",
      origin: { _type: "DV_DATE_TIME", value: "2026-08-02T10:10:00Z" },
      events: [{
        _type: "POINT_EVENT",
        name: { _type: "DV_TEXT", value: "Any event" },
        time: { _type: "DV_DATE_TIME", value: "2026-08-02T10:10:00Z" },
        data: {
          _type: "ITEM_TREE",
          items: [{
            _type: "ELEMENT",
            name: { _type: "DV_TEXT", value: "Value" },
            value: { _type: "DV_COUNT", magnitude: 1 },
          }],
        },
      }],
    },
  });

  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Vital signs" },
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
    content: [
      observation("Pulse oximetry"),
      observation("Respiration"),
    ],
  };
}

function vitalSignsWithDivergentEntry(): Record<string, unknown> {
  const base = vitalSignsWithUniformEntryMeta();
  const second = (base.content as Record<string, unknown>[])[1];
  second.language = {
    _type: "CODE_PHRASE",
    terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
    code_string: "sv",
  };
  second.subject = { _type: "PARTY_IDENTIFIED", name: "Related person" };
  return base;
}

function countOccurrences(haystack: string, needle: string): number {
  let n = 0;
  let i = 0;
  while (true) {
    const at = haystack.indexOf(needle, i);
    if (at < 0) break;
    n++;
    i = at + needle.length;
  }
  return n;
}

Deno.test("structural Markdown: vital signs omit repeated entry language/encoding", () => {
  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG)
    .serialize(vitalSignsWithUniformEntryMeta());
  assertEquals(countOccurrences(md, "_language:_"), 0);
  assertEquals(countOccurrences(md, "_encoding:_"), 0);
  assertEquals(countOccurrences(md, "_subject:_"), 0);
  assertStringIncludes(md, "entry_encoding:");
  assertStringIncludes(md, "default_subject:");
});

Deno.test("lossless AsciiDoc: vital signs omit repeated entry language/encoding", () => {
  const ad = new AsciidocSerializer(STRUCTURAL_ASCIIDOC_CONFIG)
    .serialize(vitalSignsWithUniformEntryMeta());
  assertEquals(countOccurrences(ad, "_language:_"), 0);
  assertEquals(countOccurrences(ad, "_encoding:_"), 0);
  assertEquals(countOccurrences(ad, "_subject:_"), 0);
  assertStringIncludes(ad, ":entry-encoding:");
  assertStringIncludes(ad, ":default-subject:");
});

Deno.test("round-trip restores composition defaults onto every ENTRY", () => {
  const original = vitalSignsWithUniformEntryMeta();
  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(original);
  const parsed = new MarkdownDeserializer().deserialize<Record<string, unknown>>(md);
  assert(rmTreesSemanticallyEqual(original, parsed));

  const ad = new AsciidocSerializer(STRUCTURAL_ASCIIDOC_CONFIG).serialize(original);
  const parsedAd = new AsciidocDeserializer().deserialize<Record<string, unknown>>(ad);
  assert(rmTreesSemanticallyEqual(original, parsedAd));
});

Deno.test("divergent entry language/subject serialize explicitly and round-trip", () => {
  const original = vitalSignsWithDivergentEntry();
  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(original);
  assertStringIncludes(md, "_language:_ ISO_639-1::sv");
  assertStringIncludes(md, "_subject:_ Related person");
  const parsed = new MarkdownDeserializer().deserialize<Record<string, unknown>>(md);
  assert(rmTreesSemanticallyEqual(original, parsed));
});

Deno.test("structural Markdown hides item structure meta from rendered HTML", () => {
  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG)
    .serialize(vitalSignsWithUniformEntryMeta());
  assertEquals(md.includes("_item_name:_"), false);
  assertEquals(md.includes("_item_node_id:_"), false);
  const html = new MarkdownIt({ html: true }).render(md);
  assert(!html.includes("item_node_id"), "item_node_id must not appear in HTML");
  assert(!html.includes("item_name"), "item_name must not appear in HTML");
});
