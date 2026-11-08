/**
 * Lex lossless AsciiDoc into normalized document blocks.
 */

import type { DocumentBlock } from "../documents_common/document_blocks.ts";
import { stripNodeIdAndType } from "../documents_common/document_blocks.ts";
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
      pendingNodeId = normalizeNodeId(comment[1].trim());
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

    const list = line.match(LIST_RE);
    if (list) {
      const stripped = stripNodeIdAndType(list[1]);
      const itemText = stripped.text;
      const meta = itemText.match(/^_(.+?):_\s*(.+)$/);
      if (meta) {
        blocks.push({
          kind: "list_item",
          indent: 0,
          raw: itemText,
          label: meta[1],
          value: meta[2],
          archetypeNodeId: stripped.archetypeNodeId ?? pendingNodeId,
        });
      } else {
        const kv = itemText.match(/^\*\*(.+?)\*\*::\s*(.+)$/) ??
          itemText.match(/^\*\*([^:]+):\*\*\s*(.+)$/) ??
          itemText.match(/^\*([^:]+):\*\s+(.+)$/);
        if (kv) {
          blocks.push({
            kind: "list_item",
            indent: 0,
            label: kv[1],
            value: kv[2],
            raw: itemText,
            archetypeNodeId: stripped.archetypeNodeId ?? pendingNodeId,
          });
        } else {
          const plain = itemText.match(/^(.+?):\s*(.+)$/);
          blocks.push({
            kind: "list_item",
            indent: 0,
            label: plain?.[1],
            value: plain?.[2],
            raw: itemText,
            archetypeNodeId: stripped.archetypeNodeId ?? pendingNodeId,
          });
        }
      }
      pendingNodeId = undefined;
    }
  }

  return { frontmatter, blocks };
}
