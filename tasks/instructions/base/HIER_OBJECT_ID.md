# Instruction: Implementing the `HIER_OBJECT_ID` Class

## 1. Description

The `HIER_OBJECT_ID` class is a concrete implementation of `UID_BASED_ID` for
hierarchical identifiers. It's one of the most commonly used identifier types in
openEHR, used for identifying versioned objects, compositions, and other EHR
content.

- **Lexical Format:** Inherited from `UID_BASED_ID`: `root` or
  `root '::' extension`
- **Root Format:** A UID (UUID, ISO_OID, or INTERNET_ID)
- **Example:** `8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a::local.hospital`
- **Reference:**
  [openEHR BASE - HIER_OBJECT_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_hier_object_id_class)

## 2. Behavior

HIER_OBJECT_ID is a concrete class that doesn't add new methods beyond what's
inherited from `UID_BASED_ID`. All the behavior comes from:

- `root()` - returns the UID portion
- `extension()` - returns the optional extension
- `has_extension()` - checks if extension exists

### 2.1. Constructor

- **Purpose:** Create a new HIER_OBJECT_ID instance.
- **Pseudo-code:**
  ```typescript
  constructor() {
    super();
  }

  // Factory method for convenience
  static from(value: string): HIER_OBJECT_ID {
    const id = new HIER_OBJECT_ID();
    id.value = value;
    return id;
  }
  ```

### 2.2. Validation

Although not explicitly defined as a method in the BMM, validation is important:

- **Pseudo-code:**
  ```typescript
  isValid(): boolean {
    if (!this.value || this.value.length === 0) {
      return false;
    }
    
    try {
      // Try to parse the root - this will throw if invalid
      const root = this.root();
      return true;
    } catch (e) {
      return false;
    }
  }
  ```

## 3. Invariants

Inherited from `UID_BASED_ID`:

- **Has_extension_valid:** `has_extension() = not extension().is_empty()`

Additional constraints:

- **Root_valid:** The root must be a valid UID (UUID, ISO_OID, or INTERNET_ID)

## 4. Pre-conditions

- Value must be set and follow the UID_BASED_ID format before using.

## 5. Post-conditions

- All inherited methods work correctly with the value.

## 6. Example Usage

```typescript
// Simple HIER_OBJECT_ID with UUID root
const id1 = HIER_OBJECT_ID.from("550e8400-e29b-41d4-a716-446655440000");
console.log(id1.root().value); // "550e8400-e29b-41d4-a716-446655440000"
console.log(id1.extension().value); // ""
console.log(id1.has_extension()); // false

// HIER_OBJECT_ID with extension
const id2 = HIER_OBJECT_ID.from(
  "550e8400-e29b-41d4-a716-446655440000::local.hospital.system",
);
console.log(id2.root().value); // "550e8400-e29b-41d4-a716-446655440000"
console.log(id2.extension().value); // "local.hospital.system"
console.log(id2.has_extension()); // true

// HIER_OBJECT_ID with ISO OID root
const id3 = HIER_OBJECT_ID.from("2.16.840.1.113883.3.1::ext1");
console.log(id3.root().value); // "2.16.840.1.113883.3.1"
console.log(id3.extension().value); // "ext1"

// Usage in openEHR context
const composition = new COMPOSITION();
composition.uid = HIER_OBJECT_ID.from(
  "550e8400-e29b-41d4-a716-446655440000::1",
);
// The extension "1" might represent a version number
```

## 7. Test Cases

Key test cases to implement:

1. Test creation with UUID root only
2. Test creation with UUID root and extension
3. Test creation with ISO OID root
4. Test creation with INTERNET_ID root
5. Test root() method returns correct UID type
6. Test extension() method with and without extension
7. Test has_extension() returns correct boolean
8. Test value equality between two HIER_OBJECT_IDs
9. Test invalid formats throw appropriate errors
10. Test multiple '::' separators (only first should be used)
11. Test empty extension (e.g., "uuid::" should be treated as no extension)
12. Test serialization/deserialization to string

## 8. Common Use Cases in openEHR

HIER_OBJECT_ID is used for:

- **VERSION.uid** - Identifying specific versions of content
- **COMPOSITION.uid** - Identifying compositions
- **EHR.ehr_id** - Identifying EHR records
- **PARTY.uid** - Identifying parties (patients, practitioners)

The extension portion is commonly used to encode:

- Version numbers (e.g., `uuid::1`, `uuid::2`)
- System identifiers (e.g., `uuid::hospital.department`)
- Creating qualified identifiers within a namespace

## 9. References

- [openEHR BASE Specification - HIER_OBJECT_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_hier_object_id_class)
- [openEHR BASE Specification - UID_BASED_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_uid_based_id_class)
- [Archie HierObjectId Implementation](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/support/identification/HierObjectId.java)
- [Java-libs HierObjectId](https://github.com/openEHR/java-libs/blob/master/openehr-rm-core/src/main/java/org/openehr/rm/support/identification/HierObjectId.java)
