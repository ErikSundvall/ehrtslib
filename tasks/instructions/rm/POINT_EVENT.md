# Instruction: Implementing the `POINT_EVENT` Class

## 1. Description

The `POINT_EVENT` class represents an event at a single point in time.

- **Reference:**
  [openEHR RM - POINT_EVENT](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_point_event_class)

## 2. Behavior

Extends EVENT<T> with no additional properties. Represents instantaneous event.

## 3. Example Usage

```typescript
const event = new POINT_EVENT<ITEM_STRUCTURE>();
event.time = DV_DATE_TIME.from("2024-03-15T14:30:00");
event.data = new ITEM_TREE();
// ... populate data
```

## 4. References

- **Official Specification:**
  [openEHR RM - POINT_EVENT](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_point_event_class)
