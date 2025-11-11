# Instruction: Implementing the `ISO_OID` Class

## 1. Description

The `ISO_OID` class represents an ISO Object Identifier (OID) conforming to ISO/IEC 8824 standard.

-   **Format:** Sequence of decimal integers separated by dots
-   **Example:** `"2.16.840.1.113883.3.1"`
-   **Reference:** [openEHR BASE - ISO_OID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_iso_oid_class)

## 2. Behavior

### 2.1. Constructor and Validation

-   **Pseudo-code:**
    ```typescript
    static from(oidStr: string): ISO_OID {
      const oid = new ISO_OID();
      oid.value = oidStr;
      
      if (!oid.is_valid()) {
        throw new Error("Invalid ISO OID format");
      }
      
      return oid;
    }
    ```

### 2.2. Validation

#### `is_valid(): Boolean`

-   **Purpose:** Check if value is a valid OID.
-   **Rules:**
    -   Must consist of decimal integers separated by dots
    -   First arc must be 0, 1, or 2
    -   If first arc is 0 or 1, second arc must be 0-39
    -   All arcs must be non-negative integers
-   **Pseudo-code:**
    ```typescript
    is_valid(): Boolean {
      const val = this.value;
      if (!val) {
        return new Boolean(false);
      }
      
      // Pattern: sequence of digits separated by dots
      if (!/^[0-9]+(\.[0-9]+)*$/.test(val)) {
        return new Boolean(false);
      }
      
      const arcs = val.split('.').map(a => parseInt(a));
      
      // Check first arc (must be 0, 1, or 2)
      if (arcs[0] > 2) {
        return new Boolean(false);
      }
      
      // Check second arc if first is 0 or 1
      if (arcs.length > 1 && arcs[0] < 2 && arcs[1] > 39) {
        return new Boolean(false);
      }
      
      return new Boolean(true);
    }
    ```

### 2.3. `is_equal(other: Any): Boolean`

-   **Purpose:** Compare OIDs for equality.
-   **Pseudo-code:**
    ```typescript
    is_equal(other: Any): Boolean {
      if (!(other instanceof ISO_OID)) {
        return new Boolean(false);
      }
      
      if (!this.value || !other.value) {
        return new Boolean(false);
      }
      
      return new Boolean(this.value === other.value);
    }
    ```

## 3. Invariants

-   **Format_valid:** Must follow OID format rules
-   **First_arc_valid:** First arc in {0, 1, 2}

## 4. Pre-conditions

-   Value must be a valid OID string.

## 5. Post-conditions

-   is_valid() returns true for properly formatted OIDs.

## 6. Example Usage

```typescript
// Healthcare organization OID
const orgOid = ISO_OID.from("2.16.840.1.113883.3.1");
console.log(orgOid.value);  // "2.16.840.1.113883.3.1"
console.log(orgOid.is_valid());  // true

// WHO OID
const whoOid = ISO_OID.from("2.16.840.1.113883.3.1819");
console.log(whoOid.value);

// Invalid OID throws error
try {
  const invalid = ISO_OID.from("3.16.840");  // First arc > 2
} catch (e) {
  console.log(e.message);  // "Invalid ISO OID format"
}

// Comparison
const oid1 = ISO_OID.from("2.16.840.1.113883");
const oid2 = ISO_OID.from("2.16.840.1.113883");
console.log(oid1.is_equal(oid2));  // true
```

## 7. OID Usage in Healthcare

ISO OIDs are widely used in healthcare for:
- Organization identifiers
- Coding system identifiers
- Document type identifiers
- Value set identifiers

Common healthcare OID roots:
- `2.16.840.1.113883` - HL7 root
- `1.2.840.10008` - DICOM
- `2.16.840.1.113883.6` - Coding systems (LOINC, SNOMED, etc.)

## 8. Test Cases

Key test cases to implement:
1. Test from() with valid OID
2. Test from() throws error with invalid format
3. Test is_valid() with various valid OIDs
4. Test is_valid() with invalid first arc (> 2)
5. Test is_valid() with invalid second arc when first is 0 or 1
6. Test is_equal() comparison
7. Test with real healthcare OIDs
8. Test with single-arc OID ("0", "1", "2")
9. Test with very long OID chains
10. Test error handling for malformed strings

## 9. References

-   [openEHR BASE - ISO_OID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_iso_oid_class)
-   [ISO/IEC 8824 - OID Standard](https://www.itu.int/rec/T-REC-X.680)
-   [OID Repository](https://oid-rep.orange-labs.fr/)
-   [HL7 OID Registry](http://www.hl7.org/oid/index.cfm)
