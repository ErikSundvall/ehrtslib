# Instruction: Implementing the `Real` Class

## 1. Description

The `Real` class is an openEHR wrapper around floating-point numbers. It extends
`Ordered_Numeric` to provide comparison and arithmetic operations with decimal
precision.

- **Reference:**
  [openEHR BASE - Foundation Types - Real](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_real_class)

## 2. Behavior

### 2.1. Constructor and Factory Methods

- **Purpose:** Create Real instances from primitive numbers.
- **Pseudo-code:**
  ```typescript
  constructor() {
    super();
    this._value = 0.0;
  }

  static from(val: number): Real {
    const real = new Real();
    real._value = val;
    return real;
  }
  ```

### 2.2. `value` Property

- **Purpose:** Access the underlying primitive number value.
- **Pseudo-code:**
  ```typescript
  private _value: number = 0.0;

  get value(): number {
    return this._value;
  }

  set value(val: number) {
    this._value = val;
  }
  ```

### 2.3. `is_equal(other: Any): Boolean`

- **Purpose:** Compare two Real objects for value equality.
- **Note:** Floating-point comparison should handle precision issues.
- **Pseudo-code:**
  ```typescript
  is_equal(other: Any): Boolean {
    if (!(other instanceof Real)) {
      return new Boolean(false);
    }
    // Consider using epsilon for floating-point comparison
    const epsilon = 1e-10;
    return new Boolean(Math.abs(this.value - other.value) < epsilon);
  }
  ```

### 2.4. `less_than(other: Ordered): Boolean`

- **Purpose:** Compare reals numerically.
- **Pseudo-code:**
  ```typescript
  less_than(other: Ordered): Boolean {
    if (!(other instanceof Real)) {
      throw new Error("Cannot compare Real with non-Real");
    }
    return new Boolean(this.value < other.value);
  }
  ```

### 2.5. Arithmetic Operations

#### `add(other: Numeric): Numeric`

- **Pseudo-code:**
  ```typescript
  add(other: Numeric): Numeric {
    if (other instanceof Real || other instanceof Double) {
      return Real.from(this.value + other.value);
    }
    if (other instanceof Integer) {
      return Real.from(this.value + other.value);
    }
    throw new Error("Unsupported numeric type");
  }
  ```

#### `subtract(other: Numeric): Numeric`

- **Pseudo-code:**
  ```typescript
  subtract(other: Numeric): Numeric {
    if (other instanceof Real || other instanceof Double) {
      return Real.from(this.value - other.value);
    }
    if (other instanceof Integer) {
      return Real.from(this.value - other.value);
    }
    throw new Error("Unsupported numeric type");
  }
  ```

#### `multiply(other: Numeric): Numeric`

- **Pseudo-code:**
  ```typescript
  multiply(other: Numeric): Numeric {
    if (other instanceof Real || other instanceof Double) {
      return Real.from(this.value * other.value);
    }
    if (other instanceof Integer) {
      return Real.from(this.value * other.value);
    }
    throw new Error("Unsupported numeric type");
  }
  ```

#### `divide(other: Numeric): Real`

- **Pseudo-code:**
  ```typescript
  divide(other: Numeric): Real {
    const divisor = other.value;
    if (divisor === 0) {
      throw new Error("Division by zero");
    }
    return Real.from(this.value / divisor);
  }
  ```

#### `power(exponent: Numeric): Real`

- **Pseudo-code:**
  ```typescript
  power(exponent: Numeric): Real {
    return Real.from(Math.pow(this.value, exponent.value));
  }
  ```

### 2.6. `negative(): Real`

- **Purpose:** Return the negation.
- **Pseudo-code:**
  ```typescript
  negative(): Real {
    return Real.from(-this.value);
  }
  ```

### 2.7. `abs(): Real`

- **Purpose:** Return the absolute value.
- **Pseudo-code:**
  ```typescript
  abs(): Real {
    return Real.from(Math.abs(this.value));
  }
  ```

### 2.8. `floor(): Integer`

- **Purpose:** Return the largest integer <= this value.
- **Pseudo-code:**
  ```typescript
  floor(): Integer {
    return Integer.from(Math.floor(this.value));
  }
  ```

### 2.9. `ceiling(): Integer`

- **Purpose:** Return the smallest integer >= this value.
- **Pseudo-code:**
  ```typescript
  ceiling(): Integer {
    return Integer.from(Math.ceil(this.value));
  }
  ```

## 3. Invariants

- Value is a valid floating-point number (not NaN or Infinity in normal cases).

## 4. Pre-conditions

- For division, divisor must not be zero.
- For power, handle special cases appropriately.

## 5. Post-conditions

- Arithmetic operations return new Real objects (immutability).
- Results are accurate within floating-point precision limits.

## 6. Example Usage

```typescript
const a = Real.from(10.5);
const b = Real.from(3.2);

console.log(a.add(b).value); // 13.7
console.log(a.subtract(b).value); // 7.3
console.log(a.multiply(b).value); // 33.6
console.log(a.divide(b).value); // 3.28125

console.log(a.floor().value); // 10
console.log(a.ceiling().value); // 11

const c = Real.from(-5.7);
console.log(c.negative().value); // 5.7
console.log(c.abs().value); // 5.7

console.log(a.less_than(b)); // false
console.log(b.less_than(a)); // true
```

## 7. Test Cases

Key test cases to implement:

1. Test creation with factory method
2. Test arithmetic operations with various values
3. Test division by zero throws error
4. Test negative and abs with positive/negative values
5. Test floor and ceiling operations
6. Test comparison operations
7. Test floating-point precision handling
8. Test operations with mixed types (Real, Integer)
9. Test special values (very large, very small numbers)
10. Test is_equal handles floating-point comparison properly

## 8. References

- [openEHR BASE Specification - Real](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_real_class)
- [IEEE 754 floating-point arithmetic](https://en.wikipedia.org/wiki/IEEE_754)
