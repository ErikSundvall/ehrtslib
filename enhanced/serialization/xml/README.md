# XML Serialization for openEHR RM Objects

This module provides XML serialization and deserialization capabilities for openEHR Reference Model (RM) objects, following the [openEHR ITS-XML specification](https://specifications.openehr.org/releases/ITS-XML/).

## Features

- ✅ Serialize openEHR RM objects to canonical XML format
- ✅ Deserialize XML back to ehrtslib objects
- ✅ Support for polymorphic types via xsi:type attributes
- ✅ Configurable XML declaration, namespaces, and formatting
- ✅ Pretty-printing support for readable output
- ✅ Round-trip serialization (original → XML → restored)
- ✅ Comprehensive error handling with detailed messages
- ✅ Type registry for automatic type resolution

## Installation

This module is part of ehrtslib and uses `fast-xml-parser` as a dependency. The dependency is automatically included when you use the module.

## Quick Start

```typescript
import { 
  XmlSerializer, 
  XmlDeserializer,
  TypeRegistry 
} from "./enhanced/serialization/xml/mod.ts";
import * as rm from "./enhanced/openehr_rm.ts";

// Register RM types (do this once at application startup)
TypeRegistry.registerModule(rm);

// Create an RM object
const dvText = new rm.DV_TEXT();
dvText.value = "Hello, openEHR!";

// Serialize to XML
const serializer = new XmlSerializer({ prettyPrint: true });
const xml = serializer.serialize(dvText);
console.log(xml);
/* Output:
<?xml version="1.0" encoding="UTF-8"?>
<dv_text xmlns="http://schemas.openehr.org/v1" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
         xsi:type="DV_TEXT">
  <value>Hello, openEHR!</value>
</dv_text>
*/

// Deserialize from XML
const deserializer = new XmlDeserializer();
const restored = deserializer.deserialize<rm.DV_TEXT>(xml);
console.log(restored.value); // "Hello, openEHR!"
```

## Configuration

### Serialization Configuration

```typescript
interface XmlSerializationConfig {
  rootElement?: string;           // Root element name (default: type name)
  includeDeclaration?: boolean;   // Include <?xml ...?> (default: true)
  version?: string;               // XML version (default: "1.0")
  encoding?: string;              // Character encoding (default: "UTF-8")
  useNamespaces?: boolean;        // Include XML namespaces (default: true)
  namespace?: string;             // openEHR namespace (default: openEHR standard)
  prettyPrint?: boolean;          // Format output (default: false)
  indent?: string;                // Indentation string (default: "  ")
}
```

### Deserialization Configuration

```typescript
interface XmlDeserializationConfig {
  strict?: boolean;               // Fail on unknown types (default: true)
  preserveOrder?: boolean;        // Preserve attribute order (default: false)
  ignoreAttributes?: boolean;     // Don't parse attributes (default: false)
}
```

## Examples

### Example 1: Basic Serialization

```typescript
import { XmlSerializer } from "./enhanced/serialization/xml/mod.ts";
import { DV_TEXT } from "./enhanced/openehr_rm.ts";

const dvText = new DV_TEXT();
dvText.value = "Patient temperature recorded";

const serializer = new XmlSerializer({
  includeDeclaration: true,
  prettyPrint: true,
  useNamespaces: true
});

const xml = serializer.serialize(dvText);
console.log(xml);
```

### Example 2: Complex Nested Objects

```typescript
import { XmlSerializer, TypeRegistry } from "./enhanced/serialization/xml/mod.ts";
import { CODE_PHRASE, TERMINOLOGY_ID } from "./enhanced/openehr_rm.ts";

// Register types
TypeRegistry.register("CODE_PHRASE", CODE_PHRASE);
TypeRegistry.register("TERMINOLOGY_ID", TERMINOLOGY_ID);

// Create nested structure
const codePhrase = new CODE_PHRASE();
codePhrase.code_string = "en";

const terminologyId = new TERMINOLOGY_ID();
terminologyId.value = "ISO_639-1";
codePhrase.terminology_id = terminologyId;

const serializer = new XmlSerializer({ prettyPrint: true });
const xml = serializer.serialize(codePhrase);
console.log(xml);
```

### Example 3: Custom Configuration

```typescript
import { XmlSerializer } from "./enhanced/serialization/xml/mod.ts";

const serializer = new XmlSerializer();
const xml = serializer.serializeWith(myObject, {
  rootElement: "custom_root",
  includeDeclaration: false,
  useNamespaces: false,
  prettyPrint: true,
  indent: "    " // 4 spaces
});
```

### Example 4: Deserialization

```typescript
import { XmlDeserializer } from "./enhanced/serialization/xml/mod.ts";

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<dv_text xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="DV_TEXT">
  <value>Test Value</value>
</dv_text>`;

const deserializer = new XmlDeserializer();
const result = deserializer.deserialize(xml);
console.log(result.value); // "Test Value"
```

### Example 5: Explicit Type Deserialization

```typescript
import { XmlDeserializer } from "./enhanced/serialization/xml/mod.ts";
import { DV_TEXT } from "./enhanced/openehr_rm.ts";

// XML without type information
const xml = `<dv_text><value>Test</value></dv_text>`;

const deserializer = new XmlDeserializer();
const result = deserializer.deserializeAs(xml, DV_TEXT);
console.log(result instanceof DV_TEXT); // true
```

### Example 6: Round-Trip Serialization

```typescript
import { XmlSerializer, XmlDeserializer, TypeRegistry } from "./enhanced/serialization/xml/mod.ts";
import { CODE_PHRASE, TERMINOLOGY_ID } from "./enhanced/openehr_rm.ts";

// Register types
TypeRegistry.register("CODE_PHRASE", CODE_PHRASE);
TypeRegistry.register("TERMINOLOGY_ID", TERMINOLOGY_ID);

// Create original object
const original = new CODE_PHRASE();
original.code_string = "en";
const terminologyId = new TERMINOLOGY_ID();
terminologyId.value = "ISO_639-1";
original.terminology_id = terminologyId;

// Serialize
const serializer = new XmlSerializer();
const xml = serializer.serialize(original);

// Deserialize
const deserializer = new XmlDeserializer();
const restored = deserializer.deserialize<CODE_PHRASE>(xml);

// Verify
console.log(restored.code_string === original.code_string); // true
console.log(restored.terminology_id?.value === original.terminology_id?.value); // true
```

## TypeRegistry

The `TypeRegistry` is crucial for deserialization. It maintains a mapping between openEHR type names (e.g., "DV_TEXT") and TypeScript class constructors.

### Registering Types

```typescript
import { TypeRegistry } from "./enhanced/serialization/xml/mod.ts";
import * as rm from "./enhanced/openehr_rm.ts";

// Register individual types
TypeRegistry.register("DV_TEXT", rm.DV_TEXT);
TypeRegistry.register("CODE_PHRASE", rm.CODE_PHRASE);

// Or register entire module at once
TypeRegistry.registerModule(rm);

// Check if type is registered
console.log(TypeRegistry.hasType("DV_TEXT")); // true

// Get constructor
const DvTextConstructor = TypeRegistry.getConstructor("DV_TEXT");
const instance = new DvTextConstructor();
```

### Type Inference

During deserialization, types are inferred in this order:

1. From `xsi:type` attribute (most reliable)
2. From root element name (converted to uppercase)
3. From explicit type parameter in `deserializeAs()`

## Error Handling

The module provides specialized error classes:

```typescript
import {
  SerializationError,
  DeserializationError,
  TypeNotFoundError
} from "./enhanced/serialization/xml/mod.ts";

try {
  const xml = serializer.serialize(myObject);
} catch (error) {
  if (error instanceof SerializationError) {
    console.error("Failed to serialize:", error.message);
    console.error("Object:", error.object);
    console.error("Cause:", error.cause);
  }
}

try {
  const obj = deserializer.deserialize(xml);
} catch (error) {
  if (error instanceof TypeNotFoundError) {
    console.error("Unknown type:", error.typeName);
  } else if (error instanceof DeserializationError) {
    console.error("Failed to deserialize:", error.message);
    console.error("Data:", error.data);
  }
}
```

## Advanced Usage

### Non-Strict Mode

In non-strict mode, the deserializer will create plain objects for unknown types instead of throwing an error:

```typescript
const deserializer = new XmlDeserializer({ strict: false });

const xml = `<unknown_type><value>Test</value></unknown_type>`;
const result = deserializer.deserialize(xml);
// Returns a plain object: { value: "Test" }
```

### Custom Namespace

```typescript
const serializer = new XmlSerializer({
  useNamespaces: true,
  namespace: "http://example.com/custom-namespace"
});
```

### Compact XML (No Pretty Print)

```typescript
const serializer = new XmlSerializer({
  prettyPrint: false,
  includeDeclaration: false
});

// Produces compact single-line XML
const xml = serializer.serialize(myObject);
```

## Performance Considerations

- **Type Registration**: Register all types once at application startup
- **Instance Reuse**: Create one serializer/deserializer instance and reuse it
- **Pretty Printing**: Disable for production to reduce output size
- **Namespaces**: Can be disabled if not needed for your use case

## openEHR Compliance

This implementation follows the [openEHR ITS-XML specification](https://specifications.openehr.org/releases/ITS-XML/):

- ✅ Uses `xsi:type` attributes for polymorphic types
- ✅ Supports standard openEHR XML namespace
- ✅ Handles `archetype_node_id` as XML attribute
- ✅ Preserves openEHR RM structure and semantics
- ✅ Compatible with other openEHR implementations (e.g., Archie)

## Limitations

- Arrays are serialized as repeated elements (per XML convention)
- Internal properties (starting with `_`) are not serialized
- Null and undefined values are omitted from output
- Circular references are not supported

## Testing

Run the test suite:

```bash
deno test --allow-read tests/enhanced/xml_serializer.test.ts
deno test --allow-read tests/enhanced/xml_deserializer.test.ts
deno test --allow-read tests/enhanced/serialization_common.test.ts
```

## Contributing

When adding new RM types or modifying serialization behavior:

1. Ensure types are registered in TypeRegistry
2. Add tests for new functionality
3. Update documentation
4. Verify round-trip serialization works
5. Check compliance with openEHR ITS-XML specification

## License

Part of ehrtslib project. See main repository LICENSE file.

## References

- [openEHR ITS-XML Specification](https://specifications.openehr.org/releases/ITS-XML/)
- [fast-xml-parser Documentation](https://github.com/NaturalIntelligence/fast-xml-parser)
- [openEHR Archie (Java Reference)](https://github.com/openEHR/archie)
