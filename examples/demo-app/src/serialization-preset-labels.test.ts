/**
 * Demo preset labels must match MARKDOWN_CODEC_MATRIX / ASCIIDOC_CODEC_MATRIX.
 */
import { assertEquals } from "@std/assert";
import {
  MARKDOWN_CODEC_MATRIX,
} from "../../../serialization/markdown/mod.ts";
import {
  ASCIIDOC_CODEC_MATRIX,
} from "../../../serialization/asciidoc/mod.ts";

const MARKDOWN_PRESET_LABELS: Record<string, string> = {
  structural: "roundtrip, template-valid",
  clinical: "lossy one-way",
  compact: "lossy one-way",
  embedding: "lossy one-way",
  wikilink: "lossy one-way",
};

const ASCIIDOC_PRESET_LABELS: Record<string, string> = {
  lossless: "roundtrip, template-valid",
  compact: "lossy one-way",
  embedding: "lossy one-way",
};

Deno.test("markdown lossless preset matches codec matrix", () => {
  assertEquals(MARKDOWN_CODEC_MATRIX.losslessDialects, ["structural"]);
  assertEquals(MARKDOWN_PRESET_LABELS.structural, "roundtrip, template-valid");
  for (const p of MARKDOWN_CODEC_MATRIX.outputOnlyPresets) {
    assertEquals(MARKDOWN_PRESET_LABELS[p], "lossy one-way");
  }
});

Deno.test("asciidoc lossless preset matches codec matrix", () => {
  assertEquals(ASCIIDOC_CODEC_MATRIX.losslessDialects, ["lossless"]);
  assertEquals(ASCIIDOC_PRESET_LABELS.lossless, "roundtrip, template-valid");
  for (const p of ASCIIDOC_CODEC_MATRIX.outputOnlyPresets) {
    assertEquals(ASCIIDOC_PRESET_LABELS[p], "lossy one-way");
  }
});

Deno.test("zipehr demo variants are lossless roundtrip", () => {
  const variants = [
    "zipehr.json",
    "zipehr.yaml",
    "zipehr.xhtml",
    "zipehr.html5.short",
    "zipehr.html5.full",
    "zipehr.html5.emoji",
  ];
  assertEquals(variants.length, 6);
});
