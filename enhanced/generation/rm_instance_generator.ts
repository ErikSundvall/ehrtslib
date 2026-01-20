/**
 * RM Instance Generator
 * 
 * Generates valid RM instances from operational templates/archetypes.
 * Follows template constraints and generates example data.
 */

import * as openehr_am from "../openehr_am.ts";

/**
 * Generation mode
 */
export type GenerationMode = "minimal" | "maximal";

/**
 * Generator configuration
 */
export interface GeneratorConfig {
  mode?: GenerationMode;
  fillOptional?: boolean;
  maxDepth?: number;
}

/**
 * RM Instance Generator
 */
export class RMInstanceGenerator {
  private config: GeneratorConfig;
  
  constructor(config?: GeneratorConfig) {
    this.config = {
      mode: "minimal",
      fillOptional: false,
      maxDepth: 50,
      ...config,
    };
  }
  
  /**
   * Generate RM instance from template
   */
  generate(
    template: openehr_am.OPERATIONAL_TEMPLATE | openehr_am.ARCHETYPE
  ): any {
    if (!template.definition) {
      throw new Error("Template has no definition");
    }
    
    return this.generateFromCObject(template.definition, 0);
  }
  
  private generateFromCObject(
    cObject: openehr_am.C_OBJECT,
    depth: number
  ): any {
    if (depth > (this.config.maxDepth || 50)) {
      return null;
    }
    
    // Create instance based on RM type
    const instance: any = {
      _type: cObject.rm_type_name,
    };
    
    // Generate attributes for complex objects
    if (cObject instanceof openehr_am.C_COMPLEX_OBJECT) {
      this.generateAttributes(instance, cObject, depth);
    }
    
    return instance;
  }
  
  private generateAttributes(
    instance: any,
    cObject: openehr_am.C_COMPLEX_OBJECT,
    depth: number
  ): void {
    if (!cObject.attributes) return;
    
    for (const cAttribute of cObject.attributes) {
      const attrName = cAttribute.rm_attribute_name;
      if (!attrName) continue;
      
      // Check if attribute is required
      const isRequired = this.isAttributeRequired(cAttribute);
      
      if (!isRequired && !this.config.fillOptional) {
        continue;
      }
      
      // Generate child values
      if (cAttribute.children && cAttribute.children.length > 0) {
        const child = cAttribute.children[0];
        
        // Check if multiple values needed
        if (cAttribute instanceof openehr_am.C_MULTIPLE_ATTRIBUTE) {
          // Generate array
          const minCard = 1; // Could get from cardinality
          instance[attrName] = [];
          for (let i = 0; i < minCard; i++) {
            const childInstance = this.generateFromCObject(child, depth + 1);
            if (childInstance) {
              instance[attrName].push(childInstance);
            }
          }
        } else {
          // Generate single value
          instance[attrName] = this.generateFromCObject(child, depth + 1);
        }
      }
    }
  }
  
  private isAttributeRequired(cAttribute: openehr_am.C_ATTRIBUTE): boolean {
    // Check if any child has required occurrence
    if (cAttribute.children) {
      for (const child of cAttribute.children) {
        if (child.occurrences) {
          const lower = child.occurrences.lower || 0;
          if (lower > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
