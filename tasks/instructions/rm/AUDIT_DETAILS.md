# Instruction: Implementing the `AUDIT_DETAILS` Class

## 1. Description

AUDIT_DETAILS records audit trail information for commits.

-   **Reference:** [openEHR RM - AUDIT_DETAILS](https://specifications.openehr.org/releases/RM/latest/common.html#_audit_details_class)

## 2. Behavior

- `system_id: String` - System identifier
- `time_committed: DV_DATE_TIME` - When committed
- `change_type: DV_CODED_TEXT` - Type of change (creation, amendment, etc.)
- `description: DV_TEXT` - Optional description
- `committer: PARTY_PROXY` - Who committed

## 3. References

-   **Official Specification:** [openEHR RM - AUDIT_DETAILS](https://specifications.openehr.org/releases/RM/latest/common.html#_audit_details_class)
