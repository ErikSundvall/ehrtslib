/**
 * Web Template node id normalisation (ITS-REST simplified formats).
 */

/** Lowercase; non-alphanumeric → underscore; collapse repeats. */
export function normalizeWebTemplateId(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_") || "node";
}

export function nodeIdToAtCode(nodeId?: string): string {
  if (!nodeId) return "";
  const m = /^id(\d+(?:\.\d+)*)$/i.exec(nodeId);
  if (m) {
    const digits = m[1].replace(/\./g, "");
    return `at${digits.padStart(4, "0")}`;
  }
  return nodeId;
}

export function templateRootId(templateId: string): string {
  const base = templateId.split(".")[0] ?? templateId;
  return normalizeWebTemplateId(base);
}

/** Join AQL path segments without duplicate slashes. */
export function joinAqlPath(base: string, segment: string): string {
  const seg = segment.startsWith("/") ? segment.slice(1) : segment;
  if (!base || base === "/") return `/${seg}`;
  return `${base.replace(/\/$/, "")}/${seg}`;
}
