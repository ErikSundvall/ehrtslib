/**
 * Web Template node id normalisation, following the "Node ID Generation
 * Rules" of the ITS-REST simplified formats specification:
 * 1. replace chars that are not Unicode-alphabetic, digit, `_`, `.` or `-`
 *    with `_`; 2. collapse repeated `_`; 3. lowercase; 4. trim `_`;
 * 5. empty → "id"; 6. leading digit → prepend "a".
 */
export function normalizeWebTemplateId(text: string): string {
  let id = text
    .trim()
    .replace(/[^\p{L}\p{N}_.\-]+/gu, "_")
    .replace(/_+/g, "_")
    .toLowerCase()
    .replace(/^_+|_+$/g, "");
  if (!id) id = "id";
  if (/^\d/.test(id)) id = `a${id}`;
  return id;
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

/**
 * Root path segment for FLAT/STRUCTURED keys: the normalised template id
 * (dots and dashes retained, e.g. "conformance-ehrbase.de.v0").
 */
export function templateRootId(templateId: string): string {
  return normalizeWebTemplateId(templateId);
}

/** Join AQL path segments without duplicate slashes. */
export function joinAqlPath(base: string, segment: string): string {
  const seg = segment.startsWith("/") ? segment.slice(1) : segment;
  if (!base || base === "/") return `/${seg}`;
  return `${base.replace(/\/$/, "")}/${seg}`;
}
