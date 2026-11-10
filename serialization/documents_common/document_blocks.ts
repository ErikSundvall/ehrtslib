/**
 * Normalized block stream for Markdown and AsciiDoc document deserializers.
 */

import { isOeRmAnnotationInner } from "./oe_rm_annotation.ts";
import {
  isOeValueAnnotationInner,
  OE_VALUE_ANNOTATION_PREFIX,
} from "./oe_value_annotation.ts";

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
  /** Inner payload `oe:v1:b64:…` when present (sparse value typing). */
  oeValuePayload?: string;
  /** Inner payload `oe:rm:v1:b64:…` when present (sparse RM patch). */
  oeRmPayload?: string;
};

export type DocumentBoldBlock = {
  kind: "bold";
  text: string;
  isInterval?: boolean;
  archetypeNodeId?: string;
};

export type DocumentStructureMetaBlock = {
  kind: "structure_meta";
  field: string;
  value: string;
};

export type DocumentBlock =
  | DocumentHeadingBlock
  | DocumentListItemBlock
  | DocumentBoldBlock
  | DocumentStructureMetaBlock;

export type DocumentDialect = "structural_lossless" | "embedding_or_lossy";

const STRUCTURAL_MARKERS = new RegExp(
  String.raw`<!--\s*[^>]+\s*-->|\b_\[[A-Z][A-Z0-9_]*\]_\b|^---\s*$|^:[\w-]+:\s*.+$|^\/\/\s*\S+`,
  "m",
);

/**
 * Detect whether text looks like a structural / lossless openEHR document dialect.
 * Embedding, compact, and wikilink outputs intentionally lack round-trip markers.
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
): {
  text: string;
  archetypeNodeId?: string;
  rmType?: string;
  oeValuePayload?: string;
  oeRmPayload?: string;
} {
  let rest = line.trim();
  let archetypeNodeId: string | undefined;
  let oeValuePayload: string | undefined;
  let oeRmPayload: string | undefined;

  for (const comment of rest.matchAll(/<!--\s*([^>]+?)\s*-->/g)) {
    const inner = comment[1].trim();
    if (isOeRmAnnotationInner(inner)) oeRmPayload = inner;
    else if (isOeValueAnnotationInner(inner)) oeValuePayload = inner;
    else if (isArchetypeNodeIdMarker(inner)) archetypeNodeId ??= inner;
  }
  rest = rest.replace(/<!--\s*[^>]+?\s*-->/g, "").trim();

  const oeRmAny = rest.match(/\s+\/\/\s+(oe:rm:v1:b64:\S+)/);
  if (oeRmAny) {
    oeRmPayload ??= oeRmAny[1].trim();
    rest = rest.replace(/\s+\/\/\s+oe:rm:v1:b64:\S+/g, "").trim();
  }
  const oeValAny = rest.match(new RegExp(String.raw`\s+//\s+(${OE_VALUE_ANNOTATION_PREFIX}\S+)`));
  if (oeValAny) {
    oeValuePayload ??= oeValAny[1].trim();
    rest = rest.replace(new RegExp(String.raw`\s+//\s+${OE_VALUE_ANNOTATION_PREFIX}\S+`, "g"), "").trim();
  }

  const inlineAdoc = rest.match(/\s+\/\/\s+([^\s]+)\s*$/);
  if (inlineAdoc) {
    const candidate = inlineAdoc[1].trim();
    if (isArchetypeNodeIdMarker(candidate)) {
      archetypeNodeId ??= candidate;
      rest = rest.replace(/\s+\/\/\s+[^\s]+\s*$/, "").trim();
    }
  }

  let rmType: string | undefined;
  const typeAnn = rest.match(/_\[\s*([A-Z][A-Z0-9_]*)\s*\]_/);
  if (typeAnn) {
    rmType = typeAnn[1];
    rest = rest.replace(/_\[\s*[A-Z][A-Z0-9_]*\s*\]_/g, "").trim();
  }

  rest = rest.replace(/\[\[urn:openehr:aom:[^\]]+\|[^\]]*\]\]/g, "").trim();

  return { text: rest, archetypeNodeId, rmType, oeValuePayload, oeRmPayload };
}

/** AsciiDoc `//` comment lines that carry round-trip archetype node ids (not free-form doc notes). */
export function isArchetypeNodeIdMarker(id: string): boolean {
  const s = id.trim();
  if (!s) return false;
  if (/^at\d{4}/.test(s)) return true;
  if (/^openEHR-EHR-/.test(s)) return true;
  if (s.startsWith("urn:openehr:aom:")) return true;
  return false;
}
