/** Testable helpers for narrative caret offsets and highlight anchoring. */

export function clampCaretOffset(text: string, offset: number): number {
  if (!Number.isFinite(offset) || offset < 0) return 0;
  return Math.min(Math.floor(offset), text.length);
}

/** Start/end UTF-16 offsets for the logical line containing `at`. */
export function caretLogicalLineRange(text: string, at: number): {
  start: number;
  end: number;
  lineIndex: number;
} {
  const clamped = clampCaretOffset(text, at);
  const start = text.lastIndexOf("\n", clamped - 1) + 1;
  const nextNl = text.indexOf("\n", clamped);
  const end = nextNl < 0 ? text.length : nextNl;
  return {
    start,
    end,
    lineIndex: text.slice(0, clamped).split("\n").length - 1,
  };
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
