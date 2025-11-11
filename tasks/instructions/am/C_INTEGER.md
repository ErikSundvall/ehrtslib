# Instruction: Implementing the `C_INTEGER` Class

## 1. Description

C_INTEGER constrains Integer values.

-   **Reference:** [openEHR AM - C_INTEGER](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_integer_class)

## 2. Behavior

- `list: List<Integer>` - Allowed values
- `range: Interval<Integer>` - Allowed range

## 3. Example Usage

```typescript
const cInt = new C_INTEGER();
cInt.list = [0, 1, 2, 3, 4, 5];

// Or with range
const cRange = new C_INTEGER();
cRange.range = new Interval<Integer>();
cRange.range.lower = 0;
cRange.range.upper = 200;
```

## 4. References

-   **Official Specification:** [openEHR AM - C_INTEGER](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_integer_class)
