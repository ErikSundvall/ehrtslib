# Instruction: Implementing the `ITEM_TREE` Class

## 1. Description

The `ITEM_TREE` class represents a tree-structured collection of items. It is the most commonly used `ITEM_STRUCTURE` type in openEHR archetypes.

-   **Reference:** [openEHR RM - ITEM_TREE](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_item_tree_class)

## 2. Behavior

### 2.1. Properties

#### `items: List<ITEM>`

-   **Purpose:** Top-level items in the tree.
-   **Optional:** Yes (can be empty)
-   **Contains:** ELEMENT or CLUSTER objects

### 2.2. Structure

ITEM_TREE provides hierarchical organization:
```
ITEM_TREE
├── ELEMENT (leaf node)
├── CLUSTER
│   ├── ELEMENT
│   ├── ELEMENT
│   └── CLUSTER (nested)
│       ├── ELEMENT
│       └── ELEMENT
└── ELEMENT
```

## 3. Example Usage

```typescript
const tree = new ITEM_TREE();
tree.archetype_node_id = "at0001";

// Add top-level elements
const element1 = new ELEMENT();
element1.value = DV_TEXT.from("Value 1");

const element2 = new ELEMENT();
element2.value = DV_QUANTITY.from(120, "mm[Hg]");

// Add cluster with nested items
const cluster = new CLUSTER();
cluster.items = new List<ITEM>();
// ... add items to cluster

tree.items = new List<ITEM>();
tree.items.append(element1);
tree.items.append(cluster);
tree.items.append(element2);
```

## 4. Test Cases

1. Test creation with items
2. Test with ELEMENT items
3. Test with CLUSTER items
4. Test with nested clusters
5. Test path navigation
6. Test empty tree

## 5. References

-   **Official Specification:** [openEHR RM - ITEM_TREE](https://specifications.openehr.org/releases/RM/latest/data_structures.html#_item_tree_class)
-   **Implementation:** [Archie ITEM_TREE](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/datastructures/ItemTree.java)
