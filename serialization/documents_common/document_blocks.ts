/**
 * Normalized block stream for Markdown and AsciiDoc document deserializers.
 */

export type DocumentHeadingBlock = {
  kind: "heading";
  level: number;
  title: string;
  rmType?: string;
  archetypeNodeId?: string;
};

export type DocumentListItemBlock = {
  kind: "list_item";
  indent: number;
  /** Label before colon (optional), may include markdown bold markers. */
  label?: string;
  value?: string;
  raw: string;
  archetypeNodeId?: string;
};

export type DocumentBoldBlock = {
  kind: "bold";
  text: string;
  isInterval?: boolean;
  archetypeNodeId?: string;
};

export type DocumentBlock =
  | DocumentHeadingBlock
  | DocumentListItemBlock
  | DocumentBoldBlock;

export type DocumentDialect = "structural_lossless" | "embedding_or_lossy";

const STRUCTURAL_MARKERS = new RegExp(
  String.raw`<!--\s*[^>]+\s*-->|\b_\[[A-Z][A-Z0-9_]*\]_\b|^---\s*$|^:[\w-]+:\s*.+$|^\/\/\s*\S+`,
  "m",
);

/**
 * Detect whether text looks like a structural / lossless openEHR document dialect.
 * Embedding, clinical, and compact outputs intentionally lack round-trip markers.
 */
export function detectDocumentDialect(text: string): DocumentDialect {
  if (STRUCTURAL_MARKERS.test(text)) {
    return "structural_lossless";
  }
  return "embedding_or_lossy";
}

export const ENTRY_TYPES = new Set([
  "OBSERVATION",
  "EVALUATION",
  "INSTRUCTION",
  "ACTION",
  "ADMIN_ENTRY",
  "GENERIC_ENTRY",
]);

export function stripNodeIdAndType(
  line: string,
): { text: string; archetypeNodeId?: string; rmType?: string } {
  let rest = line.trim();
  let archetypeNodeId: string | undefined;

  const comment = rest.match(/<!--\s*([^>]+)\s*-->/);
  if (comment) {
    archetypeNodeId = comment[1].trim();
    rest = rest.replace(/<!--\s*[^>]+\s*-->/g, "").trim();
  }

  const inlineAdoc = rest.match(/\s+\/\/\s+([^\s]+)\s*$/);
  if (inlineAdoc) {
    archetypeNodeId ??= inlineAdoc[1].trim();
    rest = rest.replace(/\s+\/\/\s+[^\s]+\s*$/, "").trim();
  }

  let rmType: string | undefined;
  const typeAnn = rest.match(/_\[\s*([A-Z][A-Z0-9_]*)\s*\]_/);
  if (typeAnn) {
    rmType = typeAnn[1];
    rest = rest.replace(/_\[\s*[A-Z][A-Z0-9_]*\s*\]_/g, "").trim();
  }

  rest = rest.replace(/\[\[urn:openehr:(?:aom|am):[^\]]+\|[^\]]*\]\]/g, "").trim();

  return { text: rest, archetypeNodeId, rmType };
}
