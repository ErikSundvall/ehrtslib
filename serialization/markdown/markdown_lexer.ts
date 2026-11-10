/**
 * Lex Markdown structural dialect into normalized document blocks.
 */

import { parse } from "yaml";
import type { DocumentBlock } from "../documents_common/document_blocks.ts";
import { stripNodeIdAndType } from "../documents_common/document_blocks.ts";
import { parseOeMetaInner } from "../documents_common/oe_structure_meta.ts";

export function parseMarkdownFrontmatter(text: string): {
  body: string;
  frontmatter: Record<string, string>;
} {
  const trimmed = text.replace(/^\uFEFF/, "");
  if (!trimmed.startsWith("---")) {
    return { body: trimmed, frontmatter: {} };
  }
  const end = trimmed.indexOf("\n---", 3);
  if (end < 0) return { body: trimmed, frontmatter: {} };
  const yamlText = trimmed.slice(4, end);
  const body = trimmed.slice(end + 4).replace(/^\s*/, "");
  let frontmatter: Record<string, string> = {};
  try {
    const parsed = parse(yamlText) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      frontmatter = Object.fromEntries(
        Object.entries(parsed).map(([k, v]) => [k, String(v)]),
      );
    }
  } catch {
    for (const line of yamlText.split("\n")) {
      const m = line.match(/^([a-z_]+):\s*"?([^"]*)"?$/);
      if (m) frontmatter[m[1]] = m[2];
    }
  }
  return { body, frontmatter };
}

const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const LIST_RE = /^(\s*)-\s+(.*)$/;

export function lexMarkdownStructural(body: string): DocumentBlock[] {
  const lines = body.split("\n");
  const blocks: DocumentBlock[] = [];

  for (const line of lines) {
  if (!line.trim()) continue;

    const metaLine = line.match(/^\s*<!--\s*(oe:meta:[^>]+)\s*-->\s*$/);
    if (metaLine) {
      const parsed = parseOeMetaInner(metaLine[1].trim());
      if (parsed) {
        blocks.push({
          kind: "structure_meta",
          field: parsed.field,
          value: parsed.value,
        });
      }
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      const stripped = stripNodeIdAndType(heading[2]);
      let title = stripped.text;
      title = title.replace(/\[\[[^\]]+\]\]/g, "").trim();
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        title,
        rmType: stripped.rmType,
        archetypeNodeId: stripped.archetypeNodeId,
      });
      continue;
    }

    if (/^\*\*/.test(line.trim())) {
      const stripped = stripNodeIdAndType(line.trim());
      const inner = stripped.text.match(/^\*\*(.+)\*\*(?:\s+_\(interval\)_)?$/);
      if (inner) {
        blocks.push({
          kind: "bold",
          text: inner[1].trim(),
          isInterval: line.includes("_(interval)_"),
          archetypeNodeId: stripped.archetypeNodeId,
        });
        continue;
      }
    }

    const list = line.match(LIST_RE);
    if (list) {
      const indent = list[1].length;
      const stripped = stripNodeIdAndType(list[2]);
      const raw = list[2];
      const itemText = stripped.text;
      const meta = itemText.match(/^_(.+?):_\s*(.*)$/s);
      if (meta) {
        blocks.push({
          kind: "list_item",
          indent,
          raw: `- ${itemText}`,
          label: meta[1],
          value: meta[2],
          archetypeNodeId: stripped.archetypeNodeId,
          oeValuePayload: stripped.oeValuePayload,
          oeRmPayload: stripped.oeRmPayload,
        });
        continue;
      }
      const dblColon = itemText.match(/^\*\*(.+)::\*\*\s*(.*)$/s);
      const kv = dblColon ?? itemText.match(/^\*\*([^:]+):\*\*\s*(.*)$/s);
      if (kv) {
        const label = dblColon ? `${dblColon[1]}:` : kv[1];
        const value = dblColon ? dblColon[2] : kv[2];
        blocks.push({
          kind: "list_item",
          indent,
          raw: `- ${itemText}`,
          label,
          value,
          archetypeNodeId: stripped.archetypeNodeId,
          oeValuePayload: stripped.oeValuePayload,
          oeRmPayload: stripped.oeRmPayload,
        });
        continue;
      }
      const plain = !itemText.startsWith("**")
        ? itemText.match(/^(.+?):\s*(.+)$/)
        : null;
      if (plain) {
        blocks.push({
          kind: "list_item",
          indent,
          raw: `- ${itemText}`,
          label: plain[1],
          value: plain[2],
          archetypeNodeId: stripped.archetypeNodeId,
          oeValuePayload: stripped.oeValuePayload,
          oeRmPayload: stripped.oeRmPayload,
        });
        continue;
      }
      const clusterOnly = itemText.match(/^\*\*(.+)\*\*\s*$/);
      if (clusterOnly) {
        blocks.push({
          kind: "list_item",
          indent,
          raw: `- ${itemText}`,
          label: clusterOnly[1],
          archetypeNodeId: stripped.archetypeNodeId,
          oeValuePayload: stripped.oeValuePayload,
          oeRmPayload: stripped.oeRmPayload,
        });
        continue;
      }
      blocks.push({
        kind: "list_item",
        indent,
        raw: `- ${itemText}`,
        archetypeNodeId: stripped.archetypeNodeId,
        oeValuePayload: stripped.oeValuePayload,
      });
    }
  }

  return blocks;
}
