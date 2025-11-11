# `Character` Implementation Instructions

## Class: `Character`

### BMM Definition
- **Type:** `Ordered`
- **Documentation:** "Type representing minimal interface of built-in Character type."

### Implementation Details
- The `Character` class should have a `value` property of type `string`.
- The constructor should accept a `string` of length 1 and assign it to the `value` property.

### Methods

#### `is_equal(other: any): boolean`
- **Behavior:** This method should return `true` if the `other` object is an instance of `Character` and its `value` is equal to the current object's `value`. Otherwise, it should return `false`.

#### `less_than(other: Ordered): boolean`
- **Behavior:** This method should return `true` if the `other` object is an instance of `Character` and the current object's `value` is less than the `other` object's `value`. Otherwise, it should return `false`.

### References
- **openEHR specifications-BASE:** [primitive_types.adoc](https://specifications.openehr.org/releases/BASE/latest/primitive_types.html#_character_class)
