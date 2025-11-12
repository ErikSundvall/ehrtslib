# Instruction: Implementing the `INSTRUCTION` Class

## 1. Description

The `INSTRUCTION` class records instructions for healthcare activities, such as medication orders, procedure requests, or care plans.

-   **Reference:** [openEHR RM - INSTRUCTION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_instruction_class)

## 2. Behavior

### 2.1. Properties

#### `narrative: DV_TEXT`

-   **Purpose:** Human-readable instruction narrative.
-   **Mandatory:** Yes

#### `activities: List<ACTIVITY>`

-   **Purpose:** Structured activity definitions.
-   **Optional:** Yes

#### `expiry_time: DV_DATE_TIME`

-   **Purpose:** When instruction expires.
-   **Optional:** Yes

#### `wf_definition: DV_PARSABLE`

-   **Purpose:** Workflow engine definition.
-   **Optional:** Yes

## 3. Common Uses

INSTRUCTION is used for:
- Medication orders
- Procedure requests
- Referrals
- Care plans
- Treatment orders

## 4. Example Usage

```typescript
const medication = new INSTRUCTION();
medication.archetype_node_id = "openEHR-EHR-INSTRUCTION.medication_order.v1";

const narrative = new DV_TEXT();
narrative.value = "Aspirin 100mg once daily for 3 months";
medication.narrative = narrative;

const expiry = DV_DATE_TIME.from("2024-06-15T00:00:00");
medication.expiry_time = expiry;
```

## 5. References

-   **Official Specification:** [openEHR RM - INSTRUCTION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_instruction_class)
-   **Implementation:** [Archie INSTRUCTION](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/composition/Instruction.java)
