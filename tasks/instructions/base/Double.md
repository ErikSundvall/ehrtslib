# `Double` Implementation Instructions

## Class: `Double`

### BMM Definition
- **Type:** `Ordered_Numeric`
- **Documentation:** "Type used to represent double-precision decimal numbers. Corresponds to a double-precision floating point value in most languages."

### Implementation Details
- The `Double` class should have a `value` property of type `number`.
- The constructor should accept a `number` and assign it to the `value` property.

### Methods

#### `is_equal(other: any): boolean`
- **Behavior:** This method should return `true` if the `other` object is an instance of `Double` and its `value` is equal to the current object's `value`. Otherwise, it should return `false`.

#### `less_than(other: Ordered): boolean`
- **Behavior:** This method should return `true` if the `other` object is an instance of `Double` and the current object's `value` is less than the `other` object's `value`. Otherwise, it should return `false`.

### References
- **openEHR Archie (Java):** [Archie DOUBLE.java](https://github.com/openEHR/archie/blob/master/aom/src/main/java/com/nedap/archie/base/basic/DOUBLE.java)
- **openEHR specifications-BASE:** [primitive_types.adoc](https://specifications.openehr.org/releases/BASE/latest/primitive_types.html#_double_class)
