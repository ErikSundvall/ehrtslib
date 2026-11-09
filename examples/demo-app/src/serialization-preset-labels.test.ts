/**
 * Demo preset labels must match MARKDOWN_CODEC_MATRIX / ASCIIDOC_CODEC_MATRIX.
 */
import { assertEquals } from "@std/assert";
import { MARKDOWN_CODEC_MATRIX } from "../../../serialization/markdown/mod.ts";
import { ASCIIDOC_CODEC_MATRIX } from "../../../serialization/asciidoc/mod.ts";

const ROUNDTRIP_LABEL = "roundtrip, template-valid";
const LOSSY_LABEL = "lossy one-way";

const MARKDOWN_PRESET_LABELS: Record<string, string> = {
  structural: ROUNDTRIP_LABEL,
  compact: LOSSY_LABEL,
  embedding: LOSSY_LABEL,
  wikilink: LOSSY_LABEL,
};

const ASCIIDOC_PRESET_LABELS: Record<string, string> = {
  structural: ROUNDTRIP_LABEL,
  compact: LOSSY_LABEL,
  embedding: LOSSY_LABEL,
  wikilink: LOSSY_LABEL,
};

const OUTPUT_ORDER = ["compact", "embedding", "wikilink"] as const;

Deno.test("markdown presets match codec matrix and shared labels", () => {
  assertEquals(MARKDOWN_CODEC_MATRIX.losslessDialects, ["structural"]);
  assertEquals(MARKDOWN_PRESET_LABELS.structural, ROUNDTRIP_LABEL);
  assertEquals(MARKDOWN_CODEC_MATRIX.outputOnlyPresets, OUTPUT_ORDER);
  for (const p of MARKDOWN_CODEC_MATRIX.outputOnlyPresets) {
    assertEquals(MARKDOWN_PRESET_LABELS[p], LOSSY_LABEL);
  }
});

Deno.test("asciidoc presets match codec matrix and shared labels", () => {
  assertEquals(ASCIIDOC_CODEC_MATRIX.losslessDialects, ["structural"]);
  assertEquals(ASCIIDOC_PRESET_LABELS.structural, ROUNDTRIP_LABEL);
  assertEquals(ASCIIDOC_CODEC_MATRIX.outputOnlyPresets, OUTPUT_ORDER);
  for (const p of ASCIIDOC_CODEC_MATRIX.outputOnlyPresets) {
    assertEquals(ASCIIDOC_PRESET_LABELS[p], LOSSY_LABEL);
  }
});
