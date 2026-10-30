/**
 * Canonical JSON Serializer for openEHR RM Objects
 * 
 * Simplified, non-configurable serializer that produces canonical openEHR JSON.
 * This class is optimized for performance and minimal code size - it always:
 * - Includes _type fields (no type inference)
 * - Uses pretty printing with 2-space indentation
 * - Follows openEHR ITS-JSON specification strictly
 * - Does not support terse format or hybrid styles
 * - Refuses primitives and untyped plain objects in RM-class attributes
 *   (`onNonRmValue`, default `"throw"`)
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
 * import { JsonCanonicalSerializer } from './serialization/json/mod.ts';
 * 
 * const serializer = new JsonCanonicalSerializer();
 * const json = serializer.serialize(composition);
 * ```
 */

import {
  SerializationError,
  ArchetypeNodeIdLocation,
  NameLocation,
  walkRmTreeToPlain,
} from '../common/mod.ts';
import { type PropertyOrderOptions } from '../common/property_order.ts';
import {
  prepareCanonicalAttributeValue,
  resolveOnNonRmValue,
  type CanonicalOnNonRmValue,
} from './canonical_rm_values.ts';

export type { CanonicalOnNonRmValue };

/** Options for {@link JsonCanonicalSerializer}. */
export interface JsonCanonicalSerializeOptions {
  prettyPrint?: boolean;
  indent?: number;
  archetypeNodeIdLocation?: ArchetypeNodeIdLocation;
  nameLocation?: NameLocation;
  /**
   * What to do when an RM-class attribute holds a value that is not an RM
   * instance (a primitive, or a plain object with no resolvable type / no
   * concrete `_type` when the declared type is abstract or polymorphic).
   *
   * - `"throw"` (default) — refuse to emit non-canonical JSON
   * - `"coerce"` — turn a string into CODE_PHRASE, DV_CODED_TEXT, or DV_TEXT
   *   via the init helpers when the declared type is one of those; otherwise throw
   * - `"pass"` — emit the value as stored (previous behaviour)
   */
  onNonRmValue?: CanonicalOnNonRmValue;
}

/**
 * Canonical JSON Serializer - Canonical openEHR JSON only
 */
export class JsonCanonicalSerializer {
  private readonly TYPE_PROPERTY = '_type';
  private readonly INDENT = 2;
  private readonly onNonRmValue: CanonicalOnNonRmValue;

  constructor(options: Pick<JsonCanonicalSerializeOptions, 'onNonRmValue'> = {}) {
    this.onNonRmValue = resolveOnNonRmValue(options.onNonRmValue);
  }

  /**
   * Serialize an RM object to canonical JSON string
   * 
   * @param obj - The object to serialize
   * @returns Canonical JSON string with pretty printing
   * @throws SerializationError if serialization fails, including when an
   *   RM-class attribute holds a non-RM value and `onNonRmValue` is `"throw"`
   *   (the default) or `"coerce"` cannot convert it
   */
  serialize(obj: any, options?: JsonCanonicalSerializeOptions): string {
    const space = (options?.prettyPrint ?? true) ? (options?.indent ?? this.INDENT) : undefined;
    const onNonRmValue = options?.onNonRmValue !== undefined
      ? resolveOnNonRmValue(options.onNonRmValue)
      : this.onNonRmValue;
    try {
      const jsonObj = this.toJsonObject(obj, {
        archetypeNodeIdLocation: options?.archetypeNodeIdLocation,
        nameLocation: options?.nameLocation,
      }, onNonRmValue);
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
   * @param order - Where to place archetype_node_id / name
   * @returns Plain JSON object
   */
  private toJsonObject(
    obj: any,
    order: PropertyOrderOptions = {},
    onNonRmValue: CanonicalOnNonRmValue = 'throw',
  ): any {
    // Preserve the historical "always null" behavior for a null/undefined root,
    // since the shared walker otherwise returns undefined here (see rm_tree_walker.ts).
    if (obj === null || obj === undefined) {
      return null;
    }

    return walkRmTreeToPlain(
      obj,
      { order },
      (ctx, orderedKeys, recurse, source) => {
        const result: Record<string, any> = {};

        // Always add type property for canonical format
        if (ctx.typeName) {
          result[this.TYPE_PROPERTY] = ctx.typeName;
        }

        // Serialize properties in order. Non-RM values are checked here, not in
        // the shared walker (YAML uses the same walker and must keep emitting them).
        for (const key of orderedKeys) {
          const prepared = prepareCanonicalAttributeValue(
            ctx.typeName,
            key,
            source[key],
            onNonRmValue,
          );
          const jsonValue = recurse(prepared, key);

          // Skip undefined values
          if (jsonValue !== undefined) {
            result[key] = jsonValue;
          }
        }

        return result;
      },
    );
  }
}
