# Instruction: Implementing the `OBJECT_VERSION_ID` Class

## 1. Description

The `OBJECT_VERSION_ID` class represents a unique identifier for a versioned object, combining object ID, creating system ID, and version tree ID.

-   **Format:** `object_id '::' creating_system_id '::' version_tree_id`
-   **Example:** `"8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a::hospital.system::1"`
-   **Reference:** [openEHR BASE - OBJECT_VERSION_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_object_version_id_class)

## 2. Behavior

### 2.1. Constructor and Parsing

-   **Pseudo-code:**
    ```typescript
    static from(versionIdStr: string): OBJECT_VERSION_ID {
      const id = new OBJECT_VERSION_ID();
      id.value = versionIdStr;
      id.parse(versionIdStr);
      return id;
    }
    
    private parse(versionIdStr: string): void {
      const parts = versionIdStr.split('::');
      
      if (parts.length !== 3) {
        throw new Error("OBJECT_VERSION_ID must have 3 parts separated by '::'");
      }
      
      this._object_id = UID_BASED_ID.from(parts[0]);
      this._creating_system_id = parts[1];
      this._version_tree_id = VERSION_TREE_ID.from(parts[2]);
    }
    ```

### 2.2. Component Accessors

#### `object_id(): UID`

-   **Purpose:** Return the object identifier (UID part).
-   **Pseudo-code:**
    ```typescript
    object_id(): UID {
      return this._object_id.root();
    }
    ```

#### `creating_system_id(): String`

-   **Purpose:** Return the identifier of the system that created the version.
-   **Pseudo-code:**
    ```typescript
    creating_system_id(): String {
      return String.from(this._creating_system_id);
    }
    ```

#### `version_tree_id(): VERSION_TREE_ID`

-   **Purpose:** Return the version tree identifier.
-   **Pseudo-code:**
    ```typescript
    version_tree_id(): VERSION_TREE_ID {
      return this._version_tree_id;
    }
    ```

### 2.3. Convenience Methods

#### `is_branch(): Boolean`

-   **Purpose:** Check if this is a branch version (has branch number).
-   **Pseudo-code:**
    ```typescript
    is_branch(): Boolean {
      return this._version_tree_id.is_branch();
    }
    ```

### 2.4. `is_equal(other: Any): Boolean`

-   **Purpose:** Compare OBJECT_VERSION_ID objects.
-   **Pseudo-code:**
    ```typescript
    is_equal(other: Any): Boolean {
      if (!(other instanceof OBJECT_VERSION_ID)) {
        return new Boolean(false);
      }
      
      return new Boolean(this.value === other.value);
    }
    ```

## 3. Invariants

-   **Three_parts:** Value must have exactly 3 parts separated by '::'
-   **Object_id_valid:** First part is a valid UID_BASED_ID
-   **System_id_valid:** Second part is non-empty
-   **Version_tree_id_valid:** Third part is a valid VERSION_TREE_ID

## 4. Pre-conditions

-   Value must follow the three-part format.

## 5. Post-conditions

-   All components properly parsed and accessible.

## 6. Example Usage

```typescript
// Complete version ID
const versionId = OBJECT_VERSION_ID.from(
  "8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a::hospital.system::1"
);

console.log(versionId.object_id().value);  // UUID
console.log(versionId.creating_system_id().value);  // "hospital.system"
console.log(versionId.version_tree_id().value);  // "1"

// Branch version
const branchId = OBJECT_VERSION_ID.from(
  "550e8400-e29b-41d4-a716-446655440000::sys::2.1.3"
);

console.log(branchId.is_branch());  // true
console.log(branchId.version_tree_id().value);  // "2.1.3"

// Usage in versioning context
const composition = new COMPOSITION();
composition.uid = versionId;
```

## 7. Use in openEHR Versioning

OBJECT_VERSION_ID is fundamental to openEHR's versioning system:
- Uniquely identifies a specific version of content
- Tracks which system created the version
- Supports branching and merging of versions

Format breakdown:
- **object_id**: Identifies the logical object across all versions
- **creating_system_id**: Identifies the EHR system that created this version
- **version_tree_id**: Identifies this specific version in the version tree

## 8. Test Cases

Key test cases to implement:
1. Test parsing valid three-part ID
2. Test parsing throws error with < 3 parts
3. Test parsing throws error with > 3 parts
4. Test object_id() extraction
5. Test creating_system_id() extraction
6. Test version_tree_id() extraction
7. Test is_branch() with trunk and branch versions
8. Test is_equal() comparison
9. Test with various UID types (UUID, ISO_OID, etc.)
10. Test with complex version tree IDs (2.1.3)
11. Test round-trip (parse then to_string)

## 9. References

-   [openEHR BASE - OBJECT_VERSION_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_object_version_id_class)
-   [openEHR RM - Versioning](https://specifications.openehr.org/releases/RM/latest/common.html#_versioning_package)
-   [Archie ObjectVersionId](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/support/identification/ObjectVersionId.java)
