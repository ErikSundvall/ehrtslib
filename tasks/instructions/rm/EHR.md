# Instruction: Implementing the `EHR` Class

## 1. Description

EHR represents an Electronic Health Record for a single subject.

-   **Reference:** [openEHR RM - EHR](https://specifications.openehr.org/releases/RM/latest/ehr.html#_ehr_class)

## 2. Behavior

- `system_id: HIER_OBJECT_ID` - System identifier
- `ehr_id: HIER_OBJECT_ID` - EHR identifier
- `time_created: DV_DATE_TIME` - Creation time
- `ehr_status: OBJECT_REF` - Reference to EHR_STATUS
- `ehr_access: OBJECT_REF` - Reference to EHR_ACCESS
- `compositions: List<OBJECT_REF>` - References to compositions
- `contributions: List<OBJECT_REF>` - References to contributions

## 3. References

-   **Official Specification:** [openEHR RM - EHR](https://specifications.openehr.org/releases/RM/latest/ehr.html#_ehr_class)
