# Instruction: Implementing the `ORIGINAL_VERSION` Class

## 1. Description

ORIGINAL_VERSION represents a version created in this system.

- **Reference:**
  [openEHR RM - ORIGINAL_VERSION](https://specifications.openehr.org/releases/RM/latest/common.html#_original_version_class)

## 2. Behavior

- `data: T` - The actual versioned content
- `lifecycle_state: DV_CODED_TEXT` - Version lifecycle state
- `attestations: List<ATTESTATION>` - Attestations
- `is_merged: Boolean` - Whether this is a merge

### 2.2. Methods

- `is_branch(): Boolean` - Is this a branch version?

## 3. Example Usage

```typescript
const version = new ORIGINAL_VERSION<COMPOSITION>();
version.data = myComposition;
version.lifecycle_state = DV_CODED_TEXT.from(
  "complete",
  CODE_PHRASE.from("532", "openehr"),
);
```

## 4. References

- **Official Specification:**
  [openEHR RM - ORIGINAL_VERSION](https://specifications.openehr.org/releases/RM/latest/common.html#_original_version_class)
