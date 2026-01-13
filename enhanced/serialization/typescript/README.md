# TypeScript Constructor Serialization for openEHR RM Objects

This module provides TypeScript code generation for openEHR Reference Model (RM) objects using the **Nested Object Initialization** pattern.

## Overview

The TypeScript Constructor Serializer generates clean, readable TypeScript code that uses the simplified object creation patterns described in [SIMPLIFIED-CREATION-GUIDE.md](../../../SIMPLIFIED-CREATION-GUIDE.md).

Instead of verbose imperative code, you get concise declarative constructors.

## Quick Start

### Basic Usage

```typescript
import { TypeScriptConstructorSerializer } from './enhanced/serialization/typescript/mod.ts';
import { SECTION, ELEMENT, DV_TEXT, DV_CODED_TEXT, DV_QUANTITY, CODE_PHRASE } from './enhanced/openehr_rm.ts';
import { TERMINOLOGY_ID } from './enhanced/openehr_base.ts';

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

// Generate TypeScript code
const serializer = new TypeScriptConstructorSerializer();
const code = serializer.serialize(section);

console.log(code);
// Output:
// import { DV_CODED_TEXT, DV_QUANTITY, DV_TEXT, ELEMENT, SECTION } from './enhanced/openehr_rm.ts';
// import { CODE_PHRASE, TERMINOLOGY_ID } from './enhanced/openehr_base.ts';
//
// const section = new SECTION({
//   name: "Vital Signs",
//   items: [
//     new ELEMENT({
//       name: "Diagnosis",
//       value: "SNOMED-CT::44054006|Diabetes mellitus type 2|"
//     }),
//     new ELEMENT({
//       name: "Pulse rate",
//       value: new DV_QUANTITY({
//         magnitude: 72,
//         units: "/min"
//       })
//     })
//   ]
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

The following examples all use the same SECTION object from the Quick Start to show how different configuration options affect the generated code.

### 1. Terse Format (Recommended)

With terse format enabled (default), CODE_PHRASE and DV_CODED_TEXT use compact string notation:

```typescript
const serializer = new TypeScriptConstructorSerializer({ useTerseFormat: true });
const code = serializer.serialize(section);

// Output:
// const section = new SECTION({
//   name: "Vital Signs",
//   items: [
//     new ELEMENT({
//       name: "Diagnosis",
//       value: "SNOMED-CT::44054006|Diabetes mellitus type 2|"  // Terse format!
//     }),
//     new ELEMENT({
//       name: "Pulse rate",
//       value: new DV_QUANTITY({
//         magnitude: 72,
//         units: "/min"
//       })
//     })
//   ]
// });
```

Without terse format:

```typescript
const serializer = new TypeScriptConstructorSerializer({ useTerseFormat: false });

// Output:
// const section = new SECTION({
//   name: "Vital Signs",
//   items: [
//     new ELEMENT({
//       name: "Diagnosis",
//       value: new DV_CODED_TEXT({
//         defining_code: new CODE_PHRASE({
//           terminology_id: "SNOMED-CT",
//           code_string: "44054006",
//           preferred_term: "Type 2 diabetes mellitus"
//         }),
//         value: "Diabetes mellitus type 2"
//       })
//     }),
//     // ...
//   ]
// });
```

### 2. Primitive Value Constructors

With primitive constructors enabled (default), simple wrapper types like DV_TEXT are simplified:

```typescript
const serializer = new TypeScriptConstructorSerializer({ usePrimitiveConstructors: true });

// name: "Vital Signs"  // Simplified from new DV_TEXT({value: "Vital Signs"})
```

Without primitive constructors:

```typescript
const serializer = new TypeScriptConstructorSerializer({ usePrimitiveConstructors: false });

// name: new DV_TEXT({
//   value: "Vital Signs"
// })
```

### 3. Archetype Node ID Location

Control where `archetype_node_id` appears in the generated code. This is useful for objects like COMPOSITION that have this property.

```typescript
// Example with a COMPOSITION instead
const composition = new COMPOSITION({
  archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
  name: "Encounter",
  language: "ISO_639-1::en"
});

// After name (default) - most readable
const serializer1 = new TypeScriptConstructorSerializer({ 
  archetypeNodeIdLocation: 'after_name' 
});
// Output:
// new COMPOSITION({
//   name: "Encounter",
//   archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
//   language: "ISO_639-1::en"
// });

// Beginning - spec order
const serializer2 = new TypeScriptConstructorSerializer({ 
  archetypeNodeIdLocation: 'beginning' 
});
// Output:
// new COMPOSITION({
//   archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
//   name: "Encounter",
//   language: "ISO_639-1::en"
// });

// End - emphasize data properties
const serializer3 = new TypeScriptConstructorSerializer({ 
  archetypeNodeIdLocation: 'end' 
});
// Output:
// new COMPOSITION({
//   name: "Encounter",
//   language: "ISO_639-1::en",
//   archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1"
// });
```

### 4. Include Comments (Development Mode)

Add helpful comments for development (note: comment generation is currently basic):

```typescript
const serializer = new TypeScriptConstructorSerializer({ 
  includeComments: true 
});

// Output includes comments:
// const section = new SECTION({
//   name: "Vital Signs",  // DV_TEXT or string
//   items: [
//     // Array of ELEMENT objects
//   ]
// });
```

### 5. Include Undefined Attributes (Skeleton Mode)

Show all possible properties as placeholders - useful for generating code scaffolds:

```typescript
const serializer = new TypeScriptConstructorSerializer({ 
  includeUndefinedAttributes: true 
});

// Output includes undefined properties:
// const section = new SECTION({
//   name: "Vital Signs",
//   archetype_node_id: undefined,  // TODO: Set value
//   items: [...],
//   feeder_audit: undefined,  // TODO: Set value
//   links: undefined,  // TODO: Set value
//   // ... other possible properties
// });
```

## Advanced Usage

### Custom Variable Names

```typescript
const serializer = new TypeScriptConstructorSerializer();

// Default variable name (inferred from type)
const code1 = serializer.serialize(section);
// Output: const section = new SECTION({ ... });

// Custom variable name
const code2 = serializer.serialize(section, 'vitalSigns');
// Output: const vitalSigns = new SECTION({ ... });
```

### Different Configuration Presets

Here's how different presets affect the output for our example section:

```typescript
// Compact mode (default) - for production code
const compact = new TypeScriptConstructorSerializer({
  useTerseFormat: true,
  usePrimitiveConstructors: true,
  includeComments: false,
  includeUndefinedAttributes: false
});
const code1 = compact.serialize(section);
// Output:
// const section = new SECTION({
//   name: "Vital Signs",
//   items: [
//     new ELEMENT({
//       name: "Diagnosis",
//       value: "SNOMED-CT::44054006|Diabetes mellitus type 2|"
//     }),
//     new ELEMENT({
//       name: "Pulse rate",
//       value: new DV_QUANTITY({
//         magnitude: 72,
//         units: "/min"
//       })
//     })
//   ]
// });

// Verbose mode - for learning/documentation
const verbose = new TypeScriptConstructorSerializer({
  useTerseFormat: false,
  usePrimitiveConstructors: false,
  includeComments: true,
  includeUndefinedAttributes: false
});
const code2 = verbose.serialize(section);
// Output:
// const section = new SECTION({
//   name: new DV_TEXT({
//     value: "Vital Signs"
//   }),
//   items: [
//     new ELEMENT({
//       name: new DV_TEXT({
//         value: "Diagnosis"
//       }),
//       value: new DV_CODED_TEXT({
//         defining_code: new CODE_PHRASE({
//           terminology_id: "SNOMED-CT",
//           code_string: "44054006",
//           preferred_term: "Type 2 diabetes mellitus"
//         }),
//         value: "Diabetes mellitus type 2"
//       })
//     }),
//     // ...
//   ]
// });

// Skeleton mode - for code generation scaffolds
const skeleton = new TypeScriptConstructorSerializer({
  useTerseFormat: true,
  usePrimitiveConstructors: true,
  includeComments: true,
  includeUndefinedAttributes: true
});
const code3 = skeleton.serialize(section);
// Output includes all possible properties as undefined placeholders
```

## Integration with Other Serializers

The TypeScript serializer works well with JSON, XML, and YAML deserializers:

```typescript
import { JsonDeserializer } from '../json/mod.ts';
import { TypeScriptConstructorSerializer } from './mod.ts';

// Parse JSON containing our section data
const jsonString = `{
  "_type": "SECTION",
  "name": {"value": "Vital Signs"},
  "items": [...]
}`;

const jsonDeserializer = new JsonDeserializer();
const section = jsonDeserializer.deserialize(jsonString);

// Generate TypeScript code
const tsSerializer = new TypeScriptConstructorSerializer();
const code = tsSerializer.serialize(section);

// Now you have executable TypeScript code!
console.log(code);
```

## Use Cases

1. **Documentation** - Generate example code for documentation
2. **Code Generation** - Create TypeScript code from data or schemas
3. **Learning** - Show how to construct openEHR objects
4. **Testing** - Generate test data constructors
5. **Migration** - Convert data formats to TypeScript code

## Best Practices

1. **Use Terse Format** - It's more readable and follows openEHR conventions
2. **Use Primitive Constructors** - Reduces boilerplate significantly
3. **Set archetypeNodeIdLocation** - Choose based on your preference
4. **Enable Comments for Docs** - Helpful for generated documentation
5. **Enable Undefined for Scaffolding** - Useful when generating code scaffolds

## Limitations

- Does not validate the generated code (you should test it)
- Comments are currently basic (will be enhanced in future)
- Type introspection for undefined attributes is limited

## See Also

- [SIMPLIFIED-CREATION-GUIDE.md](../../../SIMPLIFIED-CREATION-GUIDE.md) - Full guide to simplified object creation
- [JSON Serialization](../json/README.md) - JSON serialization/deserialization
- [YAML Serialization](../yaml/README.md) - YAML serialization/deserialization
- [XML Serialization](../xml/README.md) - XML serialization/deserialization
