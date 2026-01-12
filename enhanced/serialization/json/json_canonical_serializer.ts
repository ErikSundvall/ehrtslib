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
import { SerializationError, ArchetypeNodeIdLocation } from '../common/mod.ts';

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
  serialize(obj: any, options?: { prettyPrint?: boolean; indent?: number; archetypeNodeIdLocation?: ArchetypeNodeIdLocation }): string {
    const space = (options?.prettyPrint ?? true) ? (options?.indent ?? this.INDENT) : undefined;
    const archIdLocation = options?.archetypeNodeIdLocation ?? 'after_name';
    try {
      const jsonObj = this.toJsonObject(obj, archIdLocation);
      return JSON.stringify(jsonObj, null, space);
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
   * @param archIdLocation - Where to place archetype_node_id
   * @returns Plain JSON object
   */
  private toJsonObject(obj: any, archIdLocation: ArchetypeNodeIdLocation = 'after_name'): any {
    // Handle primitives
    if (obj === null || obj === undefined) {
      return null;
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.toJsonObject(item, archIdLocation));
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

    // Collect properties to serialize
    const props = Array.from(allProperties).filter(key => {
      // Skip internal properties (starting with _ or $)
      if (key.startsWith('_') || key.startsWith('$')) return false;
      // Skip functions
      if (typeof obj[key] === 'function') return false;
      // Skip null/undefined values
      if (obj[key] === null || obj[key] === undefined) return false;
      return true;
    });

    // Reorder properties if archetype_node_id is present
    let orderedKeys: string[] = [];
    const hasArchId = props.includes('archetype_node_id');
    const hasName = props.includes('name');

    if (hasArchId) {
      const rest = props.filter(k => k !== 'archetype_node_id');
      if (archIdLocation === 'beginning') {
        orderedKeys = ['archetype_node_id', ...rest];
      } else if (archIdLocation === 'after_name' && hasName) {
        for (const key of rest) {
          orderedKeys.push(key);
          if (key === 'name') orderedKeys.push('archetype_node_id');
        }
      } else if (archIdLocation === 'end') {
        orderedKeys = [...rest, 'archetype_node_id'];
      } else {
        // Fallback for 'after_name' if name not found, or any other case
        orderedKeys = [...rest, 'archetype_node_id'];
      }
    } else {
      orderedKeys = props;
    }

    // Serialize properties in order
    for (const key of orderedKeys) {
      const value = obj[key];

      // Recursively convert
      const jsonValue = this.toJsonObject(value, archIdLocation);

      // Skip undefined values
      if (jsonValue !== undefined) {
        result[key] = jsonValue;
      }
    }

    return result;
  }
}
