/**
 * Serialize AOM archetypes/templates to ADL 1.4 text (down-convert from internal ADL2 model).
 */

import * as openehr_am from "../openehr_am.ts";
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
    let adl = this.inner.serialize(archetype);
    adl = this.toAdl14Header(adl, archetype);
    adl = adl.replace(/\bterminology\b/g, "ontology");
    adl = adl.replace(/\bterm_bindings\b/g, "constraint_bindings");
    adl = this.convertNodeIdsToAtCodes(adl);
    adl = this.wrapTermDefinitionItems(adl);
    return adl.trimEnd() + "\n";
  }

  private toAdl14Header(adl: string, archetype: openehr_am.ARCHETYPE): string {
    return adl.replace(
      /^archetype\s*\([^)]*\)/m,
      `archetype (adl_version=1.4; rm_release=${this.config.rmRelease}; generated)`,
    ).replace(
      /(\s+)(openEHR[^\s]+)\.v(\d+)\.(\d+)\.(\d+)/g,
      (_m, indent: string, base: string, maj: string) => `${indent}${base}.v${maj}`,
    );
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
      } else if (/^(ontology|terminology|language|description|annotations)\b/i.test(trimmed)) {
        inDefinition = false;
        inRules = false;
      }

      if (inDefinition || inRules) {
        out.push(line.replace(/\[id(\d+)\]/gi, (_m, n: string) => {
          const num = parseInt(n, 10);
          return `[at${String(num).padStart(4, "0")}]`;
        }));
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
        const inner = body.split("\n").filter((l) => l.trim()).map((l) => {
          if (/^\s*\w+\s*=/.test(l)) return `${indent}        ${l.trim()}`;
          return l;
        }).join("\n");
        return `${indent}term_definitions = <\n${indent}    items = <\n${inner}\n${indent}    >\n${indent}>`;
      },
    );
  }
}

/** Round-trip metrics for tests. */
export function adl14RoundTripMetrics(
  original: string,
  reserialized: string,
): { lineCountDelta: number; nodeIdAtCodes: number } {
  const atCount = (reserialized.match(/\[at\d+\]/g) ?? []).length;
  const origLines = original.split("\n").length;
  const newLines = reserialized.split("\n").length;
  return { lineCountDelta: newLines - origLines, nodeIdAtCodes: atCount };
}
