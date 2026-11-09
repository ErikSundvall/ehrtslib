import { assert, assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
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
import {
  DOCUMENT_PRESET_DOC_ANCHORS,
  DOCUMENT_PRESET_IDS,
  DOCUMENT_PRESET_RM_POLICIES,
  DOCUMENT_PRESET_DOC_PATH,
  rmPoliciesAlignedForPreset,
  rmPolicyFromAsciidocConfig,
  rmPolicyFromMarkdownConfig,
} from "../../../serialization/documents_common/document_preset_rules.ts";

const PRESET_CONFIGS = {
  markdown: {
    structural: STRUCTURAL_MARKDOWN_CONFIG,
    compact: COMPACT_MARKDOWN_CONFIG,
    embedding: EMBEDDING_MARKDOWN_CONFIG,
    wikilink: WIKILINK_MARKDOWN_CONFIG,
  },
  asciidoc: {
    structural: STRUCTURAL_ASCIIDOC_CONFIG,
    compact: COMPACT_ASCIIDOC_CONFIG,
    embedding: EMBEDDING_ASCIIDOC_CONFIG,
    wikilink: WIKILINK_ASCIIDOC_CONFIG,
  },
} as const;

function vitalSignsLossyFixture(): Record<string, unknown> {
  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Vital signs" },
    content: [{
      _type: "OBSERVATION",
      name: { _type: "DV_TEXT", value: "Pulse oximetry" },
      archetype_node_id: "openEHR-EHR-OBSERVATION.pulse_oximetry.v1",
      data: {
        _type: "HISTORY",
        origin: { _type: "DV_DATE_TIME", value: "2026-08-02T10:10:00Z" },
        events: [{
          _type: "POINT_EVENT",
          name: { _type: "DV_TEXT", value: "Any event" },
          archetype_node_id: "at0006",
          time: { _type: "DV_DATE_TIME", value: "2026-08-02T10:10:00Z" },
          data: {
            _type: "ITEM_TREE",
            items: [{
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "SpO₂" },
              archetype_node_id: "at0004",
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

Deno.test("DOCUMENT_PRESET_RM_POLICIES: configs align with shared descriptor", () => {
  for (const id of DOCUMENT_PRESET_IDS) {
    const canonical = DOCUMENT_PRESET_RM_POLICIES[id];
    assertEquals(rmPolicyFromMarkdownConfig(id), canonical);
    assertEquals(rmPolicyFromAsciidocConfig(id), canonical);
    assertEquals(rmPoliciesAlignedForPreset(id), canonical);
  }
});

Deno.test("documents-presets.md exposes stable GitHub anchors", async () => {
  const text = await Deno.readTextFile(
    new URL(`../../../${DOCUMENT_PRESET_DOC_PATH}`, import.meta.url),
  );
  for (const anchor of DOCUMENT_PRESET_DOC_ANCHORS) {
    if (anchor === "rm-simplification-rules") {
      assertStringIncludes(text, "## RM simplification rules");
    } else {
      assertStringIncludes(text, `## ${anchor}`);
    }
  }
});

for (const preset of ["compact", "embedding", "wikilink"] as const) {
  Deno.test(`RM content parity: ${preset} markdown and asciidoc on vital-signs`, () => {
    const comp = vitalSignsLossyFixture();
    const md = new MarkdownSerializer(PRESET_CONFIGS.markdown[preset]).serialize(comp);
    const ad = new AsciidocSerializer(PRESET_CONFIGS.asciidoc[preset]).serialize(comp);
    const policy = DOCUMENT_PRESET_RM_POLICIES[preset];

    assertStringIncludes(md, "SpO₂");
    assertStringIncludes(ad, "SpO₂");
    assertStringIncludes(md, "98");
    assertStringIncludes(ad, "98");

    if (!policy.archetypeNodeIds) {
      assertFalse(md.includes("at0004"));
      assertFalse(ad.includes("at0004"));
    }
    assertFalse(md.includes("**Any event**"));
    assertFalse(ad.includes("*Any event*"));
    assertFalse(ad.includes(".Any event"));
    assertFalse(/^origin:/m.test(md));
    assertFalse(/^origin::/m.test(ad));

    if (policy.terseCodedValues) {
      // lossy compact/wikilink still show clinical rubrics
      assert(md.length > 20 && ad.length > 20);
    }
  });
}

Deno.test("RM content parity: structural keeps node ids and event title", () => {
  const comp = vitalSignsLossyFixture();
  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(comp);
  const ad = new AsciidocSerializer(STRUCTURAL_ASCIIDOC_CONFIG).serialize(comp);
  assertStringIncludes(md, "at0004");
  assertStringIncludes(ad, "at0004");
  assertStringIncludes(md, "Any event");
  assertStringIncludes(ad, "Any event");
});
