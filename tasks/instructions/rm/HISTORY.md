# Instruction: Implementing the `HISTORY` Class

## 1. Description

The `HISTORY` class represents a temporal series of events. It is used in OBSERVATION to record data over time.

-   **Reference:** [openEHR RM - HISTORY](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_history_class)

## 2. Behavior

### 2.1. Properties

#### `origin: DV_DATE_TIME`

-   **Purpose:** Reference time point for all events.
-   **Mandatory:** Yes

#### `events: List<EVENT<T>>`

-   **Purpose:** The temporal series of events.
-   **Optional:** Yes (but typically present)
-   **Generic:** T is ITEM_STRUCTURE subtype

#### `period: DV_DURATION`

-   **Purpose:** Total time period covered.
-   **Optional:** Yes

#### `duration: DV_DURATION`

-   **Purpose:** Duration of history.
-   **Optional:** Yes

#### `summary: ITEM_STRUCTURE`

-   **Purpose:** Summary data for entire history.
-   **Optional:** Yes

## 3. Example Usage

```typescript
const history = new HISTORY<ITEM_STRUCTURE>();
history.origin = DV_DATE_TIME.from("2024-03-15T10:00:00");

const event1 = new POINT_EVENT<ITEM_STRUCTURE>();
event1.time = DV_DATE_TIME.from("2024-03-15T10:00:00");
// ... set event data

const event2 = new POINT_EVENT<ITEM_STRUCTURE>();
event2.time = DV_DATE_TIME.from("2024-03-15T10:30:00");
// ... set event data

history.events = new List<EVENT<ITEM_STRUCTURE>>();
history.events.append(event1);
history.events.append(event2);
```

## 4. References

-   **Official Specification:** [openEHR RM - HISTORY](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_history_class)
-   **Implementation:** [Archie HISTORY](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/datastructures/History.java)
