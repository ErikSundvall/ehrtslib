# DV_ORDERED

## Description

Abstract parent class for ordered data values. Provides comparison operations
for any data value type that has a natural ordering.

**Specification Reference:**
[openEHR RM Data Types](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_ordered_class)

## Behavior

### Properties

- `normal_range`: REFERENCE_RANGE<DV_ORDERED> (optional) - The normal range for
  this value
- `other_reference_ranges`: List<REFERENCE_RANGE<DV_ORDERED>> (optional) - Other
  reference ranges
- `normal_status`: CODE_PHRASE (optional) - Status of value relative to normal
  range

### Methods

#### is_normal()

Returns true if the value is within the normal range.

**Pseudocode:**

```typescript
function is_normal(): boolean {
  if (!this.normal_range) return true;
  if (!this.normal_status) return true;

  // Check if normal_status code indicates normal
  return this.normal_status.code_string === "N"; // N = Normal
}
```

#### is_strictly_comparable_to(other: DV_ORDERED): boolean

True if this value can be compared to other using '<', '>', etc.

## Invariants

- `Other_reference_ranges_validity`: other_reference_ranges /= Void implies not
  other_reference_ranges.is_empty
- `Is_simple_validity`: (normal_range = Void and other_reference_ranges = Void)
  implies normal_status = Void
- `Normal_status_validity`: normal_status /= Void implies
  code_set(Code_set_id_normal_statuses).has_code(normal_status)
- `Normal_range_and_status_consistency`: (normal_range /= Void and normal_status
  /= Void) implies (normal_status.code_string.is_equal("N") xor not
  normal_range.is_in_range(self))

## Pre-conditions

None - abstract class

## Post-conditions

None - abstract class

## Example Usage

```typescript
// Abstract class - see concrete implementations like DV_QUANTITY, DV_COUNT, etc.
// Example in subclass:
const quantity = new DV_QUANTITY();
quantity.magnitude = 120;
quantity.units = "mm[Hg]";
quantity.normal_range = new REFERENCE_RANGE();
quantity.normal_range.range = new DV_INTERVAL();
// ... setup range
if (quantity.is_normal()) {
  console.log("Value within normal range");
}
```

## Test Cases

1. **Normal range checking**: Value within range returns is_normal() = true
2. **Outside normal range**: Value outside range returns is_normal() = false
3. **No normal range**: No normal_range means is_normal() = true
4. **Normal status code**: Status code "N" indicates normal
5. **Reference ranges list**: Other_reference_ranges can contain multiple ranges
6. **Strictly comparable**: Values of same type are strictly comparable
7. **Type mismatch**: Values of different types not strictly comparable
8. **Consistency check**: Normal status consistent with range check

## References

- [openEHR RM Data Types Specification](https://specifications.openehr.org/releases/RM/latest/data_types.html)
- [Archie DvOrdered Implementation](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/datavalues/DvOrdered.java)
