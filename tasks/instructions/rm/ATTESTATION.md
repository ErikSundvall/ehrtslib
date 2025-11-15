# Instruction: Implementing the `ATTESTATION` Class

## 1. Description

ATTESTATION extends AUDIT_DETAILS for legal attestation.

- **Reference:**
  [openEHR RM - ATTESTATION](https://specifications.openehr.org/releases/RM/latest/common.html#_attestation_class)

## 2. Behavior

- `attested_view: DV_MULTIMEDIA` - Attested content
- `proof: String` - Digital signature or proof
- `items: List<DV_EHR_URI>` - Specific items attested
- `reason: DV_TEXT` - Reason for attestation
- `is_pending: Boolean` - Pending status

## 3. References

- **Official Specification:**
  [openEHR RM - ATTESTATION](https://specifications.openehr.org/releases/RM/latest/common.html#_attestation_class)
