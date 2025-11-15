# Instruction: Implementing the `DV_PERIODIC_TIME_SPECIFICATION` Class

## 1. Description

DV_PERIODIC_TIME_SPECIFICATION represents periodic timing (e.g., daily, weekly).

- **Reference:**
  [openEHR RM - DV_PERIODIC_TIME_SPECIFICATION](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_periodic_time_specification_class)

## 2. Behavior

### 2.1. Properties

- `value: DV_PARSABLE` - Periodic specification
- `calendar_alignment: DV_CODED_TEXT` - Calendar alignment (day, week, month,
  year)
- `event_alignment: DV_CODED_TEXT` - Event alignment (e.g., before/after meal)
- `institution_specified: Boolean` - Whether time is institution-specific

## 3. Example Usage

```typescript
const periodicSpec = new DV_PERIODIC_TIME_SPECIFICATION();
periodicSpec.value = new DV_PARSABLE();
periodicSpec.value.value = "twice daily";
periodicSpec.calendar_alignment = new DV_CODED_TEXT(
  "day",
  "openehr::time_alignment",
);
```

## 4. References

- **Official Specification:**
  [openEHR RM - DV_PERIODIC_TIME_SPECIFICATION](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_periodic_time_specification_class)
