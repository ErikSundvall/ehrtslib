# JSON Serialization for openEHR RM Objects

This module provides JSON serialization and deserialization for openEHR Reference Model (RM) objects according to the [openEHR ITS-JSON specification](https://github.com/openEHR/specifications-ITS-JSON).

## Features

- ✅ **Canonical JSON format** - Compliant with openEHR ITS-JSON specification
- ✅ **Type inference** - Intelligently omit `_type` fields when they can be inferred
- ✅ **Terse format** - Optional compact representation for CODE_PHRASE and DV_CODED_TEXT
- ✅ **Flexible configuration** - Multiple preset configurations for different use cases
- ✅ **Type-safe deserialization** - Automatic reconstruction of typed objects
- ✅ **Error handling** - Comprehensive error reporting with context

## Quick Start

### Basic Serialization

```typescript
import { JsonSerializer } from './enhanced/serialization/json/mod.ts';
import { DV_TEXT } from './enhanced/openehr_rm.ts';

// Create an RM object
const dvText = new DV_TEXT();
dvText.value = "Blood pressure reading";

// Serialize to JSON
const serializer = new JsonSerializer({ prettyPrint: true });
const json = serializer.serialize(dvText);

console.log(json);
// Output:
// {
//   "_type": "DV_TEXT",
//   "value": "Blood pressure reading"
// }
```

### Basic Deserialization

```typescript
import { JsonDeserializer } from './enhanced/serialization/json/mod.ts';

const json = '{"_type":"DV_TEXT","value":"Test"}';

const deserializer = new JsonDeserializer();
const obj = deserializer.deserialize(json);

console.log(obj.value); // "Test"
```

## Configuration Options

### Serialization Configuration

```typescript
interface JsonSerializationConfig {
  // Type property name (default: "_type")
  typePropertyName?: string;
  
  // Always include type, even when inferable (default: false)
  alwaysIncludeType?: boolean;
  
  // Include null values (default: false)
  includeNullValues?: boolean;
  
  // Include empty collections (default: true)
  includeEmptyCollections?: boolean;
  
  // Pretty print (default: false)
  prettyPrint?: boolean;
  
  // Indentation (default: 2)
  indent?: number;
  
  // Use terse format for CODE_PHRASE/DV_CODED_TEXT (default: false)
  // ⚠️ WARNING: Breaks canonical JSON format
  useTerseFormat?: boolean;
  
  // Use hybrid style formatting (default: false)
  useHybridStyle?: boolean;
}
```

### Deserialization Configuration

```typescript
interface JsonDeserializationConfig {
  // Type property name (default: "_type")
  typePropertyName?: string;
  
  // Strict mode (default: false)
  strict?: boolean;
  
  // Allow incomplete objects (default: false)
  allowIncomplete?: boolean;
  
  // Parse terse format strings (default: false)
  parseTerseFormat?: boolean;
}
```

## Preset Configurations

### Canonical JSON (openEHR Standard)

```typescript
import { JsonSerializer, CANONICAL_JSON_CONFIG } from './enhanced/serialization/json/mod.ts';

const serializer = new JsonSerializer(CANONICAL_JSON_CONFIG);
const json = serializer.serialize(composition);
```

This produces standard-compliant openEHR JSON with all type information.

### Compact JSON (Smaller Output)

```typescript
import { JsonSerializer, COMPACT_JSON_CONFIG } from './enhanced/serialization/json/mod.ts';

const serializer = new JsonSerializer(COMPACT_JSON_CONFIG);
const json = serializer.serialize(composition);
```

Uses type inference to omit `_type` fields when safe, producing smaller JSON.

### Internal Storage Format (Non-standard)

```typescript
import { JsonSerializer, INTERNAL_JSON_CONFIG } from './enhanced/serialization/json/mod.ts';

const serializer = new JsonSerializer(INTERNAL_JSON_CONFIG);
const json = serializer.serialize(composition);
```

⚠️ **WARNING**: Uses terse format, which breaks canonical JSON standard. Only use for internal storage where you control both ends.

## Advanced Usage

### Type Inference

The serializer can automatically omit `_type` fields when the type can be inferred from context:

```typescript
const serializer = new JsonSerializer({
  alwaysIncludeType: false, // Enable type inference
  prettyPrint: true
});

const codedText = new DV_CODED_TEXT();
codedText.value = "event";
codedText.defining_code = codePhrase;

const json = serializer.serialize(codedText);
// The defining_code won't have a _type field because it's known to be CODE_PHRASE
```

### Terse Format

**⚠️ NON-STANDARD** - This breaks openEHR canonical JSON format:

```typescript
const serializer = new JsonSerializer({ useTerseFormat: true });

const codePhrase = new CODE_PHRASE();
codePhrase.terminology_id = new TERMINOLOGY_ID();
codePhrase.terminology_id.value = "ISO_639-1";
codePhrase.code_string = "en";

const json = serializer.serialize(codePhrase);
console.log(json); // "ISO_639-1::en"
```

To deserialize terse format:

```typescript
const deserializer = new JsonDeserializer({ parseTerseFormat: true });
const obj = deserializer.deserialize('"ISO_639-1::en"');
```

### Error Handling

```typescript
import { JsonDeserializer, DeserializationError, TypeNotFoundError } from './enhanced/serialization/json/mod.ts';

try {
  const deserializer = new JsonDeserializer({ strict: true });
  const obj = deserializer.deserialize(invalidJson);
} catch (error) {
  if (error instanceof TypeNotFoundError) {
    console.error(`Unknown type: ${error.typeName}`);
  } else if (error instanceof DeserializationError) {
    console.error(`Deserialization failed: ${error.message}`);
  }
}
```

## Type Registration

Before using serialization, ensure all RM types are registered:

```typescript
import { TypeRegistry } from './enhanced/serialization/common/type_registry.ts';
import * as rm from './enhanced/openehr_rm.ts';
import * as base from './enhanced/openehr_base.ts';

TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);
```

## Compatibility

- ✅ Compliant with openEHR ITS-JSON specification (when using canonical config)
- ✅ Compatible with Archie JSON output
- ✅ Works with openEHR JSON schemas
- ⚠️ Terse format is non-standard (use only internally)

## Performance Tips

1. **Reuse serializer instances** - Create once, use multiple times
2. **Disable pretty printing** for production (smaller output, faster)
3. **Enable type inference** for smaller JSON (requires deserialization support)
4. **Use terse format** only for internal storage (not interoperable)

## Examples

See the `examples/` directory for more comprehensive examples:
- `json_serialization_basic.ts` - Basic usage
- `json_serialization_advanced.ts` - Advanced features
