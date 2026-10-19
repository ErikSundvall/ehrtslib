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
function formatNodeBracket(nodeId?: string): string {
  if (nodeId === undefined || nodeId === null || nodeId === "") return "";
  return `[${nodeId}]`;
}

export class ADL2Serializer {
  protected config: ADL2SerializerConfig;

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
      adl += this.serializeCObject(archetype.definition, 1);
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

  protected serializeCObject(
    cObject: openehr_am.C_OBJECT,
    level: number,
  ): string {
    if (cObject instanceof openehr_am.C_ARCHETYPE_ROOT) {
      return this.serializeArchetypeRoot(cObject, level);
    }
    if (cObject instanceof openehr_am.C_COMPLEX_OBJECT) {
      return this.serializeComplexObject(cObject, level);
    }
    if (cObject instanceof openehr_am.ARCHETYPE_SLOT) {
      return this.serializeSlot(cObject, level);
    }
    if (cObject instanceof openehr_am.C_TERMINOLOGY_CODE) {
      return this.serializeTerminologyCode(cObject, level);
    }
    if (cObject instanceof openehr_am.C_PRIMITIVE_OBJECT) {
      return this.serializePrimitiveObject(cObject, level);
    }
    return "";
  }

  protected serializeComplexObject(
    cObject: openehr_am.C_COMPLEX_OBJECT,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    let line = `${indent}${cObject.rm_type_name}${formatNodeBracket(cObject.node_id)}`;
    line = this.decorateObjectLine(cObject, line);

    if (cObject.occurrences) {
      const lower = cObject.occurrences.lower ?? 0;
      const upper = cObject.occurrences.upper;
      const upperStr = upper === undefined ? "*" : String(upper);
      line += ` occurrences matches {${lower}..${upperStr}}`;
    }

    const attrs = cObject.attributes;
    if (attrs && attrs.length > 0) {
      let adl = line + " matches {\n";
      for (const attr of attrs) {
        adl += this.serializeAttribute(attr, level + 1);
      }
      adl += `${indent}}\n`;
      return adl;
    }
    return line + "\n";
  }

  protected serializeArchetypeRoot(
    root: openehr_am.C_ARCHETYPE_ROOT,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    let line = `${indent}use_archetype ${root.rm_type_name}${formatNodeBracket(root.node_id)}`;
    if (root.archetype_ref) {
      line += `, ${root.archetype_ref}`;
    }
    line += `]`;
    line = this.decorateObjectLine(root, line);

    if (root.occurrences) {
      const lower = root.occurrences.lower ?? 0;
      const upper = root.occurrences.upper;
      const upperStr = upper === undefined ? "*" : String(upper);
      line += ` occurrences matches {${lower}..${upperStr}}`;
    }

    const attrs = root.attributes;
    if (attrs && attrs.length > 0) {
      let adl = line + " matches {\n";
      for (const attr of attrs) {
        adl += this.serializeAttribute(attr, level + 1);
      }
      adl += `${indent}}\n`;
      return adl;
    }
    return line + "\n";
  }

  /** Hook for OPT2 inline term labels (`-- …`). */
  protected decorateObjectLine(
    _node: openehr_am.C_OBJECT,
    line: string,
  ): string {
    return line;
  }

  protected serializeAttribute(
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
      if (
        children.length === 1 &&
        children[0] instanceof openehr_am.C_PRIMITIVE_OBJECT &&
        !(children[0] instanceof openehr_am.C_TERMINOLOGY_CODE) &&
        !children[0].node_id &&
        children[0].item instanceof openehr_am.C_STRING &&
        children[0].item.pattern
      ) {
        adl += ` matches {|${children[0].item.pattern}|}\n`;
      } else {
        adl += " matches {\n";
        for (const child of children) {
          adl += this.serializeCObject(child, level + 1);
        }
        adl += `${indent}}\n`;
      }
    } else {
      adl += "\n";
    }

    return adl;
  }

  protected serializeSlot(
    slot: openehr_am.ARCHETYPE_SLOT,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    let adl = `${indent}allow_archetype ${slot.rm_type_name}${formatNodeBracket(slot.node_id)}`;
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

  protected serializeTerminologyCode(
    term: openehr_am.C_TERMINOLOGY_CODE,
    level: number,
  ): string {
    const indent = this.getIndent(level);
    const code = term.constraint ?? "";
    return `${indent}[${code}]\n`;
  }

  protected serializePrimitiveObject(
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
      return `${indent}{|${pattern}|}\n`;
    }
    if (pattern && !pattern.includes("|")) {
      return `${indent}${prim.rm_type_name}${formatNodeBracket(prim.node_id)} matches {${JSON.stringify(pattern)}}\n`;
    }
    return `${indent}${prim.rm_type_name}${formatNodeBracket(prim.node_id)}\n`;
  }

  protected getIndent(level: number): string {
    return (this.config.indent || "    ").repeat(level);
  }
}
