# Instruction: Implementing the `ITEM_SINGLE` Class

## 1. Description

The `ITEM_SINGLE` class represents a single ELEMENT - simplest ITEM_STRUCTURE.

- **Reference:**
  [openEHR RM - ITEM_SINGLE](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_item_single_class)

## 2. Behavior

### 2.1. Properties

- `item: ELEMENT` - The single element

## 3. Example Usage

```typescript
const single = new ITEM_SINGLE();
const elem = new ELEMENT();
elem.value = DV_TEXT.from("Single value");
single.item = elem;
```

## 4. References

- **Official Specification:**
  [openEHR RM - ITEM_SINGLE](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_item_single_class)
