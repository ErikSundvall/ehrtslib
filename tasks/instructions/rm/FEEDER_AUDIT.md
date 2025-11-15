# Instruction: Implementing the `FEEDER_AUDIT` Class

## 1. Description

FEEDER_AUDIT records provenance from feeder systems.

- **Reference:**
  [openEHR RM - FEEDER_AUDIT](https://specifications.openehr.org/releases/RM/latest/common.html#_feeder_audit_class)

## 2. Behavior

- `originating_system_audit: FEEDER_AUDIT_DETAILS` - Source system info
- `feeder_system_audit: FEEDER_AUDIT_DETAILS` - Intermediate system info
- `original_content: DV_ENCAPSULATED` - Original data format

## 3. References

- **Official Specification:**
  [openEHR RM - FEEDER_AUDIT](https://specifications.openehr.org/releases/RM/latest/common.html#_feeder_audit_class)
