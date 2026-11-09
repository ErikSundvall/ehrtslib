/**
 * Demo-only: split front matter / header attributes from document body for preview.
 */

import { parseMarkdownFrontmatter } from "../../../serialization/markdown/markdown_lexer.ts";

const ATTR_RE = /^:([^:]+):\s*(.+)$/;

export type DocumentViewParts = {
  metadata: Record<string, string>;
  body: string;
};

export function splitMarkdownForDocumentView(source: string): DocumentViewParts {
  const { body, frontmatter } = parseMarkdownFrontmatter(source);
  return { metadata: frontmatter, body };
}

export function splitAsciidocForDocumentView(source: string): DocumentViewParts {
  const lines = source.replace(/^\uFEFF/, "").split("\n");
  const metadata: Record<string, string> = {};
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("=")) break;
    const attr = line.match(ATTR_RE);
    if (attr) {
      const key = attr[1].replace(/-/g, "_");
      metadata[key] = attr[2].trim();
      continue;
    }
    break;
  }
  const body = lines.slice(i).join("\n").replace(/^\s+/, "");
  return { metadata, body };
}

export function buildMetadataPanelHtml(metadata: Record<string, string>): string {
  const keys = Object.keys(metadata);
  if (keys.length === 0) return "";
  const rows = keys.sort().map((key) => {
    const value = escapeHtml(metadata[key]);
    return `<tr><th scope="row">${escapeHtml(key)}</th><td>${value}</td></tr>`;
  }).join("");
  return `<details class="doc-metadata-panel" open>
<summary>Metadata</summary>
<table class="doc-metadata-table"><tbody>${rows}</tbody></table>
</details>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const DOCUMENT_METADATA_CSS = `
.doc-metadata-panel { margin: 0 0 0.75rem 0; font-size: 0.8rem; color: #64748b; }
.doc-metadata-panel summary { cursor: pointer; font-weight: 500; color: #475569; margin-bottom: 0.35rem; }
.doc-metadata-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
.doc-metadata-table th { text-align: left; font-weight: 500; padding: 0.15rem 0.5rem 0.15rem 0; white-space: nowrap; vertical-align: top; }
.doc-metadata-table td { padding: 0.15rem 0; word-break: break-word; }
`;
