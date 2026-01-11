# ehrtslib (Electronic Health Record TypeScript Library)

TypeScript library for (to begin with) openEHR. Intended for (partial) use both
in clients like web browsers or and in servers based on e.g. Deno or Node.js The
library is big an detailed, so developers using it are assumed to be importing
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

## Additional Resources

- **[README-FOR-LIB-MAINTENANCE.md](README-FOR-LIB-MAINTENANCE.md)** - Comprehensive guide for library maintainers on generating TypeScript from openEHR BMM specifications, updating versions, and managing dependencies
- **[DUAL-APPROACH-GUIDE.md](DUAL-APPROACH-GUIDE.md)** - Detailed explanation of the dual getter/setter pattern used in this library
- **[ROADMAP.md](ROADMAP.md)** - Project roadmap and development phases
- **[SIMPLIFIED-CREATION-GUIDE.md](SIMPLIFIED-CREATION-GUIDE.md)** - Simplified guide for creating openEHR data structures
