/**
 * ZipEHR html5 temporal display spans: human labels must not affect round-trip.
 */
import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import {
  formatZsDisplayDateTime,
  formatZsDisplayDuration,
} from "../../../serialization/zipehr/temporal_display.ts";
import {
  serializeToHtml5Variant,
  zipehrHtml5ToCanonical,
} from "../../../serialization/zipehr/mod.ts";

const FIXTURE = new URL(
  "../../fixtures/workbench-ferro/02-pain-rich.json",
  import.meta.url,
);

Deno.test("temporal display: English date-time and duration phrases", () => {
  const en = formatZsDisplayDateTime(
    "2021-10-21T14:21:00+01:00",
    "DV_DATE_TIME",
    "en",
  );
  assert(!en.includes("2021-10-21T14:21"), `expected human form, got ${en}`);
  assertEquals(formatZsDisplayDuration("P3D", "en"), "3 days");
  assertEquals(formatZsDisplayDuration("P2W", "en"), "2 weeks");
});

Deno.test("temporal display: Swedish locale differs from English", () => {
  const sv = formatZsDisplayDuration("P2W", "sv");
  const en = formatZsDisplayDuration("P2W", "en");
  assert(sv.includes("2") && en.includes("2"));
  assertStringIncludes(sv, "veck");
  assert(!en.includes("veck"));
});

Deno.test("html5 temporal human spans round-trip without leaking display text", async () => {
  const comp = JSON.parse(await Deno.readTextFile(FIXTURE));
  const html = await serializeToHtml5Variant(
    comp,
    "zipehr.html5.short",
    { layout: "linesaving", propertyMode: "comment" },
  );
  assert(html.includes('class="zs-display-value"'));
  assert(html.includes("data-zs-value="));
  const back = zipehrHtml5ToCanonical(html, "zipehr.html5.short");
  const before = JSON.stringify(comp);
  const after = JSON.stringify(back);
  assertEquals(after, before);
  const displayOnly = formatZsDisplayDateTime(
    "2021-10-21T14:21:00+01:00",
    "DV_DATE_TIME",
    "en",
  );
  assert(
    !after.includes(displayOnly) || displayOnly === "2021-10-21T14:21:00+01:00",
    "parsed JSON must not pick up human display strings",
  );
});