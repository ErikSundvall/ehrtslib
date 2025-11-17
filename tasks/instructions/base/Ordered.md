# Instruction: Implementing the `Ordered` Class

## 1. Description

The `Ordered` class is an abstract ancestor for types with total ordering
(comparison operations).

- **Reference:**
  [openEHR BASE - Ordered](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_ordered_class)

## 2. Behavior

### 2.1. Abstract Methods

- **`less_than(other: Ordered): Boolean`** - Compare if this < other

### 2.2. Derived Operations

- **`less_than_or_equal(other: Ordered): Boolean`** - this <= other
- **`greater_than(other: Ordered): Boolean`** - this > other
- **`greater_than_or_equal(other: Ordered): Boolean`** - this >= other

## 3. Invariants

- **Comparison_consistent:** Comparison operations are consistent

## 4. References

- [openEHR BASE - Ordered](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_ordered_class)
