/**
 * Audit document serializers across veredictum composition fixtures.
 */
import { assert } from "@std/assert";
import { join } from "@std/path";
import {
  AsciidocDeserializer,
  AsciidocSerializer,
  COMPACT_ASCIIDOC_CONFIG,
  EMBEDDING_ASCIIDOC_CONFIG,
  STRUCTURAL_ASCIIDOC_CONFIG,
  WIKILINK_ASCIIDOC_CONFIG,
} from "../../../serialization/asciidoc/mod.ts";
import {
  COMPACT_MARKDOWN_CONFIG,
  EMBEDDING_MARKDOWN_CONFIG,
  MarkdownDeserializer,
  MarkdownSerializer,
  STRUCTURAL_MARKDOWN_CONFIG,
  WIKILINK_MARKDOWN_CONFIG,
} from "../../../serialization/markdown/mod.ts";
import { assertNoForbiddenDocumentMarkers } from "../../../serialization/documents_common/document_rm_render.ts";
import { rmTreesSemanticallyEqual } from "../../../serialization/documents_common/mod.ts";
import { DOCUMENT_PRESET_IDS } from "../../../serialization/documents_common/document_preset_rules.ts";

const COMPOSITIONS_DIR = new URL(
  "../../veredictum/compositions",
  import.meta.url,
);

const SKIP_NAME = /invalid|reject|missing_mandatory|cardinality|empty\.json$/;

const MD_CONFIGS: Record<string, Record<string, unknown>> = {
  structural: STRUCTURAL_MARKDOWN_CONFIG,
  compact: COMPACT_MARKDOWN_CONFIG,
  embedding: EMBEDDING_MARKDOWN_CONFIG,
  wikilink: WIKILINK_MARKDOWN_CONFIG,
};

const AD_CONFIGS: Record<string, Record<string, unknown>> = {
  structural: STRUCTURAL_ASCIIDOC_CONFIG,
  compact: COMPACT_ASCIIDOC_CONFIG,
  embedding: EMBEDDING_ASCIIDOC_CONFIG,
  wikilink: WIKILINK_ASCIIDOC_CONFIG,
};

Deno.test("document audit: veredictum compositions — no forbidden placeholders", async () => {
  const dir = COMPOSITIONS_DIR.pathname;
  let checked = 0;
  for await (const entry of Deno.readDir(dir)) {
    if (!entry.isFile || !entry.name.endsWith(".json")) continue;
    if (SKIP_NAME.test(entry.name)) continue;
    const raw = await Deno.readTextFile(join(dir, entry.name));
    let comp: Record<string, unknown>;
    try {
      comp = JSON.parse(raw);
    } catch {
      continue;
    }
    if (comp._type !== "COMPOSITION") continue;
    for (const preset of DOCUMENT_PRESET_IDS) {
      const md = new MarkdownSerializer(MD_CONFIGS[preset]).serialize(comp);
      const ad = new AsciidocSerializer(AD_CONFIGS[preset]).serialize(comp);
      assertNoForbiddenDocumentMarkers(md);
      assertNoForbiddenDocumentMarkers(ad);
    }
    checked++;
  }
  assert(checked >= 5, `expected several composition fixtures, got ${checked}`);
});

function bloodPressureComposition(): Record<string, unknown> {
  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Blood pressure" },
    category: {
      _type: "DV_CODED_TEXT",
      value: "event",
      defining_code: {
        _type: "CODE_PHRASE",
        terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
        code_string: "433",
      },
    },
    content: [{
      _type: "OBSERVATION",
      name: { _type: "DV_TEXT", value: "Blood pressure" },
      data: {
        _type: "HISTORY",
        events: [{
          _type: "POINT_EVENT",
          name: { _type: "DV_TEXT", value: "Any event" },
          time: { _type: "DV_DATE_TIME", value: "2026-01-01T12:00:00Z" },
          data: {
            _type: "ITEM_TREE",
            items: [{
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Systolic" },
              value: {
                _type: "DV_QUANTITY",
                magnitude: 120,
                units: "mm[Hg]",
              },
            }],
          },
        }],
      },
    }],
  };
}

Deno.test("document audit: structural round-trip blood pressure", () => {
  const comp = bloodPressureComposition();
  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(comp);
  const fromMd = new MarkdownDeserializer().deserialize(md);
  assert(rmTreesSemanticallyEqual(comp, fromMd));
  const ad = new AsciidocSerializer(STRUCTURAL_ASCIIDOC_CONFIG).serialize(comp);
  const fromAd = new AsciidocDeserializer().deserialize(ad);
  assert(rmTreesSemanticallyEqual(comp, fromAd));
});
