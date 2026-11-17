/**
 * Human-readable labels for DV_DATE/TIME/DATE_TIME/DURATION in ZipEHR HTML5
 * quiet preview (canonical ISO stays in data-zs-value).
 */

const Temporal = globalThis.Temporal;

export function formatZsDisplayDateTime(
  iso: string,
  rmType: string,
  locale: string,
): string {
  if (!iso) return "";
  const loc = locale || "en";
  try {
    if (rmType === "DV_DATE") {
      const plain = iso.length >= 10 ? iso.slice(0, 10) : iso;
      const d = Temporal.PlainDate.from(plain);
      return new Intl.DateTimeFormat(loc, { dateStyle: "medium" }).format(
        new Date(d.year, d.month - 1, d.day),
      );
    }
    if (rmType === "DV_TIME") {
      const t = Temporal.PlainTime.from(iso.replace(/^.*T/, "") || iso);
      return new Intl.DateTimeFormat(loc, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(2000, 0, 1, t.hour, t.minute, t.second));
    }
    const instant = new Date(iso);
    if (!Number.isNaN(instant.getTime())) {
      return new Intl.DateTimeFormat(loc, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(instant);
    }
  } catch {
    /* fall through */
  }
  return iso;
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