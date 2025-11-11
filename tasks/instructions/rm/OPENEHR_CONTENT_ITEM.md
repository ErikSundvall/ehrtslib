# Instruction: Implementing the `OPENEHR_CONTENT_ITEM` Class

## 1. Description

OPENEHR_CONTENT_ITEM represents openEHR-specific content (SECTION or ENTRY).

-   **Reference:** [openEHR RM - OPENEHR_CONTENT_ITEM](https://specifications.openehr.org/releases/RM/latest/ehr.html#_openehr_content_item_class)

## 2. Behavior

Abstract class - parent of SECTION and ENTRY types.

Inherits from CONTENT_ITEM:
- Standard LOCATABLE properties
- Must have archetype_node_id

## 3. Example Usage

```typescript
// Use concrete subclass like SECTION or OBSERVATION
const section = new SECTION();
section.archetype_node_id = "at0001";
```

## 4. References

-   **Official Specification:** [openEHR RM - OPENEHR_CONTENT_ITEM](https://specifications.openehr.org/releases/RM/latest/ehr.html#_openehr_content_item_class)
