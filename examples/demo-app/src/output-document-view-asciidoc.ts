/**
 * Lazy-loaded AsciiDoc document renderer (demo-only).
 */

import { stripAsciidocDisplayComments } from "./output-render-sources.ts";
import {
  buildMetadataPanelHtml,
  DOCUMENT_METADATA_CSS,
  splitAsciidocForDocumentView,
} from "./document-view-split.ts";

let loadPromise: Promise<AsciidoctorApi> | undefined;

type AsciidoctorApi = {
  convert: (
    input: string,
    opts: { standalone: boolean; safe: string; attributes?: Record<string, boolean | string> },
  ) => string;
};

async function loadAsciidoctor(): Promise<AsciidoctorApi> {
  const mod = await import("@asciidoctor/core");
  const Asciidoctor = (mod as { default?: () => AsciidoctorApi }).default ??
    (mod as { Asciidoctor?: () => AsciidoctorApi }).Asciidoctor;
  if (typeof Asciidoctor !== "function") {
    throw new Error("Could not load @asciidoctor/core default export");
  }
  return Asciidoctor();
}

const PROSE_CSS = `
${DOCUMENT_METADATA_CSS}
body { margin: 0; padding: 1rem 1.25rem; font-family: system-ui, sans-serif; line-height: 1.55; color: #0f172a; }
h1,h2,h3,h4 { margin-top: 1.25em; margin-bottom: 0.5em; }
.tableblock { margin: 0.75em 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #cbd5e1; padding: 0.35em 0.6em; }
`;

export async function renderAsciidocDocumentHtml(source: string): Promise<string> {
  if (!loadPromise) loadPromise = loadAsciidoctor();
  const asciidoctor = await loadPromise;
  const { metadata, body: docBody } = splitAsciidocForDocumentView(source);
  const metaPanel = buildMetadataPanelHtml(metadata);
  const cleaned = stripAsciidocDisplayComments(docBody);
  const body = asciidoctor.convert(cleaned, {
    standalone: false,
    safe: "safe",
    attributes: { showtitle: true },
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AsciiDoc preview</title>
<style>${PROSE_CSS}</style>
</head>
<body class="asciidoc">${metaPanel}${body}</body>
</html>`;
}
