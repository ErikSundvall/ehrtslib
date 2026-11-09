import { assert, assertEquals, assertThrows } from "jsr:@std/assert";
import {
  displayTextRecoversDataValue,
  encodeOeValueAnnotationPayload,
  formatOeValueAnnotationMarkdown,
  needsOeValueAnnotation,
  parseOeValueAnnotationPayload,
  resolveDataValueFromDisplayAndAnnotation,
} from "../../../serialization/documents_common/oe_value_annotation.ts";
import { InvalidFormatError } from "../../../serialization/common/errors.ts";
import { MarkdownSerializer, STRUCTURAL_MARKDOWN_CONFIG } from "../../../serialization/markdown/mod.ts";

Deno.test("sparse: clear quantity needs no oe annotation", () => {
  const dv = { _type: "DV_QUANTITY", magnitude: 145, units: "mm[Hg]" };
  const display = "145 mm[Hg]";
  assertEquals(needsOeValueAnnotation(dv, display), false);
  assert(displayTextRecoversDataValue(dv, display));
});

Deno.test("sparse: DV_TEXT with date-like value needs oe annotation", () => {
  const dv = { _type: "DV_TEXT", value: "2026-01-01T12:00:00Z" };
  const display = "2026-01-01T12:00:00Z";
  assertEquals(needsOeValueAnnotation(dv, display), true);
});

Deno.test("sparse: DV_CODED_TEXT without visible code needs oe annotation", () => {
  const dv = {
    _type: "DV_CODED_TEXT",
    value: "Sitting",
    defining_code: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "local" },
      code_string: "at1001",
    },
  };
  const display = "Sitting";
  assertEquals(needsOeValueAnnotation(dv, display), true);
  const md = formatOeValueAnnotationMarkdown(dv);
  assert(md.includes("oe:v1:b64:"));
  const inner = md.match(/<!--\s+([^>]+)\s+-->/)?.[1] ?? "";
  const parsed = resolveDataValueFromDisplayAndAnnotation(display, inner);
  assertEquals(parsed._type, "DV_CODED_TEXT");
  assertEquals((parsed.defining_code as { code_string: string }).code_string, "at1001");
});

Deno.test("sparse: serializer skips oe on unambiguous quantity line", () => {
  const tree = {
    _type: "ITEM_TREE",
    items: [{
      _type: "ELEMENT",
      name: { _type: "DV_TEXT", value: "Systolic" },
      value: { _type: "DV_QUANTITY", magnitude: 120, units: "mm[Hg]" },
    }],
  };
  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(tree);
  assert(!md.includes("oe:v1:b64:"), md);
  assert(md.includes("120 mm[Hg]"));
});

Deno.test("malformed oe annotation is rejected", () => {
  assertThrows(
    () => parseOeValueAnnotationPayload("oe:v1:b64:!!!", "src"),
    InvalidFormatError,
  );
});

Deno.test("oe payload roundtrip is stable", () => {
  const dv = {
    _type: "DV_COUNT",
    magnitude: 3,
  };
  const payload = encodeOeValueAnnotationPayload(dv);
  const out = parseOeValueAnnotationPayload(payload);
  assertEquals(out._type, "DV_COUNT");
  assertEquals(out.magnitude, 3);
});
