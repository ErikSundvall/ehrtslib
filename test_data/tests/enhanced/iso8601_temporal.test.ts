/**
 * ISO 8601 arithmetic uses Deno's built-in Temporal global (2.7+).
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { Env } from "../../../base/base_types/builtins.ts";
import { builtinTemporal } from "../../../base/foundation_types/temporal_api.ts";
import {
  Iso8601_date,
  Iso8601_date_time,
  Iso8601_duration,
} from "../../../base/foundation_types/time.ts";

function date(value: string): Iso8601_date {
  const result = new Iso8601_date();
  result.value = value;
  return result;
}

function dateTime(value: string): Iso8601_date_time {
  const result = new Iso8601_date_time();
  result.value = value;
  return result;
}

function duration(value: string): Iso8601_duration {
  const result = new Iso8601_duration();
  result.value = value;
  return result;
}

Deno.test("Iso8601_date parses full, year-month, and year-only values", () => {
  const full = date("2020-01-15");
  assertEquals(full.year().value, 2020);
  assertEquals(full.month().value, 1);
  assertEquals(full.day().value, 15);

  const yearMonth = date("2020-03");
  assertEquals(yearMonth.year().value, 2020);
  assertEquals(yearMonth.month().value, 3);
  assertEquals(yearMonth.day().value, 0);
  assertEquals(yearMonth.month_unknown().value, false);
  assertEquals(yearMonth.day_unknown().value, true);

  const yearOnly = date("2020");
  assertEquals(yearOnly.year().value, 2020);
  assertEquals(yearOnly.month().value, 0);
  assertEquals(yearOnly.day().value, 0);
  assertEquals(yearOnly.month_unknown().value, true);
});

Deno.test("Iso8601_date and Iso8601_date_time add, subtract, and diff", () => {
  assertEquals(date("2020-01-31").add(duration("P1D")).value, "2020-02-01");
  assertEquals(
    date("2020-02-01").subtract(duration("P1D")).value,
    "2020-01-31",
  );
  assertEquals(date("2020-01-11").diff(date("2020-01-01")).value, "P10D");

  const summed = dateTime("2020-01-15T13:00:00").add(duration("PT90M"));
  assertEquals(summed.value, "2020-01-15T14:30:00");
  const subtracted = dateTime("2020-01-15T14:30:00").subtract(
    duration("PT90M"),
  );
  assertEquals(subtracted.value, "2020-01-15T13:00:00");
  assertEquals(
    dateTime("2020-01-15T14:30:00").diff(dateTime("2020-01-15T13:00:00")).value,
    "PT1H30M",
  );
});

Deno.test("Iso8601_duration add and subtract", () => {
  assertEquals(duration("P1D").add(duration("P2D")).value, "P3D");
  assertEquals(duration("PT3H").subtract(duration("PT1H")).value, "PT2H");
});

Deno.test("Env.current_date returns today's Iso8601_date", () => {
  const today = Env.current_date();
  assert(today instanceof Iso8601_date);
  const clock = builtinTemporal();
  assertEquals(today.value, clock.Now.plainDateISO().toString());
  assertEquals(today.month().value, clock.Now.plainDateISO().month);

  const now = Env.current_date_time();
  assert(now instanceof Iso8601_date_time);
  assert(now.value?.startsWith(today.value + "T"));

  const zone = Env.current_time_zone();
  assertEquals(zone.value, clock.Now.zonedDateTimeISO().offset);
});
