/**
 * Hidden structural metadata for lossless Markdown / AsciiDoc round-trip
 * (`item_node_id`, `item_name`, non-default `ITEM_TREE` structure types).
 */

export const OE_META_PREFIX = "oe:meta:" as const;

export function isOeMetaInner(text: string): boolean {
  return text.startsWith(OE_META_PREFIX);
}

export function parseOeMetaInner(inner: string): { field: string; value: string } | null {
  if (!isOeMetaInner(inner)) return null;
  const rest = inner.slice(OE_META_PREFIX.length);
  const eq = rest.indexOf("=");
  if (eq <= 0) return null;
  return { field: rest.slice(0, eq), value: rest.slice(eq + 1) };
}

export function formatOeMetaMarkdown(field: string, value: string): string {
  return `<!-- ${OE_META_PREFIX}${field}=${value} -->`;
}

export function formatOeMetaAsciidoc(field: string, value: string): string {
  return `// ${OE_META_PREFIX}${field}=${value}`;
}
