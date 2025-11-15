# Instruction: Implementing the `Boolean` Class

## 1. Description

The `Boolean` class is an openEHR wrapper around the primitive boolean type. It
provides value and reference equality semantics consistent with the openEHR
model.

- **Reference:**
  [openEHR BASE - Foundation Types - Boolean](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_boolean_class)

## 2. Behavior

### 2.1. Constructor and Factory Methods

- **Purpose:** Create Boolean instances from primitive booleans.
- **Pseudo-code:**
  ```typescript
  constructor() {
    super();
    this._value = false;
  }

  static from(val: boolean): Boolean {
    const bool = new Boolean();
    bool._value = val;
    return bool;
  }
  ```

### 2.2. `value` Property

- **Purpose:** Access the underlying primitive boolean value.
- **Pseudo-code:**
  ```typescript
  private _value: boolean = false;

  get value(): boolean {
    return this._value;
  }

  set value(val: boolean) {
    this._value = val;
  }
  ```

### 2.3. `is_equal(other: Any): Boolean`

- **Purpose:** Compare two Boolean objects for value equality.
- **Pseudo-code:**
  ```typescript
  is_equal(other: Any): Boolean {
    if (!(other instanceof Boolean)) {
      return new Boolean(false);
    }
    return new Boolean(this.value === other.value);
  }
  ```

### 2.4. Logical Operations

#### `and(other: Boolean): Boolean`

- **Purpose:** Logical AND operation.
- **Pseudo-code:**
  ```typescript
  and(other: Boolean): Boolean {
    return Boolean.from(this.value && other.value);
  }
  ```

#### `or(other: Boolean): Boolean`

- **Purpose:** Logical OR operation.
- **Pseudo-code:**
  ```typescript
  or(other: Boolean): Boolean {
    return Boolean.from(this.value || other.value);
  }
  ```

#### `xor(other: Boolean): Boolean`

- **Purpose:** Logical XOR (exclusive or) operation.
- **Pseudo-code:**
  ```typescript
  xor(other: Boolean): Boolean {
    return Boolean.from(this.value !== other.value);
  }
  ```

#### `not(): Boolean`

- **Purpose:** Logical NOT operation.
- **Pseudo-code:**
  ```typescript
  not(): Boolean {
    return Boolean.from(!this.value);
  }
  ```

#### `implies(other: Boolean): Boolean`

- **Purpose:** Logical implication (if this then other).
- **Returns:** True if this is false or other is true.
- **Pseudo-code:**
  ```typescript
  implies(other: Boolean): Boolean {
    return Boolean.from(!this.value || other.value);
  }
  ```

## 3. Invariants

- Value is either true or false (enforced by type system).

## 4. Pre-conditions

- None specific to Boolean operations.

## 5. Post-conditions

- Logical operations return new Boolean objects (immutability).
- Operations follow standard boolean logic truth tables.

## 6. Example Usage

```typescript
const t = Boolean.from(true);
const f = Boolean.from(false);

console.log(t.and(f).value); // false
console.log(t.or(f).value); // true
console.log(t.xor(f).value); // true
console.log(t.xor(t).value); // false
console.log(t.not().value); // false
console.log(f.not().value); // true

// Implication
console.log(t.implies(f).value); // false (true implies false = false)
console.log(f.implies(t).value); // true (false implies anything = true)
console.log(f.implies(f).value); // true

// Equality
const t2 = Boolean.from(true);
console.log(t.is_equal(t2)); // true
console.log(t.equal(t2)); // false (different references)
```

## 7. Test Cases

Key test cases to implement:

1. Test creation with factory method
2. Test value equality vs reference equality
3. Test AND operation truth table
4. Test OR operation truth table
5. Test XOR operation truth table
6. Test NOT operation
7. Test implication operation
8. Test is_equal with same and different values
9. Test immutability (operations return new objects)

## 8. References

- [openEHR BASE Specification - Foundation Types - Boolean](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_boolean_class)
- [Logic operations truth tables](https://en.wikipedia.org/wiki/Truth_table)
