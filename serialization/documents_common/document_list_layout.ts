/**
 * Lossy AsciiDoc / Markdown list layout helpers (definition lists vs bullet lists).
 */

/**
 * AsciiDoc definition list term line.
 * Nesting depth is extra `:` **after the term** (`Namn::`, `Namn:::`, …), never leading colons.
 */
export function asciidocDlistTermLine(
  nestLevel: number,
  term: string,
  value: string,
): string {
  const delimiter = "::" + (nestLevel > 0 ? ":".repeat(nestLevel) : "");
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
