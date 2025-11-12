# Instruction: Implementing the `INTERVAL_EVENT` Class

## 1. Description

The `INTERVAL_EVENT` class represents an event over a time period.

-   **Reference:** [openEHR RM - INTERVAL_EVENT](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_interval_event_class)

## 2. Behavior

### 2.1. Properties

- `width: DV_DURATION` - Duration of interval
- `math_function: DV_CODED_TEXT` - How data was computed (mean, max, min, etc.)

## 3. Example Usage

```typescript
const event = new INTERVAL_EVENT<ITEM_STRUCTURE>();
event.time = DV_DATE_TIME.from("2024-03-15T14:30:00");
event.width = DV_DURATION.from("PT1H");
event.math_function = DV_CODED_TEXT.from("mean", CODE_PHRASE.from("146", "openehr"));
```

## 4. References

-   **Official Specification:** [openEHR RM - INTERVAL_EVENT](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_interval_event_class)
