# Instruction: Implementing the `Integer` Class

## 1. Description

The `Integer` class is an openEHR wrapper around primitive integer values. It
extends `Ordered_Numeric` to provide comparison and arithmetic operations.

- **Reference:**
  [openEHR BASE - Foundation Types - Integer](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_integer_class)

## 2. Behavior

### 2.1. Constructor and Factory Methods

- **Purpose:** Create Integer instances from primitive numbers.
- **Pseudo-code:**
  ```typescript
  constructor() {
    super();
    this._value = 0;
  }

  static from(val: number): Integer {
    const int = new Integer();
    int._value = Math.floor(val); // Ensure integer
    return int;
  }
  ```

### 2.2. `value` Property

- **Purpose:** Access the underlying primitive integer value.
- **Pseudo-code:**
  ```typescript
  private _value: number = 0;

  get value(): number {
    return this._value;
  }

  set value(val: number) {
    this._value = Math.floor(val); // Ensure integer
  }
  ```

### 2.3. `is_equal(other: Any): Boolean`

- **Purpose:** Compare two Integer objects for value equality.
- **Pseudo-code:**
  ```typescript
  is_equal(other: Any): Boolean {
    if (!(other instanceof Integer)) {
      return new Boolean(false);
    }
    return new Boolean(this.value === other.value);
  }
  ```

### 2.4. `less_than(other: Ordered): Boolean`

- **Purpose:** Compare integers numerically.
- **Pseudo-code:**
  ```typescript
  less_than(other: Ordered): Boolean {
    if (!(other instanceof Integer)) {
      throw new Error("Cannot compare Integer with non-Integer");
    }
    return new Boolean(this.value < other.value);
  }
  ```

### 2.5. Arithmetic Operations

#### `add(other: Numeric): Numeric`

- **Purpose:** Add two integers.
- **Pseudo-code:**
  ```typescript
  add(other: Numeric): Numeric {
    if (!(other instanceof Integer)) {
      throw new Error("Cannot add Integer with non-Integer");
    }
    return Integer.from(this.value + other.value);
  }
  ```

#### `subtract(other: Numeric): Numeric`

- **Purpose:** Subtract another integer.
- **Pseudo-code:**
  ```typescript
  subtract(other: Numeric): Numeric {
    if (!(other instanceof Integer)) {
      throw new Error("Cannot subtract non-Integer from Integer");
    }
    return Integer.from(this.value - other.value);
  }
  ```

#### `multiply(other: Numeric): Numeric`

- **Purpose:** Multiply two integers.
- **Pseudo-code:**
  ```typescript
  multiply(other: Numeric): Numeric {
    if (!(other instanceof Integer)) {
      throw new Error("Cannot multiply Integer with non-Integer");
    }
    return Integer.from(this.value * other.value);
  }
  ```

#### `divide(other: Numeric): Real`

- **Purpose:** Divide by another number, returning a Real.
- **Pseudo-code:**
  ```typescript
  divide(other: Numeric): Real {
    if (!(other instanceof Integer)) {
      throw new Error("Cannot divide Integer by non-Integer");
    }
    if (other.value === 0) {
      throw new Error("Division by zero");
    }
    const real = new Real();
    real.value = this.value / other.value;
    return real;
  }
  ```

#### `modulo(other: Integer): Integer`

- **Purpose:** Return the modulo (remainder) of division.
- **Pseudo-code:**
  ```typescript
  modulo(other: Integer): Integer {
    if (other.value === 0) {
      throw new Error("Modulo by zero");
    }
    return Integer.from(this.value % other.value);
  }
  ```

#### `power(other: Integer): Integer`

- **Purpose:** Raise to a power.
- **Pseudo-code:**
  ```typescript
  power(other: Integer): Integer {
    return Integer.from(Math.pow(this.value, other.value));
  }
  ```

### 2.6. `negative(): Integer`

- **Purpose:** Return the negation of this integer.
- **Pseudo-code:**
  ```typescript
  negative(): Integer {
    return Integer.from(-this.value);
  }
  ```

### 2.7. `abs(): Integer`

- **Purpose:** Return the absolute value.
- **Pseudo-code:**
  ```typescript
  abs(): Integer {
    return Integer.from(Math.abs(this.value));
  }
  ```

### 2.8. `floor(): Integer` and `ceiling(): Integer`

- **Purpose:** For Integer, these return the value itself.
- **Pseudo-code:**
  ```typescript
  floor(): Integer {
    return this;
  }

  ceiling(): Integer {
    return this;
  }
  ```

## 3. Invariants

- None specific, but inherits numeric invariants from parent classes.

## 4. Pre-conditions

- For division and modulo, the divisor must not be zero.

## 5. Post-conditions

- Arithmetic operations return new Integer objects (immutability).

## 6. Example Usage

```typescript
const a = Integer.from(10);
const b = Integer.from(3);

console.log(a.add(b).value); // 13
console.log(a.subtract(b).value); // 7
console.log(a.multiply(b).value); // 30
console.log(a.divide(b).value); // 3.333...
console.log(a.modulo(b).value); // 1
console.log(a.power(Integer.from(2)).value); // 100

console.log(a.less_than(b)); // false
console.log(b.less_than(a)); // true
console.log(a.is_equal(Integer.from(10))); // true

const c = Integer.from(-5);
console.log(c.negative().value); // 5
console.log(c.abs().value); // 5
```

## 7. Test Cases

Key test cases to implement:

1. Test creation with factory method
2. Test value equality vs reference equality
3. Test comparison operations (less_than, is_equal, etc.)
4. Test addition, subtraction, multiplication
5. Test division returns Real
6. Test modulo operation
7. Test power operation
8. Test negative and abs
9. Test floor and ceiling (should return self)
10. Test division by zero throws error
11. Test modulo by zero throws error
12. Test with negative numbers
13. Test with zero
14. Test large integers (within JavaScript safe integer range)

## 8. References

- [openEHR BASE Specification - Foundation Types - Integer](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_integer_class)
- [Archie - Numeric types](https://github.com/openEHR/archie/tree/master/openehr-rm/src/main/java/com/nedap/archie)
