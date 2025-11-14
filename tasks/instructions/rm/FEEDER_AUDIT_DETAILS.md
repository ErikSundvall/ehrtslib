# Instruction: Implementing the `FEEDER_AUDIT_DETAILS` Class

## 1. Description

FEEDER_AUDIT_DETAILS provides details about a feeder system.

- **Reference:**
  [openEHR RM - FEEDER_AUDIT_DETAILS](https://specifications.openehr.org/releases/RM/latest/common.html#_feeder_audit_details_class)

## 2. Behavior

- `system_id: String` - System identifier
- `location: PARTY_IDENTIFIED` - Where data originated
- `provider: PARTY_IDENTIFIED` - Who provided the data
- `subject: PARTY_PROXY` - Subject of the data
- `time: DV_DATE_TIME` - When data was committed

## 3. References

- **Official Specification:**
  [openEHR RM - FEEDER_AUDIT_DETAILS](https://specifications.openehr.org/releases/RM/latest/common.html#_feeder_audit_details_class)
