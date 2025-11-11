# `Boolean` Implementation Instructions

## Class: `Boolean`

### BMM Definition
- **Type:** `Any`
- **Documentation:** "Type representing minimal interface of built-in Boolean type."

### Implementation Details
- The `Boolean` class should have a `value` property of type `boolean`.
- The constructor should accept a `boolean` and assign it to the `value` property.

### Methods

#### `is_equal(other: any): boolean`
- **Behavior:** This method should return `true` if the `other` object is an instance of `Boolean` and its `value` is equal to the current object's `value`. Otherwise, it should return `false`.

### References
- **openEHR specifications-BASE:** [primitive_types.adoc](https://specifications.openehr.org/releases/BASE/latest/primitive_types.html#_boolean_class)
