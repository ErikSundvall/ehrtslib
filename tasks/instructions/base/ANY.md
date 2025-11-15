# Instruction: Implementing the `Any` Class

## 1. Description

The `Any` class is the abstract ancestor for all other classes in the openEHR
model. It provides the fundamental semantics for value and reference equality.
It is an abstract class and cannot be instantiated directly.

- **Reference:**
  [openEHR Foundation Types Specification - Any Class](https://specifications.openehr.org/releases/BASE/development/foundation_types.html#_any_class)

## 2. Behavior

The `Any` class must define the following abstract methods, which will be
implemented by its concrete descendants.

### 2.1. `is_equal(other: Any): boolean`

- **Purpose:** Compares the value of the current object with another. This
  method is intended to be overridden by all descendants to provide specific
  value-based equality checks.
- **Behavior:**
  - Should return `true` if the `other` object is considered equal in value to
    the current object.
  - Should return `false` otherwise.
- **Pseudo-code:**
  ```
  abstract is_equal(other: Any): boolean;
  ```

### 2.2. `equal(other: Any): boolean`

- **Purpose:** Provides reference equality for reference types and value
  equality for value types. In a TypeScript/JavaScript context, this can be
  implemented using the strict equality operator (`===`).
- **Behavior:**
  - Should return `true` if `this` and `other` refer to the same object in
    memory.
- **Pseudo-code:**
  ```
  equal(other: Any): boolean {
    return this === other;
  }
  ```

### 2.3. `instance_of(a_type: string): Any`

- **Purpose:** This method is described in the specification but is more of a
  meta-programming feature. In a TypeScript context, we will define it, but its
  implementation may be limited.
- **Behavior:**
  - The specification suggests it creates a new instance of a type. This is not
    straightforward to implement in a generic way in TypeScript. For now, the
    implementation should throw an error indicating it's not supported.
- **Pseudo-code:**
  ```
  instance_of(a_type: string): Any {
    throw new Error("Not implemented");
  }
  ```

### 2.4. `type_of(an_object: Any): string`

- **Purpose:** Returns the type name of an object as a string.
- **Behavior:**
  - Should return the name of the class of `an_object`.
- **Pseudo-code:**
  ```
  type_of(an_object: Any): string {
    return an_object.constructor.name;
  }
  ```

### 2.5. `not_equal(other: Any): boolean`

- **Purpose:** The inverse of the `equal` method.
- **Behavior:**
  - Should return `true` if the current object is not equal to the `other`
    object.
- **Pseudo-code:**
  ```
  not_equal(other: Any): boolean {
    return !this.equal(other);
  }
  ```

## 3. Invariants

- None specified for the `Any` class itself, but its methods form the basis for
  invariants in descendant classes.

## 4. Pre-conditions

- None for the abstract `Any` class. Concrete implementations must ensure proper
  construction.

## 5. Post-conditions

- `equal(x)` returns true if and only if `this` and `x` are the same object
  reference.
- `not_equal(x)` always returns the opposite of `equal(x)`.

## 6. Example Usage

```typescript
class ConcreteType extends Any {
  constructor(public value: number) {
    super();
  }

  is_equal(other: any): boolean {
    if (!(other instanceof ConcreteType)) {
      return false;
    }
    return this.value === other.value;
  }
}

const a = new ConcreteType(1);
const b = new ConcreteType(1);
const c = new ConcreteType(2);
const d = a;

// is_equal (value equality)
a.is_equal(b); // true
a.is_equal(c); // false

// equal (reference equality)
a.equal(b); // false
a.equal(d); // true
```

## 7. Test Cases

Key test cases to implement:

1. Test `is_equal` returns true for objects with same values
2. Test `is_equal` returns false for objects with different values
3. Test `equal` returns true for same reference
4. Test `equal` returns false for different references (even with same values)
5. Test `not_equal` returns opposite of `equal`
6. Test `type_of` returns correct class name
7. Test abstract class cannot be instantiated directly
8. Test concrete implementations properly override abstract methods

## 8. References

- [openEHR BASE Specification - Any Class](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_any_class)
- [Archie - Base types](https://github.com/openEHR/archie/tree/master/openehr-rm/src/main/java/com/nedap/archie)
- [Java-libs - Any equivalent](https://github.com/openEHR/java-libs/tree/master/openehr-rm-core)
