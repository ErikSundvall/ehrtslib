# ehrtslib (Electronic Health Record TypeScript Library)

[Experimental website](https://eriksundvall.github.io/ehrtslib)

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
- **JSON** - Compliant with openEHR ITS-JSON specification, plus optimized variants (compact, type-inferred). See [JSON serialization guide](enhanced/serialization/json/README.md)
- **XML** - Compliant with openEHR ITS-XML specification. See [XML serialization guide](enhanced/serialization/xml/README.md)
- **YAML** - Human-readable format with multiple style options. See [YAML serialization guide](enhanced/serialization/yaml/README.md)
- **ZipEHR (experimental)** - Compact ZipEHR YAML/JSON with symbol variants `emoji` (default) and `lettercode` (Ehrbase short letter codes). See [`enhanced/serialization/zipehr/ehrbase-short-codes.md`](enhanced/serialization/zipehr/ehrbase-short-codes.md) for the mapping.
- **SIMPLIFIED (experimental)** - Experimental FLAT/STRUCTURED simplified openEHR representation for operational templates. See [SIMPLIFIED-CREATION-GUIDE.md](SIMPLIFIED-CREATION-GUIDE.md).

### Archetype and Template Support

The library includes support for the openEHR Archetype Model (AM) layer for **ADL 2** and **ADL 1.4** (via conversion).

**What to expect:** see **[docs/ADL_SUPPORT.md](docs/ADL_SUPPORT.md)** (parser, serializer, 1.4 conversion, rules, validation).

#### ADL parsing (1.4 and 2.x)

```typescript
import { parseAdl } from "./enhanced/parser/mod.ts";

const { archetype, warnings, convertedFrom14 } = parseAdl(adlText);
// ADL 1.4 is converted to ADL2 syntax automatically
```

Low-level ADL2-only API: `ADL2Tokenizer` + `ADL2Parser` in `enhanced/parser/`.

**Not included:** full Archie JVM semantic validator; deep legacy AOM code migration (ac-code/value_sets) — see [ADL_SUPPORT.md](docs/ADL_SUPPORT.md).

#### Validation Framework
Comprehensive validation of RM instances against templates/archetypes:

```typescript
import { TemplateValidator } from "./enhanced/validation/template_validator.ts";

const validator = new TemplateValidator({
  validateUnits: true,                // UCUM unit validation
  validateTerminology: true,          // Terminology validation
  validateIntervals: true,            // DV_INTERVAL bounds validation
  validateRMSpecification: true,      // RM spec constraints (e.g., COMPOSITION.category)
  useTypeRegistry: true,              // Type resolution
});

await validator.initialize();
const result = validator.validate(rmInstance, template); // includes rules/invariants when present

if (!result.valid) {
  result.errors.forEach(err => {
    console.log(`${err.path}: ${err.message} [${err.constraintType}]`);
  });
}
```

**Validation Features:**
- **Occurrence and cardinality** constraints
- **Primitive constraints**: patterns, ranges, value lists
- **UCUM unit validation** using official UCUM library
- **Terminology validation**: DV_CODED_TEXT structure
- **Interval validation**: DV_INTERVAL bounds and ordering
- **RM specification constraints**: e.g., COMPOSITION.category must be 431|persistent| or 433|event|
- **TypeRegistry integration** for type resolution

#### Code Generation
Generate TypeScript code from templates with natural language names:

```typescript
import { TypeScriptGenerator } from "./enhanced/generation/mod.ts";

const generator = new TypeScriptGenerator({ language: "en" });
const code = generator.generate(template);
```

#### Complete Documentation
- **[ADL support (1.4 + 2.x)](docs/ADL_SUPPORT.md)** - Feature matrix and conversion limits
- **[Archetype and Template Usage Guide](examples/archetype_template_usage.ts)** - Complete examples of parsing, validation, and generation
- **[Validation Framework](enhanced/validation/)** - Comprehensive validation with multiple validators
- **[Code Generation](enhanced/generation/)** - Generate TypeScript, RM instances, and serialize to ADL2

## Additional Resources

- **[README-FOR-LIB-MAINTENANCE.md](README-FOR-LIB-MAINTENANCE.md)** - Comprehensive guide for library maintainers on generating TypeScript from openEHR BMM specifications, updating versions, and managing dependencies
- **[DUAL-APPROACH-GUIDE.md](DUAL-APPROACH-GUIDE.md)** - Detailed explanation of the dual getter/setter pattern used in this library
- **[ROADMAP.md](ROADMAP.md)** - Project roadmap and development phases
- **[SIMPLIFIED-CREATION-GUIDE.md](SIMPLIFIED-CREATION-GUIDE.md)** - Simplified guide for creating openEHR data structures
