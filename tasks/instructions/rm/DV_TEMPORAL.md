# DV_TEMPORAL

## Description

Abstract parent for temporal data values (dates and times). Provides comparison
operations for temporal values.

**Specification Reference:**
[openEHR RM Data Types](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_temporal_class)

## Behavior

### Properties

- `value`: String (abstract) - ISO 8601 string representation
- Inherits from DV_ORDERED: normal_range, other_reference_ranges, normal_status

### Methods

#### diff(other: DV_TEMPORAL): DV_DURATION

Difference between two temporal values as a duration.

**Pseudocode:**

```typescript
function diff(other: DV_TEMPORAL): DV_DURATION {
  // Parse both ISO 8601 values
  const thisTime = parseISO8601(this.value);
  const otherTime = parseISO8601(other.value);

  // Calculate difference
  const diffMillis = Math.abs(thisTime - otherTime);

  // Create duration
  const duration = new DV_DURATION();
  duration.value = formatISODuration(diffMillis);
  return duration;
}
```

## Invariants

- `Value_valid`: value /= Void and valid ISO 8601 format

## Pre-conditions

None - abstract class

## Post-conditions

For diff: Result is positive duration

## Example Usage

```typescript
// Abstract - see DV_DATE, DV_TIME, DV_DATE_TIME for concrete examples
const date1 = new DV_DATE();
date1.value = "2024-01-15";

const date2 = new DV_DATE();
date2.value = "2024-01-10";

const diff = date1.diff(date2); // P5D (5 days)
```

## Test Cases

1. **ISO 8601 format**: Value must be valid ISO 8601
2. **Comparison**: Temporal values can be compared
3. **Difference calculation**: diff() returns duration
4. **Date difference**: Days between dates
5. **Time difference**: Duration between times
6. **DateTime difference**: Full duration calculation
7. **Normal range**: Can specify normal temporal ranges
8. **Ordering**: Temporal values are ordered

## References

- [openEHR RM Data Types Specification](https://specifications.openehr.org/releases/RM/latest/data_types.html)
- [ISO 8601 Standard](https://www.iso.org/iso-8601-date-and-time-format.html)
