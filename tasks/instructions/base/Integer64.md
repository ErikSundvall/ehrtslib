# `Integer64` Implementation Instructions

## Class: `Integer64`

### BMM Definition
- **Type:** `Ordered_Numeric`
- **Documentation:** "Type representing minimal interface of built-in Integer64 type."

### Implementation Details
- The `Integer64` class should have a `value` property of type `bigint`.
- The constructor should accept a `bigint` and assign it to the `value` property.

### Methods

#### `is_equal(other: any): boolean`
- **Behavior:** This method should return `true` if the `other` object is an instance of `Integer64` and its `value` is equal to the current object's `value`. Otherwise, it should return `false`.

#### `less_than(other: Ordered): boolean`
- **Behavior:** This method should return `true` if the `other` object is an instance of `Integer64` and the current object's `value` is less than the `other` object's `value`. Otherwise, it should return `false`.

### References
- **openEHR specifications-BASE:** [primitive_types.adoc](https://specifications.openehr.org/releases/BASE/latest/primitive_types.html#_integer64_class)
