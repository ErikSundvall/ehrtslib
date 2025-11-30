# Design Alternatives: Remaining Unimplemented BASE Methods

## Overview

Three methods in the BASE package remain intentionally unimplemented. This report analyzes each method, explores how they're used by RM and LANG packages, and proposes design alternatives that align with the openEHR specification intent.

## Method 1: `Any.instance_of(a_type: String): Any`

### Specification Intent
Creates a new instance of a type given its name as a string. This is a **factory method** for dynamic type instantiation.

### Current Implementation
```typescript
instance_of(a_type: String): Any {
  throw new Error("Method instance_of not yet implemented.");
}
```

### Usage Analysis
- **LANG package**: Used in BMM (Basic Meta-Model) for dynamic class instantiation from schema definitions
- **RM package**: Not directly used, but could be useful for dynamic clinical data creation

### Design Alternatives

#### Alternative A: Registry-Based Factory (Recommended)
Create a type registry that maps type names to constructors.

```typescript
// Type registry
const TYPE_REGISTRY: Map<string, new () => Any> = new Map();

// Registration function
export function registerType(name: string, constructor: new () => Any): void {
  TYPE_REGISTRY.set(name.toUpperCase(), constructor);
}

// Implementation
instance_of(a_type: String): Any {
  const typeName = a_type?.value?.toUpperCase() || "";
  const constructor = TYPE_REGISTRY.get(typeName);
  if (!constructor) {
    throw new Error(`Unknown type: ${a_type?.value}`);
  }
  return new constructor();
}
```

**Pros:**
- Type-safe at runtime
- Explicit registration of supported types
- Easy to extend with new types
- Works well with TypeScript

**Cons:**
- Requires manual registration
- Not fully dynamic (only registered types work)

#### Alternative B: Module Reflection
Use TypeScript/JavaScript module imports to dynamically look up types.

```typescript
instance_of(a_type: String): Any {
  const typeName = a_type?.value || "";
  // Import all types and look up by name
  const allTypes = { ...openehr_rm, ...openehr_base, ...openehr_lang };
  const TypeClass = allTypes[typeName];
  if (!TypeClass || typeof TypeClass !== "function") {
    throw new Error(`Unknown type: ${typeName}`);
  }
  return new TypeClass();
}
```

**Pros:**
- No manual registration needed
- Works with all exported types

**Cons:**
- Less type-safe
- Depends on module structure
- Performance overhead

#### Alternative C: Abstract Factory Pattern
Define an abstract factory interface implemented by each package.

```typescript
interface TypeFactory {
  canCreate(typeName: string): boolean;
  create(typeName: string): Any;
}

// Each package implements its factory
class RMTypeFactory implements TypeFactory { ... }
class LANGTypeFactory implements TypeFactory { ... }

instance_of(a_type: String): Any {
  for (const factory of registeredFactories) {
    if (factory.canCreate(a_type.value)) {
      return factory.create(a_type.value);
    }
  }
  throw new Error(`Unknown type: ${a_type?.value}`);
}
```

**Pros:**
- Clean separation of concerns
- Package-level encapsulation
- Extensible

**Cons:**
- More complex setup
- Requires factory registration

### Recommendation
**Alternative A (Registry-Based Factory)** is recommended because:
1. It's simple and explicit
2. Works well with TypeScript's type system
3. Registration can happen at module load time
4. Clear error messages for unregistered types

---

## Method 2: `Container<T>.matching(test: Operation<T>): T`

### Specification Intent
Returns a **List** of all items matching a predicate function. Similar to JavaScript's `filter()`.

### Current Implementation
```typescript
matching(test: Operation<T>): T {
  throw new Error("Method matching not yet implemented.");
}
```

### Note on Return Type
The specification says it returns a **List**, but the current signature returns `T`. This appears to be a specification/implementation mismatch. It should return `List<T>` (or equivalent array/container).

### Usage Analysis
- **LANG package**: Used in `BMM_MODEL` to find classes, properties, etc. matching criteria
- **RM package**: Could be used to filter items in `CLUSTER`, `ITEM_LIST`, etc.

### Design Alternatives

#### Alternative A: Implement in Concrete Subclasses (Recommended)
Since `Container<T>` is abstract, implement `matching()` in each concrete subclass.

```typescript
// In List<T>
matching(test: Operation<T>): List<T> {
  const results = new List<T>();
  for (const item of this._items) {
    const testResult = test(item);
    if (testResult?.value === true) {
      results.add(item);
    }
  }
  return results;
}

// In Hash<K, V>
matching(test: Operation<K>): List<K> {
  const results = new List<K>();
  for (const entry of this._map.values()) {
    const testResult = test(entry.key);
    if (testResult?.value === true) {
      results.add(entry.key);
    }
  }
  return results;
}
```

**Pros:**
- Type-correct for each container type
- Can optimize for each data structure
- Clear semantics

**Cons:**
- Duplicate logic in each subclass

#### Alternative B: Default Implementation Using Iterator
Provide a default implementation that works with any iterable.

```typescript
abstract class Container<T> {
  abstract [Symbol.iterator](): Iterator<T>;
  
  matching(test: Operation<T>): List<T> {
    const results = new List<T>();
    for (const item of this) {
      const testResult = test(item);
      if (testResult?.value === true) {
        results.add(item);
      }
    }
    return results;
  }
}
```

**Pros:**
- Single implementation
- Works with any iterable container

**Cons:**
- Requires iterator support in all subclasses
- May not be optimal for all data structures

#### Alternative C: Use JavaScript Array.filter() Internally

```typescript
matching(test: Operation<T>): List<T> {
  const items = this.toArray(); // Abstract method to get items
  const filtered = items.filter(item => {
    const result = test(item);
    return result?.value === true;
  });
  return List.from(filtered);
}
```

**Pros:**
- Leverages JavaScript's native filter
- Simple implementation

**Cons:**
- Creates intermediate arrays
- Requires `toArray()` method

### Recommendation
**Alternative A (Implement in Concrete Subclasses)** because:
1. `Container` is abstract, so subclasses must implement
2. Each container type can optimize for its data structure
3. Return type can be properly typed (`List<T>`)

---

## Method 3: `Container<T>.select(test: Operation<T>): T`

### Specification Intent
Returns the **first item** matching a predicate function, or `undefined` if no match. Similar to JavaScript's `find()`.

### Current Implementation
```typescript
select(test: Operation<T>): T {
  throw new Error("Method select not yet implemented.");
}
```

### Usage Analysis
- **LANG package**: Used in `BMM_MODEL` to find specific classes, types, packages
- **RM package**: Could find specific items in `CLUSTER`, entries in `COMPOSITION`, etc.

### Design Alternatives

#### Alternative A: Implement in Concrete Subclasses (Recommended)

```typescript
// In List<T>
select(test: Operation<T>): T | undefined {
  for (const item of this._items) {
    const testResult = test(item);
    if (testResult?.value === true) {
      return item;
    }
  }
  return undefined;
}

// In Hash<K, V>
select(test: Operation<K>): K | undefined {
  for (const entry of this._map.values()) {
    const testResult = test(entry.key);
    if (testResult?.value === true) {
      return entry.key;
    }
  }
  return undefined;
}
```

**Pros:**
- Short-circuits on first match (efficient)
- Type-correct return type
- Can optimize iteration per container

**Cons:**
- Duplicate logic

#### Alternative B: Default Implementation Using Iterator

```typescript
select(test: Operation<T>): T | undefined {
  for (const item of this) {
    const testResult = test(item);
    if (testResult?.value === true) {
      return item;
    }
  }
  return undefined;
}
```

**Pros:**
- Single implementation
- Short-circuits properly

**Cons:**
- Requires iterator support

#### Alternative C: Use JavaScript Array.find() Internally

```typescript
select(test: Operation<T>): T | undefined {
  const items = this.toArray();
  return items.find(item => {
    const result = test(item);
    return result?.value === true;
  });
}
```

**Pros:**
- Leverages native `find()`
- Simple code

**Cons:**
- Creates array first (inefficient)
- Loses short-circuit optimization

### Recommendation
**Alternative A (Implement in Concrete Subclasses)** because:
1. Short-circuit optimization is important
2. Each container can iterate efficiently
3. Proper return type handling

---

## Implementation Strategy

### Phase 1: Fix Return Types
Update method signatures to correct types:
```typescript
// Container<T>
matching(test: Operation<T>): List<T>;  // Not T
select(test: Operation<T>): T | undefined;  // Add undefined
```

### Phase 2: Implement in List and Hash
```typescript
// List<T>
class List<T> extends Container<T> {
  matching(test: Operation<T>): List<T> { ... }
  select(test: Operation<T>): T | undefined { ... }
}

// Hash<K, V>
class Hash<K, V> extends Container<K> {
  matching(test: Operation<K>): List<K> { ... }
  select(test: Operation<K>): K | undefined { ... }
}
```

### Phase 3: Implement Type Registry for instance_of
```typescript
// In openehr_base.ts
const TYPE_REGISTRY = new Map<string, new () => Any>();

export function registerType(name: string, ctor: new () => Any) {
  TYPE_REGISTRY.set(name.toUpperCase(), ctor);
}

// In Any class
instance_of(a_type: String): Any {
  const ctor = TYPE_REGISTRY.get(a_type?.value?.toUpperCase() || "");
  if (!ctor) throw new Error(`Unknown type: ${a_type?.value}`);
  return new ctor();
}

// Each package registers its types at load time
// openehr_rm.ts
registerType("DV_TEXT", DV_TEXT);
registerType("CLUSTER", CLUSTER);
// etc.
```

---

## Summary

| Method | Recommended Approach | Key Benefit |
|--------|---------------------|-------------|
| `instance_of` | Registry-Based Factory | Type-safe, explicit control |
| `matching` | Implement in subclasses | Proper return type, optimization |
| `select` | Implement in subclasses | Short-circuit, proper typing |

These approaches align with:
- openEHR specification intent
- TypeScript type system
- JavaScript idioms (filter, find)
- Performance requirements

---

## Next Steps

1. **Review this proposal** - confirm approach with maintainer
2. **Fix return type signatures** - update Container interface
3. **Implement in List/Hash** - concrete implementations
4. **Add type registry** - for instance_of
5. **Add tests** - verify all implementations
6. **Update LANG package** - use newly implemented methods

---

## Tree-Shaking Analysis

Modern bundlers (esbuild, Rollup, Webpack with terser) perform tree-shaking to eliminate unused code from production bundles. This section analyzes how each design alternative affects tree-shaking.

### General Principles for Tree-Shaking

1. **ES Module exports are tree-shakeable** - Named exports that aren't imported are eliminated
2. **Side effects prevent tree-shaking** - Code that executes at module load time cannot be removed
3. **Dynamic code prevents tree-shaking** - Runtime type lookups, eval, etc. cannot be analyzed statically
4. **Class methods are NOT individually tree-shaken** - If a class is used, all its methods are included

### Analysis by Method

#### `instance_of` Alternatives

| Alternative | Tree-Shakeable? | Notes |
|-------------|-----------------|-------|
| A: Registry-Based Factory | ✅ Partially | Registration calls at module load are side effects, but unused types won't be registered if their modules aren't imported |
| B: Module Reflection | ❌ No | Spreads all modules together, pulling in everything |
| C: Abstract Factory Pattern | ✅ Partially | Factory classes can be tree-shaken if not imported |

**Best for Tree-Shaking: Alternative A** - With careful design, registrations can be co-located with type definitions, so unused types won't register themselves.

**Optimization Strategy for Alternative A (✅ IMPLEMENTED):**
```typescript
// Instead of central registration:
// registerType("DV_TEXT", DV_TEXT);  // Side effect at module load

// Use lazy registration in type modules:
export class DV_TEXT extends DV_ENCAPSULATED {
  static {
    // Static initialization block - only runs if class is used
    TYPE_REGISTRY.set("DV_TEXT", DV_TEXT);
  }
}
```

This approach is now implemented in `enhanced/openehr_base.ts` for all registered types.
The static initialization block approach was chosen over decorators because:
1. **Zero runtime overhead** - No decorator function calls
2. **Native JavaScript** - Uses ES2022 static blocks, widely supported
3. **Simpler** - No need for decorator infrastructure
4. **Direct** - Registration happens in the class definition itself

Or use a decorator pattern that bundles can optimize (not implemented):
```typescript
@registeredType("DV_TEXT")
export class DV_TEXT extends DV_ENCAPSULATED { ... }
```

#### `matching` and `select` Alternatives

| Alternative | Tree-Shakeable? | Notes |
|-------------|-----------------|-------|
| A: Implement in Subclasses | ✅ Yes | Methods are part of class, tree-shaken with class |
| B: Default Implementation + Iterator | ✅ Yes | Same behavior as A |
| C: Use Array.filter()/find() | ✅ Yes | Same behavior as A |

**All alternatives are equivalent for tree-shaking** since they're instance methods on classes. The choice should be based on:
- Code maintainability (A has duplication, B/C are DRY)
- Performance (A can be optimized per data structure)
- Type correctness (A provides best typing)

### Recommendations for Tree-Shaking Optimization

1. **Avoid module-level side effects** - Don't execute code at import time
2. **Use ES modules exclusively** - CommonJS is harder to tree-shake
3. **Mark package.json with `"sideEffects": false`** or list only files with side effects
4. **Lazy type registration** - Only register types when they're actually instantiated
5. **Consider dynamic imports** - For large optional features

### Impact on Bundle Size

With **Alternative A (Registry-Based Factory)** and proper lazy registration:
- Applications using only `openehr_base` won't include RM or LANG types
- Type registrations only occur for imported modules
- Estimated reduction: 60-80% for basic-only usage vs importing everything

With **Alternative B (Module Reflection)**:
- All types are always included regardless of usage
- No bundle size optimization possible
- Not recommended for library consumers
