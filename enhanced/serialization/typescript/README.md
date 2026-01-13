# TypeScript Constructor Serialization for openEHR RM Objects

This module provides TypeScript code generation for openEHR Reference Model (RM) objects using the **Nested Object Initialization** pattern.

## Overview

The TypeScript Constructor Serializer generates clean, readable TypeScript code that uses the simplified object creation patterns described in [SIMPLIFIED-CREATION-GUIDE.md](../../../SIMPLIFIED-CREATION-GUIDE.md).

Instead of verbose imperative code, you get concise declarative constructors.

## Quick Start

### Basic Usage

```typescript
import { TypeScriptConstructorSerializer } from './enhanced/serialization/typescript/mod.ts';
import { DV_TEXT } from './enhanced/openehr_rm.ts';

// Create an RM object
const dvText = new DV_TEXT();
dvText.value = "Patient temperature reading";

// Generate TypeScript code
const serializer = new TypeScriptConstructorSerializer();
const code = serializer.serialize(dvText);

console.log(code);
// Output:
// import { DV_TEXT } from './enhanced/openehr_rm.ts';
//
// const dvText = new DV_TEXT("Patient temperature reading");
```

### Complex Objects

```typescript
import { TypeScriptConstructorSerializer } from './enhanced/serialization/typescript/mod.ts';
import { COMPOSITION, DV_TEXT, CODE_PHRASE, DV_CODED_TEXT } from './enhanced/openehr_rm.ts';
import { TERMINOLOGY_ID, OBJECT_VERSION_ID, ARCHETYPE_ID } from './enhanced/openehr_base.ts';

// Create a composition
const composition = new COMPOSITION();
composition.archetype_node_id = "openEHR-EHR-COMPOSITION.encounter.v1";
composition.name = new DV_TEXT("Encounter");
composition.language = new CODE_PHRASE();
composition.language.terminology_id = new TERMINOLOGY_ID();
composition.language.terminology_id.value = "ISO_639-1";
composition.language.code_string = "en";

// Generate code
const serializer = new TypeScriptConstructorSerializer();
const code = serializer.serialize(composition);

console.log(code);
// Output:
// import { COMPOSITION } from './enhanced/openehr_rm.ts';
// import { ARCHETYPE_ID, CODE_PHRASE, OBJECT_VERSION_ID } from './enhanced/openehr_base.ts';
//
// const composition = new COMPOSITION({
//   name: "Encounter",
//   archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
//   language: "ISO_639-1::en"
// });
```

## Configuration Options

### TypeScriptConstructorSerializationConfig

```typescript
interface TypeScriptConstructorSerializationConfig {
  // Use terse format for CODE_PHRASE and DV_CODED_TEXT (default: true)
  useTerseFormat?: boolean;
  
  // Use primitive value constructors for simple wrappers (default: true)
  usePrimitiveConstructors?: boolean;
  
  // Include comments in the generated code (default: false)
  includeComments?: boolean;
  
  // Include undefined attributes (default: false)
  includeUndefinedAttributes?: boolean;
  
  // Indentation size in spaces (default: 2)
  indent?: number;
  
  // Location of archetype_node_id property (default: 'after_name')
  archetypeNodeIdLocation?: 'beginning' | 'after_name' | 'end';
}
```

## Features

### 1. Terse Format (Recommended)

Uses compact string notation for CODE_PHRASE and DV_CODED_TEXT:

```typescript
// With terse format (default)
const serializer = new TypeScriptConstructorSerializer({ useTerseFormat: true });

// CODE_PHRASE
// Input: {terminology_id: {value: "ISO_639-1"}, code_string: "en"}
// Output: "ISO_639-1::en"

// DV_CODED_TEXT  
// Input: {value: "event", defining_code: {terminology_id: {value: "openehr"}, code_string: "433"}}
// Output: "openehr::433|event|"
```

### 2. Primitive Value Constructors

Simplifies wrapper types that only contain a value:

```typescript
// With primitive constructors (default)
const serializer = new TypeScriptConstructorSerializer({ usePrimitiveConstructors: true });

// DV_TEXT
// Input: {value: "Hello world"}
// Output: "Hello world"

// TERMINOLOGY_ID
// Input: {value: "ISO_639-1"}
// Output: "ISO_639-1"
```

### 3. Archetype Node ID Location

Control where `archetype_node_id` appears in the generated code:

```typescript
// After name (default) - most readable
const serializer1 = new TypeScriptConstructorSerializer({ 
  archetypeNodeIdLocation: 'after_name' 
});
// Output:
// new COMPOSITION({
//   name: "Test",
//   archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
//   // ... other properties
// });

// Beginning - spec order
const serializer2 = new TypeScriptConstructorSerializer({ 
  archetypeNodeIdLocation: 'beginning' 
});
// Output:
// new COMPOSITION({
//   archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
//   name: "Test",
//   // ... other properties
// });

// End - emphasize other properties
const serializer3 = new TypeScriptConstructorSerializer({ 
  archetypeNodeIdLocation: 'end' 
});
// Output:
// new COMPOSITION({
//   name: "Test",
//   // ... other properties
//   archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1"
// });
```

### 4. Include Comments (Development Mode)

Add helpful comments for development:

```typescript
const serializer = new TypeScriptConstructorSerializer({ 
  includeComments: true 
});

// Output includes comments:
// const composition = new COMPOSITION({
//   name: "Test",  // DV_TEXT or string
//   archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",  // Required
//   // ...
// });
```

### 5. Include Undefined Attributes (Template Mode)

Show all possible properties as templates:

```typescript
const serializer = new TypeScriptConstructorSerializer({ 
  includeUndefinedAttributes: true 
});

// Output includes undefined properties:
// const composition = new COMPOSITION({
//   name: "Test",
//   archetype_node_id: undefined,  // TODO: Set value
//   language: undefined,  // TODO: Set value
//   territory: undefined,  // TODO: Set value
//   category: undefined,  // TODO: Set value
//   // ...
// });
```

## Advanced Usage

### Custom Variable Names

```typescript
const serializer = new TypeScriptConstructorSerializer();

// Default variable name (inferred from type)
const code1 = serializer.serialize(composition);
// Output: const composition = new COMPOSITION({ ... });

// Custom variable name
const code2 = serializer.serialize(composition, 'myComposition');
// Output: const myComposition = new COMPOSITION({ ... });
```

### Different Configuration Presets

```typescript
// Compact mode (default) - for production code
const compact = new TypeScriptConstructorSerializer({
  useTerseFormat: true,
  usePrimitiveConstructors: true,
  includeComments: false,
  includeUndefinedAttributes: false
});

// Verbose mode - for learning/documentation
const verbose = new TypeScriptConstructorSerializer({
  useTerseFormat: false,
  usePrimitiveConstructors: false,
  includeComments: true,
  includeUndefinedAttributes: false
});

// Template mode - for code generation
const template = new TypeScriptConstructorSerializer({
  useTerseFormat: true,
  usePrimitiveConstructors: true,
  includeComments: true,
  includeUndefinedAttributes: true
});
```

## Integration with Other Serializers

The TypeScript serializer works well with JSON, XML, and YAML deserializers:

```typescript
import { JsonDeserializer } from '../json/mod.ts';
import { TypeScriptConstructorSerializer } from './mod.ts';

// Parse JSON
const jsonDeserializer = new JsonDeserializer();
const composition = jsonDeserializer.deserialize(jsonString);

// Generate TypeScript code
const tsSerializer = new TypeScriptConstructorSerializer();
const code = tsSerializer.serialize(composition);

// Now you have executable TypeScript code!
console.log(code);
```

## Use Cases

1. **Documentation** - Generate example code for documentation
2. **Code Generation** - Create TypeScript code from templates or data
3. **Learning** - Show how to construct openEHR objects
4. **Testing** - Generate test data constructors
5. **Migration** - Convert data formats to TypeScript code

## Best Practices

1. **Use Terse Format** - It's more readable and follows openEHR conventions
2. **Use Primitive Constructors** - Reduces boilerplate significantly
3. **Set archetypeNodeIdLocation** - Choose based on your preference
4. **Enable Comments for Docs** - Helpful for generated documentation
5. **Enable Undefined for Templates** - Useful when generating code templates

## Limitations

- Does not validate the generated code (you should test it)
- Comments are currently basic (will be enhanced in future)
- Type introspection for undefined attributes is limited

## See Also

- [SIMPLIFIED-CREATION-GUIDE.md](../../../SIMPLIFIED-CREATION-GUIDE.md) - Full guide to simplified object creation
- [JSON Serialization](../json/README.md) - JSON serialization/deserialization
- [YAML Serialization](../yaml/README.md) - YAML serialization/deserialization
- [XML Serialization](../xml/README.md) - XML serialization/deserialization
