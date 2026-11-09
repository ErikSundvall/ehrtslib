/**
 * Pre-process serializer output before demo document rendering (strip annotations).
 */

/** HTML comments from the markdown serializer (node ids, oe:v1:value typing). */
export function stripMarkdownDisplayComments(source: string): string {
  return source.replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * AsciiDoc serializer `//` annotations (document attrs, node ids, URNs).
 * Removes whole-line comments and trailing inline node-id comments.
 */
export function stripAsciidocDisplayComments(source: string): string {
  const trailingNodeId =
    /\s+\/\/\s+(at\d{4}|openEHR-[A-Za-z0-9._-]+|urn:openehr:[^\s]+)\s*$/i;
  const stripEndOeV1 = /\s+\/\/\s+oe:v1:[^\n]+$/;
  return source
    .split("\n")
    .filter((line) => !/^\s*\/\//.test(line))
    .map((line) => line.replace(trailingNodeId, "").replace(stripEndOeV1, ""))
    .join("\n");
}

export type DocumentRenderKind = "markdown" | "asciidoc" | "html-zipehr" | "html-opt";

const RENDERABLE = new Map<string, DocumentRenderKind>([
  ["markdown", "markdown"],
  ["asciidoc", "asciidoc"],
  ["zipehr.xhtml", "html-zipehr"],
  ["zipehr.html5.short", "html-zipehr"],
  ["zipehr.html5.full", "html-zipehr"],
  ["zipehr.html5.emoji", "html-zipehr"],
  ["opt.html5.short", "html-opt"],
  ["opt.html5.full", "html-opt"],
  ["opt.html5.emoji", "html-opt"],
]);

export function isRenderableOutputFormat(formatKey: string): boolean {
  return RENDERABLE.has(formatKey);
}

export function documentRenderKind(
  formatKey: string,
): DocumentRenderKind | undefined {
  return RENDERABLE.get(formatKey);
}

export function listRenderableOutputFormats(): string[] {
  return [...RENDERABLE.keys()];
}

export function editorHostIdForFormat(formatKey: string): string {
  return `output-${formatKey}-content`;
}

export function formatKeyFromEditorHostId(hostId: string): string | undefined {
  if (!hostId.startsWith("output-") || !hostId.endsWith("-content")) {
    return undefined;
  }
  return hostId.slice("output-".length, -"-content".length);
}
