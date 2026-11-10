/** Testable helpers for narrative caret offsets and highlight anchoring. */

export function clampCaretOffset(text: string, offset: number): number {
  if (!Number.isFinite(offset) || offset < 0) return 0;
  return Math.min(Math.floor(offset), text.length);
}

/**
 * Find `snippet` in `text`, preferring a match at/after `preferredStart`
 * (needed when wire offsets pre-date Automerge merge on the peer).
 */
export function resolveHighlightRange(
  text: string,
  preferredStart: number,
  snippet: string,
): { start: number; end: number } | null {
  if (!snippet) return null;
  const anchor = clampCaretOffset(text, preferredStart);
  const near = text.indexOf(snippet, Math.max(0, anchor - 24));
  if (near >= 0) {
    return { start: near, end: near + snippet.length };
  }
  const anywhere = text.indexOf(snippet);
  if (anywhere < 0) return null;
  return { start: anywhere, end: anywhere + snippet.length };
}

export function escapeMirrorText(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
