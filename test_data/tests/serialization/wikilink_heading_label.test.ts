import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  AsciidocSerializer,
  COMPACT_ASCIIDOC_CONFIG,
} from "../../../serialization/asciidoc/mod.ts";
import {
  MarkdownSerializer,
  WIKILINK_MARKDOWN_CONFIG,
} from "../../../serialization/markdown/mod.ts";

function bloodPressureComp(): Record<string, unknown> {
  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Vitals" },
    archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
    content: [{
      _type: "OBSERVATION",
      name: { _type: "DV_TEXT", value: "Blood pressure" },
      archetype_node_id: "openEHR-EHR-OBSERVATION.blood_pressure.v2",
      data: {
        _type: "HISTORY",
        events: [{
          _type: "POINT_EVENT",
          name: { _type: "DV_TEXT", value: "Any event" },
          archetype_node_id: "at0006",
          time: { _type: "DV_DATE_TIME", value: "2026-04-13T10:30:00Z" },
          data: { _type: "ITEM_TREE", items: [] },
        }],
      },
    }],
  };
}

Deno.test("Wikilink Markdown: heading label appears once (URN replaces title)", () => {
  const md = new MarkdownSerializer(WIKILINK_MARKDOWN_CONFIG).serialize(bloodPressureComp());
  const title = "Blood pressure";
  assertStringIncludes(md, `## [[urn:openehr:aom:org.openehr::openEHR-EHR-OBSERVATION.blood_pressure.v2|${title}]]`);
  assertEquals(md.includes(`## ${title} [[` ), false);
});

Deno.test("AsciiDoc URN link: entry heading label appears once", () => {
  const ad = new AsciidocSerializer({
    ...COMPACT_ASCIIDOC_CONFIG,
    includeArchetypeNodeIds: true,
    nodeIdRendering: "comment",
    useOpenehrUrnLinks: true,
  }).serialize(bloodPressureComp());
  const title = "Blood pressure";
  assertStringIncludes(
    ad,
    `link:urn:openehr:aom:org.openehr::openEHR-EHR-OBSERVATION.blood_pressure.v2[${title}]`,
  );
  assertEquals(ad.includes(`**${title}**`), false);
});
