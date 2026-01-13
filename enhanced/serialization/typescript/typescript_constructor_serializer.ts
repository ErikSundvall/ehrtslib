/**
 * TypeScript Constructor Serializer for openEHR RM Objects
 * 
 * Generates TypeScript constructor code that can be used to create
 * openEHR RM object instances using the "Nested Object Initialization" pattern.
 * 
 * This follows the patterns described in SIMPLIFIED-CREATION-GUIDE.md
 */

import { TypeRegistry } from '../common/type_registry.ts';
import { SerializationError } from '../common/errors.ts';
import type { ArchetypeNodeIdLocation } from '../common/mod.ts';

/**
 * Configuration options for TypeScript constructor serialization
 */
export interface TypeScriptConstructorSerializationConfig {
  /**
   * Use terse format for CODE_PHRASE and DV_CODED_TEXT
   * Example: "ISO_639-1::en" instead of {code_string: "en", terminology_id: "ISO_639-1"}
   * @default true
   */
  useTerseFormat?: boolean;

  /**
   * Use primitive value constructors for simple wrapper types
   * Example: "text value" instead of {value: "text value"}
   * @default true
   */
  usePrimitiveConstructors?: boolean;

  /**
   * Include comments in the generated code
   * Adds comments listing alternative/possible values for properties
   * @default false
   */
  includeComments?: boolean;

  /**
   * Include undefined attributes in the output
   * Shows all possible properties even if not set
   * @default false
   */
  includeUndefinedAttributes?: boolean;

  /**
   * Indentation size in spaces
   * @default 2
   */
  indent?: number;

  /**
   * Location of archetype_node_id in the generated code
   * @default 'after_name'
   */
  archetypeNodeIdLocation?: ArchetypeNodeIdLocation;
}

/**
 * Default configuration
 */
export const DEFAULT_TYPESCRIPT_CONSTRUCTOR_CONFIG: Required<TypeScriptConstructorSerializationConfig> = {
  useTerseFormat: true,
  usePrimitiveConstructors: true,
  includeComments: false,
  includeUndefinedAttributes: false,
  indent: 2,
  archetypeNodeIdLocation: 'after_name',
};

/**
 * TypeScript Constructor Serializer
 * 
 * Generates TypeScript code using nested object initialization pattern
 */
export class TypeScriptConstructorSerializer {
  private config: Required<TypeScriptConstructorSerializationConfig>;
  private usedTypes: Set<string> = new Set();

  /**
   * Create a TypeScript constructor serializer
   * @param config - Serialization configuration
   */
  constructor(config: TypeScriptConstructorSerializationConfig = {}) {
    this.config = { ...DEFAULT_TYPESCRIPT_CONSTRUCTOR_CONFIG, ...config };
  }

  /**
   * Serialize an RM object to TypeScript constructor code
   * 
   * @param obj - The object to serialize
   * @param variableName - Optional variable name (default: inferred from type)
   * @returns TypeScript code string
   * @throws SerializationError if serialization fails
   */
  serialize(obj: any, variableName?: string): string {
    try {
      this.usedTypes = new Set();

      // Generate the constructor code
      const typeName = TypeRegistry.getTypeNameFromInstance(obj);
      if (!typeName) {
        throw new SerializationError('Cannot serialize object without type information', obj);
      }

      const varName = variableName || this.getDefaultVariableName(typeName);
      const constructorCode = this.generateConstructorCall(obj, 0);

      // Collect imports
      const rmTypes: string[] = [];
      const baseTypes: string[] = [];

      for (const type of this.usedTypes) {
        if (this.isBaseType(type)) {
          baseTypes.push(type);
        } else {
          rmTypes.push(type);
        }
      }

      // Generate imports
      let code = '';
      if (rmTypes.length > 0) {
        code += `import { ${rmTypes.sort().join(', ')} } from './enhanced/openehr_rm.ts';\n`;
      }
      if (baseTypes.length > 0) {
        code += `import { ${baseTypes.sort().join(', ')} } from './enhanced/openehr_base.ts';\n`;
      }

      if (code) {
        code += '\n';
      }

      // Add variable declaration
      code += `const ${varName} = ${constructorCode};\n`;

      return code;
    } catch (error) {
      throw new SerializationError(
        `Failed to serialize to TypeScript: ${error instanceof Error ? error.message : String(error)}`,
        obj,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate a constructor call for an object
   */
  private generateConstructorCall(obj: any, depth: number): string {
    // Handle null/undefined
    if (obj === null || obj === undefined) {
      return 'undefined';
    }

    // Handle primitives
    if (typeof obj === 'string') {
      return JSON.stringify(obj);
    }
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return this.generateArrayCode(obj, depth);
    }

    // Handle objects
    const typeName = TypeRegistry.getTypeNameFromInstance(obj);
    if (!typeName) {
      // Plain object
      return this.generatePlainObjectCode(obj, depth);
    }

    // Track used type
    this.usedTypes.add(typeName);

    // Check for terse format opportunity
    if (this.config.useTerseFormat) {
      const terseForm = this.getTerseForm(obj, typeName);
      if (terseForm !== null) {
        return JSON.stringify(terseForm);
      }
    }

    // Check for primitive wrapper optimization
    if (this.config.usePrimitiveConstructors && this.isPrimitiveWrapper(typeName)) {
      const keys = this.getAllPropertyNames(obj).filter(k => !k.startsWith('_') && !k.startsWith('$') && k !== 'constructor');
      // Get keys that actually have values
      const keysWithValues = keys.filter(k => obj[k] !== undefined);
      // If it only has 'value' and it's a primitive type, use the primitive value
      if (keysWithValues.length === 1 && keysWithValues[0] === 'value' && (typeof obj.value === 'string' || typeof obj.value === 'number' || typeof obj.value === 'boolean')) {
        return this.generateConstructorCall(obj.value, depth);
      }
    }

    // Generate constructor with initialization object
    return `new ${typeName}(${this.generateInitializationObject(obj, depth + 1)})`;
  }

  /**
   * Generate array code
   */
  private generateArrayCode(arr: any[], depth: number): string {
    if (arr.length === 0) {
      return '[]';
    }

    const indentStr = ' '.repeat(this.config.indent * (depth + 1));
    const items = arr.map(item =>
      indentStr + this.generateConstructorCall(item, depth + 1)
    ).join(',\n');

    return `[\n${items}\n${' '.repeat(this.config.indent * depth)}]`;
  }

  /**
   * Generate plain object code
   */
  private generatePlainObjectCode(obj: Record<string, any>, depth: number): string {
    const indentStr = ' '.repeat(this.config.indent * (depth + 1));
    const properties: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('_') || key === 'constructor') {
        continue;
      }
      const valueCode = this.generateConstructorCall(value, depth + 1);
      properties.push(`${indentStr}${key}: ${valueCode}`);
    }

    if (properties.length === 0) {
      return '{}';
    }

    return `{\n${properties.join(',\n')}\n${' '.repeat(this.config.indent * depth)}}`;
  }

  /**
   * Generate initialization object for a constructor
   */
  private generateInitializationObject(obj: any, depth: number): string {
    const indentStr = ' '.repeat(this.config.indent * depth);
    const properties: string[] = [];
    const typeName = TypeRegistry.getTypeNameFromInstance(obj);

    let keys = this.getAllPropertyNames(obj);

    // If includeUndefinedAttributes is requested, get all possible keys
    if (this.config.includeUndefinedAttributes && typeName) {
      keys = this.getAllPossibleKeys(typeName, keys);
    }

    // Handle archetype_node_id ordering
    const hasArchetypeNodeId = keys.includes('archetype_node_id');
    const hasName = keys.includes('name');

    // Build ordered keys based on archetypeNodeIdLocation
    let orderedKeys: string[] = [];
    if (hasArchetypeNodeId && hasName) {
      const location = this.config.archetypeNodeIdLocation;
      const otherKeys = keys.filter(k => k !== 'archetype_node_id' && k !== 'name');

      if (location === 'beginning') {
        orderedKeys = ['archetype_node_id', 'name', ...otherKeys];
      } else if (location === 'after_name') {
        orderedKeys = ['name', 'archetype_node_id', ...otherKeys];
      } else { // 'end'
        orderedKeys = ['name', ...otherKeys, 'archetype_node_id'];
      }
    } else {
      orderedKeys = keys;
    }

    for (const key of orderedKeys) {
      // Skip internal properties
      if (key.startsWith('_') || key === 'constructor') {
        continue;
      }

      const value = obj[key];

      // Handle undefined values
      if (value === undefined) {
        if (this.config.includeUndefinedAttributes) {
          if (this.config.includeComments) {
            properties.push(`${indentStr}${key}: undefined  // TODO: Set value`);
          } else {
            properties.push(`${indentStr}${key}: undefined`);
          }
        }
        continue;
      }

      // Generate property code
      const valueCode = this.generateConstructorCall(value, depth);
      let propertyLine = `${indentStr}${key}: ${valueCode}`;

      // Add comments if requested
      if (this.config.includeComments) {
        const comment = this.getPropertyComment(typeName, key, value);
        if (comment) {
          propertyLine += `  // ${comment}`;
        }
      }

      properties.push(propertyLine);
    }

    if (properties.length === 0) {
      return '{}';
    }

    return `{\n${properties.join(',\n')}\n${' '.repeat(this.config.indent * (depth - 1))}}`;
  }

  /**
   * Get all property names from an object, including getters
   */
  private getAllPropertyNames(obj: any): string[] {
    if (!obj || typeof obj !== 'object') return [];

    const allProperties = new Set<string>();

    // Add own properties
    Object.keys(obj).forEach(key => {
      if (!key.startsWith('_') && !key.startsWith('$')) {
        allProperties.add(key);
      }
    });

    // Add properties from prototype chain (getters)
    let proto = Object.getPrototypeOf(obj);
    while (proto && proto !== Object.prototype) {
      Object.getOwnPropertyNames(proto).forEach(key => {
        if (key !== 'constructor' && !key.startsWith('_') && !key.startsWith('$')) {
          const descriptor = Object.getOwnPropertyDescriptor(proto, key);
          if (descriptor && descriptor.get) {
            allProperties.add(key);
          }
        }
      });
      proto = Object.getPrototypeOf(proto);
    }

    return Array.from(allProperties);
  }

  /**
   * Get all possible keys for a type (including undefined ones)
   */
  private getAllPossibleKeys(typeName: string, existingKeys: string[]): string[] {
    // This would require access to the class definition
    // For now, just return existing keys
    // TODO: Implement type introspection if needed
    return existingKeys;
  }

  /**
   * Get terse form for CODE_PHRASE or DV_CODED_TEXT
   */
  private getTerseForm(obj: any, typeName: string): string | null {
    if (typeName === 'CODE_PHRASE') {
      const terminologyId = obj.terminology_id?.value;
      const codeString = obj.code_string;
      if (terminologyId && codeString) {
        return `${terminologyId}::${codeString}`;
      }
    } else if (typeName === 'DV_CODED_TEXT') {
      const value = obj.value;
      const definingCode = obj.defining_code;
      if (definingCode) {
        const terminologyId = definingCode.terminology_id?.value;
        const codeString = definingCode.code_string;
        if (terminologyId && codeString) {
          return `${terminologyId}::${codeString}|${value || ''}|`;
        }
      }
    }
    return null;
  }

  /**
   * Check if a type is a primitive wrapper
   */
  private isPrimitiveWrapper(typeName: string): boolean {
    const primitiveWrappers = [
      'DV_TEXT',
      'DV_CODED_TEXT',
      'TERMINOLOGY_ID',
      'OBJECT_VERSION_ID',
      'ARCHETYPE_ID',
      'TEMPLATE_ID',
      'HIER_OBJECT_ID',
      'GENERIC_ID',
    ];
    return primitiveWrappers.includes(typeName);
  }

  /**
   * Check if a type belongs to the BASE package
   */
  private isBaseType(typeName: string): boolean {
    const baseTypes = [
      'TERMINOLOGY_ID',
      'CODE_PHRASE',
      'ARCHETYPE_ID',
      'OBJECT_VERSION_ID',
      'TEMPLATE_ID',
      'GENERIC_ID',
      'OBJECT_ID',
      'UID_BASED_ID',
      'HIER_OBJECT_ID',
      'PARTY_REF',
      'OBJECT_REF',
      'LOCATABLE_REF',
      'ACCESS_GROUP_REF',
      'VERSIONED_OBJECT_REF',
      'Boolean',
      'Integer',
      'Integer64',
      'Real',
      'Any',
      'Ordered',
      'Ordered_Numeric',
    ];
    return baseTypes.includes(typeName);
  }

  /**
   * Get default variable name from type name
   */
  private getDefaultVariableName(typeName: string): string {
    // Convert COMPOSITION -> composition, DV_TEXT -> dvText, etc.
    const name = typeName.toLowerCase();
    if (name.includes('_')) {
      // Convert SNAKE_CASE to camelCase
      return name.split('_').map((word, i) =>
        i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');
    }
    return name;
  }

  /**
   * Get a comment for a property (for includeComments mode)
   */
  private getPropertyComment(typeName: string | undefined, key: string, value: any): string | null {
    // This could be enhanced to provide more useful comments
    // For now, just return null
    return null;
  }
}
