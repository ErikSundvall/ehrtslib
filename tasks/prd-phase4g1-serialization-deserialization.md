# Product Requirements Document: Serialization/Deserialization (Phase 4g.1)

## Executive Summary

This PRD defines a comprehensive design for serialization and deserialization of openEHR RM object instances to and from canonical JSON, XML, and YAML formats. The goal is to enable ehrtslib users to:
1. Convert RM object trees to standardized exchange formats
2. Parse external openEHR data into ehrtslib objects
3. Support interoperability with other openEHR implementations
4. Provide configurable behavior for different use cases

**Scope:** This is Phase 4g.1 - research, design, and documentation. Implementation will occur in a future phase.

## Context from ROADMAP.md

> Serialisation and deserialisation of RM object instance trees to and from openEHRs canonical JSON and XML formats (in separate classes so that you only import the ones you need, since often a project using the library will need either XML or JSON).

Key requirements from ROADMAP:
- Separate modules for JSON, XML, and YAML serialization
- Optional dependencies (import only what you need)
- Configurable `_type` field inclusion/inference
- Support for canonical JSON and XML formats
- YAML format with configurable flow/block styles
- Align with openEHR specifications

## Research Findings

### 1. openEHR Canonical JSON Format

Based on research of openEHR/specifications-ITS-JSON and openEHR/archie:

#### Key Characteristics:
- JSON Schema Draft-07 compliant
- Uses `_type` field as discriminator for polymorphism
- `_type` field is **required** for runtime type identification
- Schema uses `if...then` constructs for type-based validation
- Two schema formats available:
  - All-in-One: Single file per RM version (e.g., `openehr_rm_1.1.0_all.json`)
  - Split Format: `main.json` + individual type files (e.g., `COMPOSITION.json`)

#### `_type` Field Handling:
- **Serialization**: Include `_type` for all polymorphic types
- **Optional omission**: Can omit when type is unambiguous from context
- **Deserialization**: Must handle presence or absence gracefully
- **Value format**: Uppercase class name (e.g., "COMPOSITION", "DV_TEXT", "CODE_PHRASE")

#### Example JSON Structure:
```json
{
  "_type": "COMPOSITION",
  "archetype_node_id": "openEHR-EHR-COMPOSITION.encounter.v1",
  "name": {
    "_type": "DV_TEXT",
    "value": "Blood Pressure Recording"
  },
  "language": {
    "_type": "CODE_PHRASE",
    "terminology_id": {
      "_type": "TERMINOLOGY_ID",
      "value": "ISO_639-1"
    },
    "code_string": "en"
  },
  "category": {
    "_type": "DV_CODED_TEXT",
    "value": "event",
    "defining_code": {
      "_type": "CODE_PHRASE",
      "terminology_id": {
        "_type": "TERMINOLOGY_ID",
        "value": "openehr"
      },
      "code_string": "433"
    }
  }
}
```

### 2. Archie's Implementation (Java Reference)

#### JSON Serialization (Jackson-based):
- Uses Jackson `ObjectMapper` with custom configuration
- `JacksonUtil` provides pre-configured mappers
- `ArchieJacksonConfiguration` controls behavior:
  - `typePropertyName`: Name of type discriminator (default: `_type`)
  - `alwaysIncludeTypeProperty`: Include `_type` always or only when needed
  - `serializeEmptyCollections`: Include empty arrays/objects
  - `failOnUnknownProperties`: Strict vs. lenient parsing
- `OpenEHRTypeNaming` strategy determines `_type` values
- `DeserializationProblemHandler` handles missing/unexpected `_type` fields

#### XML Serialization (JAXB-based):
- Uses Java Architecture for XML Binding (JAXB)
- `JAXBUtil` provides configured `JAXBContext`
- RM classes annotated with:
  - `@XmlAccessorType`: How properties are accessed
  - `@XmlType`: XML type definition
  - `@XmlElement`: Element mapping
  - `@XmlRootElement`: Root element definition
- `Marshaller` for serialization, `Unmarshaller` for deserialization
- Supports XPath querying via XML-DOM conversion

### 3. TypeScript Serialization Libraries

Research indicates several options:

#### Option A: class-transformer
- **Pros**: Decorator-based, type-aware, active development
- **Cons**: Requires decorators on all classes, not JSON-Schema compliant
- **URL**: https://github.com/typestack/class-transformer
- **Best for**: TypeScript-native projects with full control over class definitions

#### Option B: typescript-json-serializer
- **Pros**: Decorator-based, JSON-Schema support, type validation
- **Cons**: Less popular, may require extensive class modification
- **URL**: https://github.com/GillianPerard/typescript-json-serializer
- **Best for**: When JSON-Schema validation is critical

#### Option C: Custom Implementation
- **Pros**: Full control, no dependencies, tailored to openEHR
- **Cons**: More development effort, need to maintain
- **Best for**: Lightweight builds, maximum compatibility

#### Option D: Hybrid Approach
- **Pros**: Use native JSON.parse/JSON.stringify with custom logic
- **Cons**: Need manual type reconstruction
- **Best for**: Balancing simplicity and control

### 4. XML Serialization for TypeScript

#### Option A: fast-xml-parser
- **Pros**: Fast, lightweight, supports attributes and CDATA
- **Cons**: Need to map object structure to XML schema
- **URL**: https://github.com/NaturalIntelligence/fast-xml-parser
- **Best for**: Performance-critical applications

#### Option B: xml2js / node-xml2js
- **Pros**: Popular, well-maintained, bidirectional conversion
- **Cons**: Older API, XML structure can be verbose
- **URL**: https://github.com/Leonidas-from-XIV/node-xml2js
- **Best for**: Traditional XML workflows

#### Option C: xmlbuilder2
- **Pros**: Modern API, fluent interface, full XML features
- **Cons**: Larger dependency, may be overkill for simple needs
- **URL**: https://github.com/oozcitak/xmlbuilder2
- **Best for**: Complex XML generation

### 5. YAML Serialization

#### Option A: js-yaml
- **Pros**: Mature, widely used, supports flow/block styles
- **Cons**: Limited customization of style mixing
- **URL**: https://github.com/nodeca/js-yaml
- **Best for**: Standard YAML serialization

#### Option B: yaml (by eemeli)
- **Pros**: Modern API, better style control, maintains formatting
- **Cons**: Newer, less ecosystem adoption
- **URL**: https://github.com/eemeli/yaml
- **Best for**: Fine-grained YAML formatting control

## Design Recommendations

### Architecture: Modular Serializers

Create separate, importable modules for each format:

```
enhanced/
  serialization/
    json/
      json_serializer.ts       - JSON serialization
      json_deserializer.ts     - JSON deserialization
      json_config.ts           - Configuration types
    xml/
      xml_serializer.ts        - XML serialization
      xml_deserializer.ts      - XML deserialization
      xml_config.ts            - Configuration types
    yaml/
      yaml_serializer.ts       - YAML serialization
      yaml_deserializer.ts     - YAML deserialization
      yaml_config.ts           - Configuration types
    common/
      serialization_base.ts    - Shared interfaces and utilities
      type_registry.ts         - Type name mapping
      type_inference.ts        - Shared type inference logic for JSON/YAML
      terse_format.ts          - Shared terse format handlers for CODE_PHRASE/DV_CODED_TEXT
```

### Recommended Implementation Approach

**For JSON:** Custom implementation with optional class-transformer support
- Leverage JavaScript's native JSON capabilities
- Add custom reviver/replacer functions for type handling
- Implement type registry for polymorphic reconstruction
- Implement shared type inference logic (see below)
- **Rationale**: Minimal dependencies, maximum control, aligns with openEHR spec

**For XML:** Use fast-xml-parser
- Lightweight and performant
- Sufficient features for openEHR XML
- **Rationale**: Good balance of features and simplicity

**For YAML:** Use yaml by eemeli
- Better style control for hybrid formatting
- Modern API aligns with project style
- Share type inference logic with JSON (see below)
- **Rationale**: Best fit for zipehr-style mixed formatting

### Shared Type Inference Mechanism

To reduce code maintenance and ensure consistency, JSON and YAML serializers should share a common type inference mechanism:

```typescript
// In common/type_inference.ts
export class TypeInferenceEngine {
  /**
   * Determine if _type can be omitted for a property
   * @param propertyName - Name of the property (e.g., "name", "language")
   * @param parentType - Type of the parent object (e.g., "COMPOSITION")
   * @param value - The value being serialized
   * @returns true if _type can be safely omitted
   */
  static canOmitType(
    propertyName: string,
    parentType: string,
    value: any
  ): boolean {
    // Check if property has unambiguous type based on RM specification
    const propertyType = this.getPropertyType(parentType, propertyName);
    if (!propertyType) return false;
    
    // If property type is concrete (not polymorphic), can omit
    if (!this.isPolymorphic(propertyType)) return true;
    
    // If value matches the most common/default type for this property, can omit
    const valueType = this.getTypeName(value);
    return valueType === this.getDefaultTypeForProperty(parentType, propertyName);
  }
  
  /**
   * Infer type from context during deserialization
   * @param propertyName - Name of the property
   * @param parentType - Type of the parent object
   * @param data - The data being deserialized
   * @returns inferred type name
   */
  static inferType(
    propertyName: string,
    parentType: string,
    data: any
  ): string | undefined {
    // Use RM specification to determine expected type
    const propertyType = this.getPropertyType(parentType, propertyName);
    
    // If property is not polymorphic, return the concrete type
    if (propertyType && !this.isPolymorphic(propertyType)) {
      return propertyType;
    }
    
    // For polymorphic properties, try to infer from data structure
    return this.inferFromStructure(data, propertyType);
  }
}
```

**Benefits of Shared Type Inference**:
- Single source of truth for type inference rules
- Consistent behavior between JSON and YAML formats
- Easier maintenance and testing
- Can be extended for future formats

**Terse Format Support**:

In addition to type inference, both JSON and YAML serializers support an optional terse format mode for CODE_PHRASE and DV_CODED_TEXT. This mode serializes these types as compact strings:

- CODE_PHRASE: `"terminology::code"` (e.g., `"ISO_639-1::en"`)
- DV_CODED_TEXT: `"terminology::code|value|"` (e.g., `"openehr::433|event|"`)

The terse format provides significant size reduction and improved readability, especially in YAML where there is no official openEHR standard. For JSON, it should be noted that using terse format breaks the canonical standard and should only be used in controlled environments.

```typescript
// In common/terse_format.ts (shared between JSON and YAML)
export class TerseFormatHandler {
  /**
   * Serialize CODE_PHRASE to terse format
   * @returns string like "ISO_639-1::en"
   */
  static serializeCodePhrase(obj: CODE_PHRASE): string {
    const termId = obj.terminology_id?.value || '';
    const code = obj.code_string || '';
    return `${termId}::${code}`;
  }
  
  /**
   * Serialize DV_CODED_TEXT to terse format
   * @returns string like "openehr::433|event|"
   */
  static serializeDvCodedText(obj: DV_CODED_TEXT): string {
    const code = this.serializeCodePhrase(obj.defining_code);
    const value = obj.value || '';
    return `${code}|${value}|`;
  }
  
  /**
   * Parse terse CODE_PHRASE format
   */
  static parseCodePhrase(str: string): CODE_PHRASE | null {
    const match = str.match(/^([^:]+)::(.+)$/);
    if (!match) return null;
    // Create CODE_PHRASE object with parsed values
  }
  
  /**
   * Parse terse DV_CODED_TEXT format
   */
  static parseDvCodedText(str: string): DV_CODED_TEXT | null {
    const match = str.match(/^([^:]+)::([^|]+)\|([^|]*)\|$/);
    if (!match) return null;
    // Create DV_CODED_TEXT object with parsed values
  }
}
```

**Usage in Serializers**:
```typescript
// In JSON serializer
if (config.useTypeInference && TypeInferenceEngine.canOmitType(propName, parentType, value)) {
  // Omit _type field
} else {
  obj._type = getTypeName(value);
}

// In YAML serializer (same logic)
if (config.useTypeInference && TypeInferenceEngine.canOmitType(propName, parentType, value)) {
  // Omit _type field
} else {
  obj._type = getTypeName(value);
}
```

## Detailed Design

### 1. JSON Serialization

#### Configuration Options

```typescript
export interface JsonSerializationConfig {
  /**
   * Name of the type discriminator property
   * @default "_type"
   */
  typePropertyName?: string;
  
  /**
   * Always include type property, even when type is unambiguous
   * @default false
   */
  alwaysIncludeType?: boolean;
  
  /**
   * Include properties with null values
   * @default false
   */
  includeNullValues?: boolean;
  
  /**
   * Include empty arrays and objects
   * @default true
   */
  includeEmptyCollections?: boolean;
  
  /**
   * Prettify output JSON
   * @default false
   */
  prettyPrint?: boolean;
  
  /**
   * Indentation spaces when prettifying
   * @default 2
   */
  indent?: number;
  
  /**
   * Use terse format for CODE_PHRASE and DV_CODED_TEXT
   * When true, serializes these as compact strings like "ISO_639-1::en" and "openehr::433|event|"
   * WARNING: This breaks the openEHR canonical JSON standard and should only be used
   * for internal applications or when interoperating with systems that support this format.
   * @default false
   */
  useTerseFormat?: boolean;
}

export interface JsonDeserializationConfig {
  /**
   * Name of the type discriminator property
   * @default "_type"
   */
  typePropertyName?: string;
  
  /**
   * Fail on unknown properties
   * @default false
   */
  strict?: boolean;
  
  /**
   * Allow missing required properties (create with defaults)
   * @default false
   */
  allowIncomplete?: boolean;
  
  /**
   * Parse terse format for CODE_PHRASE and DV_CODED_TEXT
   * When true, recognizes compact string formats like "ISO_639-1::en" and "openehr::433|event|"
   * and converts them to proper objects during deserialization.
   * @default false
   */
  parseTerseFormat?: boolean;
}
```

#### Serializer Interface

```typescript
export class JsonSerializer {
  constructor(config?: JsonSerializationConfig);
  
  /**
   * Serialize an RM object to JSON string
   */
  serialize(obj: any): string;
  
  /**
   * Serialize an RM object to JSON object
   */
  toJsonObject(obj: any): Record<string, any>;
  
  /**
   * Serialize with custom configuration (one-time use)
   */
  serializeWith(obj: any, config: JsonSerializationConfig): string;
}

export class JsonDeserializer {
  constructor(config?: JsonDeserializationConfig);
  
  /**
   * Deserialize JSON string to RM object
   * Type is inferred from _type field
   */
  deserialize<T = any>(json: string): T;
  
  /**
   * Deserialize JSON object to RM object
   */
  fromJsonObject<T = any>(obj: Record<string, any>): T;
  
  /**
   * Deserialize with explicit type (when _type is missing)
   */
  deserializeAs<T>(json: string, type: new () => T): T;
}
```

#### Type Registry

```typescript
export class TypeRegistry {
  /**
   * Register a class with its openEHR type name
   */
  static register(typeName: string, constructor: new () => any): void;
  
  /**
   * Get constructor for a type name
   */
  static getConstructor(typeName: string): (new () => any) | undefined;
  
  /**
   * Get type name for a constructor
   */
  static getTypeName(constructor: new () => any): string | undefined;
  
  /**
   * Check if a type is registered
   */
  static hasType(typeName: string): boolean;
}
```

#### Example Usage

```typescript
import { JsonSerializer, JsonDeserializer } from "./enhanced/serialization/json/mod.ts";
import * as openehr_rm from "./openehr_rm.ts";

// Serialization
const composition = new openehr_rm.COMPOSITION({
  name: "Test Composition",
  language: "ISO_639-1::en"
});

const serializer = new JsonSerializer({
  alwaysIncludeType: true,
  prettyPrint: true
});

const json = serializer.serialize(composition);
console.log(json);

// Deserialization
const deserializer = new JsonDeserializer();
const restored = deserializer.deserialize<openehr_rm.COMPOSITION>(json);
console.log(restored.name?.value); // "Test Composition"

// Using terse format (WARNING: breaks canonical JSON standard)
const terseSerializer = new JsonSerializer({
  useTerseFormat: true,
  prettyPrint: true
});
const terseJson = terseSerializer.serialize(composition);
// Output includes compact strings like:
// "language": "ISO_639-1::en"
// "category": "openehr::433|event|"
// instead of full object structures

// Deserializing terse format
const terseDeserializer = new JsonDeserializer({
  parseTerseFormat: true
});
const restoredFromTerse = terseDeserializer.deserialize<openehr_rm.COMPOSITION>(terseJson);
```

### 2. XML Serialization

#### Configuration Options

```typescript
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
   * Indentation string
   * @default "  " (2 spaces)
   */
  indent?: string;
}

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
   * Ignore attributes
   * @default false
   */
  ignoreAttributes?: boolean;
}
```

#### Serializer Interface

```typescript
export class XmlSerializer {
  constructor(config?: XmlSerializationConfig);
  
  /**
   * Serialize an RM object to XML string
   */
  serialize(obj: any): string;
  
  /**
   * Serialize with custom configuration
   */
  serializeWith(obj: any, config: XmlSerializationConfig): string;
}

export class XmlDeserializer {
  constructor(config?: XmlDeserializationConfig);
  
  /**
   * Deserialize XML string to RM object
   */
  deserialize<T = any>(xml: string): T;
  
  /**
   * Deserialize with explicit type
   */
  deserializeAs<T>(xml: string, type: new () => T): T;
}
```

#### Example Usage

```typescript
import { XmlSerializer, XmlDeserializer } from "./enhanced/serialization/xml/mod.ts";
import * as openehr_rm from "./openehr_rm.ts";

const composition = new openehr_rm.COMPOSITION({
  name: "Test Composition"
});

const serializer = new XmlSerializer({
  prettyPrint: true,
  useNamespaces: true
});

const xml = serializer.serialize(composition);
console.log(xml);
// <?xml version="1.0" encoding="UTF-8"?>
// <composition xmlns="http://schemas.openehr.org/v1">
//   <name>
//     <value>Test Composition</value>
//   </name>
// </composition>

const deserializer = new XmlDeserializer();
const restored = deserializer.deserialize<openehr_rm.COMPOSITION>(xml);
```

### 3. YAML Serialization

#### Configuration Options

```typescript
export interface YamlSerializationConfig {
  /**
   * Include _type field
   * @default true
   */
  includeType?: boolean;
  
  /**
   * Use type inference to omit _type where unambiguous (compact mode)
   * When true, _type is omitted for properties where type can be inferred from context
   * @default false
   */
  useTypeInference?: boolean;
  
  /**
   * Use flow style for values (inline)
   * @default false
   */
  flowStyleValues?: boolean;
  
  /**
   * Use block style for objects (multi-line)
   * @default true
   */
  blockStyleObjects?: boolean;
  
  /**
   * Use hybrid style (zipehr-style: siblings on separate lines, values inline)
   * @default false
   */
  hybridStyle?: boolean;
  
  /**
   * Indentation spaces
   * @default 2
   */
  indent?: number;
  
  /**
   * Line width for flow style wrapping
   * @default 80
   */
  lineWidth?: number;
  
  /**
   * Use terse format for CODE_PHRASE and DV_CODED_TEXT
   * When true, serializes these as compact strings like "ISO_639-1::en" and "openehr::433|event|"
   * Since there is no standard openEHR YAML format, this is a recommended compact representation
   * that maintains readability while reducing verbosity.
   * @default false
   */
  useTerseFormat?: boolean;
}

export interface YamlDeserializationConfig {
  /**
   * Strict parsing
   * @default true
   */
  strict?: boolean;
  
  /**
   * Allow duplicate keys
   * @default false
   */
  allowDuplicateKeys?: boolean;
  
  /**
   * Parse terse format for CODE_PHRASE and DV_CODED_TEXT
   * When true, recognizes compact string formats like "ISO_639-1::en" and "openehr::433|event|"
   * and converts them to proper objects during deserialization.
   * @default false
   */
  parseTerseFormat?: boolean;
}
```

#### Serializer Interface

```typescript
export class YamlSerializer {
  constructor(config?: YamlSerializationConfig);
  
  /**
   * Serialize an RM object to YAML string
   */
  serialize(obj: any): string;
  
  /**
   * Serialize with custom configuration
   */
  serializeWith(obj: any, config: YamlSerializationConfig): string;
}

export class YamlDeserializer {
  constructor(config?: YamlDeserializationConfig);
  
  /**
   * Deserialize YAML string to RM object
   */
  deserialize<T = any>(yaml: string): T;
  
  /**
   * Deserialize with explicit type
   */
  deserializeAs<T>(yaml: string, type: new () => T): T;
}
```

#### Example Usage

```typescript
import { YamlSerializer, YamlDeserializer } from "./enhanced/serialization/yaml/mod.ts";
import * as openehr_rm from "./openehr_rm.ts";

const composition = new openehr_rm.COMPOSITION({
  name: "Test Composition",
  language: "ISO_639-1::en"
});

// Standard block style
const serializer1 = new YamlSerializer({
  blockStyleObjects: true
});
console.log(serializer1.serialize(composition));
// _type: COMPOSITION
// name:
//   _type: DV_TEXT
//   value: Test Composition
// language:
//   _type: CODE_PHRASE
//   code_string: en
//   terminology_id:
//     _type: TERMINOLOGY_ID
//     value: ISO_639-1

// Hybrid style (zipehr-like)
const serializer2 = new YamlSerializer({
  hybridStyle: true
});
console.log(serializer2.serialize(composition));
// _type: COMPOSITION
// name: {_type: DV_TEXT, value: Test Composition}
// language:
//   _type: CODE_PHRASE
//   code_string: en
//   terminology_id: {_type: TERMINOLOGY_ID, value: ISO_639-1}

// Compact style with type inference
const serializer3 = new YamlSerializer({
  useTypeInference: true,
  hybridStyle: true
});
console.log(serializer3.serialize(composition));
// archetype_node_id: openEHR-EHR-COMPOSITION.encounter.v1
// name: Test Composition
// language:
//   code_string: en
//   terminology_id: ISO_639-1

// Using terse format for maximum compactness
const terseSerializer = new YamlSerializer({
  useTerseFormat: true,
  hybridStyle: true
});
console.log(terseSerializer.serialize(composition));
// archetype_node_id: openEHR-EHR-COMPOSITION.encounter.v1
// name: Test Composition
// language: "ISO_639-1::en"
// category: "openehr::433|event|"
// (CODE_PHRASE and DV_CODED_TEXT rendered as compact strings)

const deserializer = new YamlDeserializer();
const restored = deserializer.deserialize<openehr_rm.COMPOSITION>(yaml);

// Deserializing terse format
const terseDeserializer = new YamlDeserializer({
  parseTerseFormat: true
});
const restoredFromTerse = terseDeserializer.deserialize<openehr_rm.COMPOSITION>(terseYaml);
```

## Implementation Strategy

### Phase 1: Core JSON Support
1. Implement TypeRegistry with auto-registration
2. Implement JsonSerializer with basic serialization
3. Implement JsonDeserializer with type reconstruction
4. Add configuration support
5. Write comprehensive tests with openEHR examples

### Phase 2: XML Support
1. Integrate fast-xml-parser
2. Map openEHR RM structure to XML schema
3. Implement XmlSerializer
4. Implement XmlDeserializer
5. Test with canonical XML examples

### Phase 3: YAML Support
1. Integrate yaml library
2. Implement YamlSerializer with style options
3. Implement YamlDeserializer
4. Test hybrid style formatting
5. Test with zipehr examples

### Phase 4: Advanced Features
1. Add JSON-Schema validation support
2. Implement streaming serialization for large objects
3. Add partial serialization (serialize subtrees)
4. Performance optimization
5. Add format conversion utilities (JSON ↔ XML ↔ YAML)

## Testing Requirements

### Test Data Sources
1. **openEHR/specifications-ITS-JSON** - Official JSON examples
2. **openEHR/archie** - Test data from Archie's test suite
3. **zipehr** - YAML examples with mixed formatting
4. **Manual examples** - Created based on ROADMAP requirements

### Test Coverage
- ✅ Serialize simple objects (DV_TEXT, CODE_PHRASE)
- ✅ Serialize complex objects (COMPOSITION with nested OBSERVATION)
- ✅ Deserialize with _type field present
- ✅ Deserialize with _type field inferred
- ✅ Round-trip (serialize → deserialize → compare)
- ✅ Handle null/undefined/empty values
- ✅ Handle arrays and collections
- ✅ Handle polymorphic types
- ✅ Configuration options
- ✅ Error handling (invalid JSON/XML/YAML)
- ✅ Large object trees (performance)

### Validation Strategy
1. Compare output with official openEHR examples
2. Cross-validate with Archie's output (where possible)
3. JSON-Schema validation against openEHR schemas
4. Round-trip testing (original → serialized → deserialized → compare)
5. Interoperability testing with other openEHR implementations

## Dependencies

### Required for Implementation

#### JSON (Core - No External Dependencies)
- Use native `JSON.parse()` and `JSON.stringify()`
- Custom replacer/reviver functions
- **Rationale**: Minimal dependencies, maximum compatibility

#### XML
- **fast-xml-parser** v4.x
- **Rationale**: Lightweight, performant, sufficient features
- **License**: MIT
- **Bundle size**: ~50KB minified

#### YAML
- **yaml** v2.x (by eemeli)
- **Rationale**: Better style control, modern API
- **License**: ISC
- **Bundle size**: ~80KB minified

### Optional (For Advanced Features)

#### JSON Schema Validation
- **ajv** v8.x
- **Rationale**: Fast, standard-compliant JSON Schema validator
- **License**: MIT
- **Usage**: Optional, only when validation is explicitly requested

#### class-transformer (Optional Enhancement)
- **class-transformer** v0.5.x
- **Rationale**: For users who want decorator-based serialization
- **License**: MIT
- **Usage**: Optional alternative API

## Performance Considerations

### Optimization Strategies
1. **Lazy Type Registration**: Register types on-demand
2. **Object Pooling**: Reuse parser instances
3. **Streaming**: For large object trees
4. **Memoization**: Cache type mappings
5. **Worker Threads**: For async serialization of large trees

### Benchmarking
- Test with COMPOSITION trees of varying depths
- Measure serialization/deserialization time
- Monitor memory usage
- Compare with other implementations (where possible)

## Error Handling

### Error Types
```typescript
export class SerializationError extends Error {
  constructor(
    message: string,
    public readonly object: any,
    public readonly cause?: Error
  ) {
    super(message);
  }
}

export class DeserializationError extends Error {
  constructor(
    message: string,
    public readonly data: string,
    public readonly cause?: Error
  ) {
    super(message);
  }
}

export class TypeNotFoundError extends DeserializationError {
  constructor(typeName: string, data: string) {
    super(`Type not found: ${typeName}`, data);
  }
}
```

### Error Recovery
- Provide detailed error messages with context
- Allow partial deserialization (skip invalid nodes)
- Support validation mode (check without throwing)

## Documentation Requirements

### User Documentation
1. **Serialization Guide** - Comprehensive guide with examples
2. **API Reference** - Full API documentation
3. **Migration Guide** - For users coming from other implementations
4. **Configuration Reference** - All options explained
5. **Examples** - Common use cases demonstrated

### Developer Documentation
1. **Architecture Overview** - Design decisions explained
2. **Type Registry** - How type mapping works
3. **Extension Guide** - Adding custom serializers
4. **Performance Guide** - Optimization tips

## Future Enhancements (Post-Implementation)

### Potential Features
1. **Streaming API** - For very large objects
2. **Incremental Serialization** - Serialize as objects are built
3. **Format Conversion** - Direct JSON ↔ XML ↔ YAML conversion
4. **Schema Generation** - Generate JSON Schema from RM objects
5. **Canonical Form Comparison** - Deep equality checking
6. **Compression** - Compressed serialization formats
7. **Binary Formats** - CBOR, MessagePack support

## Success Criteria

A successful implementation will:
1. ✅ Serialize all openEHR RM objects to canonical JSON
2. ✅ Deserialize canonical JSON to ehrtslib objects
3. ✅ Support XML serialization/deserialization
4. ✅ Support YAML with configurable styles
5. ✅ Pass round-trip tests (original → serialized → deserialized)
6. ✅ Validate against openEHR JSON schemas
7. ✅ Match Archie's output (where applicable)
8. ✅ Maintain backward compatibility
9. ✅ Provide clear error messages
10. ✅ Include comprehensive documentation
11. ✅ Have modular, tree-shakeable exports
12. ✅ Achieve acceptable performance (<100ms for typical COMPOSITION)

## References

### openEHR Specifications
- **ITS-JSON**: https://github.com/openEHR/specifications-ITS-JSON
- **ITS-XML**: https://specifications.openehr.org/releases/ITS-XML/
- **Simplified Formats**: https://openehr.atlassian.net/wiki/spaces/spec/pages/624361477/

### Reference Implementations
- **Archie (Java)**: https://github.com/openEHR/archie
- **zipehr (JS)**: https://github.com/ErikSundvall/zipehr
- **code-generator (PHP)**: https://github.com/sebastian-iancu/code-generator

### Libraries
- **fast-xml-parser**: https://github.com/NaturalIntelligence/fast-xml-parser
- **yaml**: https://github.com/eemeli/yaml
- **ajv**: https://github.com/ajv-validator/ajv
- **class-transformer**: https://github.com/typestack/class-transformer

### Related Documentation
- **SIMPLIFIED-CREATION-GUIDE.md** - Constructor initialization patterns
- **DUAL-APPROACH-GUIDE.md** - Getter/setter pattern
- **ROADMAP.md** - Project phases

## Appendix: Example Outputs

### JSON (Canonical)
```json
{
  "_type": "COMPOSITION",
  "archetype_node_id": "openEHR-EHR-COMPOSITION.encounter.v1",
  "name": {
    "_type": "DV_TEXT",
    "value": "Blood Pressure Recording"
  },
  "language": {
    "_type": "CODE_PHRASE",
    "terminology_id": {
      "_type": "TERMINOLOGY_ID",
      "value": "ISO_639-1"
    },
    "code_string": "en"
  },
  "territory": {
    "_type": "CODE_PHRASE",
    "terminology_id": {
      "_type": "TERMINOLOGY_ID",
      "value": "ISO_3166-1"
    },
    "code_string": "GB"
  },
  "category": {
    "_type": "DV_CODED_TEXT",
    "value": "event",
    "defining_code": {
      "_type": "CODE_PHRASE",
      "terminology_id": {
        "_type": "TERMINOLOGY_ID",
        "value": "openehr"
      },
      "code_string": "433"
    }
  },
  "composer": {
    "_type": "PARTY_IDENTIFIED",
    "name": "Dr. Smith"
  }
}
```

### JSON (Type Inference Enabled - More Compact)
```json
{
  "_type": "COMPOSITION",
  "archetype_node_id": "openEHR-EHR-COMPOSITION.encounter.v1",
  "name": {
    "value": "Blood Pressure Recording"
  },
  "language": {
    "terminology_id": {
      "value": "ISO_639-1"
    },
    "code_string": "en"
  },
  "territory": {
    "terminology_id": {
      "value": "ISO_3166-1"
    },
    "code_string": "GB"
  },
  "category": {
    "value": "event",
    "defining_code": {
      "terminology_id": {
        "value": "openehr"
      },
      "code_string": "433"
    }
  },
  "composer": {
    "name": "Dr. Smith"
  }
}
```

### XML (Canonical)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<composition xmlns="http://schemas.openehr.org/v1" 
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             archetype_node_id="openEHR-EHR-COMPOSITION.encounter.v1">
  <name xsi:type="DV_TEXT">
    <value>Blood Pressure Recording</value>
  </name>
  <language>
    <terminology_id>
      <value>ISO_639-1</value>
    </terminology_id>
    <code_string>en</code_string>
  </language>
  <territory>
    <terminology_id>
      <value>ISO_3166-1</value>
    </terminology_id>
    <code_string>GB</code_string>
  </territory>
  <category xsi:type="DV_CODED_TEXT">
    <value>event</value>
    <defining_code>
      <terminology_id>
        <value>openehr</value>
      </terminology_id>
      <code_string>433</code_string>
    </defining_code>
  </category>
  <composer xsi:type="PARTY_IDENTIFIED">
    <name>Dr. Smith</name>
  </composer>
</composition>
```

### YAML (Block Style)
```yaml
_type: COMPOSITION
archetype_node_id: openEHR-EHR-COMPOSITION.encounter.v1
name:
  _type: DV_TEXT
  value: Blood Pressure Recording
language:
  _type: CODE_PHRASE
  terminology_id:
    _type: TERMINOLOGY_ID
    value: ISO_639-1
  code_string: en
territory:
  _type: CODE_PHRASE
  terminology_id:
    _type: TERMINOLOGY_ID
    value: ISO_3166-1
  code_string: GB
category:
  _type: DV_CODED_TEXT
  value: event
  defining_code:
    _type: CODE_PHRASE
    terminology_id:
      _type: TERMINOLOGY_ID
      value: openehr
    code_string: "433"
composer:
  _type: PARTY_IDENTIFIED
  name: Dr. Smith
```

### YAML (Hybrid Style - zipehr-like)
```yaml
_type: COMPOSITION
archetype_node_id: openEHR-EHR-COMPOSITION.encounter.v1
name: {_type: DV_TEXT, value: Blood Pressure Recording}
language:
  _type: CODE_PHRASE
  code_string: en
  terminology_id: {_type: TERMINOLOGY_ID, value: ISO_639-1}
territory:
  _type: CODE_PHRASE
  code_string: GB
  terminology_id: {_type: TERMINOLOGY_ID, value: ISO_3166-1}
category:
  _type: DV_CODED_TEXT
  value: event
  defining_code:
    _type: CODE_PHRASE
    code_string: "433"
    terminology_id: {_type: TERMINOLOGY_ID, value: openehr}
composer: {_type: PARTY_IDENTIFIED, name: Dr. Smith}
```

### YAML (Compact with Type Inference)
```yaml
archetype_node_id: openEHR-EHR-COMPOSITION.encounter.v1
name: Blood Pressure Recording
language:
  code_string: en
  terminology_id: ISO_639-1
territory:
  code_string: GB
  terminology_id: ISO_3166-1
category:
  value: event
  defining_code:
    code_string: "433"
    terminology_id: openehr
composer:
  name: Dr. Smith
```

**Note**: The compact variant omits `_type` fields where the type can be inferred from the property context (similar to the compact JSON format). This provides maximum readability while maintaining semantic correctness.

### YAML (Compact with Terse Format)
```yaml
archetype_node_id: openEHR-EHR-COMPOSITION.encounter.v1
name: Blood Pressure Recording
language: "ISO_639-1::en"
territory: "ISO_3166-1::GB"
category: "openehr::433|event|"
composer:
  name: Dr. Smith
```

**Note**: The terse format option renders CODE_PHRASE and DV_CODED_TEXT as compact strings (e.g., `"ISO_639-1::en"`, `"openehr::433|event|"`). Since there is no official openEHR YAML standard, this approach maximizes compactness and readability for YAML use cases while maintaining full semantic information.

### JSON (With Terse Format - Non-Standard)
```json
{
  "_type": "COMPOSITION",
  "archetype_node_id": "openEHR-EHR-COMPOSITION.encounter.v1",
  "name": {
    "_type": "DV_TEXT",
    "value": "Blood Pressure Recording"
  },
  "language": "ISO_639-1::en",
  "territory": "ISO_3166-1::GB",
  "category": "openehr::433|event|",
  "composer": {
    "_type": "PARTY_IDENTIFIED",
    "name": "Dr. Smith"
  }
}
```

**WARNING**: Using terse format in JSON breaks the openEHR canonical JSON standard. This should only be used for internal applications or when interoperating with systems that explicitly support this compact format. For standards-compliant JSON, use the canonical format without the `useTerseFormat` option.

## Summary

This PRD provides a comprehensive design for serialization/deserialization of openEHR RM objects in ehrtslib. The design:

- ✅ Separates JSON, XML, and YAML into independent modules
- ✅ Provides configurable behavior for different use cases
- ✅ Aligns with openEHR canonical formats and specifications
- ✅ Leverages existing TypeScript libraries appropriately
- ✅ Maintains minimal dependencies for core functionality
- ✅ Supports both strict and lenient parsing modes
- ✅ Enables interoperability with other openEHR implementations
- ✅ Provides clear migration path from manual serialization

The implementation will be modular, performant, and well-documented, enabling ehrtslib users to easily exchange data with other openEHR systems and tools.
