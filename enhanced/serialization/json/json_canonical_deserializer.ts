/**
 * Canonical JSON Deserializer for openEHR RM Objects
 * 
 * Simplified, non-configurable deserializer for canonical openEHR JSON.
 * This class is optimized for performance and minimal code size - it always:
 * - Requires _type fields (no type inference)
 * - Uses strict mode (fails on unknown types)
 * - Follows openEHR ITS-JSON specification strictly
 * - Does not support terse format parsing
 * 
 * **Important**: The openEHR ITS-JSON specification allows the _type field to be
 * omitted in some cases where the type can be inferred from context. However, this
 * deserializer REQUIRES _type fields and will throw errors if they are missing.
 * For flexible deserialization with type inference, use JsonConfigurableDeserializer.
 * 
 * For configurable deserialization, use JsonConfigurableDeserializer instead.
 * 
 * @example
 * ```typescript
 * import { JsonCanonicalDeserializer } from './enhanced/serialization/json/mod.ts';
 * 
 * const deserializer = new JsonCanonicalDeserializer();
 * const obj = deserializer.deserialize(jsonString);
 * ```
 */

import { TypeRegistry } from '../common/type_registry.ts';
import {
  DeserializationError,
  TypeNotFoundError,
} from '../common/errors.ts';

/**
 * Canonical JSON Deserializer - Canonical openEHR JSON only
 */
export class JsonCanonicalDeserializer {
  private readonly TYPE_PROPERTY = '_type';
  
  /**
   * Deserialize a canonical JSON string to an RM object
   * 
   * @param json - JSON string to deserialize
   * @returns Deserialized object
   * @throws DeserializationError if deserialization fails
   * @throws TypeNotFoundError if type is not registered
   */
  deserialize<T = any>(json: string): T {
    try {
      const parsed = JSON.parse(json);
      return this.fromJsonObject(parsed);
    } catch (error) {
      if (error instanceof DeserializationError || error instanceof TypeNotFoundError) {
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
   * Convert a plain JSON object to an RM object
   * 
   * @param obj - Plain JSON object
   * @returns Deserialized RM object
   * @throws DeserializationError if type cannot be determined
   * @throws TypeNotFoundError if type is not registered
   */
  private fromJsonObject<T = any>(obj: any): T {
    // Handle primitives
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj !== 'object') {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.fromJsonObject(item)) as T;
    }
    
    // Get type from _type field - required in canonical format
    const typeName = obj[this.TYPE_PROPERTY];
    
    if (!typeName) {
      throw new DeserializationError(
        'Cannot determine type for object: _type field is required in canonical JSON (canonical deserializer, strict mode). Note: The openEHR spec allows _type to be omitted in some cases, but this deserializer requires it.',
        JSON.stringify(obj)
      );
    }
    
    // Get constructor - must be registered
    const constructor = TypeRegistry.getConstructor(typeName);
    
    if (!constructor) {
      throw new TypeNotFoundError(
        typeName,
        JSON.stringify(obj) + ' (canonical deserializer, strict mode)'
      );
    }
    
    // Create instance
    const instance = new constructor();
    
    // Populate properties
    for (const [key, value] of Object.entries(obj)) {
      // Skip type property
      if (key === this.TYPE_PROPERTY) {
        continue;
      }
      
      // Recursively deserialize property
      try {
        instance[key] = this.fromJsonObject(value);
      } catch (error) {
        throw new DeserializationError(
          `Failed to deserialize property '${key}' of ${typeName}: ${
            error instanceof Error ? error.message : String(error)
          } (canonical deserializer, strict mode)`,
          JSON.stringify(obj),
          error instanceof Error ? error : undefined
        );
      }
    }
    
    return instance as T;
  }
}
