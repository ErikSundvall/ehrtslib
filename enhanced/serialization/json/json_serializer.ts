/**
 * JSON Serializer for openEHR RM Objects
 * 
 * Serializes openEHR Reference Model objects to JSON format according to
 * the openEHR ITS-JSON specification.
 * 
 * Features:
 * - Type property (_type) handling with intelligent inference
 * - Optional terse format for CODE_PHRASE and DV_CODED_TEXT
 * - Hybrid style formatting (zipehr-like)
 * - Configurable output format
 */

import { TypeRegistry } from '../common/type_registry.ts';
import { TypeInferenceEngine } from '../common/type_inference.ts';
import { HybridStyleFormatter } from '../common/hybrid_formatter.ts';
import { SerializationError } from '../common/errors.ts';
import {
  toTerseCodePhrase,
  toTerseDvCodedText,
} from '../../terse_format.ts';
import {
  JsonSerializationConfig,
  DEFAULT_JSON_SERIALIZATION_CONFIG,
} from './json_config.ts';

/**
 * JSON Serializer for openEHR RM objects
 */
export class JsonSerializer {
  private config: Required<JsonSerializationConfig>;
  
  /**
   * Create a JSON serializer with the given configuration
   * 
   * @param config - Serialization configuration
   */
  constructor(config: JsonSerializationConfig = {}) {
    this.config = { ...DEFAULT_JSON_SERIALIZATION_CONFIG, ...config };
  }
  
  /**
   * Serialize an RM object to JSON string
   * 
   * @param obj - The object to serialize
   * @returns JSON string
   * @throws SerializationError if serialization fails
   */
  serialize(obj: any): string {
    try {
      const jsonObj = this.toJsonObject(obj);
      
      if (this.config.prettyPrint) {
        return JSON.stringify(jsonObj, null, this.config.indent);
      } else {
        return JSON.stringify(jsonObj);
      }
    } catch (error) {
      throw new SerializationError(
        `Failed to serialize object: ${error instanceof Error ? error.message : String(error)}`,
        obj,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Convert an RM object to a plain JSON object
   * 
   * @param obj - The object to convert
   * @param parentType - Type of the parent object (for type inference)
   * @param propertyName - Name of the property holding this object
   * @returns Plain JSON object
   */
  toJsonObject(obj: any, parentType?: string, propertyName?: string): any {
    // Handle primitives
    if (obj === null || obj === undefined) {
      return this.config.includeNullValues ? null : undefined;
    }
    
    if (typeof obj !== 'object') {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      const result = obj.map(item => this.toJsonObject(item, parentType, propertyName));
      if (result.length === 0 && !this.config.includeEmptyCollections) {
        return undefined;
      }
      return result;
    }
    
    // Handle terse format conversion if enabled
    if (this.config.useTerseFormat && this.canUseTerseFormat(obj)) {
      return this.toTerseFormat(obj);
    }
    
    // Get type information
    const typeName = TypeRegistry.getTypeNameFromInstance(obj);
    
    // Create result object
    const result: Record<string, any> = {};
    
    // Add type property if needed
    if (this.shouldIncludeType(obj, typeName, parentType, propertyName)) {
      result[this.config.typePropertyName] = typeName || obj.constructor.name.toUpperCase();
    }
    
    // Get all property names including getters
    const allProperties = new Set<string>();
    
    // Add own properties
    Object.keys(obj).forEach(key => allProperties.add(key));
    
    // Add properties from prototype chain (getters)
    let proto = Object.getPrototypeOf(obj);
    while (proto && proto !== Object.prototype) {
      Object.getOwnPropertyNames(proto).forEach(key => {
        if (key !== 'constructor') {
          const descriptor = Object.getOwnPropertyDescriptor(proto, key);
          if (descriptor && descriptor.get) {
            allProperties.add(key);
          }
        }
      });
      proto = Object.getPrototypeOf(proto);
    }
    
    // Serialize all properties
    for (const key of allProperties) {
      // Skip internal properties (starting with _ or $)
      if (key.startsWith('_') || key.startsWith('$')) {
        continue;
      }
      
      // Skip functions
      if (typeof obj[key] === 'function') {
        continue;
      }
      
      const value = obj[key];
      
      // Skip null/undefined if not including them
      if ((value === null || value === undefined) && !this.config.includeNullValues) {
        continue;
      }
      
      // Recursively convert
      const jsonValue = this.toJsonObject(value, typeName, key);
      
      // Skip undefined values
      if (jsonValue !== undefined) {
        result[key] = jsonValue;
      }
    }
    
    // Skip empty objects if not including them
    const hasProperties = Object.keys(result).some(k => k !== this.config.typePropertyName);
    if (!hasProperties && !this.config.includeEmptyCollections) {
      return undefined;
    }
    
    return result;
  }
  
  /**
   * Serialize with a specific configuration (one-time use)
   * 
   * @param obj - The object to serialize
   * @param config - Configuration for this serialization
   * @returns JSON string
   */
  static serializeWith(obj: any, config: JsonSerializationConfig): string {
    const serializer = new JsonSerializer(config);
    return serializer.serialize(obj);
  }
  
  /**
   * Determine if type property should be included
   */
  private shouldIncludeType(
    obj: any,
    typeName: string | undefined,
    parentType?: string,
    propertyName?: string
  ): boolean {
    // Always include if configured to do so
    if (this.config.alwaysIncludeType) {
      return true;
    }
    
    // If no type name, we can't include it
    if (!typeName) {
      return false;
    }
    
    // If no context (top-level), include type
    if (!parentType || !propertyName) {
      return true;
    }
    
    // Use type inference to decide
    return !TypeInferenceEngine.canOmitType(propertyName, parentType, obj);
  }
  
  /**
   * Check if an object can use terse format
   */
  private canUseTerseFormat(obj: any): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    
    const typeName = TypeRegistry.getTypeNameFromInstance(obj);
    return typeName === 'CODE_PHRASE' || typeName === 'DV_CODED_TEXT';
  }
  
  /**
   * Convert object to terse format string
   */
  private toTerseFormat(obj: any): string {
    const typeName = TypeRegistry.getTypeNameFromInstance(obj);
    
    if (typeName === 'CODE_PHRASE') {
      return toTerseCodePhrase(obj);
    }
    
    if (typeName === 'DV_CODED_TEXT') {
      return toTerseDvCodedText(obj);
    }
    
    throw new SerializationError(`Cannot convert ${typeName} to terse format`, obj);
  }
}
