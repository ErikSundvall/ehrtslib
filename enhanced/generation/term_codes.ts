/**
 * Archetype node id / at-code normalisation for terminology lookup.
 */

import { nodeIdToAtCode } from "../serialization/simplified/normalize.ts";

/** Candidate term codes to try for a template node id. */
export function termCodeCandidates(nodeId: string): string[] {
  const out = new Set<string>();
  out.add(nodeId);
  out.add(nodeIdToAtCode(nodeId));

  const shortDot = /^at0\.(\d+)$/i.exec(nodeId);
  if (shortDot) {
    out.add(`at${shortDot[1].padStart(4, "0")}`);
  }

  const dotted = /^at(\d+)\.(\d+(?:\.\d+)*)$/i.exec(nodeId);
  if (dotted && dotted[1].length < 4) {
    const padded = dotted[1].padStart(4, "0");
    out.add(`at${padded}`);
    out.add(`at${padded}.${dotted[2]}`);
  }

  const base = nodeId.replace(/\.\d+(?:\.\d+)*$/, "");
  if (base !== nodeId) out.add(base);

  return [...out];
}

export function resolveTemplateLanguage(
  template: {
    original_language?: unknown;
    ontology?: { original_language?: { code_string?: string } };
    description?: { details?: Record<string, { language?: { codeString?: string; code_string?: string } }> };
  },
  preferred?: string,
): string {
  if (preferred) return preferred;
  if (typeof template.original_language === "string" && template.original_language) {
    return template.original_language;
  }
  const fromOntology = template.ontology?.original_language?.code_string;
  if (fromOntology) return fromOntology;
  const defs = (template.ontology as { term_definitions?: Record<string, unknown> } | undefined)
    ?.term_definitions;
  if (defs) {
    const svCount = Object.keys(defs.sv ?? {}).length;
    const enCount = Object.keys(defs.en ?? {}).length;
    if (svCount > enCount && svCount > 0) return "sv";
    let bestLang = "en";
    let bestCount = -1;
    for (const [lang, table] of Object.entries(defs)) {
      const count = table && typeof table === "object"
        ? Object.keys(table).length
        : 0;
      if (count > bestCount) {
        bestCount = count;
        bestLang = lang;
      }
    }
    if (bestCount > 0) return bestLang;
  }
  const details = template.description?.details;
  if (details?.sv) return "sv";
  return "en";
}
