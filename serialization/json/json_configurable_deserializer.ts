/**
 * JSON Configurable Deserializer for openEHR RM Objects
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
import { registerOpenEhrModelTypes } from '../common/openehr_model_registry.ts';
import { TypeInferenceEngine } from '../common/type_inference.ts';
import {
  DeserializationError,
  TypeNotFoundError,
  InvalidFormatError,
} from '../common/errors.ts';
import {
  buildJsonSourceIndex,
  escapeJsonPointerSegment,
  lookupJsonSourceLocation,
  type JsonSourceIndex,
} from '../common/json_source_index.ts';
import {
  parseTerseCodePhrase,
  parseTerseDvCodedText,
  isTerseCodePhrase,
  isTerseDvCodedText,
} from '../terse_format.ts';
import {
  JsonDeserializationConfig,
  DEFAULT_JSON_DESERIALIZATION_CONFIG,
} from './json_config.ts';
import { validateDeserializedInstance } from '../common/post_deserialize_validation.ts';
import {
  declaredAttributeSlot,
  isDerivedRmProperty,
  knownRmAttributeNames,
} from './canonical_rm_values.ts';

/**
 * JSON Configurable Deserializer for openEHR RM objects
 */
export class JsonConfigurableDeserializer {
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
    registerOpenEhrModelTypes();
    try {
      const sourceIndex = buildJsonSourceIndex(json);
      const parsed = JSON.parse(json);
      
      // Check if parsed result is a terse format string
      if (this.config.parseTerseFormat && typeof parsed === 'string') {
        const terseResult = this.parseTerseString(parsed);
        if (terseResult) {
          return terseResult as T;
        }
      }
      
      const instance = this.fromJsonObject(parsed, undefined, undefined, undefined, '', sourceIndex);
      return this.maybeValidateAgainstTemplate(instance, json);
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
      const sourceIndex = buildJsonSourceIndex(json);
      const parsed = JSON.parse(json);
      
      // Check if parsed result is a terse format string
      if (this.config.parseTerseFormat && typeof parsed === 'string') {
        const terseResult = this.parseTerseString(parsed);
        if (terseResult) {
          return terseResult as T;
        }
      }
      
      const typeName = TypeRegistry.getTypeName(type);
      const instance = this.fromJsonObject(parsed, typeName, undefined, undefined, '', sourceIndex);
      return this.maybeValidateAgainstTemplate(instance, json);
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
    propertyName?: string,
    jsonPointer = '',
    sourceIndex?: JsonSourceIndex,
  ): T {
    // Handle primitives
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj !== 'object') {
      if (this.config.strict) {
        this.rejectPrimitiveWhereObjectDeclared(
          obj,
          parentType,
          propertyName,
          jsonPointer,
          sourceIndex,
        );
      }
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
      return obj.map((item, index) => 
        this.fromJsonObject(
          item,
          expectedType,
          parentType,
          propertyName,
          `${jsonPointer}/${index}`,
          sourceIndex,
        )
      ) as T;
    }
    
    if (this.config.strict) {
      this.rejectMissingTypeOnAbstractSlot(
        obj,
        parentType,
        propertyName,
        jsonPointer,
        sourceIndex,
      );
    }

    // Resolve type
    const typeName = this.resolveType(obj, expectedType, parentType, propertyName);
    
    if (!typeName) {
      if (this.config.strict) {
        throw this.deserializationError(
          'Cannot determine type for object (strict mode enabled)',
          JSON.stringify(obj),
          undefined,
          jsonPointer,
          sourceIndex,
        );
      }
      // In lenient mode, return plain object
      return obj as T;
    }
    
    // Get constructor
    const constructor = TypeRegistry.getConstructor(typeName);
    
    if (!constructor) {
      if (this.config.strict) {
        throw new TypeNotFoundError(
          typeName,
          JSON.stringify(obj) + ' (strict mode enabled)',
          lookupJsonSourceLocation(sourceIndex ?? new Map(), jsonPointer),
        );
      }
      // In lenient mode, return plain object
      return obj as T;
    }
    
    // Create instance
    const instance = new constructor();

    if (this.config.strict) {
      this.rejectUnknownAttributes(obj, typeName, jsonPointer, sourceIndex);
    }
    
    // Populate properties
    for (const [key, value] of Object.entries(obj)) {
      // Skip type property
      if (key === this.config.typePropertyName) {
        continue;
      }
      
      const childPointer = jsonPointer === ''
        ? `/${escapeJsonPointerSegment(key)}`
        : `${jsonPointer}/${escapeJsonPointerSegment(key)}`;

      // Recursively deserialize property
      try {
        instance[key] = this.fromJsonObject(
          value,
          undefined,
          typeName,
          key,
          childPointer,
          sourceIndex,
        );
      } catch (error) {
        if (this.config.strict) {
          throw this.deserializationError(
            `Failed to deserialize property '${key}' of ${typeName}: ${
              error instanceof Error ? error.message : String(error)
            }`,
            JSON.stringify(obj),
            error instanceof Error ? error : undefined,
            childPointer,
            sourceIndex,
            error instanceof DeserializationError ? error.source : undefined,
          );
        }
        // In lenient mode, use raw value
        instance[key] = value;
      }
    }
    
    return instance as T;
  }

  /**
   * Strict mode: a JSON primitive cannot stand in for an RM object type.
   * Lenient mode still returns the primitive (terse strings included).
   */
  private rejectPrimitiveWhereObjectDeclared(
    value: unknown,
    parentType: string | undefined,
    propertyName: string | undefined,
    jsonPointer: string,
    sourceIndex: JsonSourceIndex | undefined,
  ): void {
    const slot = declaredAttributeSlot(parentType, propertyName);
    if (!slot?.isRmObject) return;
    throw this.deserializationError(
      `Attribute '${propertyName}' on ${parentType} expects ${slot.rawTypeName}, got ${typeof value}`,
      JSON.stringify(value),
      undefined,
      jsonPointer,
      sourceIndex,
    );
  }

  /**
   * Strict mode: abstract or polymorphic slots need an explicit `_type`.
   * Concrete non-polymorphic slots (CODE_PHRASE, TERMINOLOGY_ID, …) may still
   * be inferred. This runs before type inference so an abstract type such as
   * PARTY_PROXY is not chosen as a best guess.
   */
  private rejectMissingTypeOnAbstractSlot(
    obj: Record<string, unknown>,
    parentType: string | undefined,
    propertyName: string | undefined,
    jsonPointer: string,
    sourceIndex: JsonSourceIndex | undefined,
  ): void {
    if (obj[this.config.typePropertyName]) return;
    const slot = declaredAttributeSlot(parentType, propertyName);
    if (!slot?.requiresTypeTag) return;
    throw this.deserializationError(
      `Missing ${this.config.typePropertyName} for attribute '${propertyName}' on ${parentType}: declared type '${slot.typeName}' is abstract or polymorphic`,
      JSON.stringify(obj),
      undefined,
      jsonPointer,
      sourceIndex,
    );
  }

  /**
   * Strict mode: reject keys the RM class does not declare (BMM `attributesFor`).
   * The type discriminator is not an RM attribute. Derived RM functions such as
   * `EVENT.offset` are allowed. Types we cannot describe are left alone so
   * non-RM documents are unchanged. Only called when `strict` is true.
   */
  private rejectUnknownAttributes(
    obj: object,
    typeName: string,
    jsonPointer: string,
    sourceIndex: JsonSourceIndex | undefined,
  ): void {
    const known = knownRmAttributeNames(typeName);
    if (!known) return;
    for (const key of Object.keys(obj)) {
      if (key === this.config.typePropertyName) continue;
      if (known.has(key) || isDerivedRmProperty(typeName, key)) continue;
      const childPointer = jsonPointer === ''
        ? `/${escapeJsonPointerSegment(key)}`
        : `${jsonPointer}/${escapeJsonPointerSegment(key)}`;
      throw this.deserializationError(
        `Unknown attribute '${key}' on ${typeName}`,
        JSON.stringify(obj),
        undefined,
        childPointer,
        sourceIndex,
      );
    }
  }

  private deserializationError(
    message: string,
    data?: string,
    cause?: Error,
    jsonPointer?: string,
    sourceIndex?: JsonSourceIndex,
    existingSource?: DeserializationError['source'],
  ): DeserializationError {
    const source = existingSource ??
      (jsonPointer !== undefined
        ? lookupJsonSourceLocation(sourceIndex ?? new Map(), jsonPointer)
        : undefined);
    return new DeserializationError(message, data, cause, source);
  }

  private maybeValidateAgainstTemplate<T>(instance: T, jsonSource?: string): T {
    const template = this.config.validateAgainstTemplate;
    if (!template) return instance;

    const result = validateDeserializedInstance(instance, {
      validateAgainstTemplate: template,
      jsonSource,
    });
    if (result && !result.valid) {
      const summary = result.errors.map((e) => {
        const location = e.sourceLine !== undefined
          ? ` (line ${e.sourceLine}, column ${e.sourceColumn})`
          : e.jsonPointer !== undefined
          ? ` (${e.jsonPointer})`
          : '';
        return `${e.path}: ${e.message}${location}`;
      }).join(
        "; ",
      );
      throw new DeserializationError(
        `Deserialized instance failed template validation: ${summary}`,
        jsonSource,
      );
    }
    return instance;
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
    const deserializer = new JsonConfigurableDeserializer(config);
    return deserializer.deserialize<T>(json);
  }
}
