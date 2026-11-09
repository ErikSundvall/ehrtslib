import { assertEquals, assertStringIncludes } from "@std/assert";
import { AsciidocSerializer, LOSSLESS_ASCIIDOC_CONFIG } from "../../../serialization/asciidoc/mod.ts";

Deno.test("AsciiDoc context: last context line has no trailing hard line break", () => {
  const comp = {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Report" },
    context: {
      _type: "EVENT_CONTEXT",
      start_time: { _type: "DV_DATE_TIME", value: "2026-08-02T10:15:00Z" },
      setting: { _type: "DV_CODED_TEXT", value: "secondary medical care" },
    },
    content: [],
  };
  const ad = new AsciidocSerializer({
    ...LOSSLESS_ASCIIDOC_CONFIG,
    includeHeader: false,
  }).serialize(comp);
  assertStringIncludes(ad, "*Setting:* secondary medical care");
  const lines = ad.split("\n");
  const settingLine = lines.find((l) => l.includes("Setting"));
  assertEquals(settingLine?.endsWith(" +"), false);
  const dateLine = lines.find((l) => l.includes("Date"));
  assertEquals(dateLine?.endsWith(" +"), true);
});
