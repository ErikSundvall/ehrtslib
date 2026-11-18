/**
 * Human-readable labels for DV_DATE/TIME/DATE_TIME/DURATION in ZipEHR HTML5
 * quiet preview (canonical ISO stays in data-zs-value).
 *
 * Wall-clock components are taken from the ISO string; never from the host TZ.
 */

export interface WallDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  hasTime: boolean;
}

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const SV_MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "maj",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
] as const;

/** Parse openEHR-style ISO 8601; wall time is literal in the string (offset not applied). */
export function parseWallDateTimeFromIso(iso: string): WallDateTimeParts | null {
  const trimmed = iso.trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    return {
      year: Number(dateOnly[1]),
      month: Number(dateOnly[2]),
      day: Number(dateOnly[3]),
      hour: 0,
      minute: 0,
      second: 0,
      hasTime: false,
    };
  }
  const withTime =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{0,2})?$/
      .exec(trimmed);
  if (!withTime) return null;
  return {
    year: Number(withTime[1]),
    month: Number(withTime[2]),
    day: Number(withTime[3]),
    hour: Number(withTime[4]),
    minute: Number(withTime[5]),
    second: Number(withTime[6] ?? 0),
    hasTime: true,
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function monthShort(locale: string, month: number): string {
  const lang = (locale || "en").split("-")[0];
  if (lang === "sv") return SV_MONTHS[month - 1] ?? String(month);
  return EN_MONTHS[month - 1] ?? String(month);
}

export function formatZsDisplayDateTime(
  iso: string,
  rmType: string,
  locale: string,
): string {
  if (!iso) return "";
  const loc = locale || "en";
  const plain = rmType === "DV_DATE"
    ? (iso.length >= 10 ? iso.slice(0, 10) : iso)
  : rmType === "DV_TIME"
    ? (iso.includes("T") ? iso.split("T")[1] : iso)
    : iso;
  const parts = parseWallDateTimeFromIso(
    rmType === "DV_TIME"
      ? `2000-01-01T${plain.replace(/Z|[+-].*$/, "")}`
      : plain,
  );
  if (!parts) return iso;
  const day = parts.day;
  const mon = monthShort(loc, parts.month);
  const year = parts.year;
  const dateSeg = loc.startsWith("sv")
    ? `${day} ${mon} ${year}`
    : `${day} ${mon} ${year}`;
  if (rmType === "DV_DATE" || !parts.hasTime) return dateSeg;
  if (rmType === "DV_TIME") {
    return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
  }
  return `${dateSeg} ${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

/** openEHR ISO 8601 duration → short clinical phrase (weeks/days/hours…). */
export function formatZsDisplayDuration(
  iso: string,
  locale: string,
): string {
  if (!iso) return "";
  const loc = locale || "en";
  const parts: { unit: string; count: number }[] = [];
  const re =
    /^P(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i;
  const m = re.exec(iso.trim());
  if (!m) return iso;
  const push = (count: string | undefined, unit: string) => {
    if (!count) return;
    const n = Number(count);
    if (Number.isFinite(n) && n !== 0) parts.push({ unit, count: n });
  };
  push(m[1], "year");
  push(m[2], "month");
  push(m[3], "week");
  push(m[4], "day");
  push(m[5], "hour");
  push(m[6], "minute");
  push(m[7], "second");
  if (!parts.length) return iso;
  const labels: Record<string, Record<string, [string, string]>> = {
    en: {
      year: ["year", "years"],
      month: ["month", "months"],
      week: ["week", "weeks"],
      day: ["day", "days"],
      hour: ["hour", "hours"],
      minute: ["minute", "minutes"],
      second: ["second", "seconds"],
    },
    sv: {
      year: ["år", "år"],
      month: ["månad", "månader"],
      week: ["vecka", "veckor"],
      day: ["dag", "dagar"],
      hour: ["timme", "timmar"],
      minute: ["minut", "minuter"],
      second: ["sekund", "sekunder"],
    },
  };
  const dict = labels[loc] ?? labels[loc.split("-")[0]] ?? labels.en;
  const nf = new Intl.NumberFormat(loc);
  const words = parts.map(({ unit, count }) => {
    const pair = dict[unit] ?? [unit, `${unit}s`];
    const label = count === 1 ? pair[0] : pair[1];
    return `${nf.format(count)} ${label}`;
  });
  return words.join(" ");
}