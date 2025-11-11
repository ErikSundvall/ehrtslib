# Instruction: Implementing the `GENERIC_ID` Class

## 1. Description

The `GENERIC_ID` class represents a generic identifier for identifiers whose format is otherwise unknown to openEHR. It includes a scheme attribute to name the identification system.

-   **Reference:** [openEHR BASE - GENERIC_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_generic_id_class)

## 2. Behavior

### 2.1. Properties

-   **`value: String`** - Inherited from OBJECT_ID, the identifier value
-   **`scheme: String`** - Name of the scheme to which this identifier conforms

### 2.2. Constructor

-   **Pseudo-code:**
    ```typescript
    constructor() {
      super();
    }
    
    static from(value: string, scheme: string): GENERIC_ID {
      const id = new GENERIC_ID();
      id.value = value;
      id.scheme = String.from(scheme);
      return id;
    }
    ```

### 2.3. `is_equal(other: Any): Boolean`

-   **Purpose:** Compare two GENERIC_ID objects.
-   **Pseudo-code:**
    ```typescript
    is_equal(other: Any): Boolean {
      if (!(other instanceof GENERIC_ID)) {
        return new Boolean(false);
      }
      
      // Compare both value and scheme
      if (!this.value || !other.value) {
        return new Boolean(false);
      }
      if (this.value !== other.value) {
        return new Boolean(false);
      }
      
      if (!this.scheme || !other.scheme) {
        return new Boolean(false);
      }
      if (!this.scheme.is_equal(other.scheme).value) {
        return new Boolean(false);
      }
      
      return new Boolean(true);
    }
    ```

## 3. Invariants

-   **Scheme_exists:** `scheme /= Void and then not scheme.is_empty()`
-   **Value_exists:** Inherited from OBJECT_ID

## 4. Pre-conditions

-   Both value and scheme must be set.

## 5. Post-conditions

-   GENERIC_ID objects are immutable once created (best practice).

## 6. Example Usage

```typescript
// Local system identifier
const localId = GENERIC_ID.from("12345", "local");
console.log(localId.value);           // "12345"
console.log(localId.scheme.value);    // "local"

// Hospital MRN (Medical Record Number)
const mrn = GENERIC_ID.from("MRN-987654", "hospital_mrn");
console.log(mrn.value);               // "MRN-987654"
console.log(mrn.scheme.value);        // "hospital_mrn"

// National ID
const nationalId = GENERIC_ID.from("123-45-6789", "SSN");
console.log(nationalId.scheme.value); // "SSN"

// Comparison
const id1 = GENERIC_ID.from("12345", "local");
const id2 = GENERIC_ID.from("12345", "local");
const id3 = GENERIC_ID.from("12345", "remote");

console.log(id1.is_equal(id2));       // true
console.log(id1.is_equal(id3));       // false (different scheme)
```

## 7. Common Use Cases in openEHR

GENERIC_ID is used when:
- Integrating with systems that have their own identifier schemes
- Working with identifiers that don't fit standard openEHR types
- Supporting legacy identifier formats
- Using institution-specific identifier schemes

Examples:
- Medical Record Numbers (MRNs)
- Social Security Numbers
- Passport numbers
- Driver's license numbers
- Custom organizational identifiers

## 8. Test Cases

Key test cases to implement:
1. Test creation with value and scheme
2. Test is_equal with identical IDs
3. Test is_equal with same value but different scheme
4. Test is_equal with different values
5. Test validation - both value and scheme must be set
6. Test validation - scheme must not be empty
7. Test with various real-world identifier schemes
8. Test serialization/deserialization
9. Test that scheme is case-sensitive
10. Test immutability

## 9. References

-   [openEHR BASE Specification - GENERIC_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_generic_id_class)
-   [Archie GenericId Implementation](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/support/identification/GenericId.java)
