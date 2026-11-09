/**
 * Lossy AsciiDoc / Markdown list layout helpers (definition lists vs bullet lists).
 */

/** Nested AsciiDoc dlist term prefix (`::` for level 1, `:::` for level 2, …). */
export function asciidocDlistTermLine(
  nestLevel: number,
  term: string,
  value: string,
): string {
  const lead = nestLevel <= 0 ? "" : ":".repeat(nestLevel + 1);
  return `${lead}${term}:: ${value}`;
}
