# Instruction: Implementing the `GENERIC_CONTENT_ITEM` Class

## 1. Description

GENERIC_CONTENT_ITEM represents generic content that can appear in a
composition.

- **Reference:**
  [openEHR RM - GENERIC_CONTENT_ITEM](https://specifications.openehr.org/releases/RM/latest/ehr.html#_generic_content_item_class)

## 2. Behavior

### 2.1. Properties

Inherits from CONTENT_ITEM:

- `data: ITEM_STRUCTURE` - Generic content data

## 3. Example Usage

```typescript
const content = new GENERIC_CONTENT_ITEM();
content.data = new ITEM_TREE();
content.data.add_element("note", "Additional information");
```

## 4. References

- **Official Specification:**
  [openEHR RM - GENERIC_CONTENT_ITEM](https://specifications.openehr.org/releases/RM/latest/ehr.html#_generic_content_item_class)
