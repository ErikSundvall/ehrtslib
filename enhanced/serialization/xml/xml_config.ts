/**
 * Configuration options for XML serialization
 */
export interface XmlSerializationConfig {
  /**
   * Root element name (defaults to type name)
   */
  rootElement?: string;
  
  /**
   * Include XML declaration
   * @default true
   */
  includeDeclaration?: boolean;
  
  /**
   * XML version
   * @default "1.0"
   */
  version?: string;
  
  /**
   * Character encoding
   * @default "UTF-8"
   */
  encoding?: string;
  
  /**
   * Use XML namespaces
   * @default true
   */
  useNamespaces?: boolean;
  
  /**
   * openEHR XML namespace
   * @default "http://schemas.openehr.org/v1"
   */
  namespace?: string;
  
  /**
   * Prettify output XML
   * @default false
   */
  prettyPrint?: boolean;
  
  /**
   * Indentation string (when prettyPrint is true)
   * @default "  " (2 spaces)
   */
  indent?: string;
}

/**
 * Configuration options for XML deserialization
 */
export interface XmlDeserializationConfig {
  /**
   * Strict parsing (fail on invalid XML)
   * @default true
   */
  strict?: boolean;
  
  /**
   * Preserve attribute order
   * @default false
   */
  preserveOrder?: boolean;
  
  /**
   * Ignore attributes (don't parse them)
   * @default false
   */
  ignoreAttributes?: boolean;
}

/**
 * Default XML serialization configuration
 */
export const DEFAULT_XML_SERIALIZATION_CONFIG: Required<XmlSerializationConfig> = {
  rootElement: '',
  includeDeclaration: true,
  version: '1.0',
  encoding: 'UTF-8',
  useNamespaces: true,
  namespace: 'http://schemas.openehr.org/v1',
  prettyPrint: false,
  indent: '  '
};

/**
 * Default XML deserialization configuration
 */
export const DEFAULT_XML_DESERIALIZATION_CONFIG: Required<XmlDeserializationConfig> = {
  strict: true,
  preserveOrder: false,
  ignoreAttributes: false
};
