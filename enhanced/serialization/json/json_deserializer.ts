/**
 * JSON Deserializer for openEHR RM Objects
 * 
 * Deserializes JSON to openEHR Reference Model objects according to
 * the openEHR ITS-JSON specification.
 * 
 * Features:
 * - Type resolution with multiple strategies
 * - Optional terse format parsing
 * - Intelligent type inference
 * - Strict and lenient modes
 */

import { TypeRegistry } from '../common/type_registry.ts';
import { TypeInferenceEngine } from '../common/type_inference.ts';
import {
  DeserializationError,
  TypeNotFoundError,
  InvalidFormatError,
} from '../common/errors.ts';
import {
  parseTerseCodePhrase,
  parseTerseDvCodedText,
  isTerseCodePhrase,
  isTerseDvCodedText,
} from '../../terse_format.ts';
import {
  JsonDeserializationConfig,
  DEFAULT_JSON_DESERIALIZATION_CONFIG,
} from './json_config.ts';

/**
 * JSON Deserializer for openEHR RM objects
 */
export class JsonDeserializer {
  private config: Required<JsonDeserializationConfig>;
  
  /**
   * Create a JSON deserializer with the given configuration
   * 
   * @param config - Deserialization configuration
   */
  constructor(config: JsonDeserializationConfig = {}) {
    this.config = { ...DEFAULT_JSON_DESERIALIZATION_CONFIG, ...config };
  }
  
  /**
   * Deserialize a JSON string to an RM object
   * 
   * @param json - JSON string to deserialize
   * @returns Deserialized object
   * @throws DeserializationError if deserialization fails
   */
  deserialize<T = any>(json: string): T {
    try {
      const parsed = JSON.parse(json);
      
      // Check if parsed result is a terse format string
      if (this.config.parseTerseFormat && typeof parsed === 'string') {
        const terseResult = this.parseTerseString(parsed);
        if (terseResult) {
          return terseResult as T;
        }
      }
      
      return this.fromJsonObject(parsed);
    } catch (error) {
      if (error instanceof DeserializationError) {
        throw error;
      }
      throw new DeserializationError(
        `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
        json,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Deserialize a JSON string to a specific type
   * 
   * @param json - JSON string to deserialize
   * @param type - Expected type constructor
   * @returns Deserialized object of the specified type
   * @throws DeserializationError if deserialization fails
   */
  deserializeAs<T>(json: string, type: new () => T): T {
    try {
      const parsed = JSON.parse(json);
      
      // Check if parsed result is a terse format string
      if (this.config.parseTerseFormat && typeof parsed === 'string') {
        const terseResult = this.parseTerseString(parsed);
        if (terseResult) {
          return terseResult as T;
        }
      }
      
      const typeName = TypeRegistry.getTypeName(type);
      return this.fromJsonObject(parsed, typeName);
    } catch (error) {
      if (error instanceof DeserializationError) {
        throw error;
      }
      throw new DeserializationError(
        `Failed to deserialize as ${type.name}: ${error instanceof Error ? error.message : String(error)}`,
        json,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Convert a plain JSON object to an RM object
   * 
   * @param obj - Plain JSON object
   * @param expectedType - Expected type name (optional)
   * @param parentType - Type of parent object (for inference)
   * @param propertyName - Name of property holding this object
   * @returns Deserialized RM object
   */
  fromJsonObject<T = any>(
    obj: any,
    expectedType?: string,
    parentType?: string,
    propertyName?: string
  ): T {
    // Handle primitives
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj !== 'object') {
      return obj;
    }
    
    // Check for terse format (if enabled)
    if (this.config.parseTerseFormat && typeof obj === 'string') {
      const parsed = this.parseTerseString(obj);
      if (parsed) {
        return parsed as T;
      }
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => 
        this.fromJsonObject(item, expectedType, parentType, propertyName)
      ) as T;
    }
    
    // Resolve type
    const typeName = this.resolveType(obj, expectedType, parentType, propertyName);
    
    if (!typeName) {
      if (this.config.strict) {
        throw new DeserializationError(
          'Cannot determine type for object',
          JSON.stringify(obj)
        );
      }
      // In lenient mode, return plain object
      return obj as T;
    }
    
    // Get constructor
    const constructor = TypeRegistry.getConstructor(typeName);
    
    if (!constructor) {
      if (this.config.strict) {
        throw new TypeNotFoundError(typeName, JSON.stringify(obj));
      }
      // In lenient mode, return plain object
      return obj as T;
    }
    
    // Create instance
    const instance = new constructor();
    
    // Populate properties
    for (const [key, value] of Object.entries(obj)) {
      // Skip type property
      if (key === this.config.typePropertyName) {
        continue;
      }
      
      // Recursively deserialize property
      try {
        instance[key] = this.fromJsonObject(value, undefined, typeName, key);
      } catch (error) {
        if (this.config.strict) {
          throw new DeserializationError(
            `Failed to deserialize property '${key}' of ${typeName}: ${
              error instanceof Error ? error.message : String(error)
            }`,
            JSON.stringify(obj),
            error instanceof Error ? error : undefined
          );
        }
        // In lenient mode, use raw value
        instance[key] = value;
      }
    }
    
    return instance as T;
  }
  
  /**
   * Resolve the type name for an object using multiple strategies
   * 
   * Priority:
   * 1. Explicit _type field
   * 2. Expected type parameter
   * 3. Type inference from property name and parent
   * 4. Type inference from structure
   */
  private resolveType(
    obj: any,
    expectedType?: string,
    parentType?: string,
    propertyName?: string
  ): string | undefined {
    // Strategy 1: Explicit type field
    if (obj[this.config.typePropertyName]) {
      return obj[this.config.typePropertyName];
    }
    
    // Strategy 2: Expected type
    if (expectedType) {
      return expectedType;
    }
    
    // Strategy 3: Type inference from context
    if (parentType && propertyName) {
      const inferred = TypeInferenceEngine.inferType(propertyName, parentType, obj);
      if (inferred) {
        return inferred;
      }
    }
    
    // Strategy 4: Type inference from structure
    const structureInferred = TypeInferenceEngine.inferFromStructure(obj);
    if (structureInferred) {
      return structureInferred;
    }
    
    return undefined;
  }
  
  /**
   * Try to parse a string as terse format
   */
  private parseTerseString(str: string): any | null {
    if (!str || typeof str !== 'string') {
      return null;
    }
    
    // Try DV_CODED_TEXT first (has trailing pipe)
    if (isTerseDvCodedText(str)) {
      const result = parseTerseDvCodedText(str);
      if (result) {
        return result;
      }
    }
    
    // Try CODE_PHRASE
    if (isTerseCodePhrase(str)) {
      const result = parseTerseCodePhrase(str);
      if (result) {
        return result;
      }
    }
    
    return null;
  }
  
  /**
   * Deserialize with a specific configuration (one-time use)
   * 
   * @param json - JSON string to deserialize
   * @param config - Configuration for this deserialization
   * @returns Deserialized object
   */
  static deserializeWith<T = any>(
    json: string,
    config: JsonDeserializationConfig
  ): T {
    const deserializer = new JsonDeserializer(config);
    return deserializer.deserialize<T>(json);
  }
}
