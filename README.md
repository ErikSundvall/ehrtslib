# ehrtslib (Electronic Health Record TypeScript Library)

TypeScript library for (to begin with) openEHR. Intended for (partial) use both
in clients like web browsers or in servers based on e.g. Deno or Node.js. The
library is big and detailed, so developers using it are assumed to be importing
just needed parts and to have build tools/processes that use e.g. "tree shaking"
to reduce the amount of code shipped to end users.

## For library users: Using the library in your own projects

This library uses a **dual getter/setter pattern** for working with openEHR primitive types (String, Integer, Boolean, etc.), providing both convenience and type safety.

### Quick Start: Two Ways to Access Properties

**1. Default Access (Primitives)** - Use property names directly for simple operations:
```typescript
// Setting values - accepts JavaScript primitives (auto-wrapped with validation)
person.name = "John";
dateTime.value = "2025-11-19T10:30:00Z";

// Getting values - returns JavaScript primitives
const name: string = person.name;  // Returns primitive string
const date: string = dateTime.value;  // Returns primitive string
```

**2. Typed Access (Wrappers)** - Use `$` prefix to access openEHR wrapper objects and their methods:
```typescript
// Getting wrapper - access wrapper methods for advanced operations
const nameWrapper: String = person.$name;
if (nameWrapper.is_empty()) {
  console.log("Name is empty");
}
```

**When to use which:** Use default primitive access (~95% of cases) for simple value operations. Use `$` prefix wrapper access when you need openEHR-specific methods like `is_empty()`, `as_upper()`, or type-specific validation.

For detailed information about the dual approach pattern, see [DUAL-APPROACH-GUIDE.md](DUAL-APPROACH-GUIDE.md).

### Creating and Modifying Compositions

Creating openEHR compositions is straightforward using constructor initialization with nested objects:

```typescript
import { COMPOSITION } from "./openehr_rm.ts";

// Create a composition with all common properties
const composition = new COMPOSITION({
  archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
  name: "Blood Pressure Recording",
  language: "ISO_639-1::en",           // Terse format for codes
  territory: "ISO_3166-1::GB",
  category: "openehr::433|event|",     // Terse format for coded text
  composer: {
    name: "Dr. Smith"
  }
});

// Modify properties directly
composition.uid = "8849182c-82ad-4088-a07f-48ead4180515::uk.nhs.example::1";
```

**Key features:**
- Constructor accepts initialization objects for all properties
- Use terse format strings for codes: `"terminology::code"` for CODE_PHRASE, `"terminology::code|value|"` for DV_CODED_TEXT
- Mix constructor initialization with direct property assignment as needed
- Full type safety with IDE autocomplete

See [SIMPLIFIED-CREATION-GUIDE.md](SIMPLIFIED-CREATION-GUIDE.md) for comprehensive examples and best practices.

### Serialization and Deserialization

The library supports multiple serialization formats (JSON, XML, YAML):

```typescript
import { JsonConfigurableSerializer, JsonConfigurableDeserializer } from "./enhanced/serialization/json/mod.ts";

// Serialize to JSON
const serializer = new JsonConfigurableSerializer({ prettyPrint: true });
const json = serializer.serialize(composition);

// Deserialize from JSON
const deserializer = new JsonConfigurableDeserializer();
const restored = deserializer.deserialize(json);
```

**Supported formats:**
- **JSON** - Compliant with openEHR ITS-JSON specification
- **XML** - Compliant with openEHR ITS-XML specification  
- **YAML** - Human-readable format with multiple style options

See documentation in `enhanced/serialization/` for format-specific guides and configuration options.

## Additional Resources

- **[README-FOR-LIB-MAINTENANCE.md](README-FOR-LIB-MAINTENANCE.md)** - Comprehensive guide for library maintainers on generating TypeScript from openEHR BMM specifications, updating versions, and managing dependencies
- **[DUAL-APPROACH-GUIDE.md](DUAL-APPROACH-GUIDE.md)** - Detailed explanation of the dual getter/setter pattern used in this library
- **[ROADMAP.md](ROADMAP.md)** - Project roadmap and development phases
- **[SIMPLIFIED-CREATION-GUIDE.md](SIMPLIFIED-CREATION-GUIDE.md)** - Simplified guide for creating openEHR data structures
