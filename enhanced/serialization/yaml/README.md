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
  // Include _type fields (default: false - only on polymorphic types)
  includeType?: boolean;
  
  // Use type inference (compact mode) (default: true)
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
  
  // Use terse format (recommended for YAML!) (default: true)
  useTerseFormat?: boolean;
  
  // Include null values (default: false)
  includeNullValues?: boolean;
  
  // Include empty collections (default: false)
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
  
  // Parse terse format (default: true)
  parseTerseFormat?: boolean;
}
```

## Preset Configurations

The following examples all serialize the same SECTION with two data elements to show the differences between configurations.

**Input Object:**
```typescript
// Create a section with diabetes diagnosis and pulse observation
const section = new SECTION();
section.name = new DV_TEXT();
section.name.value = "Vital Signs";

// First element: Diabetes diagnosis (DV_CODED_TEXT)
const diabetesElement = new ELEMENT();
diabetesElement.name = new DV_TEXT();
diabetesElement.name.value = "Diagnosis";
diabetesElement.value = new DV_CODED_TEXT();
diabetesElement.value.value = "Diabetes mellitus type 2";
diabetesElement.value.defining_code = new CODE_PHRASE();
diabetesElement.value.defining_code.terminology_id = new TERMINOLOGY_ID();
diabetesElement.value.defining_code.terminology_id.value = "SNOMED-CT";
diabetesElement.value.defining_code.code_string = "44054006";
diabetesElement.value.defining_code.preferred_term = "Type 2 diabetes mellitus";

// Second element: Pulse rate (DV_QUANTITY)
const pulseElement = new ELEMENT();
pulseElement.name = new DV_TEXT();
pulseElement.name.value = "Pulse rate";
pulseElement.value = new DV_QUANTITY();
pulseElement.value.magnitude = 72;
pulseElement.value.units = "/min";

section.items = [diabetesElement, pulseElement];
```

### Default YAML (Compact & Readable - Recommended)

```typescript
import { YamlSerializer } from './enhanced/serialization/yaml/mod.ts';

const serializer = new YamlSerializer();  // Uses DEFAULT_YAML_SERIALIZATION_CONFIG
const yaml = serializer.serialize(section);
```

**Output:**
```yaml
_type: SECTION
name:
  value: Vital Signs
items:
  - name:
      value: Diagnosis
    value:
      defining_code: SNOMED-CT::44054006|Type 2 diabetes mellitus|
      value: Diabetes mellitus type 2
  - name:
      value: Pulse rate
    value:
      magnitude: 72
      units: /min
```

Uses type inference and terse format for maximum conciseness while maintaining readability. _type included only on polymorphic classes. Empty collections omitted.

### Verbose YAML

```typescript
import { YamlSerializer, VERBOSE_YAML_CONFIG } from './enhanced/serialization/yaml/mod.ts';

const serializer = new YamlSerializer(VERBOSE_YAML_CONFIG);
const yaml = serializer.serialize(section);
```

**Output:**
```yaml
_type: SECTION
name:
  _type: DV_TEXT
  value: Vital Signs
items:
  - _type: ELEMENT
    name:
      _type: DV_TEXT
      value: Diagnosis
    value:
      _type: DV_CODED_TEXT
      defining_code:
        _type: CODE_PHRASE
        terminology_id:
          _type: TERMINOLOGY_ID
          value: SNOMED-CT
        code_string: "44054006"
        preferred_term: Type 2 diabetes mellitus
      value: Diabetes mellitus type 2
  - _type: ELEMENT
    name:
      _type: DV_TEXT
      value: Pulse rate
    value:
      _type: DV_QUANTITY
      magnitude: 72
      units: /min
```

Full YAML with all type information and no terse format. Most verbose but clearest structure.

### Hybrid YAML (Optimized for Readability)

```typescript
import { YamlSerializer, HYBRID_YAML_CONFIG } from './enhanced/serialization/yaml/mod.ts';

const serializer = new YamlSerializer(HYBRID_YAML_CONFIG);
const yaml = serializer.serialize(section);
```

**Output:**
```yaml
name: {value: Vital Signs}
items:
  - name: {value: Diagnosis}
    value: {defining_code: SNOMED-CT::44054006|Type 2 diabetes mellitus|, value: Diabetes mellitus type 2}
  - name: {value: Pulse rate}
    value: {magnitude: 72, units: /min}
```

Types omitted for better readability (included only when polymorphism requires them). Uses terse format and hybrid style with flow formatting for simple objects, resulting in the most concise and readable output. Simple objects are formatted inline using flow style (e.g., `{value: Text}`), while complex nested structures maintain block style formatting.

### Flow Style (JSON-like)

```typescript
import { YamlSerializer, FLOW_YAML_CONFIG } from './enhanced/serialization/yaml/mod.ts';

const serializer = new YamlSerializer(FLOW_YAML_CONFIG);
const yaml = serializer.serialize(section);
```

**Output:**
```yaml
{_type: SECTION, name: {_type: DV_TEXT, value: Vital Signs}, items: [{_type: ELEMENT, name: {_type: DV_TEXT, value: Diagnosis}, value: {_type: DV_CODED_TEXT, defining_code: {_type: CODE_PHRASE, terminology_id: {_type: TERMINOLOGY_ID, value: SNOMED-CT}, code_string: "44054006", preferred_term: Type 2 diabetes mellitus}, value: Diabetes mellitus type 2}}, {_type: ELEMENT, name: {_type: DV_TEXT, value: Pulse rate}, value: {_type: DV_QUANTITY, magnitude: 72, units: /min}}]}
```

More compact, JSON-like appearance. Useful when horizontal space is prioritized over vertical readability.

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
  useTerseFormat: true,
  maxInlineProperties: 3
});

// Simple objects are formatted inline (flow style)
// Complex objects use block style
const yaml = serializer.serialize(composition);
```

The hybrid style intelligently decides whether to format objects inline or across multiple lines:
- **Simple objects** (≤3 properties, no nested objects) → Flow style: `{value: Text, units: kg}`
- **Complex objects** (many properties or nested structures) → Block style with proper indentation
- **Arrays** → Block style with items properly indented
- Inspired by the zipehr approach for optimal readability

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


## Permissions

The YAML library used is `yaml` from JSR. It may require environment variable access:

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
