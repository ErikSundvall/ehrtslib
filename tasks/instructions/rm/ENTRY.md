# Instruction: Implementing the `ENTRY` Class

## 1. Description

ENTRY is the abstract parent for all clinical entry types.

-   **Reference:** [openEHR RM - ENTRY](https://specifications.openehr.org/releases/RM/latest/ehr.html#_entry_class)

## 2. Behavior

### 2.1. Properties

- `language: CODE_PHRASE` - Mandatory
- `encoding: CODE_PHRASE` - Mandatory
- `subject: PARTY_PROXY` - Mandatory
- `provider: PARTY_PROXY` - Optional
- `other_participations: List<PARTICIPATION>` - Optional
- `workflow_id: OBJECT_REF` - Optional

### 2.2. Subclasses

- CARE_ENTRY (OBSERVATION, EVALUATION, INSTRUCTION, ACTION)
- ADMIN_ENTRY

## 3. References

-   **Official Specification:** [openEHR RM - ENTRY](https://specifications.openehr.org/releases/RM/latest/ehr.html#_entry_class)
