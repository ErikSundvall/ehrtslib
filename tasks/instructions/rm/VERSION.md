# Instruction: Implementing the `VERSION` Class

## 1. Description

VERSION is abstract parent for versioned content.

- **Reference:**
  [openEHR RM - VERSION](https://specifications.openehr.org/releases/RM/latest/common.html#_version_class)

## 2. Behavior

- `contribution: OBJECT_REF` - Contributing contribution
- `signature: String` - Optional digital signature
- `commit_audit: AUDIT_DETAILS` - Audit trail
- `uid: OBJECT_VERSION_ID` - Version UID

### 2.2. Subclasses

- ORIGINAL_VERSION
- IMPORTED_VERSION

## 3. References

- **Official Specification:**
  [openEHR RM - VERSION](https://specifications.openehr.org/releases/RM/latest/common.html#_version_class)
