# Instruction: Implementing the `PARTY_SELF` Class

## 1. Description

PARTY_SELF represents the EHR subject (the patient).

- **Reference:**
  [openEHR RM - PARTY_SELF](https://specifications.openehr.org/releases/RM/latest/common.html#_party_self_class)

## 2. Behavior

No additional properties - simply indicates "the subject of this EHR".

## 3. Example Usage

```typescript
const subject = new PARTY_SELF();
// Used as entry.subject to indicate patient
```

## 4. References

- **Official Specification:**
  [openEHR RM - PARTY_SELF](https://specifications.openehr.org/releases/RM/latest/common.html#_party_self_class)
