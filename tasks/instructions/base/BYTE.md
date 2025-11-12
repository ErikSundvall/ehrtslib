# Instruction: Implementing the `Byte` Class

## 1. Description

The `Byte` class is an alias or closely related to `Octet`, representing an 8-bit byte value. Implementation is essentially identical to `OCTET.md`.

-   **Reference:** [openEHR BASE - Foundation Types - Byte](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_byte_class)

## 2. Behavior

The `Byte` class has identical behavior to `Octet`:
- Range: 0-255
- Bitwise operations: and, or, xor, not
- Shift operations: shift_left, shift_right
- Comparison operations: is_equal, less_than

See OCTET.md for complete implementation details.

## 3. Invariants

-   **Range_valid:** `0 <= value <= 255`

## 4. Pre-conditions

-   Value must be in range 0-255.

## 5. Post-conditions

-   Operations return new Byte objects (immutability).
-   Results are within 0-255 range.

## 6. Example Usage

```typescript
const byte = Byte.from(255);
console.log(byte.value);               // 255
console.log(byte.not().value);         // 0
```

## 7. Test Cases

Same as Octet class - see OCTET.md.

## 8. References

-   [openEHR BASE Specification - Byte](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_byte_class)
-   See also OCTET.md for detailed implementation
