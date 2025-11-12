# Instruction: Implementing the `INTERNET_ID` Class

## 1. Description

The `INTERNET_ID` class represents identifiers in the form of reverse internet domain names.

-   **Format:** Reverse domain name (e.g., `"org.openehr"`, `"com.hospital.department"`)
-   **Example:** `"org.openehr"`, `"uk.nhs.connecting_for_health"`
-   **Reference:** [openEHR BASE - INTERNET_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_internet_id_class)

## 2. Behavior

### 2.1. Constructor and Validation

-   **Pseudo-code:**
    ```typescript
    static from(idStr: string): INTERNET_ID {
      const id = new INTERNET_ID();
      id.value = idStr;
      
      if (!id.is_valid()) {
        throw new Error("Invalid Internet ID format");
      }
      
      return id;
    }
    ```

### 2.2. Validation

#### `is_valid(): Boolean`

-   **Purpose:** Check if value is a valid reverse domain name.
-   **Rules:**
    -   Must consist of labels separated by dots
    -   Labels must start/end with alphanumeric
    -   Labels may contain hyphens (not at start/end)
    -   Labels must be 1-63 characters
    -   Total length <= 253 characters
-   **Pseudo-code:**
    ```typescript
    is_valid(): Boolean {
      const val = this.value;
      if (!val || val.length > 253) {
        return new Boolean(false);
      }
      
      // Pattern for valid domain label
      const labelPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
      
      const labels = val.split('.');
      
      // Must have at least 2 labels (e.g., "org.openehr")
      if (labels.length < 2) {
        return new Boolean(false);
      }
      
      // Check each label
      for (const label of labels) {
        if (!labelPattern.test(label)) {
          return new Boolean(false);
        }
      }
      
      return new Boolean(true);
    }
    ```

### 2.3. `is_equal(other: Any): Boolean`

-   **Purpose:** Compare Internet IDs (case-insensitive).
-   **Pseudo-code:**
    ```typescript
    is_equal(other: Any): Boolean {
      if (!(other instanceof INTERNET_ID)) {
        return new Boolean(false);
      }
      
      if (!this.value || !other.value) {
        return new Boolean(false);
      }
      
      // Case-insensitive comparison
      return new Boolean(
        this.value.toLowerCase() === other.value.toLowerCase()
      );
    }
    ```

## 3. Invariants

-   **Format_valid:** Must follow reverse domain name format
-   **Case_insensitive:** Comparison is case-insensitive

## 4. Pre-conditions

-   Value must be a valid reverse domain name.

## 5. Post-conditions

-   is_valid() returns true for properly formatted Internet IDs.

## 6. Example Usage

```typescript
// openEHR organization ID
const openehrId = INTERNET_ID.from("org.openehr");
console.log(openehrId.value);  // "org.openehr"
console.log(openehrId.is_valid());  // true

// Hospital department ID
const deptId = INTERNET_ID.from("com.hospital.cardiology");
console.log(deptId.value);

// NHS Connecting for Health
const nhsId = INTERNET_ID.from("uk.nhs.connecting_for_health");
console.log(nhsId.value);

// Case-insensitive comparison
const id1 = INTERNET_ID.from("org.openehr");
const id2 = INTERNET_ID.from("ORG.OPENEHR");
console.log(id1.is_equal(id2));  // true

// Invalid ID throws error
try {
  const invalid = INTERNET_ID.from("invalid..domain");
} catch (e) {
  console.log(e.message);  // "Invalid Internet ID format"
}
```

## 7. Usage in openEHR

Internet IDs are used for:
- Namespace identification
- Organization identifiers in a decentralized manner
- Application/system identifiers
- Template identifiers

The reverse domain name format ensures global uniqueness without central registry.

## 8. Test Cases

Key test cases to implement:
1. Test from() with valid reverse domain
2. Test from() throws error with invalid format
3. Test is_valid() with various valid formats
4. Test is_valid() rejects single-label domains
5. Test is_valid() validates label length (max 63)
6. Test is_valid() validates total length (max 253)
7. Test is_valid() rejects labels starting with hyphen
8. Test is_valid() rejects labels ending with hyphen
9. Test is_equal() is case-insensitive
10. Test with multi-level domains
11. Test with numeric labels
12. Test with hyphens in middle of labels

## 9. References

-   [openEHR BASE - INTERNET_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_internet_id_class)
-   [RFC 1034 - Domain Names](https://tools.ietf.org/html/rfc1034)
-   [Archie InternetId Implementation](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/support/identification/InternetId.java)
