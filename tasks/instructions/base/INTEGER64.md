# Instruction: Implementing the `Integer64` Class

## 1. Description

The `Integer64` class is an openEHR wrapper for 64-bit integers, providing
extended range beyond standard 32-bit integers.

- **Reference:**
  [openEHR BASE - Foundation Types - Integer64](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_integer64_class)

## 2. Behavior

The `Integer64` class has the same operations as `Integer` but with 64-bit
range.

### 2.1. Constructor and Factory Methods

- **Pseudo-code:**
  ```typescript
  constructor() {
    super();
    this._value = 0;
  }

  static from(val: number | bigint): Integer64 {
    const int64 = new Integer64();
    // JavaScript Number can safely represent integers up to 2^53-1
    // For true 64-bit, consider using BigInt
    if (typeof val === 'bigint') {
      int64._value = Number(val);
    } else {
      int64._value = val;
    }
    return int64;
  }
  ```

### 2.2. Arithmetic and Comparison Operations

All operations mirror `Integer` class:

- `add(other: Numeric): Numeric`
- `subtract(other: Numeric): Numeric`
- `multiply(other: Numeric): Numeric`
- `divide(other: Numeric): Real`
- `modulo(other: Integer64): Integer64`
- `power(other: Integer64): Integer64`
- `negative(): Integer64`
- `abs(): Integer64`
- `floor(): Integer64` (returns self)
- `ceiling(): Integer64` (returns self)
- `is_equal(other: Any): Boolean`
- `less_than(other: Ordered): Boolean`

See INTEGER.md for detailed pseudo-code of each operation.

## 3. Invariants

- Value is within 64-bit integer range.

## 4. Pre-conditions

- For division and modulo, divisor must not be zero.

## 5. Post-conditions

- Operations return new Integer64 objects (immutability).
- Results stay within 64-bit range or throw overflow errors.

## 6. Example Usage

```typescript
const a = Integer64.from(9223372036854775807n); // Max 64-bit int
const b = Integer64.from(100);

console.log(a.add(b).value); // Overflow handling needed
console.log(b.multiply(Integer64.from(2)).value); // 200
```

## 7. Test Cases

Same as Integer class plus:

1. Test with large 64-bit values
2. Test overflow detection
3. Test operations near max/min 64-bit values
4. Test with JavaScript BigInt interop

## 8. References

- [openEHR BASE Specification - Integer64](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_integer64_class)
- [JavaScript BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
