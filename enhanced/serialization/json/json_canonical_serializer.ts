/**
 * Canonical JSON Serializer for openEHR RM Objects
 * 
 * Simplified, non-configurable serializer that produces canonical openEHR JSON.
 * This class is optimized for performance and minimal code size - it always:
 * - Includes _type fields (no type inference)
 * - Uses pretty printing with 2-space indentation
 * - Follows openEHR ITS-JSON specification strictly
 * - Does not support terse format or hybrid styles
 * 
 * **Note on _type field**: The openEHR ITS-JSON specification allows the _type 
 * field to be omitted in some cases where the type can be inferred from context.
 * However, this serializer ALWAYS includes _type fields for maximum clarity and
 * interoperability. For configurable type inclusion, use JsonConfigurableSerializer.
 * 
 * For configurable serialization, use JsonConfigurableSerializer instead.
 * 
 * @example
 * ```typescript
 * import { JsonCanonicalSerializer } from './enhanced/serialization/json/mod.ts';
 * 
 * const serializer = new JsonCanonicalSerializer();
 * const json = serializer.serialize(composition);
 * ```
 */

import { TypeRegistry } from '../common/type_registry.ts';
import { SerializationError } from '../common/errors.ts';

/**
 * Canonical JSON Serializer - Canonical openEHR JSON only
 */
export class JsonCanonicalSerializer {
  private readonly TYPE_PROPERTY = '_type';
  private readonly INDENT = 2;
  
  /**
   * Serialize an RM object to canonical JSON string
   * 
   * @param obj - The object to serialize
   * @returns Canonical JSON string with pretty printing
   * @throws SerializationError if serialization fails
   */
  serialize(obj: any): string {
    try {
      const jsonObj = this.toJsonObject(obj);
      return JSON.stringify(jsonObj, null, this.INDENT);
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
   * @returns Plain JSON object
   */
  private toJsonObject(obj: any): any {
    // Handle primitives
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (typeof obj !== 'object') {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.toJsonObject(item));
    }
    
    // Get type information - always include in canonical format
    const typeName = TypeRegistry.getTypeNameFromInstance(obj);
    
    // Create result object
    const result: Record<string, any> = {};
    
    // Always add type property for canonical format
    if (typeName) {
      result[this.TYPE_PROPERTY] = typeName;
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
      
      // Skip null/undefined values
      if (value === null || value === undefined) {
        continue;
      }
      
      // Recursively convert
      const jsonValue = this.toJsonObject(value);
      
      // Skip undefined values
      if (jsonValue !== undefined) {
        result[key] = jsonValue;
      }
    }
    
    return result;
  }
}
