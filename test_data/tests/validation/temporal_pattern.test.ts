import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  adlTemporalPatternToRegExp,
  matchesAdlTemporalPattern,
  matchesDurationPattern,
} from "../../../validation/temporal_pattern.ts";

Deno.test("ADL temporal pattern yyyy-mm-?? accepts year-month and year-month-day", () => {
  const re = adlTemporalPatternToRegExp("yyyy-mm-??");
  assertEquals(re?.test("2020-01"), true);
  assertEquals(re?.test("2020-01-15"), true);
  assertEquals(re?.test("2020"), false);
  assertEquals(matchesAdlTemporalPattern("2020-01-15", "yyyy-mm-??"), true);
});

Deno.test("ADL duration pattern PYMWDTHMS allows ISO-8601 fields in the set", () => {
  assertEquals(matchesDurationPattern("P1Y2M", "PYMWDTHMS"), true);
  assertEquals(matchesDurationPattern("PT1H", "PYMWDTHMS"), true);
  assertEquals(matchesDurationPattern("P1Y", "PT"), false);
});
