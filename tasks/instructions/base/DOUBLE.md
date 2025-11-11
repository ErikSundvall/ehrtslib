# Instruction: Implementing the `Double` Class

## 1. Description

The `Double` class is an openEHR wrapper around double-precision floating-point numbers. It extends `Ordered_Numeric` and provides higher precision than `Real`.

-   **Reference:** [openEHR BASE - Foundation Types - Double](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_double_class)

## 2. Behavior

The `Double` class has essentially the same behavior as `Real` but with double precision. Implementation is nearly identical to `REAL.md`.

### 2.1. Constructor and Factory Methods

-   **Pseudo-code:**
    ```typescript
    constructor() {
      super();
      this._value = 0.0;
    }
    
    static from(val: number): Double {
      const dbl = new Double();
      dbl._value = val;
      return dbl;
    }
    ```

### 2.2. Arithmetic and Comparison Operations

All operations mirror `Real` class:
- `add(other: Numeric): Numeric`
- `subtract(other: Numeric): Numeric`
- `multiply(other: Numeric): Numeric`
- `divide(other: Numeric): Double`
- `power(exponent: Numeric): Double`
- `negative(): Double`
- `abs(): Double`
- `floor(): Integer`
- `ceiling(): Integer`
- `is_equal(other: Any): Boolean`
- `less_than(other: Ordered): Boolean`

See REAL.md for detailed pseudo-code of each operation.

## 3. Invariants

-   Value is a valid double-precision floating-point number.

## 4. Pre-conditions

-   For division, divisor must not be zero.

## 5. Post-conditions

-   Operations return new Double objects (immutability).
-   Results have double precision accuracy.

## 6. Example Usage

```typescript
const a = Double.from(10.123456789);
const b = Double.from(3.987654321);

console.log(a.add(b).value);       // 14.11111111
console.log(a.multiply(b).value);  // 40.36...

console.log(a.floor().value);      // 10
console.log(a.ceiling().value);    // 11
```

## 7. Test Cases

Same as Real class:
1. Test creation and arithmetic operations
2. Test division by zero throws error
3. Test negative and abs
4. Test floor and ceiling
5. Test comparison operations
6. Test precision handling
7. Test operations with mixed numeric types

## 8. References

-   [openEHR BASE Specification - Double](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_double_class)
-   [IEEE 754 double-precision](https://en.wikipedia.org/wiki/Double-precision_floating-point_format)
