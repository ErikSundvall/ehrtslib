/**
 * Type Inference Engine for Smart Type Omission
 * 
 * This module provides intelligent type inference for openEHR RM objects
 * during serialization and deserialization. It allows omitting the `_type`
 * field when the type can be unambiguously determined from context.
 * 
 * Key Features:
 * - Infer types from property names and parent types
 * - Detect when types can be safely omitted
 * - Handle polymorphic properties
 * - Structure-based type inference as fallback
 */

import { TypeRegistry } from './type_registry.ts';

/**
 * Property type information extracted from RM class metadata
 * Maps parent type + property name to expected type
 */
interface PropertyTypeInfo {
  parentType: string;
  propertyName: string;
  expectedType: string;
  isPolymorphic: boolean;
}

/**
 * Type Inference Engine for determining when `_type` fields can be omitted
 * and for inferring types during deserialization.
 */
export class TypeInferenceEngine {
  // Cache for property type mappings
  private static propertyTypeMap = new Map<string, PropertyTypeInfo>();
  
  // List of known polymorphic types
  // These are types that have concrete subtypes that may appear in their place
  private static polymorphicTypes = new Set<string>([
    'DATA_VALUE',
    'DV_ORDERED',
    'DV_TEXT',  // DV_CODED_TEXT inherits from DV_TEXT
    'ITEM',
    'ITEM_STRUCTURE',
    'EVENT',  // POINT_EVENT and INTERVAL_EVENT
    'LOCATABLE',
    'CONTENT_ITEM',
    'CARE_ENTRY',
    'ENTRY',
    'SECTION',
    'PATHABLE',
    'PARTY_IDENTIFIED',  // PARTY_RELATED inherits from PARTY_IDENTIFIED
  ]);
  
  /**
   * Determine if a type field can be omitted during serialization
   * 
   * @param propertyName - Name of the property holding the value
   * @param parentType - Type name of the parent object
   * @param value - The actual value object
   * @returns true if the type can be safely omitted
   */
  static canOmitType(propertyName: string, parentType: string, value: any): boolean {
    if (!value || typeof value !== 'object') {
      return true; // Primitives don't need type
    }
    
    // Get the actual type of the value
    const valueType = TypeRegistry.getTypeNameFromInstance(value);
    if (!valueType) {
      return false; // Unknown type, must include
    }
    
    // Get expected type for this property
    const expectedType = this.getDefaultTypeForProperty(parentType, propertyName);
    
    if (!expectedType) {
      return false; // No default type known, must include
    }
    
    // Check if the property is polymorphic
    if (this.isPolymorphic(expectedType)) {
      return false; // Polymorphic properties need explicit type
    }
    
    // If value type matches expected type exactly, can omit
    return valueType === expectedType;
  }
  
  /**
   * Infer the type from context during deserialization
   * 
   * @param propertyName - Name of the property
   * @param parentType - Type name of the parent object
   * @param data - The data object being deserialized
   * @returns Inferred type name or undefined if cannot infer
   */
  static inferType(propertyName: string, parentType: string, data: any): string | undefined {
    // Strategy 1: Get default type for this property
    const defaultType = this.getDefaultTypeForProperty(parentType, propertyName);
    if (defaultType && !this.isPolymorphic(defaultType)) {
      return defaultType;
    }
    
    // Strategy 2: Infer from structure (property names)
    const structureInferred = this.inferFromStructure(data, defaultType);
    if (structureInferred) {
      return structureInferred;
    }
    
    // Strategy 3: Use the default type even if polymorphic (best guess)
    if (defaultType) {
      // Log when we're making a best guess on a polymorphic type
      if (this.isPolymorphic(defaultType)) {
        if (typeof console !== 'undefined' && console.debug) {
          console.debug(
            `TypeInferenceEngine: Using best guess type '${defaultType}' for polymorphic property '${propertyName}' on '${parentType}'`
          );
        }
      }
      return defaultType;
    }
  }
  
  /**
   * Get the expected/default type for a property on a parent type
   * 
   * @param parentType - Type name of the parent
   * @param propertyName - Name of the property
   * @returns Expected type name or undefined
   */
  static getDefaultTypeForProperty(parentType: string, propertyName: string): string | undefined {
    const key = `${parentType}.${propertyName}`;
    const cached = this.propertyTypeMap.get(key);
    if (cached) {
      return cached.expectedType;
    }
    
    // Build property type map from known RM structures
    // This is a simplified version - in a complete implementation,
    // this would be built from BMM metadata or reflection
    const mapping = this.buildPropertyTypeMapping(parentType, propertyName);
    if (mapping) {
      this.propertyTypeMap.set(key, mapping);
      return mapping.expectedType;
    }
    
    return undefined;
  }
  
  /**
   * Check if a type is polymorphic (has multiple possible subtypes)
   * 
   * @param typeName - The type name to check
   * @returns true if the type is polymorphic
   */
  static isPolymorphic(typeName: string): boolean {
    return this.polymorphicTypes.has(typeName);
  }
  
  /**
   * Infer type from the structure of the data object
   * Uses property names as hints to determine type
   * 
   * @param data - The data object
   * @param expectedType - Optional hint about expected type
   * @returns Inferred type name or undefined
   */
  static inferFromStructure(data: any, expectedType?: string): string | undefined {
    if (!data || typeof data !== 'object') {
      return undefined;
    }
    
    const properties = Object.keys(data);
    
    // Check for distinctive property combinations
    
    // DV_TEXT has 'value' property
    if (properties.includes('value') && !properties.includes('defining_code')) {
      if (!properties.includes('magnitude')) {
        return 'DV_TEXT';
      }
    }
    
    // DV_CODED_TEXT has 'value' and 'defining_code'
    if (properties.includes('value') && properties.includes('defining_code')) {
      return 'DV_CODED_TEXT';
    }
    
    // CODE_PHRASE has 'terminology_id' and 'code_string'
    if (properties.includes('terminology_id') && properties.includes('code_string')) {
      return 'CODE_PHRASE';
    }
    
    // TERMINOLOGY_ID has 'value' as simple string
    if (properties.length === 1 && properties.includes('value') && typeof data.value === 'string') {
      return 'TERMINOLOGY_ID';
    }
    
    // DV_QUANTITY has 'magnitude' and 'units'
    if (properties.includes('magnitude') && properties.includes('units')) {
      return 'DV_QUANTITY';
    }
    
    // DV_COUNT has 'magnitude' without 'units'
    if (properties.includes('magnitude') && !properties.includes('units')) {
      return 'DV_COUNT';
    }
    
    // DV_BOOLEAN has 'value' of type boolean
    if (properties.includes('value') && typeof data.value === 'boolean') {
      return 'DV_BOOLEAN';
    }
    
    // DV_DATE_TIME has 'value' with date-time string
    if (properties.includes('value') && typeof data.value === 'string' && 
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(data.value)) {
      return 'DV_DATE_TIME';
    }
    
    // COMPOSITION has 'category', 'archetype_node_id', 'content'
    if (properties.includes('category') && properties.includes('archetype_node_id')) {
      return 'COMPOSITION';
    }
    
    // OBSERVATION has 'data' and is often recognizable
    if (properties.includes('data') && properties.includes('archetype_node_id')) {
      return 'OBSERVATION';
    }
    
    return undefined;
  }
  
  /**
   * Build property type mapping for a given parent type and property
   * This is a simplified version - would ideally use BMM metadata
   * 
   * @param parentType - The parent type
   * @param propertyName - The property name
   * @returns Property type information or undefined
   */
  private static buildPropertyTypeMapping(
    parentType: string,
    propertyName: string
  ): PropertyTypeInfo | undefined {
    // Common property mappings based on openEHR RM
    const mappings: Record<string, Record<string, { type: string; polymorphic: boolean }>> = {
      'COMPOSITION': {
        'name': { type: 'DV_TEXT', polymorphic: false },
        'language': { type: 'CODE_PHRASE', polymorphic: false },
        'category': { type: 'DV_CODED_TEXT', polymorphic: false },
        'territory': { type: 'CODE_PHRASE', polymorphic: false },
        'context': { type: 'EVENT_CONTEXT', polymorphic: false },
        'content': { type: 'CONTENT_ITEM', polymorphic: true },
      },
      'DV_CODED_TEXT': {
        'defining_code': { type: 'CODE_PHRASE', polymorphic: false },
      },
      'CODE_PHRASE': {
        'terminology_id': { type: 'TERMINOLOGY_ID', polymorphic: false },
      },
      'OBSERVATION': {
        'name': { type: 'DV_TEXT', polymorphic: false },
        'language': { type: 'CODE_PHRASE', polymorphic: false },
        'data': { type: 'HISTORY', polymorphic: false },
      },
      'ELEMENT': {
        'name': { type: 'DV_TEXT', polymorphic: false },
        'value': { type: 'DATA_VALUE', polymorphic: true },
      },
      'PARTY_IDENTIFIED': {
        'name': { type: 'DV_TEXT', polymorphic: false },
      },
    };
    
    const parentMappings = mappings[parentType];
    if (!parentMappings) {
      return undefined;
    }
    
    const propInfo = parentMappings[propertyName];
    if (!propInfo) {
      return undefined;
    }
    
    return {
      parentType,
      propertyName,
      expectedType: propInfo.type,
      isPolymorphic: propInfo.polymorphic,
    };
  }
  
  /**
   * Get the property type for a given object path
   * Useful for nested object traversal
   * 
   * @param parentType - The parent type
   * @param propertyName - The property name
   * @returns The expected type or undefined
   */
  static getPropertyType(parentType: string, propertyName: string): string | undefined {
    return this.getDefaultTypeForProperty(parentType, propertyName);
  }
  
  /**
   * Clear cached type mappings (useful for testing)
   */
  static clearCache(): void {
    this.propertyTypeMap.clear();
  }
  
  /**
   * Register additional polymorphic types
   * 
   * @param types - Array of type names that are polymorphic
   */
  static registerPolymorphicTypes(types: string[]): void {
    types.forEach(type => this.polymorphicTypes.add(type));
  }
}
