# Instruction: Implementing the `LINK` Class

## 1. Description

LINK represents relationships between LOCATABLE objects.

-   **Reference:** [openEHR RM - LINK](https://specifications.openehr.org/releases/RM/latest/common.html#_link_class)

## 2. Behavior

- `meaning: DV_TEXT` - Meaning of the link
- `type: DV_TEXT` - Type of relationship
- `target: DV_EHR_URI` - Target object reference

## 3. Example Usage

```typescript
const link = new LINK();
link.meaning = DV_TEXT.from("causative agent");
link.type = DV_TEXT.from("problem");
link.target = new DV_EHR_URI();
link.target.value = "ehr://system/ehr_id/composition_id";
```

## 4. References

-   **Official Specification:** [openEHR RM - LINK](https://specifications.openehr.org/releases/RM/latest/common.html#_link_class)
