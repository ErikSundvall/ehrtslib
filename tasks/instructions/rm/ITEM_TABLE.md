# Instruction: Implementing the `ITEM_TABLE` Class

## 1. Description

The `ITEM_TABLE` class represents tabular data with rows and columns.

- **Reference:**
  [openEHR RM - ITEM_TABLE](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_item_table_class)

## 2. Behavior

### 2.1. Properties

- `rows: List<CLUSTER>` - Table rows

## 3. Example Usage

```typescript
const table = new ITEM_TABLE();
// ... add rows as CLUSTERs
```

## 4. References

- **Official Specification:**
  [openEHR RM - ITEM_TABLE](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_item_table_class)
