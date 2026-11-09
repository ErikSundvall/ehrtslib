/**
 * Lossy document preset rules for OBSERVATION HISTORY (compact, embedding, wikilink).
 * Structural round-trip output is unchanged.
 */

export type DocumentOutputStyle = "structural" | "compact" | "embedding" | string | undefined;

export function isLossyDocumentStyle(style: DocumentOutputStyle): boolean {
  return style !== undefined && style !== "structural";
}

function dvDateTimeValue(dv: unknown): string {
  if (!dv) return "";
  if (typeof dv === "string") return dv;
  if (typeof dv === "object" && dv !== null) {
    const v = (dv as Record<string, unknown>).value;
    return typeof v === "string" ? v : "";
  }
  return "";
}

export function historyEvents(history: unknown): unknown[] {
  if (!history || typeof history !== "object") return [];
  const events = (history as Record<string, unknown>).events;
  return Array.isArray(events) ? events : [];
}

/** ISO-8601 time of the sole event, or the earliest event by time. */
export function anchorEventTimeValue(history: unknown): string {
  const events = historyEvents(history);
  let best = "";
  for (const ev of events) {
    if (!ev || typeof ev !== "object") continue;
    const t = dvDateTimeValue((ev as Record<string, unknown>).time);
    if (!t) continue;
    if (!best || t < best) best = t;
  }
  return best;
}

export function historyOriginValue(history: unknown): string {
  if (!history || typeof history !== "object") return "";
  return dvDateTimeValue((history as Record<string, unknown>).origin);
}

/** True when redundant with anchor event time (lossy presets only). */
export function historyOriginRedundantWithAnchor(history: unknown): boolean {
  const origin = historyOriginValue(history);
  if (!origin) return false;
  const anchor = anchorEventTimeValue(history);
  if (!anchor) return false;
  return origin === anchor;
}

export function shouldEmitHistoryOrigin(
  history: unknown,
  style: DocumentOutputStyle,
): boolean {
  const origin = historyOriginValue(history);
  if (!origin) return false;
  if (!isLossyDocumentStyle(style)) return true;
  return !historyOriginRedundantWithAnchor(history);
}

export function shouldSkipLossyEventTitles(
  style: DocumentOutputStyle,
  eventCount: number,
): boolean {
  return isLossyDocumentStyle(style) && eventCount === 1;
}
