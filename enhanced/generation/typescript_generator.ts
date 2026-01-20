/**
 * TypeScript Code Generator
 * 
 * Generates TypeScript code from operational templates/archetypes.
 * Following PRD G-2.1: Uses natural language names from template terminology.
 */

import * as openehr_am from "../openehr_am.ts";

/**
 * Generator configuration
 */
export interface TypeScriptGeneratorConfig {
  language?: string;           // Default: original_language
  includeValidation?: boolean; // Include validation logic
  maxChoices?: number;         // Max choices to list in JSDoc (default: 10)
  terseStyle?: boolean;        // Use terse/compact style
}

/**
 * TypeScript Code Generator
 */
export class TypeScriptGenerator {
  private config: TypeScriptGeneratorConfig;
  private ontology?: openehr_am.ARCHETYPE_ONTOLOGY;
  
  constructor(config?: TypeScriptGeneratorConfig) {
    this.config = {
      language: "en",
      includeValidation: true,
      maxChoices: 10,
      terseStyle: true,
      ...config,
    };
  }
  
  /**
   * Generate TypeScript code from template
   */
  generate(
    template: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE
  ): string {
    this.ontology = template.ontology;
    
    if (!template.definition) {
      throw new Error("Template has no definition");
    }
    
    let code = "// Generated from template\n\n";
    code += this.generateInterface(template.definition);
    code += "\n\n";
    code += this.generateBuilder(template.definition);
    
    return code;
  }
  
  private generateInterface(cObject: openehr_am.C_COMPLEX_OBJECT): string {
    const typeName = this.getTypeName(cObject);
    let code = `/**\n`;
    code += ` * ${this.getDescription(cObject)}\n`;
    code += ` */\n`;
    code += `export interface ${typeName} {\n`;
    
    // Generate properties
    if (cObject.attributes) {
      for (const attr of cObject.attributes) {
        code += this.generateProperty(attr);
      }
    }
    
    code += "}\n";
    return code;
  }
  
  private generateProperty(cAttribute: openehr_am.C_ATTRIBUTE): string {
    const propName = cAttribute.rm_attribute_name || "unknown";
    const isRequired = this.isRequired(cAttribute);
    const isArray = cAttribute instanceof openehr_am.C_MULTIPLE_ATTRIBUTE;
    
    let code = "";
    
    // JSDoc
    if (cAttribute.children && cAttribute.children.length > 0) {
      const child = cAttribute.children[0];
      const desc = this.getDescription(child);
      code += `  /** ${desc} */\n`;
      
      // List choices if reasonable number
      if (cAttribute.children.length > 1 && 
          cAttribute.children.length <= (this.config.maxChoices || 10)) {
        code += `  /** @choices ${cAttribute.children.map(c => this.getTypeName(c)).join(", ")} */\n`;
      }
    }
    
    // Property
    const optMarker = isRequired ? "" : "?";
    if (cAttribute.children && cAttribute.children.length > 0) {
      const childType = this.getTypeName(cAttribute.children[0]);
      const arrayMarker = isArray ? "[]" : "";
      code += `  ${propName}${optMarker}: ${childType}${arrayMarker};\n`;
    } else {
      code += `  ${propName}${optMarker}: any;\n`;
    }
    
    return code;
  }
  
  private generateBuilder(cObject: openehr_am.C_COMPLEX_OBJECT): string {
    const typeName = this.getTypeName(cObject);
    const builderName = `create${typeName}`;
    
    let code = `/**\n`;
    code += ` * Create ${typeName} with simplified pattern\n`;
    code += ` */\n`;
    code += `export function ${builderName}(data: Partial<${typeName}>): ${typeName} {\n`;
    code += `  return {\n`;
    code += `    _type: "${cObject.rm_type_name}",\n`;
    code += `    ...data\n`;
    code += `  } as ${typeName};\n`;
    code += "}\n";
    
    return code;
  }
  
  private getTypeName(cObject: openehr_am.C_OBJECT): string {
    // Get natural language name from terminology
    if (cObject.node_id && this.ontology) {
      const term = this.getTermForCode(cObject.node_id);
      if (term) {
        // Convert to PascalCase
        return this.toPascalCase(term);
      }
    }
    
    // Fallback to RM type name
    return cObject.rm_type_name || "Unknown";
  }
  
  private getDescription(cObject: openehr_am.C_OBJECT): string {
    if (cObject.node_id && this.ontology) {
      const term = this.getTermForCode(cObject.node_id);
      if (term) return term;
    }
    return cObject.rm_type_name || "Unknown";
  }
  
  private getTermForCode(nodeId: string): string | undefined {
    // Simplified: Would need to parse ontology.term_definitions
    // For now, return node_id
    return nodeId;
  }
  
  private toPascalCase(text: string): string {
    return text
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  }
  
  private isRequired(cAttribute: openehr_am.C_ATTRIBUTE): boolean {
    if (cAttribute.children) {
      for (const child of cAttribute.children) {
        if (child.occurrences) {
          const lower = child.occurrences.lower || 0;
          if (lower > 0) return true;
        }
      }
    }
    return false;
  }
}
