/**
 * ADL2 Serializer
 * 
 * Serializes AOM (Archetype Object Model) back to ADL2 format.
 * Supports round-trip: ADL2 → AOM → ADL2
 */

import * as openehr_am from "../openehr_am.ts";

/**
 * Serializer configuration
 */
export interface ADL2SerializerConfig {
  indent?: string;       // Indentation (default: 4 spaces)
  includeComments?: boolean;
}

/**
 * ADL2 Serializer
 */
export class ADL2Serializer {
  private config: ADL2SerializerConfig;
  private indentLevel: number = 0;
  
  constructor(config?: ADL2SerializerConfig) {
    this.config = {
      indent: "    ",
      includeComments: false,
      ...config,
    };
  }
  
  /**
   * Serialize archetype to ADL2
   */
  serialize(archetype: openehr_am.ARCHETYPE): string {
    let adl = "";
    
    // Header
    adl += "archetype";
    
    // Metadata
    if (archetype.adl_version || archetype.rm_release) {
      adl += " (";
      const meta: string[] = [];
      if (archetype.adl_version) meta.push(`adl_version=${archetype.adl_version}`);
      if (archetype.rm_release) meta.push(`rm_release=${archetype.rm_release}`);
      adl += meta.join("; ");
      adl += ")";
    }
    adl += "\n";
    
    // Archetype ID
    if (archetype.archetype_id) {
      adl += `    ${archetype.archetype_id.value}\n`;
    }
    adl += "\n";
    
    // Language section (placeholder)
    adl += "language\n";
    adl += "    original_language = <\"ISO_639-1::en\">\n";
    adl += "\n";
    
    // Description section (placeholder)
    adl += "description\n";
    adl += "    original_author = <\n";
    adl += "        [\"name\"] = <\"Generated\">\n";
    adl += "    >\n";
    adl += "    lifecycle_state = <\"unmanaged\">\n";
    adl += "\n";
    
    // Definition section
    adl += "definition\n";
    if (archetype.definition) {
      adl += this.serializeDefinition(archetype.definition, 1);
    }
    adl += "\n";
    
    // Terminology section (placeholder)
    adl += "terminology\n";
    adl += "    term_definitions = <\n";
    adl += "        [\"en\"] = <\n";
    adl += "            [\"id1\"] = <\n";
    adl += "                text = <\"Root\">\n";
    adl += "            >\n";
    adl += "        >\n";
    adl += "    >\n";
    
    return adl;
  }
  
  private serializeDefinition(
    cObject: openehr_am.C_COMPLEX_OBJECT,
    level: number
  ): string {
    const indent = this.getIndent(level);
    let adl = "";
    
    // Type and node ID
    adl += `${indent}${cObject.rm_type_name}[${cObject.node_id}]`;
    
    // Occurrences
    if (cObject.occurrences) {
      const lower = cObject.occurrences.lower || 0;
      const upper = cObject.occurrences.upper;
      const upperStr = upper === undefined ? "*" : upper.toString();
      adl += ` occurrences matches {${lower}..${upperStr}}`;
    }
    
    // Attributes
    if (cObject.attributes && cObject.attributes.length > 0) {
      adl += " matches {\n";
      
      for (const attr of cObject.attributes) {
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
    level: number
  ): string {
    const indent = this.getIndent(level);
    let adl = "";
    
    adl += `${indent}${cAttribute.rm_attribute_name}`;
    
    if (cAttribute.children && cAttribute.children.length > 0) {
      adl += " matches {\n";
      
      for (const child of cAttribute.children) {
        if (child instanceof openehr_am.C_COMPLEX_OBJECT) {
          adl += this.serializeDefinition(child, level + 1);
        }
      }
      
      adl += `${indent}}\n`;
    } else {
      adl += "\n";
    }
    
    return adl;
  }
  
  private getIndent(level: number): string {
    return (this.config.indent || "    ").repeat(level);
  }
}
