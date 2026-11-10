/**
 * Lossy AsciiDoc / Markdown list layout helpers (definition lists vs bullet lists).
 */

/**
 * AsciiDoc labelled-list delimiters, shallowest first.
 * `::` / `:::` / `::::` are the colon forms; deeper nesting uses `;;`.
 */
const ASCIIDOC_DLIST_DELIMITERS = ["::", ":::", "::::", ";;"] as const;

/**
 * AsciiDoc definition list term line.
 * `nestLevel` 0 is a value directly under a heading or block title (`Term:: value`).
 * Deeper levels are only real nested lists, and never more than four colons.
 */
export function asciidocDlistTermLine(
  nestLevel: number,
  term: string,
  value: string,
): string {
  const level = Number.isFinite(nestLevel)
    ? Math.max(0, Math.floor(nestLevel))
    : 0;
  const delimiter = ASCIIDOC_DLIST_DELIMITERS[
    Math.min(level, ASCIIDOC_DLIST_DELIMITERS.length - 1)
  ];
  return `${term}${delimiter} ${value}`;
}

/** Reject erroneous `::term::` lines (leading colons before the term). */
export function assertNoLeadingColonDlistLines(text: string): void {
  for (const line of text.split("\n")) {
    const trimmed = line.trimStart();
    if (/^:{2,}[^:\s]/.test(trimmed)) {
      throw new Error(`AsciiDoc dlist must not use leading colons: ${line}`);
    }
  }
}
