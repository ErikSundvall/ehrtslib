# Instruction: Implementing the `ITEM_LIST` Class

## 1. Description

The `ITEM_LIST` class represents a linear list of items - a simpler alternative
to ITEM_TREE.

- **Reference:**
  [openEHR RM - ITEM_LIST](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_item_list_class)

## 2. Behavior

### 2.1. Properties

#### `items: List<ELEMENT>`

- **Purpose:** Ordered list of elements.
- **Optional:** Yes

### 2.2. Structure

```
ITEM_LIST
├── ELEMENT (item 1)
├── ELEMENT (item 2)
└── ELEMENT (item 3)
```

Note: ITEM_LIST can only contain ELEMENTs, not CLUSTERs.

## 3. Example Usage

```typescript
const list = new ITEM_LIST();
list.archetype_node_id = "at0001";

const elem1 = new ELEMENT();
elem1.value = DV_TEXT.from("Value 1");

const elem2 = new ELEMENT();
elem2.value = DV_TEXT.from("Value 2");

list.items = new List<ELEMENT>();
list.items.append(elem1);
list.items.append(elem2);
```

## 4. References

- **Official Specification:**
  [openEHR RM - ITEM_LIST](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_item_list_class)
