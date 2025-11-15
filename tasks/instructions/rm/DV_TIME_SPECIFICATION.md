# DV_TIME_SPECIFICATION

## Description

Abstract parent for time specifications (recurring times, schedules). Used for
timing of observations, medications, etc.

**Specification Reference:**
[openEHR RM Data Types](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_time_specification_class)

## Behavior

### Properties

- `value`: DV_PARSABLE - Time specification in some parsable format

### Methods

#### calendar_alignment(): String

Type of calendar alignment (e.g., "day", "week", "month").

## Invariants

- `Value_valid`: value /= Void

## Pre-conditions

None - abstract class

## Post-conditions

None

## Example Usage

```typescript
// Abstract - see DV_PERIODIC_TIME_SPECIFICATION for concrete example
const periodicTime = new DV_PERIODIC_TIME_SPECIFICATION();
periodicTime.value = new DV_PARSABLE();
periodicTime.value.value = "3x/d"; // Three times per day
periodicTime.value.formalism = "HL7:PQ";
```

## Test Cases

1. **Parsable value**: Value must be DV_PARSABLE
2. **Calendar alignment**: Can specify alignment
3. **Periodic times**: Support periodic specifications
4. **General times**: Support general time specs
5. **Format flexibility**: Support various formalisms
6. **Clinical usage**: Used in medications, observations
7. **Timing accuracy**: Precise timing representation
8. **Inheritance**: Part of data value hierarchy

## References

- [openEHR RM Data Types Specification](https://specifications.openehr.org/releases/RM/latest/data_types.html)
