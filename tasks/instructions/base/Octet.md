# `Octet` Implementation Instructions

## Class: `Octet`

### BMM Definition
- **Type:** `Ordered`
- **Documentation:** "Type representing minimal interface of built-in Octet type."

### Implementation Details
- The `Octet` class should have a `value` property of type `number`.
- The constructor should accept a `number` between 0 and 255 and assign it to the `value` property.

### Methods

#### `is_equal(other: any): boolean`
- **Behavior:** This method should return `true` if the `other` object is an instance of `Octet` and its `value` is equal to the current object's `value`. Otherwise, it should return `false`.

#### `less_than(other: Ordered): boolean`
- **Behavior:** This method should return `true` if the `other` object is an instance of `Octet` and the current object's `value` is less than the `other` object's `value`. Otherwise, it should return `false`.

### References
- **openEHR specifications-BASE:** [primitive_types.adoc](https://specifications.openehr.org/releases/BASE/latest/primitive_types.html#_octet_class)
