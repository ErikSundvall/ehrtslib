# Instruction: Implementing the `LOCATABLE` Class

## 1. Description

The `LOCATABLE` class is an abstract base class for all openEHR Reference Model
objects that can be identified and addressed within an EHR. It serves as the
foundational element for structuring clinical data and provides infrastructure
for archetype-based data definition.

- **Reference:**
  [openEHR RM - LOCATABLE](https://specifications.openehr.org/releases/RM/latest/common.html#_locatable_class)

## 2. Behavior

### 2.1. Properties

#### `uid: UID_BASED_ID`

- **Purpose:** Globally unique identifier for the locatable object.
- **Optional:** Yes (can be null)
- **Infrastructure:** Yes

#### `archetype_node_id: String`

- **Purpose:** Archetype node identifier from the archetype.
- **Mandatory:** Yes
- **Infrastructure:** Yes
- **Format:** Typically `"at0000"`, `"at0001"`, etc.

#### `name: DV_TEXT`

- **Purpose:** Human-readable name of the locatable object.
- **Mandatory:** Yes
- **Source:** From archetype term definitions or generated

#### `archetype_details: ARCHETYPED`

- **Purpose:** Details about the archetype that defines this object.
- **Optional:** Yes (present at archetype root)
- **Infrastructure:** Yes

#### `feeder_audit: FEEDER_AUDIT`

- **Purpose:** Audit trail from feeder systems.
- **Optional:** Yes

#### `links: List<LINK>`

- **Purpose:** Links to other locatable objects.
- **Optional:** Yes

### 2.2. Path Navigation Methods

#### `parent(): LOCATABLE | undefined`

- **Purpose:** Return the parent LOCATABLE in the composition hierarchy.
- **Pseudo-code:**
  ```typescript
  parent(): LOCATABLE | undefined {
    // Navigate up the object hierarchy
    // Implementation depends on runtime object graph
    return this._parent;
  }
  ```

#### `item_at_path(path: String): Any`

- **Purpose:** Return the item at a given path.
- **Pseudo-code:**
  ```typescript
  item_at_path(path: String): Any {
    // Parse the path string
    // Navigate through object hierarchy using path segments
    // Return the object at the path, or undefined if not found
    const segments = this.parse_path(path.value);
    let current: any = this;
    
    for (const segment of segments) {
      current = this.navigate_segment(current, segment);
      if (!current) return undefined;
    }
    
    return current;
  }
  ```

#### `items_at_path(path: String): List<Any>`

- **Purpose:** Return all items matching a path (handles wildcards).
- **Pseudo-code:**
  ```typescript
  items_at_path(path: String): List<Any> {
    const results = new List<Any>();
    // Parse path, handle wildcards like [*]
    // Collect all matching items
    return results;
  }
  ```

#### `path_exists(path: String): Boolean`

- **Purpose:** Check if a path exists in the object structure.
- **Pseudo-code:**
  ```typescript
  path_exists(path: String): Boolean {
    const item = this.item_at_path(path);
    return new Boolean(item !== undefined);
  }
  ```

### 2.3. Node Identification Methods

#### `concept(): DV_TEXT`

- **Purpose:** Return the clinical concept represented by this object.
- **Returns:** The name property
- **Pseudo-code:**
  ```typescript
  concept(): DV_TEXT {
    return this.name;
  }
  ```

#### `is_archetype_root(): Boolean`

- **Purpose:** Check if this is an archetype root.
- **Pseudo-code:**
  ```typescript
  is_archetype_root(): Boolean {
    return new Boolean(this.archetype_details !== undefined);
  }
  ```

## 3. Invariants

- **Name_exists:** `name /= Void`
- **Archetype_node_id_exists:**
  `archetype_node_id /= Void and then not archetype_node_id.is_empty()`
- **Links_valid:** `links /= Void implies not links.is_empty()`
- **Archetype_root_check:** `is_archetype_root() = (archetype_details /= Void)`

## 4. Pre-conditions

- `archetype_node_id` must be set before use
- `name` must be set before use

## 5. Post-conditions

- Path navigation methods return objects consistent with the path structure
- `is_archetype_root()` accurately reflects presence of archetype_details

## 6. Example Usage

```typescript
// Create a LOCATABLE-derived object (e.g., ELEMENT)
const element = new ELEMENT();
element.archetype_node_id = "at0001";

const nameText = new DV_TEXT();
nameText.value = "Blood Pressure";
element.name = nameText;

// Set archetype details for root
const archetypeDetails = new ARCHETYPED();
archetypeDetails.archetype_id = ARCHETYPE_ID.from(
  "openEHR-EHR-OBSERVATION.blood_pressure.v1",
);
element.archetype_details = archetypeDetails;

// Check if archetype root
console.log(element.is_archetype_root()); // true

// Navigate by path
const item = element.item_at_path("/data[at0001]/events[at0002]");

// Check path existence
console.log(element.path_exists("/data[at0001]"));
```

## 7. Test Cases

Key test cases to implement:

1. Test creation with mandatory properties (archetype_node_id, name)
2. Test uid assignment and retrieval
3. Test archetype_details for archetype root
4. Test is_archetype_root() with and without archetype_details
5. Test item_at_path() with valid paths
6. Test item_at_path() with invalid paths returns undefined
7. Test items_at_path() with wildcards
8. Test path_exists() with valid and invalid paths
9. Test parent() navigation
10. Test links management
11. Test feeder_audit assignment
12. Test concept() returns name

## 8. References

- [openEHR RM - LOCATABLE](https://specifications.openehr.org/releases/RM/latest/common.html#_locatable_class)
- [openEHR RM - PATHABLE](https://specifications.openehr.org/releases/RM/latest/common.html#_pathable_class)
- [Archie LOCATABLE Implementation](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/archetyped/Locatable.java)
- [openEHR Path Syntax](https://specifications.openehr.org/releases/AM/latest/ADL2.html#_paths_and_assertions)
