/**
 * Lex lossless AsciiDoc into normalized document blocks.
 */

import type { DocumentBlock } from "../documents_common/document_blocks.ts";
import { isArchetypeNodeIdMarker, stripNodeIdAndType } from "../documents_common/document_blocks.ts";
import { isOeMetaInner, parseOeMetaInner } from "../documents_common/oe_structure_meta.ts";
import { archetypeIdFromOpenehrUrn } from "../documents_common/openehr_aom_urn.ts";

function normalizeNodeId(id: string | undefined): string | undefined {
  if (!id) return id;
  return archetypeIdFromOpenehrUrn(id) ?? id;
}

const ATTR_RE = /^:([^:]+):\s*(.+)$/;
const HEADING_RE = /^(=+)\s+(.+)$/;
const LIST_RE = /^\*+\s+(.+)$/;
const COMMENT_NODE_RE = /^\/\/\s+([^/].*)$/;

export function lexAsciidocLossless(text: string): {
  frontmatter: Record<string, string>;
  blocks: DocumentBlock[];
} {
  const lines = text.split("\n");
  const frontmatter: Record<string, string> = {};
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("=")) break;
    const attr = line.match(ATTR_RE);
    if (attr) {
      const key = attr[1].replace(/-/g, "_");
      frontmatter[key] = attr[2].trim();
      continue;
    }
    break;
  }

  let pendingNodeId: string | undefined;
  const blocks: DocumentBlock[] = [];
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const comment = line.match(COMMENT_NODE_RE);
    if (comment) {
      const candidate = comment[1].trim();
      if (isOeMetaInner(candidate)) {
        const parsed = parseOeMetaInner(candidate);
        if (parsed) {
          blocks.push({
            kind: "structure_meta",
            field: parsed.field,
            value: parsed.value,
          });
        }
        continue;
      }
      if (isArchetypeNodeIdMarker(candidate)) {
        pendingNodeId = normalizeNodeId(candidate);
      }
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      const stripped = stripNodeIdAndType(heading[2]);
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        title: stripped.text,
        rmType: stripped.rmType,
        archetypeNodeId: pendingNodeId ?? stripped.archetypeNodeId,
      });
      pendingNodeId = undefined;
      continue;
    }

    if (/^\*[^*\s]/.test(line) && !line.startsWith("* ")) {
      const stripped = stripNodeIdAndType(line);
      const italic = stripped.text.match(/^\*([^*]+)\*(?:\s+_\(interval\)_)?$/);
      if (italic) {
        blocks.push({
          kind: "bold",
          text: italic[1].trim(),
          isInterval: line.includes("_(interval)_"),
          archetypeNodeId: pendingNodeId ?? stripped.archetypeNodeId,
        });
        pendingNodeId = undefined;
        continue;
      }
    }

    const list = line.match(/^(\*+)\s+(.+)$/);
    if (list) {
      const listIndent = list[1].length - 1;
      const stripped = stripNodeIdAndType(list[2]);
      const itemText = stripped.text;
      const meta = itemText.match(/^_(.+?):_\s*(.*)$/s);
      if (meta) {
        blocks.push({
          kind: "list_item",
          indent: listIndent,
          raw: itemText,
          label: meta[1],
          value: meta[2],
          archetypeNodeId: stripped.archetypeNodeId ?? pendingNodeId,
          oeValuePayload: stripped.oeValuePayload,
          oeRmPayload: stripped.oeRmPayload,
        });
      } else {
        const adEltDbl = itemText.match(/^\*(.+)::\*\s*(.*)$/s);
        const kv = adEltDbl ??
          itemText.match(/^\*\*(.+?)\*\*::\s*(.+)$/) ??
          itemText.match(/^\*\*([^:]+):\*\*\s*(.+)$/) ??
          itemText.match(/^\*([^:]+):\*\s*(.*)$/s);
        if (kv) {
          const label = adEltDbl ? `${adEltDbl[1].replace(/\*/g, "").trim()}:` : kv[1];
          const value = adEltDbl ? adEltDbl[2] : kv[2];
          blocks.push({
            kind: "list_item",
            indent: listIndent,
            label,
            value,
            raw: itemText,
            archetypeNodeId: stripped.archetypeNodeId ?? pendingNodeId,
            oeValuePayload: stripped.oeValuePayload,
          oeRmPayload: stripped.oeRmPayload,
          });
        } else {
          const clusterOnly = itemText.match(/^\*([^*]+)\*\s*$/);
          if (clusterOnly) {
            blocks.push({
              kind: "list_item",
              indent: listIndent,
              label: clusterOnly[1],
              raw: itemText,
              archetypeNodeId: stripped.archetypeNodeId ?? pendingNodeId,
              oeValuePayload: stripped.oeValuePayload,
              oeRmPayload: stripped.oeRmPayload,
            });
            continue;
          }
          const plain = itemText.match(/^(.+?):\s*(.+)$/);
          blocks.push({
            kind: "list_item",
            indent: listIndent,
            label: plain?.[1],
            value: plain?.[2],
            raw: itemText,
            archetypeNodeId: stripped.archetypeNodeId ?? pendingNodeId,
            oeValuePayload: stripped.oeValuePayload,
          oeRmPayload: stripped.oeRmPayload,
          });
        }
      }
      pendingNodeId = undefined;
    }
  }

  return { frontmatter, blocks };
}
