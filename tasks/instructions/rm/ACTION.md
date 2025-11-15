# Instruction: Implementing the `ACTION` Class

## 1. Description

The `ACTION` class records actions or procedures that have been performed. It
represents completed or ongoing interventions.

- **Reference:**
  [openEHR RM - ACTION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_action_class)

## 2. Behavior

### 2.1. Properties

#### `time: DV_DATE_TIME`

- **Purpose:** Time action was performed.
- **Mandatory:** Yes

#### `description: ITEM_STRUCTURE`

- **Purpose:** Details of the action.
- **Mandatory:** Yes

#### `ism_transition: ISM_TRANSITION`

- **Purpose:** Workflow step information.
- **Mandatory:** Yes

#### `instruction_details: INSTRUCTION_DETAILS`

- **Purpose:** Link to originating instruction.
- **Optional:** Yes

## 3. Common Uses

ACTION is used for:

- Medication administration records
- Procedures performed
- Care activities completed
- Treatment steps executed

## 4. Example Usage

```typescript
const medAdmin = new ACTION();
medAdmin.archetype_node_id = "openEHR-EHR-ACTION.medication.v1";

medAdmin.time = DV_DATE_TIME.now();

const description = new ITEM_TREE();
// Add medication details
medAdmin.description = description;

const transition = new ISM_TRANSITION();
transition.current_state = DV_CODED_TEXT.from(
  "completed",
  CODE_PHRASE.from("532", "openehr"),
);
medAdmin.ism_transition = transition;
```

## 5. References

- **Official Specification:**
  [openEHR RM - ACTION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_action_class)
- **Implementation:**
  [Archie ACTION](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/composition/Action.java)
