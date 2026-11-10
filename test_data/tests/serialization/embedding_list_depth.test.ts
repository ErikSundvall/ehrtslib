import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import {
  AsciidocSerializer,
  EMBEDDING_ASCIIDOC_CONFIG,
} from "../../../serialization/asciidoc/mod.ts";
import { asciidocDlistTermLine } from "../../../serialization/documents_common/document_list_layout.ts";
import {
  EMBEDDING_MARKDOWN_CONFIG,
  MarkdownSerializer,
} from "../../../serialization/markdown/mod.ts";

/** Accident-report shape: context, a diagnosis entry, and vitals under a section. */
function accidentReportShape(): Record<string, unknown> {
  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Accident report including vital signs" },
    context: {
      _type: "EVENT_CONTEXT",
      start_time: { _type: "DV_DATE_TIME", value: "2026-08-02T10:15:00Z" },
      setting: { _type: "DV_CODED_TEXT", value: "secondary medical care" },
    },
    content: [
      {
        _type: "EVALUATION",
        name: { _type: "DV_TEXT", value: "Problem/Diagnosis" },
        data: {
          _type: "ITEM_TREE",
          items: [
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Injury" },
              value: { _type: "DV_TEXT", value: "Ankle sprain" },
            },
            {
              _type: "CLUSTER",
              name: { _type: "DV_TEXT", value: "Anatomical location" },
              items: [{
                _type: "ELEMENT",
                name: { _type: "DV_TEXT", value: "Specific site" },
                value: { _type: "DV_TEXT", value: "Lateral ankle ligaments" },
              }],
            },
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "" },
              value: null,
            },
          ],
        },
      },
      {
        _type: "SECTION",
        name: { _type: "DV_TEXT", value: "Vital signs" },
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
      },
    ],
  };
}

Deno.test("AsciiDoc dlist delimiters stay within :: ::: :::: ;;", () => {
  assertEquals(
    asciidocDlistTermLine(0, "Injury", "Ankle sprain"),
    "Injury:: Ankle sprain",
  );
  assertEquals(
    asciidocDlistTermLine(1, "Injury", "Ankle sprain"),
    "Injury::: Ankle sprain",
  );
  assertEquals(
    asciidocDlistTermLine(2, "Injury", "Ankle sprain"),
    "Injury:::: Ankle sprain",
  );
  assertEquals(
    asciidocDlistTermLine(3, "Injury", "Ankle sprain"),
    "Injury;; Ankle sprain",
  );
  assertEquals(
    asciidocDlistTermLine(8, "Injury", "Ankle sprain"),
    "Injury;; Ankle sprain",
  );
});

Deno.test("embedding list depth resets under headings (accident-report shape)", () => {
  const comp = accidentReportShape();
  const ad = new AsciidocSerializer(EMBEDDING_ASCIIDOC_CONFIG).serialize(comp);
  const md = new MarkdownSerializer(EMBEDDING_MARKDOWN_CONFIG).serialize(comp);

  assertStringIncludes(ad, "Date:: 2026-08-02T10:15:00Z");
  assertStringIncludes(ad, "== Problem/Diagnosis");
  assertStringIncludes(ad, "Injury:: Ankle sprain");
  assertStringIncludes(ad, ".Anatomical location");
  assertStringIncludes(ad, "Specific site:: Lateral ankle ligaments");
  assertStringIncludes(ad, "== Vital signs");
  assertStringIncludes(ad, "=== Pulse oximetry");
  assertStringIncludes(ad, "SpO₂:: 98%");
  assertEquals(ad.includes("::::"), false);
  assertEquals(/:{5,}/.test(ad), false);

  const mdLines = md.split("\n");
  assertEquals(mdLines.some((line) => /^\s*-\s*$/.test(line)), false);
  assertEquals(mdLines.includes("Injury: Ankle sprain"), true);
  assertEquals(mdLines.includes("SpO₂: 98%"), true);
  assert(
    mdLines.some((line) => line === "  Specific site: Lateral ankle ligaments"),
    "cluster children indent one level, not by heading depth",
  );
  assertEquals(md.includes("      SpO₂"), false);
  assertEquals(md.includes("    Injury"), false);
});
