/** Testable helpers for narrative caret offsets and highlight anchoring. */

export function clampCaretOffset(text: string, offset: number): number {
  if (!Number.isFinite(offset) || offset < 0) return 0;
  return Math.min(Math.floor(offset), text.length);
}

/**
 * Map a remote wire caret offset onto peer text. Uses trailing context from the
 * sender (characters immediately before the caret) so stale indices land on the
 * correct line after Automerge merge, not on an earlier duplicate substring.
 */
export function resolveCaretOffset(
  text: string,
  wireOffset: number,
  beforeCaret = "",
): number {
  const anchor = clampCaretOffset(text, wireOffset);
  if (!beforeCaret) return anchor;
  const tail = beforeCaret.slice(-Math.min(32, beforeCaret.length));
  if (!tail) return anchor;

  const hits = allSnippetMatches(text, tail, 0, text.length);
  if (hits.length === 1) return hits[0]! + tail.length;
  if (hits.length > 1) {
    const match = closestMatch(hits, Math.max(0, anchor - tail.length), tail.length);
    if (match) return match.end;
  }

  const nearStart = Math.max(0, anchor - tail.length - 64);
  const nearEnd = Math.min(text.length, anchor + tail.length + 64);
  const near = text.indexOf(tail, nearStart);
  if (near >= 0 && near + tail.length <= nearEnd) {
    return near + tail.length;
  }

  // Sync still in flight: sender context not in peer text yet — hide rather than
  // trust a pre-merge UTF-16 index (often lands on duplicate words like "was").
  if (hits.length === 0) return -1;
  return anchor;
}

/** When wire caret lags but a peer highlight lands at the document tail, trust the tail. */
export function reconcileCaretWithHighlights(
  text: string,
  wireOffset: number,
  beforeCaret: string,
  peerHighlight: { start: number; end: number } | null,
): number {
  let at = resolveCaretOffset(text, wireOffset, beforeCaret);
  if (at < 0) return at;
  if (!peerHighlight) return at;
  if (peerHighlight.end >= text.length - 1 && at < peerHighlight.start) {
    return text.length;
  }
  return at;
}

/** Whether index `at` is on the requested line (0-based), for caret layout checks. */
export function caretLineIndex(text: string, at: number): number {
  const clamped = clampCaretOffset(text, at);
  return text.slice(0, clamped).split("\n").length - 1;
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

/** Map a UTF-16 offset to coordinates inside a textarea (explicit `\n` lines). */
export function caretOffsetToCoords(
  textarea: HTMLTextAreaElement,
  text: string,
  at: number,
): { left: number; top: number } {
  const style = getComputedStyle(textarea);
  const padL = parseFloat(style.paddingLeft) || 0;
  const padT = parseFloat(style.paddingTop) || 0;
  const lineHeight = parseFloat(style.lineHeight) ||
    parseFloat(style.fontSize) * 1.2 || 16;
  const font = style.font || `${style.fontSize} ${style.fontFamily}`;
  const clamped = clampCaretOffset(text, at);
  const before = text.slice(0, clamped);
  const lineIndex = before.split("\n").length - 1;
  const lineStart = before.lastIndexOf("\n") + 1;
  const col = before.slice(lineStart);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const colLen = before.slice(lineStart).length;
    const approxChar = 7.2;
    return {
      left: padL + colLen * approxChar,
      top: padT + lineIndex * lineHeight,
    };
  }
  ctx.font = font;
  const innerWidth = textarea.clientWidth - padL -
    (parseFloat(style.paddingRight) || 0);
  let colText = col;
  let wrapLines = 0;
  while (colText.length > 0) {
    let fit = colText.length;
    while (
      fit > 0 && ctx.measureText(colText.slice(0, fit)).width > innerWidth
    ) {
      fit--;
    }
    if (fit === 0) fit = 1;
    if (fit < colText.length) {
      wrapLines++;
      colText = colText.slice(fit);
    } else {
      colText = "";
    }
  }
  const linePrefix = before.slice(lineStart);
  const left = padL + Math.min(
    ctx.measureText(linePrefix).width,
    innerWidth,
  );
  const top = padT + (lineIndex + wrapLines) * lineHeight;
  return { left, top };
}
