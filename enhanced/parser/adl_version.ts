/**
 * Detect ADL artefact version from source text (header metadata and section markers).
 */

export type AdlDetectedVersion = "1.4" | "2.x" | "unknown";

function hasSectionHeader(source: string, section: string): boolean {
  return new RegExp(`^[ \\t]*${section}\\b`, "im").test(source);
}

/**
 * Inspect the first part of the file and known section keywords.
 */
export function detectAdlVersion(source: string): AdlDetectedVersion {
  const head = source.slice(0, 1200);
  const meta = head.match(/adl_version\s*=\s*([\d.]+)/i);
  if (meta) {
    const v = meta[1];
    if (v.startsWith("2")) return "2.x";
    if (v.startsWith("1.4") || v.startsWith("1.5")) return "1.4";
  }

  const hasTerminology = hasSectionHeader(source, "terminology");
  const hasOntology = hasSectionHeader(source, "ontology");
  if (hasOntology && !hasTerminology) return "1.4";

  for (const name of [
    "constraint_definitions",
    "constraint_bindings",
    "terminologies_available",
  ]) {
    if (hasSectionHeader(source, name)) return "1.4";
  }

  if (/\badl_version\s*=\s*2/i.test(head)) return "2.x";
  if (hasTerminology) return "2.x";

  return "unknown";
}

export function isAdl14(source: string): boolean {
  return detectAdlVersion(source) === "1.4";
}
