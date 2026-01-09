# YAML Serialization for openEHR RM Objects

This module provides YAML serialization and deserialization for openEHR Reference Model (RM) objects.

**Note**: YAML is not an official openEHR standard format, but it provides excellent human readability for files, documentation, and data inspection.

## Features

- ✅ **Human-readable format** - Easy to read and edit
- ✅ **Multiple styles** - Block, flow, and hybrid formatting
- ✅ **Type inference** - Optional compact mode with fewer type annotations
- ✅ **Terse format** - Recommended for YAML (no official standard to break!)
- ✅ **Flexible configuration** - Multiple preset configurations
- ✅ **Type-safe deserialization** - Automatic reconstruction of typed objects

## Quick Start

### Basic Serialization

```typescript
import { YamlSerializer } from './enhanced/serialization/yaml/mod.ts';
import { DV_TEXT } from './enhanced/openehr_rm.ts';

// Create an RM object
const dvText = new DV_TEXT();
dvText.value = "Patient temperature reading";

// Serialize to YAML
const serializer = new YamlSerializer();
const yaml = serializer.serialize(dvText);

console.log(yaml);
// Output:
// _type: DV_TEXT
// value: Patient temperature reading
```

### Basic Deserialization

```typescript
import { YamlDeserializer } from './enhanced/serialization/yaml/mod.ts';

const yaml = `
_type: DV_TEXT
value: Test value
`;

const deserializer = new YamlDeserializer();
const obj = deserializer.deserialize(yaml);

console.log(obj.value); // "Test value"
```

## Configuration Options

### Serialization Configuration

```typescript
interface YamlSerializationConfig {
  // Include _type fields (default: true)
  includeType?: boolean;
  
  // Use type inference (compact mode) (default: false)
  useTypeInference?: boolean;
  
  // Flow style for values (default: false)
  flowStyleValues?: boolean;
  
  // Block style for objects (default: true)
  blockStyleObjects?: boolean;
  
  // Hybrid style (zipehr-like) (default: false)
  hybridStyle?: boolean;
  
  // Indentation (default: 2)
  indent?: number;
  
  // Line width (default: 80)
  lineWidth?: number;
  
  // Use terse format (recommended for YAML!) (default: false)
  useTerseFormat?: boolean;
  
  // Include null values (default: false)
  includeNullValues?: boolean;
  
  // Include empty collections (default: true)
  includeEmptyCollections?: boolean;
}
```

### Deserialization Configuration

```typescript
interface YamlDeserializationConfig {
  // Strict mode (default: true)
  strict?: boolean;
  
  // Allow duplicate keys (default: false)
  allowDuplicateKeys?: boolean;
  
  // Parse terse format (default: false)
  parseTerseFormat?: boolean;
}
```

## Preset Configurations

### Standard YAML

```typescript
import { YamlSerializer, STANDARD_YAML_CONFIG } from './enhanced/serialization/yaml/mod.ts';

const serializer = new YamlSerializer(STANDARD_YAML_CONFIG);
const yaml = serializer.serialize(composition);
```

Readable YAML with full type information.

### Compact YAML (Recommended)

```typescript
import { YamlSerializer, COMPACT_YAML_CONFIG } from './enhanced/serialization/yaml/mod.ts';

const serializer = new YamlSerializer(COMPACT_YAML_CONFIG);
const yaml = serializer.serialize(composition);
```

Uses type inference and terse format for maximum conciseness while maintaining readability.

### Hybrid YAML (ZipEHR-style)

```typescript
import { YamlSerializer, HYBRID_YAML_CONFIG } from './enhanced/serialization/yaml/mod.ts';

const serializer = new YamlSerializer(HYBRID_YAML_CONFIG);
const yaml = serializer.serialize(composition);
```

Inspired by ZipEHR: simple objects inline, complex objects with line breaks.

### Flow Style (JSON-like)

```typescript
import { YamlSerializer, FLOW_YAML_CONFIG } from './enhanced/serialization/yaml/mod.ts';

const serializer = new YamlSerializer(FLOW_YAML_CONFIG);
const yaml = serializer.serialize(composition);
```

More compact, JSON-like appearance.

## Advanced Usage

### Terse Format (Recommended for YAML)

Unlike JSON, YAML has no official openEHR standard, so terse format is **recommended**:

```typescript
const serializer = new YamlSerializer({ useTerseFormat: true });

const codePhrase = new CODE_PHRASE();
codePhrase.terminology_id = new TERMINOLOGY_ID();
codePhrase.terminology_id.value = "ISO_639-1";
codePhrase.code_string = "en";

const yaml = serializer.serialize(codePhrase);
console.log(yaml); // ISO_639-1::en
```

To deserialize:

```typescript
const deserializer = new YamlDeserializer({ parseTerseFormat: true });
const obj = deserializer.deserialize("ISO_639-1::en");
```

### Compact Mode with Type Inference

```typescript
const serializer = new YamlSerializer({
  includeType: true,
  useTypeInference: true, // Omit types when safe
  useTerseFormat: true
});

const yaml = serializer.serialize(composition);
```

This produces the most concise YAML while still being deserializable.

### Hybrid Style Formatting

```typescript
const serializer = new YamlSerializer({
  hybridStyle: true,
  maxInlineProperties: 3
});

// Simple objects appear inline
// Complex objects use block style
const yaml = serializer.serialize(composition);
```

### Cross-Format Conversion

Convert between JSON and YAML easily:

```typescript
import { JsonDeserializer } from '../json/mod.ts';
import { YamlSerializer } from './mod.ts';

// Deserialize from JSON
const jsonDeserializer = new JsonDeserializer();
const obj = jsonDeserializer.deserialize(jsonString);

// Serialize to YAML
const yamlSerializer = new YamlSerializer();
const yaml = yamlSerializer.serialize(obj);
```

## YAML-Specific Features

### Anchors and Aliases

The YAML parser supports anchors and aliases:

```yaml
_type: COMPOSITION
name: &composition_name
  _type: DV_TEXT
  value: Blood Pressure

# Reuse the same object
description: *composition_name
```

### Multi-line Strings

YAML's multi-line string support works naturally:

```yaml
_type: DV_TEXT
value: |
  This is a long
  multi-line text
  with line breaks
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

## Use Cases

### Configuration Files

YAML is perfect for openEHR templates and configuration:

```yaml
# template_config.yaml
_type: TEMPLATE
name: Blood Pressure Template
definition:
  _type: COMPOSITION
  category: openehr::433|event|
  content:
    - _type: OBSERVATION
      name: Blood Pressure
```

### Human-Readable Data Dumps

Export data in a format that's easy to read and edit:

```typescript
const serializer = new YamlSerializer(HYBRID_YAML_CONFIG);
const yaml = serializer.serialize(composition);

// Save to file
await Deno.writeTextFile('composition.yaml', yaml);
```

### Documentation

Use YAML in documentation to show examples:

````markdown
## Example COMPOSITION

```yaml
_type: COMPOSITION
name: Blood Pressure Recording
category: openehr::433|event|
```
````

## Permissions

The YAML library may require environment variable access:

```bash
deno run --allow-env --allow-read your_script.ts
```

## Performance Tips

1. **Reuse serializer instances** - Create once, use multiple times
2. **Use compact config** for smaller output
3. **Enable terse format** for CODE_PHRASE and DV_CODED_TEXT
4. **Consider block style** for deeply nested objects

## Compatibility

- ⚠️ YAML is not an official openEHR standard
- ✅ All data can be converted between JSON and YAML
- ✅ Terse format is recommended for YAML
- ✅ Works with type inference
- ✅ Supports all YAML 1.2 features

## Examples

See the `examples/` directory for more comprehensive examples:
- `yaml_serialization_basic.ts` - Basic usage
- `yaml_serialization_advanced.ts` - Advanced features
