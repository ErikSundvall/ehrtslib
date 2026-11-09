/**
 * Block-boundary helpers for Markdown / AsciiDoc serializers so renderers (GFM,
 * AsciiDoctor) recognize headings, tables, and emphasized event titles.
 */

/** Insert a single blank line when the buffer ends with non-blank content. */
export function ensureBlankLineBeforeBlock(lines: string[]): void {
  if (lines.length === 0) return;
  if (lines[lines.length - 1] !== "") {
    lines.push("");
  }
}

/** Collapse runs of 3+ newlines to a single blank line between blocks. */
export function finalizeDocumentText(lines: string[]): string {
  const joined = lines.join("\n");
  const normalized = joined.replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "");
  return normalized.length ? normalized + "\n" : "\n";
}
