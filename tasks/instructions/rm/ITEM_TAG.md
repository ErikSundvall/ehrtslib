# Instruction: Implementing the `ITEM_TAG` Class

## 1. Description

ITEM_TAG represents a tag applied to a data item for categorization or workflow.

- **Reference:**
  [openEHR RM - ITEM_TAG](https://specifications.openehr.org/releases/RM/latest/ehr.html#_item_tag_class)

## 2. Behavior

### 2.1. Properties

- `key: DV_CODED_TEXT` - Tag key/category
- `value: DV_TEXT` - Tag value

## 3. Example Usage

```typescript
const tag = new ITEM_TAG();
tag.key = new DV_CODED_TEXT("priority", "tag_types::priority");
tag.value = new DV_TEXT("urgent");
```

## 4. References

- **Official Specification:**
  [openEHR RM - ITEM_TAG](https://specifications.openehr.org/releases/RM/latest/ehr.html#_item_tag_class)
