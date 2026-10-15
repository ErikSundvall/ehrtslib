/**
 * Serialize AOM archetypes/templates to ADL 1.4 text (down-convert from internal ADL2 model).
 */

import * as openehr_am from "../am/openehr_am.ts";
import { ADL2Serializer } from "./adl2_serializer.ts";

export interface Adl14SerializerConfig {
  indent?: string;
  rmRelease?: string;
}

export class ADL14Serializer {
  private config: Required<Adl14SerializerConfig>;
  private inner: ADL2Serializer;

  constructor(config?: Adl14SerializerConfig) {
    this.config = {
      indent: config?.indent ?? "    ",
      rmRelease: config?.rmRelease ?? "1.0.4",
    };
    this.inner = new ADL2Serializer({ indent: this.config.indent });
  }

  serialize(archetype: openehr_am.ARCHETYPE): string {
    this.assertSerializableDefinition(archetype);
    let adl = this.inner.serialize(archetype);
    adl = this.toAdl14Header(adl, archetype);
    adl = this.insertConceptSection(adl, archetype);
    adl = adl.replace(/\bterminology\b/g, "ontology");
    adl = adl.replace(/\bterm_bindings\b/g, "constraint_bindings");
    adl = this.convertNodeIdsToAtCodes(adl);
    adl = this.wrapTermDefinitionItems(adl);
    return adl.trimEnd() + "\n";
  }

  private toAdl14Header(adl: string, _archetype: openehr_am.ARCHETYPE): string {
    return adl.replace(
      /^archetype\s*\([^)]*\)/m,
      `archetype (adl_version=1.4; rm_release=${this.config.rmRelease}; generated)`,
    ).replace(
      /(\s+)(openEHR[^\s]+)\.v(\d+)\.(\d+)\.(\d+)/g,
      (_m, indent: string, base: string, maj: string) =>
        `${indent}${base}.v${maj}`,
    );
  }

  /**
   * Insert ADL 1.4 `concept` section after archetype id / specialize (#115).
   */
  private insertConceptSection(
    adl: string,
    archetype: openehr_am.ARCHETYPE,
  ): string {
    if (/^concept\b/m.test(adl)) return adl;
    const conceptCode = this.conceptAtCode(archetype);
    const conceptText = this.conceptText(archetype, conceptCode);
    const block =
      `concept\n    [${conceptCode}]    -- ${
        conceptText.replace(/\n/g, " ")
      }\n\n`;

    const parts = adl.split("\n");
    let insertAt = -1;
    for (let i = 0; i < parts.length; i++) {
      if (/^specialize\b/.test(parts[i])) {
        // insert after specialize + parent id + blank line
        insertAt = i + 1;
        while (insertAt < parts.length && parts[insertAt].trim() !== "") {
          insertAt++;
        }
        insertAt++; // after blank line
        break;
      }
    }
    if (insertAt < 0) {
      // after archetype header + id + blank
      for (let i = 0; i < parts.length; i++) {
        if (/^archetype\b/.test(parts[i])) {
          insertAt = i + 1;
          while (insertAt < parts.length && parts[insertAt].trim() !== "") {
            insertAt++;
          }
          insertAt++;
          break;
        }
      }
    }
    if (insertAt < 0) insertAt = 0;
    parts.splice(insertAt, 0, ...block.trimEnd().split("\n"), "");
    return parts.join("\n");
  }

  private conceptAtCode(archetype: openehr_am.ARCHETYPE): string {
    if (archetype.concept) {
      return this.idToAtCode(String(archetype.concept));
    }
    const nodeId = archetype.definition?.node_id;
    if (nodeId) return this.idToAtCode(nodeId);
    return "at0000";
  }

  private conceptText(
    archetype: openehr_am.ARCHETYPE,
    conceptCode: string,
  ): string {
    const ontology = archetype.ontology as {
      term_definitions?: Record<
        string,
        Record<string, { text?: string }>
      >;
    } | undefined;
    const defs = ontology?.term_definitions;
    if (!defs) return conceptCode;
    const nodeId = archetype.definition?.node_id;
    for (const lang of ["en", ...Object.keys(defs)]) {
      const table = defs[lang];
      if (!table) continue;
      for (const key of [conceptCode, nodeId, this.idToAtCode(nodeId ?? "")]) {
        if (key && table[key]?.text) return table[key].text!;
      }
      // ADL2 term keys are still idN before ontology rewrite
      if (nodeId && table[nodeId]?.text) return table[nodeId].text!;
    }
    return conceptCode;
  }

  /** Best-effort idN → atNNNN (specialised id1.1 → at0001.1). Full mapping in #116. */
  private idToAtCode(code: string): string {
    const m = /^(id|at|ac)(\d+)((?:\.\d+)*)$/i.exec(code);
    if (!m) return code || "at0000";
    if (m[1].toLowerCase() === "ac") return code;
    const padded = m[2].padStart(4, "0");
    return `at${padded}${m[3] ?? ""}`;
  }

  /**
   * Refuse to emit invalid ADL 1.4 when the AOM definition is missing or empty.
   * (@see https://github.com/ErikSundvall/ehrtslib/issues/113)
   */
  private assertSerializableDefinition(archetype: openehr_am.ARCHETYPE): void {
    const def = archetype.definition;
    if (!def || !def.rm_type_name || !def.node_id) {
      throw new Error(
        "ADL14Serializer: refuse to serialize archetype with empty or incomplete definition " +
          "(missing rm_type_name/node_id). This usually means cADL parsing failed; " +
          "see parse result errors / issue #113.",
      );
    }
  }

  private convertNodeIdsToAtCodes(adl: string): string {
    const lines = adl.split("\n");
    let inDefinition = false;
    let inRules = false;
    const out: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^definition\b/i.test(trimmed)) {
        inDefinition = true;
        inRules = false;
      } else if (/^rules\b/i.test(trimmed)) {
        inRules = true;
        inDefinition = false;
      } else if (
        /^(ontology|terminology|language|description|annotations|concept|specialize|specialise)\b/i
          .test(trimmed)
      ) {
        inDefinition = false;
        inRules = false;
      }

      if (inDefinition || inRules) {
        out.push(
          line.replace(/\[id(\d+(?:\.\d+)*)\]/gi, (_m, n: string) => {
            return `[${this.idToAtCode("id" + n)}]`;
          }),
        );
      } else {
        out.push(line);
      }
    }
    return out.join("\n");
  }

  private wrapTermDefinitionItems(adl: string): string {
    return adl.replace(
      /^([ \t]*)term_definitions\s*=\s*<\s*\n([\s\S]*?)^\1>/gm,
      (_full, indent: string, body: string) => {
        // Already wrapped?
        if (/^\s*items\s*=\s*</m.test(body)) {
          return `${indent}term_definitions = <\n${body}${indent}>`;
        }
        return `${indent}term_definitions = <\n${indent}    items = <\n${body}${indent}    >\n${indent}>`;
      },
    );
  }
}

/** Round-trip metrics for tests. */
export function adl14RoundTripMetrics(
  original: string,
  reserialized: string,
): { lineCountDelta: number; nodeIdAtCodes: number } {
  const atCount = (reserialized.match(/\[at\d+(?:\.\d+)*\]/g) ?? []).length;
  const origLines = original.split("\n").length;
  const newLines = reserialized.split("\n").length;
  return { lineCountDelta: newLines - origLines, nodeIdAtCodes: atCount };
}
