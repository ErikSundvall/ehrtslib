// openEHR BASE model — BMM package org.openehr.base.base_types.builtins
// Hand-written from specifications-BASE working copy (Env, Locale, Math, …).
// Package boundaries follow the BMM package structure.

import type { Numeric } from "../foundation_types/primitive_types.ts";
import { Terminology_code } from "../foundation_types/terminology.ts";
import {
  Iso8601_date,
  Iso8601_date_time,
  Iso8601_time,
  Iso8601_timezone,
} from "../foundation_types/time.ts";
import { Temporal as TemporalAPI } from "../temporal_polyfill.ts";

const GMath = globalThis.Math;

function numericValue(v: Numeric | number): number {
  if (typeof v === "number") return v;
  const maybe = v as unknown as { value?: number };
  return maybe.value ?? 0;
}

function toNumbers(
  vals: Iterable<number | { value?: number }> | undefined,
): number[] {
  if (!vals) return [];
  const out: number[] = [];
  for (const v of vals) {
    out.push(typeof v === "number" ? v : v?.value ?? 0);
  }
  return out;
}

/**
 * Class representing the real-world environment, providing basic information
 * like current time, date, etc.
 */
export class Env {
  current_date(): Iso8601_date {
    const d = new Iso8601_date();
    d.value = TemporalAPI.Now.plainDateISO().toString();
    return d;
  }

  current_time(): Iso8601_time {
    const t = new Iso8601_time();
    t.value = TemporalAPI.Now.plainTimeISO().toString();
    return t;
  }

  current_date_time(): Iso8601_date_time {
    const dt = new Iso8601_date_time();
    dt.value = TemporalAPI.Now.zonedDateTimeISO().toString();
    return dt;
  }

  current_time_zone(): Iso8601_timezone {
    const tz = new Iso8601_timezone();
    const offset = TemporalAPI.Now.zonedDateTimeISO().offset;
    tz.value = offset === "+00:00" ? "Z" : offset;
    return tz;
  }
}

/**
 * A basic statistical evaluator class providing common functions on collections
 * of numbers.
 */
export class Statistical_evaluator {
  sum(vals: Iterable<number | { value?: number }> | undefined): number {
    return toNumbers(vals).reduce((a, b) => a + b, 0);
  }

  avg(vals: Iterable<number | { value?: number }> | undefined): number {
    return this.mean(vals);
  }

  mean(vals: Iterable<number | { value?: number }> | undefined): number {
    const nums = toNumbers(vals);
    if (nums.length === 0) return 0;
    return this.sum(nums) / nums.length;
  }

  median(vals: Iterable<number | { value?: number }> | undefined): number {
    const nums = toNumbers(vals).slice().sort((a, b) => a - b);
    if (nums.length === 0) return 0;
    const mid = GMath.floor(nums.length / 2);
    if (nums.length % 2 === 0) {
      return (nums[mid - 1] + nums[mid]) / 2;
    }
    return nums[mid];
  }

  mode(vals: Iterable<number | { value?: number }> | undefined): number {
    const nums = toNumbers(vals);
    if (nums.length === 0) return 0;
    const counts = new Map<number, number>();
    let best = nums[0];
    let bestCount = 0;
    for (const n of nums) {
      const c = (counts.get(n) ?? 0) + 1;
      counts.set(n, c);
      if (c > bestCount) {
        best = n;
        bestCount = c;
      }
    }
    return best;
  }

  max(vals: Iterable<number | { value?: number }> | undefined): number {
    const nums = toNumbers(vals);
    return nums.length ? GMath.max(...nums) : 0;
  }

  min(vals: Iterable<number | { value?: number }> | undefined): number {
    const nums = toNumbers(vals);
    return nums.length ? GMath.min(...nums) : 0;
  }

  count(vals: Iterable<number | { value?: number }> | undefined): number {
    return toNumbers(vals).length;
  }

  std_dev(vals: Iterable<number | { value?: number }> | undefined): number {
    const nums = toNumbers(vals);
    if (nums.length === 0) return 0;
    const mean = this.mean(nums);
    const variance = nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) /
      nums.length;
    return GMath.sqrt(variance);
  }
}

/**
 * Class representing current Locale.
 */
export class Locale {
  primary_language(): Terminology_code {
    const code = new Terminology_code();
    const lang = (typeof navigator !== "undefined" && navigator.language) ||
      "en";
    code.code_string = lang.split("-")[0];
    return code;
  }
}

/**
 * Mathematical computation.
 */
export class Math {
  ln(v: Numeric | number): number {
    return GMath.log(numericValue(v));
  }

  log(v: Numeric | number): number {
    return GMath.log10(numericValue(v));
  }

  sin(v: Numeric | number): number {
    return GMath.sin(numericValue(v));
  }
}

/**
 * Quantity conversion. Unit conversion for physical properties is performed
 * by the TERM UCUM service; this class is the BASE BMM entry point.
 */
export class Quantity_converter {
  convert_value(
    value: number,
    from_units: { value?: string } | string,
    to_units: { value?: string } | string,
    _property?: Terminology_code,
  ): number {
    const from = typeof from_units === "string"
      ? from_units
      : from_units.value ?? "";
    const to = typeof to_units === "string" ? to_units : to_units.value ?? "";
    if (from === to) return value;
    throw new Error(
      `Quantity_converter.convert_value cannot convert ${from} to ${to} without a UCUM service`,
    );
  }
}
