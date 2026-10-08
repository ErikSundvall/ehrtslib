/**
 * Deno's built-in Temporal global, typed for this repo.
 *
 * `tsconfig.json` sets `lib` to ES2020 + DOM, which does not include Temporal.
 * Deno 2.7+ provides the runtime global with no flag. A helper avoids declaring
 * `globalThis.Temporal`, which collides with Deno's own `lib.esnext.temporal`
 * when that lib is also loaded.
 */

interface TemporalDurationLike {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
  microseconds?: number;
  nanoseconds?: number;
}

export interface TemporalDuration extends TemporalDurationLike {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  microseconds: number;
  nanoseconds: number;
  add(other: TemporalDuration | TemporalDurationLike): TemporalDuration;
  subtract(other: TemporalDuration | TemporalDurationLike): TemporalDuration;
  negated(): TemporalDuration;
  total(options: { unit: string }): number;
  toString(): string;
}

interface TemporalOverflowOptions {
  overflow?: string;
}

export interface TemporalPlainDate {
  year: number;
  month: number;
  day: number;
  add(
    duration: TemporalDuration,
    options?: TemporalOverflowOptions,
  ): TemporalPlainDate;
  subtract(
    duration: TemporalDuration,
    options?: TemporalOverflowOptions,
  ): TemporalPlainDate;
  since(other: TemporalPlainDate): TemporalDuration;
  toString(): string;
}

interface TemporalPlainYearMonth {
  year: number;
  month: number;
}

interface TemporalToStringOptions {
  smallestUnit?: string;
}

interface TemporalPlainDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  microsecond: number;
  nanosecond: number;
  add(duration: TemporalDuration): TemporalPlainDateTime;
  subtract(duration: TemporalDuration): TemporalPlainDateTime;
  since(other: TemporalPlainDateTime): TemporalDuration;
  toPlainDate(): TemporalPlainDate;
  toString(options?: TemporalToStringOptions): string;
}

interface TemporalPlainTime {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  microsecond: number;
  nanosecond: number;
  add(duration: TemporalDuration): TemporalPlainTime;
  subtract(duration: TemporalDuration): TemporalPlainTime;
  since(other: TemporalPlainTime): TemporalDuration;
  toString(options?: TemporalToStringOptions): string;
}

interface TemporalZonedDateTime {
  offset: string;
  toPlainDateTime(): TemporalPlainDateTime;
}

export interface TemporalNamespace {
  Now: {
    plainDateISO(): TemporalPlainDate;
    plainTimeISO(): TemporalPlainTime;
    zonedDateTimeISO(): TemporalZonedDateTime;
  };
  PlainDate: {
    from(value: string): TemporalPlainDate;
    compare(one: TemporalPlainDate, two: TemporalPlainDate): number;
  };
  PlainYearMonth: {
    from(value: string): TemporalPlainYearMonth;
  };
  PlainDateTime: {
    from(value: string): TemporalPlainDateTime;
    compare(one: TemporalPlainDateTime, two: TemporalPlainDateTime): number;
  };
  PlainTime: {
    from(value: string): TemporalPlainTime;
    compare(one: TemporalPlainTime, two: TemporalPlainTime): number;
  };
  Duration: {
    from(value: string): TemporalDuration;
  };
}

export function builtinTemporal(): TemporalNamespace {
  return (globalThis as unknown as { Temporal: TemporalNamespace }).Temporal;
}
