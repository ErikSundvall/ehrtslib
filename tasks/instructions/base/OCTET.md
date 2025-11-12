# Instruction: Implementing the `Octet` Class

## 1. Description

The `Octet` class represents an 8-bit byte value (0-255). It extends `Ordered` to provide comparison capabilities.

-   **Reference:** [openEHR BASE - Foundation Types - Octet](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_octet_class)

## 2. Behavior

### 2.1. Constructor and Factory Methods

-   **Purpose:** Create Octet instances from numeric values.
-   **Pseudo-code:**
    ```typescript
    constructor() {
      super();
      this._value = 0;
    }
    
    static from(val: number): Octet {
      if (val < 0 || val > 255) {
        throw new Error("Octet value must be between 0 and 255");
      }
      const octet = new Octet();
      octet._value = Math.floor(val);
      return octet;
    }
    ```

### 2.2. `value` Property

-   **Purpose:** Access the underlying byte value.
-   **Pseudo-code:**
    ```typescript
    private _value: number = 0;
    
    get value(): number {
      return this._value;
    }
    
    set value(val: number) {
      if (val < 0 || val > 255) {
        throw new Error("Octet value must be between 0 and 255");
      }
      this._value = Math.floor(val);
    }
    ```

### 2.3. `is_equal(other: Any): Boolean`

-   **Purpose:** Compare two Octet objects.
-   **Pseudo-code:**
    ```typescript
    is_equal(other: Any): Boolean {
      if (!(other instanceof Octet)) {
        return new Boolean(false);
      }
      return new Boolean(this.value === other.value);
    }
    ```

### 2.4. `less_than(other: Ordered): Boolean`

-   **Purpose:** Compare octets numerically.
-   **Pseudo-code:**
    ```typescript
    less_than(other: Ordered): Boolean {
      if (!(other instanceof Octet)) {
        throw new Error("Cannot compare Octet with non-Octet");
      }
      return new Boolean(this.value < other.value);
    }
    ```

### 2.5. Bitwise Operations

#### `and(other: Octet): Octet`

-   **Purpose:** Bitwise AND.
-   **Pseudo-code:**
    ```typescript
    and(other: Octet): Octet {
      return Octet.from(this.value & other.value);
    }
    ```

#### `or(other: Octet): Octet`

-   **Purpose:** Bitwise OR.
-   **Pseudo-code:**
    ```typescript
    or(other: Octet): Octet {
      return Octet.from(this.value | other.value);
    }
    ```

#### `xor(other: Octet): Octet`

-   **Purpose:** Bitwise XOR.
-   **Pseudo-code:**
    ```typescript
    xor(other: Octet): Octet {
      return Octet.from(this.value ^ other.value);
    }
    ```

#### `not(): Octet`

-   **Purpose:** Bitwise NOT.
-   **Pseudo-code:**
    ```typescript
    not(): Octet {
      return Octet.from(~this.value & 0xFF); // Mask to 8 bits
    }
    ```

#### `shift_left(n: Integer): Octet`

-   **Purpose:** Left shift by n bits.
-   **Pseudo-code:**
    ```typescript
    shift_left(n: Integer): Octet {
      return Octet.from((this.value << n.value) & 0xFF);
    }
    ```

#### `shift_right(n: Integer): Octet`

-   **Purpose:** Right shift by n bits.
-   **Pseudo-code:**
    ```typescript
    shift_right(n: Integer): Octet {
      return Octet.from((this.value >> n.value) & 0xFF);
    }
    ```

## 3. Invariants

-   **Range_valid:** `0 <= value <= 255`

## 4. Pre-conditions

-   Value must be in range 0-255.
-   Shift amounts should be reasonable (0-7 for 8-bit values).

## 5. Post-conditions

-   Operations return new Octet objects (immutability).
-   Results are within 0-255 range.

## 6. Example Usage

```typescript
const a = Octet.from(0b11001100);  // 204
const b = Octet.from(0b10101010);  // 170

console.log(a.and(b).value);       // 136 (0b10001000)
console.log(a.or(b).value);        // 238 (0b11101110)
console.log(a.xor(b).value);       // 102 (0b01100110)
console.log(a.not().value);        // 51  (0b00110011)

console.log(a.shift_left(Integer.from(2)).value);  // 48 (shifted & masked)
console.log(a.shift_right(Integer.from(2)).value); // 51

console.log(a.less_than(b));       // false (204 > 170)
```

## 7. Test Cases

Key test cases to implement:
1. Test creation with valid values (0-255)
2. Test creation throws error for negative values
3. Test creation throws error for values > 255
4. Test bitwise AND operation
5. Test bitwise OR operation
6. Test bitwise XOR operation
7. Test bitwise NOT operation
8. Test left shift
9. Test right shift
10. Test comparison operations
11. Test value equality
12. Test with boundary values (0, 255)

## 8. References

-   [openEHR BASE Specification - Octet](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_octet_class)
-   [Bitwise operations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators)
