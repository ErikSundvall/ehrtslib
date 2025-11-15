# Instruction: Implementing the `ITEM` Class

## 1. Description

ITEM is abstract parent for data items (ELEMENT, CLUSTER).

- **Reference:**
  [openEHR RM - ITEM](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_item_class)

## 2. Behavior

Abstract method:

- `is_simple(): Boolean` - Whether item is simple (ELEMENT) or composite
  (CLUSTER)

### 2.2. Subclasses

- ELEMENT (is_simple = true)
- CLUSTER (is_simple = false)

## 3. References

- **Official Specification:**
  [openEHR RM - ITEM](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_item_class)
