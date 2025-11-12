# Instruction: Implementing the `GENERIC_ENTRY` Class

## 1. Description

GENERIC_ENTRY represents a generic entry for non-clinical content.

-   **Reference:** [openEHR RM - GENERIC_ENTRY](https://specifications.openehr.org/releases/RM/latest/ehr.html#_generic_entry_class)

## 2. Behavior

### 2.1. Properties

Inherits from CONTENT_ITEM:
- `data: ITEM_STRUCTURE` - Entry data

## 3. Example Usage

```typescript
const entry = new GENERIC_ENTRY();
entry.data = new ITEM_TREE();
entry.data.add_element("note", "General information");
```

## 4. References

-   **Official Specification:** [openEHR RM - GENERIC_ENTRY](https://specifications.openehr.org/releases/RM/latest/ehr.html#_generic_entry_class)
