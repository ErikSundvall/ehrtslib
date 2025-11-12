# Instruction: Implementing the `UID_BASED_ID` Class

## 1. Description

The `UID_BASED_ID` class is an abstract model of UID-based identifiers consisting of a root part and an optional extension. The lexical form is: `root '::' extension`.

-   **Lexical Format:** `root` or `root '::' extension`
-   **Example:** `8a8a8a-8a8a-8a8a::1` or just `8a8a8a-8a8a-8a8a`
-   **Reference:** [openEHR BASE - UID_BASED_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_uid_based_id_class)

## 2. Behavior

### 2.1. `root(): UID`

-   **Purpose:** Returns the identifier of the conceptual namespace in which the object exists.
-   **Returns:** The part to the left of the first '::' separator, if any, or else the whole string.
-   **Pseudo-code:**
    ```typescript
    root(): UID {
      const val = this.value;
      if (!val) throw new Error("Value is not set");
      
      const separatorIndex = val.indexOf('::');
      const rootStr = separatorIndex === -1 
        ? val 
        : val.substring(0, separatorIndex);
      
      // Need to determine which UID type to instantiate
      // Could be UUID, ISO_OID, or INTERNET_ID
      return this.parseUID(rootStr);
    }
    
    private parseUID(uidStr: string): UID {
      // UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uidStr)) {
        const uuid = new UUID();
        uuid.value = uidStr;
        return uuid;
      }
      
      // ISO OID pattern: digits separated by dots
      if (/^[0-9]+(\.[0-9]+)*$/.test(uidStr)) {
        const oid = new ISO_OID();
        oid.value = uidStr;
        return oid;
      }
      
      // Internet ID pattern: reverse domain name
      if (/^[a-zA-Z0-9.-]+$/.test(uidStr)) {
        const internetId = new INTERNET_ID();
        internetId.value = uidStr;
        return internetId;
      }
      
      throw new Error(`Unable to determine UID type for: ${uidStr}`);
    }
    ```

### 2.2. `extension(): String`

-   **Purpose:** Returns the optional local identifier of the object within the context of the root identifier.
-   **Returns:** The part to the right of the first '::' separator if any, or else an empty String.
-   **Pseudo-code:**
    ```typescript
    extension(): String {
      const val = this.value;
      if (!val) return String.from("");
      
      const separatorIndex = val.indexOf('::');
      if (separatorIndex === -1) {
        return String.from("");
      }
      
      return String.from(val.substring(separatorIndex + 2));
    }
    ```

### 2.3. `has_extension(): Boolean`

-   **Purpose:** Checks if an extension exists.
-   **Returns:** True if not `extension().is_empty()`.
-   **Pseudo-code:**
    ```typescript
    has_extension(): Boolean {
      const ext = this.extension();
      return new Boolean(ext.value !== undefined && ext.value !== "");
    }
    ```

## 3. Invariants

-   **Has_extension_valid:** `has_extension() = not extension().is_empty()`

## 4. Pre-conditions

-   Value must be set before calling any methods.

## 5. Post-conditions

-   `root()` always returns a valid UID object.
-   `extension()` returns empty string if no extension exists.

## 6. Example Usage

```typescript
// With extension
const uid1 = new HIER_OBJECT_ID();
uid1.value = "550e8400-e29b-41d4-a716-446655440000::local";

console.log(uid1.root().value);      // "550e8400-e29b-41d4-a716-446655440000"
console.log(uid1.extension().value); // "local"
console.log(uid1.has_extension());   // true

// Without extension
const uid2 = new HIER_OBJECT_ID();
uid2.value = "550e8400-e29b-41d4-a716-446655440000";

console.log(uid2.root().value);      // "550e8400-e29b-41d4-a716-446655440000"
console.log(uid2.extension().value); // ""
console.log(uid2.has_extension());   // false
```

## 7. Test Cases

Key test cases to implement:
1. Test UID with extension - verify root() and extension() split correctly
2. Test UID without extension - verify extension() returns empty string
3. Test has_extension() returns correct boolean
4. Test with different UID types (UUID, ISO_OID, INTERNET_ID)
5. Test error handling for invalid formats
6. Test multiple '::' separators (only first should be used)

## 8. References

-   [openEHR BASE Specification - UID_BASED_ID](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_uid_based_id_class)
-   [Archie UIDBasedId Implementation](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/support/identification/UIDBasedId.java)
-   [Java-libs UIDBasedId](https://github.com/openEHR/java-libs/blob/master/openehr-rm-core/src/main/java/org/openehr/rm/support/identification/UIDBasedId.java)
