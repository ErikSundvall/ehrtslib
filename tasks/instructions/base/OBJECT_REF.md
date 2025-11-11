# Instruction: Implementing the `OBJECT_REF` Class

## 1. Description

The `OBJECT_REF` class represents a reference to another object, which may exist locally or be maintained outside the current namespace (e.g., in another service). It's a fundamental type used throughout openEHR for creating relationships between objects.

-   **Reference:** [openEHR BASE - Object Reference - OBJECT_REF](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_object_ref_class)

## 2. Behavior

### 2.1. Properties

-   **`id: OBJECT_ID`**: Globally unique identifier of the object being referenced.
-   **`namespace: String`**: Namespace to which the referenced object belongs (optional).
-   **`type: String`**: Type name of the referenced object (e.g., "COMPOSITION", "PARTY").

### 2.2. Constructor

-   **Purpose:** Create an OBJECT_REF with required properties.
-   **Pseudo-code:**
    ```typescript
    constructor() {
      super();
    }
    
    static from(id: OBJECT_ID, namespace: string, type: string): OBJECT_REF {
      const ref = new OBJECT_REF();
      ref.id = id;
      ref.namespace = String.from(namespace);
      ref.type = String.from(type);
      return ref;
    }
    ```

### 2.3. `is_equal(other: Any): Boolean`

-   **Purpose:** Compare two OBJECT_REF objects for equality.
-   **Pseudo-code:**
    ```typescript
    is_equal(other: Any): Boolean {
      if (!(other instanceof OBJECT_REF)) {
        return new Boolean(false);
      }
      
      // Compare IDs
      if (!this.id || !other.id) {
        return new Boolean(false);
      }
      if (!this.id.is_equal(other.id).value) {
        return new Boolean(false);
      }
      
      // Compare namespaces
      if (this.namespace && other.namespace) {
        if (!this.namespace.is_equal(other.namespace).value) {
          return new Boolean(false);
        }
      } else if (this.namespace || other.namespace) {
        // One has namespace, other doesn't
        return new Boolean(false);
      }
      
      // Compare types
      if (this.type && other.type) {
        if (!this.type.is_equal(other.type).value) {
          return new Boolean(false);
        }
      } else if (this.type || other.type) {
        // One has type, other doesn't
        return new Boolean(false);
      }
      
      return new Boolean(true);
    }
    ```

## 3. Invariants

-   **Id_exists:** `id /= Void`
-   **Type_valid:** `type /= Void and then not type.is_empty()`

## 4. Pre-conditions

-   The id property must be set.
-   The type property should be set for a valid reference.

## 5. Post-conditions

-   OBJECT_REF objects are typically immutable once created.

## 6. Example Usage

```typescript
// Reference to a COMPOSITION
const compositionId = HIER_OBJECT_ID.from("550e8400-e29b-41d4-a716-446655440000::1");
const compositionRef = OBJECT_REF.from(
  compositionId,
  "local",
  "COMPOSITION"
);

console.log(compositionRef.id.value);        // "550e8400-e29b-41d4-a716-446655440000::1"
console.log(compositionRef.namespace.value); // "local"
console.log(compositionRef.type.value);      // "COMPOSITION"

// Reference to a PARTY
const partyId = new HIER_OBJECT_ID();
partyId.value = "8a8a8a8a-8a8a-8a8a-8a8a-8a8a8a8a8a8a";
const partyRef = OBJECT_REF.from(
  partyId,
  "demographic",
  "PARTY"
);

// Comparison
const ref1 = OBJECT_REF.from(compositionId, "local", "COMPOSITION");
const ref2 = OBJECT_REF.from(compositionId, "local", "COMPOSITION");
console.log(ref1.is_equal(ref2));  // true
```

## 7. Common Use Cases in openEHR

### 7.1. Linking to External Objects

OBJECT_REF is used to reference objects that may be in different systems:

```typescript
// Reference to an external EHR
const ehrId = HIER_OBJECT_ID.from("7d44b88c-4199-4bad-97dc-d78268e01398");
const ehrRef = OBJECT_REF.from(ehrId, "remote.hospital.org", "EHR");

// Reference to demographic information
const patientId = HIER_OBJECT_ID.from("patient-123-456");
const patientRef = OBJECT_REF.from(patientId, "demographics", "PERSON");
```

### 7.2. In Clinical Data

Used in ENTRY objects to reference subjects, providers, etc.:

```typescript
const observation = new OBSERVATION();
observation.subject = patientRef; // Reference to the patient

const performer = OBJECT_REF.from(
  HIER_OBJECT_ID.from("practitioner-789"),
  "demographics",
  "PARTY"
);
```

### 7.3. Version References

```typescript
// Reference to a specific version of a composition
const versionId = OBJECT_VERSION_ID.from("composition-id::system::1");
const versionRef = OBJECT_REF.from(versionId, "local", "VERSION");
```

## 8. Specialized Subclasses

OBJECT_REF has specialized subclasses for specific purposes:

- **PARTY_REF**: References to parties (patients, practitioners, organizations)
- **LOCATABLE_REF**: References to LOCATABLE objects with path information
- **ACCESS_GROUP_REF**: References to access control groups

## 9. Test Cases

Key test cases to implement:
1. Test creation with all properties
2. Test creation with optional namespace
3. Test is_equal with identical references
4. Test is_equal with different IDs
5. Test is_equal with different namespaces
6. Test is_equal with different types
7. Test validation - id must be set
8. Test validation - type must be set
9. Test with different OBJECT_ID types (HIER_OBJECT_ID, ARCHETYPE_ID, etc.)
10. Test serialization/deserialization
11. Test references with and without namespace
12. Test specialized subclasses (PARTY_REF, LOCATABLE_REF)

## 10. References

-   [openEHR BASE Specification - OBJECT_REF](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_object_ref_class)
-   [openEHR BASE Specification - PARTY_REF](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_party_ref_class)
-   [openEHR BASE Specification - LOCATABLE_REF](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_locatable_ref_class)
-   [Archie ObjectRef Implementation](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/support/identification/ObjectRef.java)
