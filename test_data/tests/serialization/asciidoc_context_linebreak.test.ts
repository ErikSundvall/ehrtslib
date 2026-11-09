import { assertStringIncludes } from "@std/assert";
import { AsciidocSerializer, STRUCTURAL_ASCIIDOC_CONFIG } from "../../../serialization/asciidoc/mod.ts";

Deno.test("AsciiDoc structural context uses list meta lines", () => {
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
    ...STRUCTURAL_ASCIIDOC_CONFIG,
    includeHeader: false,
  }).serialize(comp);
  assertStringIncludes(ad, "_start_time:_ 2026-08-02T10:15:00Z");
  assertStringIncludes(ad, "_setting:_ secondary medical care");
  // setting is fully visible; sparse oe:rm is optional for this minimal fixture
});
