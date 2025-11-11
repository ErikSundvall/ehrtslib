# `Iso8601_date_time` Implementation Instructions

## Class: `Iso8601_date_time`

### BMM Definition
- **Type:** `Iso8601_type`
- **Documentation:** "Represents an ISO 8601 date/time, including partial and extended forms."

### Implementation Details
- The `Iso8601_date_time` class should have a `value` property of type `string`.
- The constructor should accept a `string` representing an ISO 8601 date/time and assign it to the `value` property.

### Methods

#### `is_equal(other: any): boolean`
- **Behavior:** This method should return `true` if the `other` object is an instance of `Iso8601_date_time` and its `value` is equal to the current object's `value`. Otherwise, it should return `false`.

#### `less_than(other: Ordered): boolean`
- **Behavior:** This method should return `true` if the `other` object is an instance of `Iso8601_date_time` and the current object's `value` is less than the `other` object's `value`. This will likely involve parsing the date/time strings.

### References
- **openEHR specifications-BASE:** [date_time_types.adoc](https://specifications.openehr.org/releases/BASE/latest/date_time_types.html#_iso8601_date_time_class)
