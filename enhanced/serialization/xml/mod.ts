/**
 * XML Serialization Module for openEHR RM Objects
 * 
 * This module provides XML serialization and deserialization capabilities
 * for openEHR Reference Model (RM) objects, following the openEHR ITS-XML
 * specification.
 * 
 * @module
 * 
 * @example
 * ```typescript
 * import { XmlSerializer, XmlDeserializer } from "./enhanced/serialization/xml/mod.ts";
 * import * as rm from "./enhanced/openehr_rm.ts";
 * 
 * // Create an RM object
 * const dvText = new rm.DV_TEXT();
 * dvText.value = "Hello, openEHR!";
 * 
 * // Serialize to XML
 * const serializer = new XmlSerializer({ prettyPrint: true });
 * const xml = serializer.serialize(dvText);
 * console.log(xml);
 * 
 * // Deserialize from XML
 * const deserializer = new XmlDeserializer();
 * const restored = deserializer.deserialize(xml);
 * console.log(restored.value); // "Hello, openEHR!"
 * ```
 */

// Core serialization/deserialization
export { XmlSerializer } from "./xml_serializer.ts";
export { XmlDeserializer } from "./xml_deserializer.ts";

// Configuration
export type {
  XmlSerializationConfig,
  XmlDeserializationConfig
} from "./xml_config.ts";

export {
  DEFAULT_XML_SERIALIZATION_CONFIG,
  DEFAULT_XML_DESERIALIZATION_CONFIG
} from "./xml_config.ts";

// Common utilities (re-exported from common)
export { TypeRegistry } from "../common/type_registry.ts";
export {
  SerializationError,
  DeserializationError,
  TypeNotFoundError
} from "../common/errors.ts";
