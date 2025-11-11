# `Iso8601_date` Implementation Instructions

## Class: `Iso8601_date`

### BMM Definition
- **Type:** `Iso8601_type`
- **Documentation:** "Represents an ISO 8601 date, including partial and extended forms."

### Implementation Details
- The `Iso8601_date` class should have a `value` property of type `string`.
- The constructor should accept a `string` representing an ISO 8601 date and assign it to the `value` property.

### Methods

#### `is_equal(other: any): boolean`
- **Behavior:** This method should return `true` if the `other` object is an instance of `Iso8601_date` and its `value` is equal to the current object's `value`. Otherwise, it should return `false`.

#### `less_than(other: Ordered): boolean`
- **Behavior:** This method should return `true` if the `other` object is an instance of `Iso8601_date` and the current object's `value` is less than the `other` object's `value`. This will likely involve parsing the date strings.

### References
- **openEHR specifications-BASE:** [date_time_types.adoc](https://specifications.openehr.org/releases/BASE/latest/date_time_types.html#_iso8601_date_class)
