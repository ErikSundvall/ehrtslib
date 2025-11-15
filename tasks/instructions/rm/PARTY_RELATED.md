# Instruction: Implementing the `PARTY_RELATED` Class

## 1. Description

PARTY_RELATED extends PARTY_IDENTIFIED with relationship information.

- **Reference:**
  [openEHR RM - PARTY_RELATED](https://specifications.openehr.org/releases/RM/latest/common.html#_party_related_class)

## 2. Behavior

- `relationship: DV_CODED_TEXT` - Relationship to patient (e.g., "mother",
  "guardian")

## 3. Example Usage

```typescript
const mother = new PARTY_RELATED();
mother.name = "Jane Doe";
mother.relationship = DV_CODED_TEXT.from(
  "Mother",
  CODE_PHRASE.from("mother", "openehr"),
);
```

## 4. References

- **Official Specification:**
  [openEHR RM - PARTY_RELATED](https://specifications.openehr.org/releases/RM/latest/common.html#_party_related_class)
