# Instruction: Implementing the `DATA_VALUE` Class

## 1. Description

The `DATA_VALUE` class is the abstract parent for all data value types in
openEHR. It represents actual clinical or administrative data values.

- **Reference:**
  [openEHR RM - DATA_VALUE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_data_value_class)

## 2. Behavior

### 2.1. Abstract Class

DATA_VALUE is abstract and cannot be instantiated directly. All clinical data
must use concrete subtypes:

- DV_TEXT, DV_CODED_TEXT - Text values
- DV_QUANTITY, DV_COUNT - Numeric values
- DV_DATE, DV_TIME, DV_DATE_TIME, DV_DURATION - Temporal values
- DV_BOOLEAN - Boolean values
- DV_ORDINAL - Ordinal values
- DV_PROPORTION - Ratios/percentages
- DV_IDENTIFIER - Identifiers
- DV_URI, DV_EHR_URI - URIs
- DV_MULTIMEDIA, DV_PARSABLE - Complex types

### 2.2. Common Behavior

All DATA_VALUE subtypes should implement:

- Value equality comparison (`is_equal`)
- String representation
- Validation of constraints

## 3. Invariants

None at the abstract level - enforced by concrete subtypes.

## 4. Example Usage

```typescript
// Cannot instantiate DATA_VALUE directly
// const dv = new DATA_VALUE();  // Error!

// Use concrete subtypes
const text: DATA_VALUE = DV_TEXT.from("Blood pressure measurement");
const quantity: DATA_VALUE = DV_QUANTITY.from(120, "mm[Hg]");
const coded: DATA_VALUE = DV_CODED_TEXT.from(
  "Male",
  CODE_PHRASE.from("at0001", "local"),
);
```

## 5. Test Cases

1. Test cannot instantiate abstract DATA_VALUE
2. Test all concrete subtypes can be assigned to DATA_VALUE type
3. Test polymorphic usage in ELEMENT

## 6. References

- [openEHR RM - DATA_VALUE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_data_value_class)
- [Archie DATA_VALUE](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/datavalues/DataValue.java)
