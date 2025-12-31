import { XMLBuilder } from "fast-xml-parser";
import { TypeRegistry } from "../common/type_registry.ts";
import { SerializationError } from "../common/errors.ts";
import {
  XmlSerializationConfig,
  DEFAULT_XML_SERIALIZATION_CONFIG
} from "./xml_config.ts";

/**
 * XmlSerializer converts openEHR RM objects to XML format
 * following the openEHR ITS-XML specification
 */
export class XmlSerializer {
  private config: Required<XmlSerializationConfig>;
  
  /**
   * Create a new XML serializer
   * @param config - Serialization configuration options
   */
  constructor(config?: XmlSerializationConfig) {
    this.config = {
      ...DEFAULT_XML_SERIALIZATION_CONFIG,
      ...config
    };
  }
  
  /**
   * Serialize an RM object to XML string
   * @param obj - The object to serialize
   * @returns XML string representation
   */
  serialize(obj: any): string {
    return this.serializeWith(obj, this.config);
  }
  
  /**
   * Serialize with custom configuration (one-time use)
   * @param obj - The object to serialize
   * @param config - Custom configuration for this serialization
   * @returns XML string representation
   */
  serializeWith(obj: any, config: XmlSerializationConfig): string {
    const mergedConfig = {
      ...this.config,
      ...config
    };
    
    try {
      // Convert object to XML-friendly structure
      const xmlObj = this.objectToXml(obj, mergedConfig);
      
      // Build XML string
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        format: mergedConfig.prettyPrint,
        indentBy: mergedConfig.indent,
        suppressEmptyNode: true,
        suppressBooleanAttributes: false
      });
      
      let xml = builder.build(xmlObj);
      
      // Add XML declaration if requested
      if (mergedConfig.includeDeclaration) {
        const declaration = `<?xml version="${mergedConfig.version}" encoding="${mergedConfig.encoding}"?>`;
        xml = mergedConfig.prettyPrint 
          ? `${declaration}\n${xml}` 
          : `${declaration}${xml}`;
      }
      
      return xml;
    } catch (error) {
      throw new SerializationError(
        `Failed to serialize object to XML: ${error.message}`,
        obj,
        error
      );
    }
  }
  
  /**
   * Convert an object to XML-friendly structure
   */
  private objectToXml(obj: any, config: Required<XmlSerializationConfig>): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    // Handle primitive types
    if (typeof obj !== 'object') {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.objectToXml(item, config));
    }
    
    // Get type name for this object
    const typeName = TypeRegistry.getTypeNameFromInstance(obj);
    
    // Determine root element name
    const rootElement = config.rootElement || typeName?.toLowerCase() || 'object';
    
    // Build XML object structure
    const xmlObj: any = {};
    const rootContent: any = {};
    
    // Add namespace if requested
    if (config.useNamespaces) {
      rootContent['@_xmlns'] = config.namespace;
      rootContent['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
    }
    
    // Add xsi:type attribute for polymorphic types
    if (typeName) {
      rootContent['@_xsi:type'] = typeName;
    }
    
    // Process all properties
    for (const [key, value] of Object.entries(obj)) {
      // Skip internal properties
      if (key.startsWith('_')) {
        continue;
      }
      
      // Skip null/undefined values
      if (value === null || value === undefined) {
        continue;
      }
      
      // Handle archetype_node_id as attribute
      if (key === 'archetype_node_id') {
        rootContent[`@_${key}`] = value;
        continue;
      }
      
      // Handle nested objects and primitives
      if (typeof value === 'object' && !Array.isArray(value)) {
        rootContent[key] = this.convertNestedObject(value, config);
      } else if (Array.isArray(value)) {
        // For arrays, create multiple elements with the same name
        rootContent[key] = value.map(item => 
          typeof item === 'object' 
            ? this.convertNestedObject(item, config)
            : item
        );
      } else {
        rootContent[key] = value;
      }
    }
    
    xmlObj[rootElement] = rootContent;
    return xmlObj;
  }
  
  /**
   * Convert a nested object to XML structure
   */
  private convertNestedObject(obj: any, config: Required<XmlSerializationConfig>): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertNestedObject(item, config));
    }
    
    const result: any = {};
    
    // Add xsi:type for polymorphic types
    const typeName = TypeRegistry.getTypeNameFromInstance(obj);
    if (typeName) {
      result['@_xsi:type'] = typeName;
    }
    
    // Process properties
    for (const [key, value] of Object.entries(obj)) {
      // Skip internal properties
      if (key.startsWith('_')) {
        continue;
      }
      
      // Skip null/undefined
      if (value === null || value === undefined) {
        continue;
      }
      
      if (typeof value === 'object') {
        result[key] = this.convertNestedObject(value, config);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
}
