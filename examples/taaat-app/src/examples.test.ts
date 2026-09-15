import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  defaultExampleUrl,
  examplesForKind,
  TAAAT_EXAMPLES,
} from "./examples.ts";

Deno.test("TAAAT examples include Ehrlibs diagnose and accident-report t.json", () => {
  const urls = TAAAT_EXAMPLES.map((e) => e.url);
  assertEquals(
    urls.includes(
      "https://github.com/Ehrlibs/openEHR-model-examples/blob/main/local/theme-packs/simple-diagnose-and-vitals/simple-diagnose-and-vitals.t.json",
    ),
    true,
  );
  assertEquals(
    urls.includes(
      "https://github.com/Ehrlibs/openEHR-model-examples/blob/main/local/theme-packs/sport-event-details/templates/Accident%20report%20including%20vital%20signs.t.json",
    ),
    true,
  );
  assertEquals(
    defaultExampleUrl("template").includes("Accident%20report"),
    true,
  );
  assertEquals(examplesForKind("template").length >= 3, true);
  assertEquals(examplesForKind("archetype").length >= 1, true);
});
