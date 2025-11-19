# Dual Getter/Setter Approach for Primitive Types

## Overview

The ehrtslib library uses a **dual getter/setter pattern** to provide both developer convenience (using primitive types) and type safety (using wrapper classes). This allows natural JavaScript/TypeScript syntax while maintaining openEHR's type hierarchy and validation semantics.

## The Problem

openEHR's BASE specification defines primitive types (String, Integer, Boolean, etc.) as **wrapper classes** with methods and validation, not as JavaScript primitives. However, forcing developers to always use wrapper objects is cumbersome:

```typescript
// ❌ Cumbersome - developers don't want this
person.name = new String("John");
const age = new Integer(42);
```

```typescript
// ✅ Natural - what developers expect
person.name = "John";
const age = 42;
```

## The Solution: Dual Pattern

The dual pattern provides **two ways to access properties**:

### 1. Default Access (Primitives)
Use the property name directly for primitive values:

```typescript
// Setting - accepts primitives (auto-wrapped with validation)
person.name = "John";
dateTime.value = "2025-11-19T10:30:00Z";

// Getting - returns primitives
const name: string = person.name;  // Returns primitive string
const date: string = dateTime.value;  // Returns primitive string
```

### 2. Typed Access (Wrappers)
Use the `$` prefix to access the wrapper object and its methods:

```typescript
// Getting wrapper - access wrapper methods
const nameWrapper: String = person.$name;
if (nameWrapper.is_empty()) {
  console.log("Name is empty");
}

const dateWrapper: String = dateTime.$value;
const length = dateWrapper.count();  // Use String methods
```

## Implementation Pattern

### For Primitive Wrapper Classes

Primitive wrapper classes (String, Integer, Double, Boolean, etc.) have a `value` property:

```typescript
export class String extends Ordered {
  value?: string;  // Direct primitive storage
  
  constructor(val?: string) {
    super();
    this.value = val;
  }
  
  static from(val?: string): String {
    return new String(val);
  }
  
  // Methods on the wrapper
  is_empty(): Boolean {
    return new Boolean((this.value || "").length === 0);
  }
}

export class Integer extends Ordered_Numeric {
  value?: number;
  
  constructor(val?: number) {
    super();
    // Validation ensures type safety
    if (val !== undefined && val !== null && !Number.isInteger(val)) {
      throw new Error(`Integer value must be an integer, got: ${val}`);
    }
    this.value = val;
  }
  
  static from(val?: number): Integer {
    return new Integer(val);
  }
}
```

### For Classes Using Primitive Wrappers

Classes that have properties using primitive wrapper types implement the dual pattern:

```typescript
export abstract class OBJECT_ID {
  // Private backing field stores the wrapper
  protected _value?: String;
  
  // Default getter returns primitive (convenient)
  get value(): string | undefined {
    return this._value?.value;
  }
  
  // Typed getter with $ prefix returns wrapper (for accessing methods)
  get $value(): String | undefined {
    return this._value;
  }
  
  // Setter accepts both primitive and wrapper with auto-wrapping
  set value(val: string | String | undefined) {
    if (val === undefined || val === null) {
      this._value = undefined;
    } else if (typeof val === "string") {
      this._value = String.from(val);  // Auto-wrap with validation
    } else {
      this._value = val;
    }
  }
}
```

## Usage Examples

### Basic Usage (Primitives)

```typescript
// Create and set using primitives
const id = new OBJECT_ID();
id.value = "abc123";  // String primitive auto-wrapped

// Read as primitive
console.log(id.value);  // "abc123" (string primitive)

// Integer example with validation
const age = new Integer(42);  // OK
const invalid = new Integer(3.14);  // Throws error - not an integer!
```

### Advanced Usage (Wrapper Methods)

```typescript
// Access wrapper to use String methods
const nameWrapper = person.$name;
if (nameWrapper && !nameWrapper.is_empty()) {
  const upper = nameWrapper.as_upper();
  console.log(upper.value);  // Access primitive from wrapper
}

// ISO8601 date example
const dateTime = new Iso8601_date_time();
dateTime.value = "2025-11-19T10:30:00Z";  // Primitive assignment

// Check if valid using wrapper
const dateWrapper = dateTime.$value;
if (dateWrapper) {
  const length = dateWrapper.count();
  console.log(`Date string length: ${length.value}`);
}
```

### Working with Arrays and Collections

```typescript
// Collections of primitives
const names: string[] = people.map(p => p.name);  // Get primitives

// Collections of wrappers for method access
const wrappers: String[] = people
  .map(p => p.$name)
  .filter(n => n !== undefined);
```

## Benefits

### Developer Experience
- **Natural syntax**: Use primitives directly for most operations
- **Discoverable**: `$` prefix makes typed access explicit
- **Backward compatible**: Existing code continues to work

### Type Safety
- **Validation**: Auto-wrapping validates at assignment time
- **Type hierarchy**: Maintains openEHR's type relationships (e.g., Uri extends String)
- **Method access**: Full wrapper API available when needed

### Maintainability
- **Clear intent**: Code documents whether you need primitive or wrapper
- **Extensible**: Easy to add new wrapper methods without breaking existing code
- **Standards compliant**: Follows openEHR BASE specification

## When to Use Which

### Use Primitive Access (Default)
- Simple value storage and retrieval
- String concatenation, number arithmetic
- Passing to standard JavaScript/TypeScript APIs
- Most common use cases (~95%)

### Use Wrapper Access (`$` prefix)
- Need to call wrapper methods (e.g., `is_empty()`, `as_upper()`)
- Type-specific operations (e.g., `String.substring()`)
- Accessing openEHR-specific functionality
- Less common, specialized use cases (~5%)

## Naming Convention

The `$` prefix for typed getters was chosen because it:
- Is visually distinct and easy to type
- Follows established patterns in reactive frameworks
- Doesn't conflict with reserved words or common property names
- Clearly signals "this returns a different type"

## Implementation Checklist

To implement the dual pattern for a new class property:

1. ✅ Declare private backing field: `protected _propertyName?: WrapperType;`
2. ✅ Implement default getter returning primitive: `get propertyName(): primitive`
3. ✅ Implement typed getter with `$`: `get $propertyName(): WrapperType`
4. ✅ Implement setter accepting both: `set propertyName(val: primitive | WrapperType)`
5. ✅ Auto-wrap primitives in setter with validation
6. ✅ Handle undefined/null cases properly

## Related Documentation

- See **STORY-PR6-AI-DEVELOPER-DIALOGUE.md** (Chapters 4-6) for detailed background and design rationale
- See **README.md** for library usage examples
- See **ROADMAP.md** for implementation phases
