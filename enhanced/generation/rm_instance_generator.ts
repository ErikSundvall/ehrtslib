/**
 * RM Instance Generator
 * 
 * Generates valid RM instances from operational templates/archetypes.
 * Follows template constraints and generates example data.
 * 
 * Includes mandatory RM attributes even if not explicitly constrained in the template.
 * Reference: openEHR RM specification, Archie BMM schema definitions
 */

import * as openehr_am from "../openehr_am.ts";

/**
 * Mandatory RM attributes per type (from RM specification and BMM schema)
 * 
 * Source: openEHR RM specifications and Archie BMM definitions
 * - COMPOSITION: language, territory, category, composer (all mandatory)
 * - OBSERVATION: data (mandatory)
 * - HISTORY: origin (mandatory)
 * - LOCATABLE: archetype_node_id, name (inherited by all LOCATABLE descendants)
 */
const MANDATORY_RM_ATTRIBUTES: Record<string, string[]> = {
  "COMPOSITION": ["language", "territory", "category", "composer"],
  "OBSERVATION": ["data"],
  "INSTRUCTION": ["narrative"],
  "ACTION": ["time"],
  "HISTORY": ["origin"],
  "LOCATABLE": ["archetype_node_id", "name"],
  "EVENT": ["time"],
  "POINT_EVENT": ["time"],
  "INTERVAL_EVENT": ["time", "math_function"],
  "CLUSTER": ["items"],
  "ELEMENT": [],  // name inherited from LOCATABLE
};

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
  includeMandatoryRMAttributes?: boolean;  // NEW: Generate mandatory RM attributes
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
      includeMandatoryRMAttributes: true,  // Default: include mandatory attributes
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
    // First, generate attributes from template constraints
    const generatedAttributes = new Set<string>();
    
    if (cObject.attributes) {
      for (const cAttribute of cObject.attributes) {
        const attrName = cAttribute.rm_attribute_name;
        if (!attrName) continue;
        
        generatedAttributes.add(attrName);
        
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
    
    // Second, add mandatory RM attributes not in template (if enabled)
    if (this.config.includeMandatoryRMAttributes) {
      this.addMandatoryRMAttributes(instance, cObject.rm_type_name || "", generatedAttributes);
    }
  }
  
  /**
   * Add mandatory RM attributes that aren't in the template
   * 
   * Based on openEHR RM specification requirements
   */
  private addMandatoryRMAttributes(
    instance: any,
    rmTypeName: string,
    generatedAttributes: Set<string>
  ): void {
    const mandatoryAttrs = MANDATORY_RM_ATTRIBUTES[rmTypeName] || [];
    
    // Also check parent class attributes (LOCATABLE)
    if (this.isLocatableDescendant(rmTypeName) && !mandatoryAttrs.includes("archetype_node_id")) {
      mandatoryAttrs.push(...MANDATORY_RM_ATTRIBUTES["LOCATABLE"]);
    }
    
    for (const attrName of mandatoryAttrs) {
      if (generatedAttributes.has(attrName)) {
        continue;  // Already generated from template
      }
      
      // Generate default value for mandatory attribute
      instance[attrName] = this.generateDefaultValue(rmTypeName, attrName);
    }
  }
  
  /**
   * Check if a type descends from LOCATABLE
   */
  private isLocatableDescendant(rmTypeName: string): boolean {
    const locatableTypes = [
      "COMPOSITION", "SECTION", "OBSERVATION", "EVALUATION", "INSTRUCTION", "ACTION",
      "ADMIN_ENTRY", "CLUSTER", "ELEMENT", "ITEM_TREE", "ITEM_LIST", "ITEM_TABLE",
      "ITEM_SINGLE", "HISTORY", "EVENT", "POINT_EVENT", "INTERVAL_EVENT",
    ];
    return locatableTypes.includes(rmTypeName);
  }
  
  /**
   * Generate default value for mandatory attribute
   */
  private generateDefaultValue(rmTypeName: string, attrName: string): any {
    // Attribute-specific defaults
    switch (`${rmTypeName}.${attrName}`) {
      case "COMPOSITION.language":
        return { _type: "CODE_PHRASE", terminology_id: { value: "ISO_639-1" }, code_string: "en" };
      
      case "COMPOSITION.territory":
        return { _type: "CODE_PHRASE", terminology_id: { value: "ISO_3166-1" }, code_string: "US" };
      
      case "COMPOSITION.category":
        return { 
          _type: "DV_CODED_TEXT",
          value: "event",
          defining_code: {
            _type: "CODE_PHRASE",
            terminology_id: { value: "openehr" },
            code_string: "433"
          }
        };
      
      case "COMPOSITION.composer":
        return {
          _type: "PARTY_IDENTIFIED",
          name: "Unknown"
        };
      
      case "INSTRUCTION.narrative":
        return {
          _type: "DV_TEXT",
          value: "Generated instruction narrative"
        };
      
      case "ACTION.time":
        return {
          _type: "DV_DATE_TIME",
          value: new Date().toISOString()
        };
      
      case "HISTORY.origin":
        return {
          _type: "DV_DATE_TIME",
          value: new Date().toISOString()
        };
      
      case "INTERVAL_EVENT.math_function":
        return {
          _type: "DV_CODED_TEXT",
          value: "mean",
          defining_code: {
            _type: "CODE_PHRASE",
            terminology_id: { value: "openehr" },
            code_string: "146"
          }
        };
      
      case "LOCATABLE.archetype_node_id":
        return "at0000";  // Generic node ID
      
      case "LOCATABLE.name":
      case "EVENT.name":
        return {
          _type: "DV_TEXT",
          value: rmTypeName
        };
      
      case "CLUSTER.items":
        return [];  // Empty array for now
      
      default:
        // Generic defaults by attribute name
        if (attrName === "time") {
          return { _type: "DV_DATE_TIME", value: new Date().toISOString() };
        }
        if (attrName === "data") {
          return null;  // Will be filled by template constraints
        }
        return null;
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
