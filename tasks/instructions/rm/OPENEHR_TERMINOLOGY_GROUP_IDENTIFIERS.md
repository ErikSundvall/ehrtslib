# Instruction: Implementing the `OPENEHR_TERMINOLOGY_GROUP_IDENTIFIERS` Class

## 1. Description

OPENEHR_TERMINOLOGY_GROUP_IDENTIFIERS provides constants for standard openEHR terminology group identifiers.

-   **Reference:** [openEHR RM - Terminology Groups](https://specifications.openehr.org/releases/RM/latest/support.html#_terminology_groups)

## 2. Behavior

### 2.1. Constants

- `GROUP_ID_COMPOSITION_CATEGORY` = "composition category"
- `GROUP_ID_SETTING` = "setting"
- `GROUP_ID_AUDIT_CHANGE_TYPE` = "audit change type"
- `GROUP_ID_ATTESTATION_REASON` = "attestation reason"
- `GROUP_ID_VERSION_LIFECYCLE_STATE` = "version lifecycle state"
- `GROUP_ID_PARTICIPATION_FUNCTION` = "participation function"
- `GROUP_ID_PARTICIPATION_MODE` = "participation mode"
- `GROUP_ID_SUBJECT_RELATIONSHIP` = "subject relationship"
- `GROUP_ID_NULL_FLAVOURS` = "null flavours"
- `GROUP_ID_PROPERTY` = "property"
- `GROUP_ID_INSTRUCTION_STATES` = "instruction states"
- `GROUP_ID_INSTRUCTION_TRANSITIONS` = "instruction transitions"

## 3. Example Usage

```typescript
const groupId = OPENEHR_TERMINOLOGY_GROUP_IDENTIFIERS.GROUP_ID_COMPOSITION_CATEGORY;
const openehr = termService.terminology("openehr");
const categories = openehr.codes_for_group_id(groupId);
```

## 4. References

-   **Official Specification:** [openEHR RM - Terminology Groups](https://specifications.openehr.org/releases/RM/latest/support.html#_terminology_groups)
