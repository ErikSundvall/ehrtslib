// openEHR BASE model — BMM package org.openehr.base.base_types.builtins
// Package boundaries follow tasks/bmm_package_map.json.

import { builtinTemporal } from "../foundation_types/temporal_api.ts";
import {
  Iso8601_date,
  Iso8601_date_time,
  Iso8601_time,
  Iso8601_timezone,
} from "../foundation_types/time.ts";

/**
 * Real-world environment: current date, time, and time zone.
 *
 * BMM interface `Env` (`org.openehr.base.base_types.builtins`). The functions
 * read Deno's built-in `Temporal` global (stable since Deno 2.7).
 */
export class Env {
  /**
   * Return today's date in the current locale.
   */
  static current_date(): Iso8601_date {
    const date = new Iso8601_date();
    date.value = builtinTemporal().Now.plainDateISO().toString();
    return date;
  }

  /**
   * Return current time in the current locale.
   */
  static current_time(): Iso8601_time {
    const time = new Iso8601_time();
    time.value = builtinTemporal().Now.plainTimeISO().toString({
      smallestUnit: "second",
    });
    return time;
  }

  /**
   * Return current date/time in the current locale, with a numeric offset.
   */
  static current_date_time(): Iso8601_date_time {
    const zoned = builtinTemporal().Now.zonedDateTimeISO();
    const dateTime = new Iso8601_date_time();
    dateTime.value =
      zoned.toPlainDateTime().toString({ smallestUnit: "second" }) +
      zoned.offset;
    return dateTime;
  }

  /**
   * Return the timezone offset of the current locale (`±hh:mm`).
   */
  static current_time_zone(): Iso8601_timezone {
    const zone = new Iso8601_timezone();
    zone.value = builtinTemporal().Now.zonedDateTimeISO().offset;
    return zone;
  }
}
