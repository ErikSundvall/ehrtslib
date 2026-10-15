/**
 * ADL2 Serializer
 *
 * Serializes AOM (Archetype Object Model) back to ADL2 format.
 * Supports round-trip: ADL2 → AOM → ADL2 (see docs/ADL2_ROUNDTRIP.md).
 */

import * as openehr_am from "../am/openehr_am.ts";
import {
  serializeAnnotationsSection,
  serializeDescriptionSection,
  serializeLanguageSection,
  serializeRmOverlaySection,
  serializeTerminologySection,
} from "../parser/odin_serializer.ts";
import type { OdinValue } from "../parser/odin_parser.ts";
import {
  getAnnotationsDocumentation,
  getRmOverlayVisibility,
} from "../parser/aom_odin_sections.ts";
import { serializeRulesSection } from "../parser/rules_serializer.ts";

/**
 * Serializer configuration
 */
export interface ADL2SerializerConfig {
  indent?: string;
  includeComments?: boolean;
}

/**
 * ADL2 Serializer
 */
export class ADL2Serializer {
  private config: ADL2SerializerConfig;

  constructor(config?: ADL2SerializerConfig) {
    this.config = {
      indent: "    ",
      includeComments: false,
      ...config,
    };
  }

  serialize(archetype: openehr_am.ARCHETYPE): string {
    const indent = this.config.indent || "    ";
    let adl = "archetype";

    if (archetype.adl_version || archetype.rm_release) {
      adl += " (";
      const meta: string[] = [];
      if (archetype.adl_version) meta.push(`adl_version=${archetype.adl_version}`);
      if (archetype.rm_release) meta.push(`rm_release=${archetype.rm_release}`);
      adl += meta.join("; ") + ")";
    }
    adl += "\n";

    if (archetype.archetype_id?.value) {
      adl += `    ${archetype.archetype_id.value}\n\n`;
    }

    const parentId = archetype.parent_archetype_id?.value;
    if (parentId) {
      adl += `specialize\n    ${parentId}\n\n`;
    }

    const translations = (archetype as { translations?: unknown }).translations;
    adl += serializeLanguageSection(
      archetype.original_language,
      indent,
      translations as OdinValue | undefined,
    );
    adl += serializeDescriptionSection(archetype.description, indent);

    adl += "definition\n";
    if (archetype.definition) {
      adl += this.serializeDefinition(archetype.definition, 1);
    }
    adl += "\n";

    adl += serializeRulesSection(archetype.invariants, indent);

    const ontologyBag = archetype.ontology as Record<string, unknown> | undefined;
    adl += serializeTerminologySection(ontologyBag, indent);

    adl += serializeAnnotationsSection(
      getAnnotationsDocumentation(archetype),
      indent,
    );
    adl += serializeRmOverlaySection(
      getRmOverlayVisibility(archetype),
      indent,
    );

    return adl;
  }

  private serializeDefinition(
    cObject: openehr_am.C_COMPLEX_OBJECT,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    let adl = `${indent}${cObject.rm_type_name}[${cObject.node_id}]`;

    if (cObject.occurrences) {
      const lower = cObject.occurrences.lower ?? 0;
      const upper = cObject.occurrences.upper;
      const upperStr = upper === undefined ? "*" : String(upper);
      adl += ` occurrences matches {${lower}..${upperStr}}`;
    }

    const attrs = cObject.attributes;
    if (attrs && attrs.length > 0) {
      adl += " matches {\n";
      for (const attr of attrs) {
        adl += this.serializeAttribute(attr, level + 1);
      }
      adl += `${indent}}\n`;
    } else {
      adl += "\n";
    }

    return adl;
  }

  private serializeAttribute(
    cAttribute: openehr_am.C_ATTRIBUTE,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    let adl = `${indent}${cAttribute.rm_attribute_name}`;

    const existence = (cAttribute as { existence?: { lower?: number; upper?: number } })
      .existence;
    if (existence) {
      const u = existence.upper ?? existence.lower;
      adl += ` existence matches {${existence.lower}..${u}}`;
    }

    if (cAttribute instanceof openehr_am.C_MULTIPLE_ATTRIBUTE && cAttribute.cardinality) {
      const card = cAttribute.cardinality;
      const interval = (card as {
        interval?: { lower?: number; upper?: number };
      }).interval;
      if (interval) {
        const upperStr = interval.upper === undefined ? "*" : String(interval.upper);
        let cardBody = `${interval.lower}..${upperStr}`;
        if (card.is_ordered === false) cardBody += "; unordered";
        else if (card.is_ordered === true) cardBody += "; ordered";
        adl += ` cardinality matches {${cardBody}}`;
      }
    }

    const children = (cAttribute as { children?: openehr_am.C_OBJECT[] }).children;
    if (children && children.length > 0) {
      adl += " matches {\n";
      for (const child of children) {
        if (child instanceof openehr_am.ARCHETYPE_SLOT) {
          adl += this.serializeSlot(child, level + 1);
        } else if (child instanceof openehr_am.C_TERMINOLOGY_CODE) {
          adl += this.serializeTerminologyCode(child, level + 1);
        } else if (child instanceof openehr_am.C_COMPLEX_OBJECT) {
          adl += this.serializeDefinition(child, level + 1);
        } else if (child instanceof openehr_am.C_PRIMITIVE_OBJECT) {
          adl += this.serializePrimitiveObject(child, level + 1);
        }
      }
      adl += `${indent}}\n`;
    } else {
      adl += "\n";
    }

    return adl;
  }

  private serializeSlot(
    slot: openehr_am.ARCHETYPE_SLOT,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    let adl = `${indent}allow_archetype ${slot.rm_type_name}[${slot.node_id}]`;
    if (slot.occurrences) {
      const lower = slot.occurrences.lower ?? 0;
      const upper = slot.occurrences.upper;
      const upperStr = upper === undefined ? "*" : String(upper);
      adl += ` occurrences matches {${lower}..${upperStr}}`;
    }
    const includes = (slot as { includes?: openehr_am.ARCHETYPE_ID_CONSTRAINT[] })
      .includes;
    if (includes && includes.length > 0) {
      adl += " matches {\n";
      adl += `${this.getIndent(level + 1)}include\n`;
      for (const c of includes) {
        const pattern = c.constraint?.pattern;
        if (pattern) {
          adl += `${this.getIndent(level + 2)}archetype_id/value matches {/${pattern}/}\n`;
        }
      }
      adl += `${indent}}\n`;
    } else {
      adl += "\n";
    }
    return adl;
  }

  private serializeTerminologyCode(
    term: openehr_am.C_TERMINOLOGY_CODE,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    const code = term.constraint ?? "";
    return `${indent}[${code}]\n`;
  }

  private serializePrimitiveObject(
    prim: openehr_am.C_PRIMITIVE_OBJECT,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    if (prim instanceof openehr_am.C_TERMINOLOGY_CODE) {
      return this.serializeTerminologyCode(prim, level);
    }
    const pattern = prim.item instanceof openehr_am.C_STRING
      ? prim.item.pattern
      : undefined;
    if (!prim.node_id && pattern) {
      // Interval-like leaf stored as C_STRING pattern (e.g. ">0")
      return `${indent}{|${pattern}|}\n`;
    }
    if (pattern && !pattern.includes("|")) {
      return `${indent}${prim.rm_type_name}[${prim.node_id}] matches {${JSON.stringify(pattern)}}\n`;
    }
    return `${indent}${prim.rm_type_name}[${prim.node_id}]\n`;
  }

  private getIndent(level: number): string {
    return (this.config.indent || "    ").repeat(level);
  }
}
