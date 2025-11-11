# DV_QUANTIFIED

## Description

Abstract parent for quantified types (i.e. types with a magnitude). Provides magnitude attribute and magnitude comparison operations.

**Specification Reference:** [openEHR RM Data Types](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_quantified_class)

## Behavior

### Properties

- `magnitude`: Ordered_Numeric (abstract) - The quantified value
- `magnitude_status`: String (optional) - Status of magnitude (e.g., "=", "<", ">", "<=", ">=", "~")
- Inherits from DV_ORDERED: normal_range, other_reference_ranges, normal_status

### Methods

#### valid_magnitude_status(): boolean

True if magnitude_status is one of the valid values.

**Pseudocode:**
```typescript
function valid_magnitude_status(): boolean {
  if (!this.magnitude_status) return true;
  const valid = ["=", "<", ">", "<=", ">=", "~"];
  return valid.includes(this.magnitude_status);
}
```

## Invariants

- `Magnitude_status_valid`: magnitude_status /= Void implies valid_magnitude_status()

## Pre-conditions

None - abstract class

## Post-conditions

None - abstract class

## Example Usage

```typescript
// Abstract - see DV_QUANTITY, DV_COUNT for concrete implementations
const quantity = new DV_QUANTITY();
quantity.magnitude = 37.5;
quantity.magnitude_status = "="; // Exact value
quantity.units = "Cel";
```

## Test Cases

1. **Magnitude required**: All quantified values have magnitude
2. **Valid status**: Only valid magnitude_status values accepted
3. **Status "=" **: Exact magnitude
4. **Status "<"**: Less than magnitude
5. **Status ">"**: Greater than magnitude
6. **Status "~"**: Approximately equal to magnitude
7. **Comparison**: Magnitudes can be compared
8. **Inheritance**: Inherits normal_range from DV_ORDERED

## References

- [openEHR RM Data Types Specification](https://specifications.openehr.org/releases/RM/latest/data_types.html)
