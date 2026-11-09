/**
 * Lazy-loaded markdown document renderer (demo-only; not part of ehrtslib bundles).
 */

import { stripMarkdownDisplayComments } from "./output-render-sources.ts";
import {
  buildMetadataPanelHtml,
  DOCUMENT_METADATA_CSS,
  splitMarkdownForDocumentView,
} from "./document-view-split.ts";

let loadPromise: Promise<typeof importMarkdownPipeline> | undefined;

type DomPurifyLike = {
  sanitize: (html: string, cfg?: Record<string, unknown>) => string;
};

async function importMarkdownPipeline() {
  const [{ default: MarkdownIt }, domPurifyMod] = await Promise.all([
    import("markdown-it"),
    import("dompurify"),
  ]);
  const createDOMPurify = (domPurifyMod as { default?: (w?: Window) => DomPurifyLike })
    .default;
  if (typeof createDOMPurify !== "function") {
    throw new Error("dompurify default export missing");
  }
  const purify = typeof globalThis.window !== "undefined"
    ? createDOMPurify(globalThis.window as unknown as Window)
    : createDOMPurify();
  const md = new MarkdownIt("default", {
    html: false,
    linkify: true,
    typographer: false,
  });
  return { md, purify };
}

/** Demo-only: turn `[[target|label]]` / `[[label]]` into GFM links for Document view. */
export function preprocessMarkdownWikilinks(source: string): string {
  return source.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_full, target: string, label?: string) => {
      const text = label ?? target;
      const href = target.startsWith("urn:") ? target : target;
      return `[${text}](${href})`;
    },
  );
}

const PROSE_CSS = `
${DOCUMENT_METADATA_CSS}
body { margin: 0; padding: 1rem 1.25rem; font-family: system-ui, sans-serif; line-height: 1.55; color: #0f172a; }
h1,h2,h3,h4 { margin-top: 1.25em; margin-bottom: 0.5em; font-weight: 600; }
table { border-collapse: collapse; width: 100%; margin: 0.75em 0; font-size: 0.95em; }
th, td { border: 1px solid #cbd5e1; padding: 0.35em 0.6em; text-align: left; vertical-align: top; }
th { background: #f1f5f9; }
code { font-family: ui-monospace, monospace; font-size: 0.9em; background: #f1f5f9; padding: 0.1em 0.35em; border-radius: 4px; }
pre { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.75em 1em; overflow-x: auto; border-radius: 6px; }
a { color: #2563eb; }
`;

export async function renderMarkdownDocumentHtml(source: string): Promise<string> {
  if (!loadPromise) {
    loadPromise = importMarkdownPipeline();
  }
  const { md, purify } = await loadPromise;
  const { metadata, body } = splitMarkdownForDocumentView(source);
  const metaPanel = buildMetadataPanelHtml(metadata);
  const cleaned = preprocessMarkdownWikilinks(stripMarkdownDisplayComments(body));
  const rawHtml = md.render(cleaned);
  const safeBody = purify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "code",
      "pre",
      "blockquote",
      "a",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "hr",
      "del",
    ],
    ALLOWED_ATTR: ["href", "title", "class", "id", "colspan", "rowspan"],
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Markdown preview</title>
<style>${PROSE_CSS}</style>
</head>
<body>${metaPanel}${safeBody}</body>
</html>`;
}
