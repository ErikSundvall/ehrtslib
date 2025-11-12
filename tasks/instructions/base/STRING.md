# Instruction: Implementing the `String` Class

## 1. Description

The `String` class is an openEHR wrapper around the primitive string type. It extends `Ordered` to provide comparison operations and implements string manipulation methods.

-   **Reference:** [openEHR BASE - Foundation Types - String](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_string_class)

## 2. Behavior

### 2.1. Constructor and Factory Methods

-   **Purpose:** Create String instances from primitive strings or other String objects.
-   **Pseudo-code:**
    ```typescript
    constructor() {
      super();
      this._value = "";
    }
    
    static from(val: string): String {
      const str = new String();
      str._value = val;
      return str;
    }
    ```

### 2.2. `value` Property

-   **Purpose:** Access the underlying primitive string value.
-   **Pseudo-code:**
    ```typescript
    get value(): string {
      return this._value || "";
    }
    
    set value(val: string) {
      this._value = val;
    }
    ```

### 2.3. `is_equal(other: Any): Boolean`

-   **Purpose:** Compare two String objects for value equality.
-   **Pseudo-code:**
    ```typescript
    is_equal(other: Any): Boolean {
      if (!(other instanceof String)) {
        return new Boolean(false);
      }
      return new Boolean(this.value === other.value);
    }
    ```

### 2.4. `less_than(other: Ordered): Boolean`

-   **Purpose:** Compare strings lexicographically.
-   **Pseudo-code:**
    ```typescript
    less_than(other: Ordered): Boolean {
      if (!(other instanceof String)) {
        throw new Error("Cannot compare String with non-String");
      }
      return new Boolean(this.value < other.value);
    }
    ```

### 2.5. `is_empty(): Boolean`

-   **Purpose:** Check if the string is empty.
-   **Pseudo-code:**
    ```typescript
    is_empty(): Boolean {
      return new Boolean(this.value.length === 0);
    }
    ```

### 2.6. `count(): Integer`

-   **Purpose:** Return the number of characters in the string.
-   **Pseudo-code:**
    ```typescript
    count(): Integer {
      const int = new Integer();
      int.value = this.value.length;
      return int;
    }
    ```

### 2.7. `as_lower(): String`

-   **Purpose:** Convert string to lowercase.
-   **Pseudo-code:**
    ```typescript
    as_lower(): String {
      return String.from(this.value.toLowerCase());
    }
    ```

### 2.8. `as_upper(): String`

-   **Purpose:** Convert string to uppercase.
-   **Pseudo-code:**
    ```typescript
    as_upper(): String {
      return String.from(this.value.toUpperCase());
    }
    ```

### 2.9. `append(s: String): String`

-   **Purpose:** Concatenate another string.
-   **Pseudo-code:**
    ```typescript
    append(s: String): String {
      return String.from(this.value + s.value);
    }
    ```

### 2.10. `substring(start: Integer, end: Integer): String`

-   **Purpose:** Extract a substring.
-   **Note:** openEHR uses 1-based indexing, JavaScript uses 0-based.
-   **Pseudo-code:**
    ```typescript
    substring(start: Integer, end: Integer): String {
      // Convert from 1-based to 0-based indexing
      const startIdx = start.value - 1;
      const endIdx = end.value;
      return String.from(this.value.substring(startIdx, endIdx));
    }
    ```

### 2.11. `index_of(pattern: String, from: Integer): Integer`

-   **Purpose:** Find the index of a substring.
-   **Note:** openEHR uses 1-based indexing.
-   **Pseudo-code:**
    ```typescript
    index_of(pattern: String, from: Integer): Integer {
      const startIdx = from.value - 1; // Convert to 0-based
      const foundIdx = this.value.indexOf(pattern.value, startIdx);
      
      const result = new Integer();
      // Convert back to 1-based, or return -1 if not found
      result.value = foundIdx === -1 ? -1 : foundIdx + 1;
      return result;
    }
    ```

### 2.12. `split(delimiter: String): List<String>`

-   **Purpose:** Split string by delimiter.
-   **Pseudo-code:**
    ```typescript
    split(delimiter: String): List<String> {
      const parts = this.value.split(delimiter.value);
      const list = new List<String>();
      for (const part of parts) {
        list.append(String.from(part));
      }
      return list;
    }
    ```

## 3. Invariants

-   **Count_valid:** `count() >= 0`

## 4. Pre-conditions

-   For operations like `substring`, indices must be valid (within bounds).

## 5. Post-conditions

-   String operations return new String objects and don't modify the original (immutability).

## 6. Example Usage

```typescript
const str1 = String.from("Hello");
const str2 = String.from("World");

console.log(str1.is_empty());              // false
console.log(str1.count().value);           // 5
console.log(str1.as_upper().value);        // "HELLO"
console.log(str1.append(str2).value);      // "HelloWorld"

const str3 = String.from("Hello, World!");
const parts = str3.split(String.from(", "));
console.log(parts.count().value);          // 2
console.log(parts.item(new Integer(0)).value); // "Hello"
console.log(parts.item(new Integer(1)).value); // "World!"

// Comparison
console.log(str1.less_than(str2));         // true (H < W)
console.log(str1.is_equal(String.from("Hello"))); // true
```

## 7. Test Cases

Key test cases to implement:
1. Test creation with factory method
2. Test value equality vs reference equality
3. Test string comparison (less_than, is_equal)
4. Test case conversion (as_lower, as_upper)
5. Test concatenation (append)
6. Test substring extraction with proper index conversion
7. Test index_of with pattern matching
8. Test split operation
9. Test empty string behavior
10. Test Unicode/multi-byte character handling

## 8. References

-   [openEHR BASE Specification - Foundation Types - String](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_string_class)
-   [Archie String support](https://github.com/openEHR/archie/tree/master/openehr-rm/src/main/java/com/nedap/archie)
