import { XMLParser } from "fast-xml-parser";
import { attributesFor } from "../../meta/rm_attributes.ts";
import { TypeRegistry } from "../common/type_registry.ts";
import { DeserializationError, TypeNotFoundError } from "../common/errors.ts";
import {
  DEFAULT_XML_DESERIALIZATION_CONFIG,
  itsXmlTagIsRepeatingList,
  XmlDeserializationConfig,
} from "./xml_config.ts";
import { validateDeserializedInstance } from "../common/post_deserialize_validation.ts";

/**
 * XmlDeserializer converts XML to openEHR RM objects
 * following the openEHR ITS-XML specification
 */
export class XmlDeserializer {
  private config: Required<XmlDeserializationConfig>;
  
  /**
   * Create a new XML deserializer
   * @param config - Deserialization configuration options
   */
  constructor(config?: XmlDeserializationConfig) {
    this.config = {
      ...DEFAULT_XML_DESERIALIZATION_CONFIG,
      ...config
    };
  }
  
  /**
   * Deserialize XML string to RM object
   * Type is inferred from root element or xsi:type attribute
   * @param xml - The XML string to deserialize
   * @returns The deserialized object
   */
  deserialize<T = any>(xml: string): T {
    try {
      // Parse XML to object
      const parser = new XMLParser({
        ignoreAttributes: this.config.ignoreAttributes,
        attributeNamePrefix: "@_",
        parseAttributeValue: false,
        parseTagValue: false,
        trimValues: true,
        isArray: (name, _jpath, _isLeafNode, isAttribute) =>
          !isAttribute && itsXmlTagIsRepeatingList(name),
      });
      
      const parsed = parser.parse(xml);

      const rootKey = Object.keys(parsed).find((k) => !k.startsWith("?")) ??
        Object.keys(parsed)[0];
      const rootData = parsed[rootKey];
      
      const instance = this.reconstructObject(rootData, rootKey) as T;
      return this.maybeValidateAgainstTemplate(instance);
    } catch (error) {
      throw new DeserializationError(
        `Failed to deserialize XML: ${error.message}`,
        xml,
        error
      );
    }
  }
  
  /**
   * Deserialize with explicit type (when type info is missing or ambiguous)
   * @param xml - The XML string to deserialize
   * @param type - The class constructor to use
   * @returns The deserialized object
   */
  deserializeAs<T>(xml: string, type: new () => T): T {
    try {
      const parser = new XMLParser({
        ignoreAttributes: this.config.ignoreAttributes,
        attributeNamePrefix: "@_",
        parseAttributeValue: false,
        parseTagValue: false,
        trimValues: true,
        isArray: (name, _jpath, _isLeafNode, isAttribute) =>
          !isAttribute && itsXmlTagIsRepeatingList(name),
      });
      
      const parsed = parser.parse(xml);
      const rootKey = Object.keys(parsed).find((k) => !k.startsWith("?")) ??
        Object.keys(parsed)[0];
      const rootData = parsed[rootKey];

      // Get type name from constructor
      const typeName = TypeRegistry.getTypeName(type);
      if (!typeName) {
        throw new TypeNotFoundError(type.name, xml);
      }
      
      // Reconstruct with explicit type
      return this.reconstructObject(rootData, rootKey, typeName) as T;
    } catch (error) {
      if (error instanceof DeserializationError) {
        throw error;
      }
      throw new DeserializationError(
        `Failed to deserialize XML as ${type.name}: ${error.message}`,
        xml,
        error
      );
    }
  }
  
  /**
   * Reconstruct an object from parsed XML data
   */
  private reconstructObject(data: any, elementName: string, explicitType?: string): any {
    if (data === null || data === undefined) {
      return null;
    }
    
    // Handle primitive values
    if (typeof data !== 'object') {
      return data;
    }
    
    // Handle arrays (though fast-xml-parser usually handles these)
    if (Array.isArray(data)) {
      return data.map(item => 
        typeof item === 'object' 
          ? this.reconstructObject(item, elementName)
          : item
      );
    }
    
    // Determine type name
    let typeName = explicitType;
    
    // Try to get type from xsi:type attribute
    if (!typeName && data['@_xsi:type']) {
      typeName = data['@_xsi:type'];
    }
    
    // Try to get type from element name (convert to uppercase)
    if (!typeName) {
      typeName = elementName.toUpperCase();
    }
    
    // Get constructor for this type
    const Constructor = TypeRegistry.getConstructor(typeName);
    
    if (!Constructor) {
      if (this.config.strict) {
        throw new TypeNotFoundError(typeName, JSON.stringify(data));
      }
      // In non-strict mode, return plain object
      return this.reconstructPlainObject(data);
    }
    
    if (typeName === "DV_BOOLEAN") {
      const instance = new Constructor();
      const raw = typeof data === "object" && data !== null && !Array.isArray(data)
        ? (data as Record<string, unknown>).value ?? (data as Record<string, unknown>)["#text"]
        : data;
      if (typeof raw === "boolean") instance.value = raw;
      else if (typeof raw === "string") {
        instance.value = raw.trim().toLowerCase() === "true";
      }
      return instance;
    }

    // Create instance
    const instance = new Constructor();
    
    // Populate properties
    for (const [key, value] of Object.entries(data)) {
      // Skip XML attributes that we've already processed
      if (key.startsWith('@_')) {
        // Handle archetype_node_id as a property
        if (key === '@_archetype_node_id') {
          instance.archetype_node_id = value;
        } else if (key === '@_xsi:type') {
          // Already handled
          continue;
        }
        continue;
      }
      
      // Reconstruct nested objects
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          instance[key] = value.map(item =>
            typeof item === 'object' && item !== null
              ? this.reconstructObject(item, key)
              : this.coerceXmlLeaf(typeName, key, item)
          );
        } else {
          const nested = this.reconstructObject(value, key);
          instance[key] = itsXmlTagIsRepeatingList(key) ? [nested] : nested;
        }
      } else {
        instance[key] = this.coerceXmlLeaf(typeName, key, value);
      }
    }
    
    return instance;
  }
  
  /**
   * Reconstruct as plain object (when type is not found and not in strict mode)
   */
  private reconstructPlainObject(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.reconstructPlainObject(item));
    }
    
    const result: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('@_')) {
        // Convert attributes to properties
        const propName = key.substring(2);
        result[propName] = value;
      } else if (typeof value === 'object') {
        const nested = this.reconstructPlainObject(value);
        result[key] = itsXmlTagIsRepeatingList(key)
          ? Array.isArray(nested) ? nested : [nested]
          : nested;
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Coerce an XML text leaf to a JS number or boolean when BMM declares
   * that attribute as Integer/Integer64/Real/Double/Boolean (or a list of
   * those). Invalid text is left as a string so later RM/template
   * validation fails loudly instead of accepting NaN.
   */
  private coerceXmlLeaf(rmType: string, attrName: string, value: unknown): unknown {
    if (typeof value !== "string") return value;
    const declared = declaredPrimitiveBmmType(rmType, attrName);
    if (!declared) return value;
    if (declared === "Boolean") return parseXmlBoolean(value);
    const numeric = parseXmlNumber(value, declared);
    return numeric === undefined ? value : numeric;
  }

  private maybeValidateAgainstTemplate<T>(instance: T): T {
    const template = this.config.validateAgainstTemplate;
    if (!template) return instance;

    const result = validateDeserializedInstance(instance, {
      validateAgainstTemplate: template,
    });
    if (result && !result.valid) {
      const summary = result.errors.map((e) => `${e.path}: ${e.message}`).join(
        "; ",
      );
      throw new DeserializationError(
        `Deserialized instance failed template validation: ${summary}`,
      );
    }
    return instance;
  }
}

const NUMERIC_BMM_TYPES = new Set([
  "Integer",
  "Integer64",
  "Real",
  "Double",
  "Numeric",
  "Ordered_Numeric",
  "Byte",
  "Octet",
]);

const INTEGER_BMM_TYPES = new Set([
  "Integer",
  "Integer64",
  "Byte",
  "Octet",
]);

/** Strip a single generic argument list: `DV_INTERVAL<DV_QUANTITY>` → `DV_INTERVAL`. */
function rmTypeBaseName(typeName: string): string {
  const lt = typeName.indexOf("<");
  return lt > 0 ? typeName.slice(0, lt).trim() : typeName;
}

function unwrapContainerType(typeName: string): string {
  const match = typeName.trim().match(/^(?:List|Array|Set)<\s*(.+)\s*>$/);
  return match ? match[1].trim() : typeName.trim();
}

function declaredPrimitiveBmmType(
  rmType: string,
  attrName: string,
): string | undefined {
  const attrs = attributesFor(rmTypeBaseName(rmType));
  const attr = attrs.find((item) => item.name === attrName);
  if (!attr) return undefined;
  const declared = unwrapContainerType(attr.typeName);
  if (declared === "Boolean" || NUMERIC_BMM_TYPES.has(declared)) return declared;
  return undefined;
}

/** XML decimal / scientific literals only. Rejects NaN, Infinity, and junk. */
function parseXmlNumber(text: string, bmmType: string): number | undefined {
  const trimmed = text.trim();
  if (INTEGER_BMM_TYPES.has(bmmType)) {
    if (!/^[+-]?\d+$/.test(trimmed)) return undefined;
    const value = Number(trimmed);
    return Number.isInteger(value) && Number.isFinite(value) ? value : undefined;
  }
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) {
    return undefined;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

function parseXmlBoolean(text: string): boolean | string {
  const trimmed = text.trim().toLowerCase();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return text;
}
