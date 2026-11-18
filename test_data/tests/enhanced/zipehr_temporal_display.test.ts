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

const WALL_CLOCK_ISO = "2021-10-21T14:21:00+01:00";

Deno.test("temporal display: English date-time and duration phrases", () => {
  const en = formatZsDisplayDateTime(WALL_CLOCK_ISO, "DV_DATE_TIME", "en");
  assertEquals(en, "21 Oct 2021 14:21");
  assert(!en.includes("PM") && !en.includes("AM"));
  assertEquals(formatZsDisplayDuration("P3D", "en"), "3 days");
  assertEquals(formatZsDisplayDuration("P2W", "en"), "2 weeks");
});

Deno.test({
  name: "temporal display: wall clock unchanged across process TZ",
  permissions: { env: true },
  fn() {
    for (const tz of ["UTC", "America/New_York"] as const) {
      const prev = Deno.env.get("TZ");
      Deno.env.set("TZ", tz);
      try {
        const en = formatZsDisplayDateTime(WALL_CLOCK_ISO, "DV_DATE_TIME", "en");
        assertStringIncludes(en, "14:21");
        assertEquals(en, "21 Oct 2021 14:21");
      } finally {
        if (prev === undefined) Deno.env.delete("TZ");
        else Deno.env.set("TZ", prev);
      }
    }
  },
});

Deno.test("temporal display: Swedish locale differs from English", () => {
  const sv = formatZsDisplayDuration("P2W", "sv");
  const en = formatZsDisplayDuration("P2W", "en");
  assert(sv.includes("2") && en.includes("2"));
  assertStringIncludes(sv, "veck");
  assert(!en.includes("veck"));
  const svDt = formatZsDisplayDateTime(WALL_CLOCK_ISO, "DV_DATE_TIME", "sv");
  assertStringIncludes(svDt, "14:21");
  assertStringIncludes(svDt, "okt");
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