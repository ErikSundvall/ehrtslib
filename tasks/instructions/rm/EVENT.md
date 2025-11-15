# Instruction: Implementing the `EVENT` Class

## 1. Description

The `EVENT` class is an abstract parent for point and interval events within a
HISTORY. It represents a single temporal event with associated data.

- **Reference:**
  [openEHR RM - EVENT](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_event_class)

## 2. Behavior

### 2.1. Properties

#### `time: DV_DATE_TIME`

- **Purpose:** Time of the event.
- **Mandatory:** Yes

#### `data: T` (generic ITEM_STRUCTURE)

- **Purpose:** The actual data for this event.
- **Mandatory:** Yes

#### `state: ITEM_STRUCTURE`

- **Purpose:** State information at time of event.
- **Optional:** Yes

### 2.2. Subclasses

- **POINT_EVENT**: Single point in time
- **INTERVAL_EVENT**: Event over a time period

## 3. Example Usage

```typescript
// Use concrete subclass POINT_EVENT
const event = new POINT_EVENT<ITEM_STRUCTURE>();
event.time = DV_DATE_TIME.from("2024-03-15T14:30:00");

const data = new ITEM_TREE();
// ... populate data
event.data = data;
```

## 4. References

- **Official Specification:**
  [openEHR RM - EVENT](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_event_class)
