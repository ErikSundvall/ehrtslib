# Instruction: Implementing the `OBSERVATION` Class

## 1. Description

The `OBSERVATION` class represents clinical observations - data that is observed or measured like vital signs, symptoms, or examination findings. It extends `CARE_ENTRY` and is one of the most commonly used entry types.

-   **Reference:** [openEHR RM - OBSERVATION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_observation_class)

## 2. Behavior

### 2.1. Properties

#### `data: HISTORY<ITEM_STRUCTURE>`

-   **Purpose:** Core observation data with temporal series.
-   **Optional:** Yes (per specification, though typically present)
-   **Contains:** Events (POINT_EVENT, INTERVAL_EVENT) with measurements

#### `state: HISTORY<ITEM_STRUCTURE>`

-   **Purpose:** State of subject during observation (e.g., patient position).
-   **Optional:** Yes
-   **Important for:** Safe clinical interpretation

#### `protocol: ITEM_STRUCTURE`

-   **Purpose:** Information about how observation was gathered.
-   **Optional:** Yes (inherited from CARE_ENTRY)
-   **Examples:** Device used, method, conditions

### 2.2. Usage Pattern

```typescript
// Create observation
const observation = new OBSERVATION();
observation.archetype_node_id = "openEHR-EHR-OBSERVATION.blood_pressure.v1";

const name = new DV_TEXT();
name.value = "Blood pressure";
observation.name = name;

// Set data (temporal series of events)
const data = new HISTORY<ITEM_STRUCTURE>();
data.origin = DV_DATE_TIME.now();

// Add point event
const event = new POINT_EVENT<ITEM_STRUCTURE>();
event.time = DV_DATE_TIME.from("2024-03-15T14:30:00");

const eventData = new ITEM_TREE();
// ... add systolic/diastolic elements
event.data = eventData;

data.events = new List<EVENT<ITEM_STRUCTURE>>();
data.events.append(event);

observation.data = data;

// Optional state
const state = new HISTORY<ITEM_STRUCTURE>();
const stateEvent = new POINT_EVENT<ITEM_STRUCTURE>();
const stateData = new ITEM_TREE();
// ... add patient position element
stateEvent.data = stateData;
state.events = new List<EVENT<ITEM_STRUCTURE>>();
state.events.append(stateEvent);
observation.state = state;
```

## 3. Invariants

-   Inherits invariants from CARE_ENTRY and ENTRY

## 4. Pre-conditions

-   If data is present, should have at least one EVENT in data.events

## 5. Post-conditions

-   All events have valid temporal information

## 6. Common OBSERVATION Archetypes

- Blood pressure
- Body temperature
- Pulse/Heart rate
- Respiration rate
- Body weight
- Laboratory test results
- Clinical findings

## 7. Test Cases

1. Test creation with mandatory data property
2. Test data contains HISTORY with events
3. Test with POINT_EVENT
4. Test with INTERVAL_EVENT
5. Test with state information
6. Test with protocol information
7. Test temporal ordering of events
8. Test real archetype: blood pressure
9. Test real archetype: body temperature
10. Test validation requires data

## 8. References

-   **Official Specification:** [openEHR RM - OBSERVATION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_observation_class)
-   **Official Specification:** [openEHR RM - CARE_ENTRY](https://specifications.openehr.org/releases/RM/latest/ehr.html#_care_entry_class)
-   **Implementation Reference:** [Archie OBSERVATION](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/composition/Observation.java)
-   [OBSERVATION Archetypes](https://ckm.openehr.org/ckm/archetypes/1013.1.150)
