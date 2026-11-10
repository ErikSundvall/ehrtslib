/** Testable helpers for narrative caret offsets and highlight anchoring. */

export function clampCaretOffset(text: string, offset: number): number {
  if (!Number.isFinite(offset) || offset < 0) return 0;
  return Math.min(Math.floor(offset), text.length);
}

function allSnippetMatches(
  text: string,
  snippet: string,
  from: number,
  to: number,
): number[] {
  const hits: number[] = [];
  const slice = text.slice(from, to);
  let cursor = 0;
  while (cursor < slice.length) {
    const found = slice.indexOf(snippet, cursor);
    if (found < 0) break;
    hits.push(from + found);
    cursor = found + 1;
  }
  return hits;
}

function closestMatch(
  positions: number[],
  anchor: number,
  snippetLength: number,
): { start: number; end: number } | null {
  if (!positions.length) return null;
  let best = positions[0]!;
  let bestDist = Math.abs(best - anchor);
  for (const pos of positions.slice(1)) {
    const dist = Math.abs(pos - anchor);
    if (dist < bestDist) {
      best = pos;
      bestDist = dist;
    }
  }
  return { start: best, end: best + snippetLength };
}

/**
 * Anchor a remote highlight on this peer's merged text.
 * Wire offsets are authoritative when the snippet still matches; otherwise search
 * only near the wire range (never the first global `indexOf`, which mis-places
 * short inserts like single letters in long clinical text).
 */
export function resolveHighlightRange(
  text: string,
  preferredStart: number,
  snippet: string,
  preferredEnd?: number,
): { start: number; end: number } | null {
  if (!snippet) return null;
  const anchor = clampCaretOffset(text, preferredStart);
  const wireEnd = preferredEnd === undefined
    ? anchor + snippet.length
    : clampCaretOffset(text, Math.max(anchor, preferredEnd));

  if (text.slice(anchor, wireEnd) === snippet) {
    return { start: anchor, end: wireEnd };
  }

  const pad = Math.max(48, snippet.length * 6);
  const windowStart = Math.max(0, anchor - pad);
  const windowEnd = Math.min(text.length, wireEnd + pad);
  const near = closestMatch(
    allSnippetMatches(text, snippet, windowStart, windowEnd),
    anchor,
    snippet.length,
  );
  if (near) return near;

  const global = allSnippetMatches(text, snippet, 0, text.length);
  if (global.length === 1) {
    const start = global[0]!;
    return { start, end: start + snippet.length };
  }
  if (global.length > 1) {
    return closestMatch(global, anchor, snippet.length);
  }
  return null;
}

export function escapeMirrorText(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
