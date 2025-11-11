# Instruction: Implementing the `PATHABLE` Class

## 1. Description

The `PATHABLE` class is an abstract parent of `LOCATABLE`, providing the path navigation capabilities for traversing hierarchical structures in openEHR data.

-   **Reference:** [openEHR RM - PATHABLE](https://specifications.openehr.org/releases/RM/latest/common.html#_pathable_class)

## 2. Behavior

### 2.1. Abstract Methods

#### `parent(): PATHABLE | undefined`

-   **Purpose:** Return the parent node in the hierarchy.
-   **Abstract:** Must be implemented by subclasses

#### `item_at_path(path: String): Any`

-   **Purpose:** Return item at a given path.
-   **Abstract:** Must be implemented by subclasses

### 2.2. Derived Methods

#### `items_at_path(path: String): List<Any>`

-   **Purpose:** Return all items matching path (with wildcards).
-   **Pseudo-code:**
    ```typescript
    items_at_path(path: String): List<Any> {
      // Parse path with potential wildcards
      // Collect all matching nodes
      const results = new List<Any>();
      // Implementation delegates to item_at_path for simple paths
      return results;
    }
    ```

#### `path_exists(path: String): Boolean`

-   **Purpose:** Check if path is valid.
-   **Pseudo-code:**
    ```typescript
    path_exists(path: String): Boolean {
      return new Boolean(this.item_at_path(path) !== undefined);
    }
    ```

#### `path_of_item(item: PATHABLE): String`

-   **Purpose:** Return the path to a specific item.
-   **Pseudo-code:**
    ```typescript
    path_of_item(item: PATHABLE): String {
      // Build path by traversing parent chain
      const segments: string[] = [];
      let current = item;
      
      while (current && current.parent()) {
        const parent = current.parent();
        const segment = this.build_segment(parent, current);
        segments.unshift(segment);
        current = parent;
      }
      
      return String.from("/" + segments.join("/"));
    }
    ```

#### `path_unique(): Boolean`

-   **Purpose:** Check if paths are unique (no duplicates at same level).
-   **Returns:** True in correctly formed structures

## 3. Path Syntax

openEHR paths follow a specific syntax:
- `/attribute[node_id]` - Navigate to child with specific archetype node id
- `/attribute[at0001]` - Example with actual node id
- `/attribute[*]` - Wildcard for all children
- `/data/events[at0002]/data` - Multi-level path

## 4. Invariants

-   **Path_unique:** Paths within structure are unique

## 5. Example Usage

```typescript
// Using PATHABLE methods on LOCATABLE objects
const composition = new COMPOSITION();
// ... populate structure ...

// Navigate to specific node
const observation = composition.item_at_path("/content[at0001]");

// Check if path exists
if (composition.path_exists("/content[at0001]/data")) {
  console.log("Data node exists");
}

// Get path to an item
const element = composition.item_at_path("/content[at0001]/data/events[at0002]/data/items[at0004]");
const path = composition.path_of_item(element);
console.log(path.value);
```

## 6. Test Cases

1. Test item_at_path() with valid single-level path
2. Test item_at_path() with multi-level path
3. Test item_at_path() with invalid path returns undefined
4. Test items_at_path() with wildcard
5. Test path_exists() returns correct boolean
6. Test path_of_item() constructs correct path
7. Test parent() navigation chain
8. Test path_unique() on valid structures

## 7. References

-   [openEHR RM - PATHABLE](https://specifications.openehr.org/releases/RM/latest/common.html#_pathable_class)
-   [openEHR Path Syntax](https://specifications.openehr.org/releases/AM/latest/ADL2.html#_paths_and_assertions)
-   [Archie PATHABLE](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/archetyped/Pathable.java)
