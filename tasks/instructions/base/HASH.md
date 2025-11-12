# Instruction: Implementing the `Hash<K, V>` Class

## 1. Description

The `Hash<K, V>` class represents a generic keyed table of values, also known as a map, dictionary, or associative array. It maps keys of a generic type `K` to values of a generic type `V`. In the openEHR context, the key type `K` is constrained to be an `Ordered` type.

-   **Reference:** [openEhr Foundation Types Specification - Hash Class](https://specifications.openehr.org/releases/BASE/development/foundation_types.html#_hash_class)

## 2. Behavior

The `Hash` class inherits from `Container` and should implement its abstract methods, as well as its own specific methods.

### 2.1. `has(value: V): boolean` (Inherited from Container)

-   **Purpose:** Tests for the membership of a *value* within the hash.
-   **Behavior:**
    -   Should return `true` if any key in the hash maps to the given `value`.
    -   Should return `false` otherwise.
-   **Pseudo-code:**
    ```typescript
    has(value: V): boolean {
      // a Map in TS/JS stores [key, value] pairs
      for (const v of this.internal_map.values()) {
        if (v === value) {
          return true;
        }
      }
      return false;
    }
    ```

### 2.2. `has_key(key: K): boolean`

-   **Purpose:** Tests for the presence of a specific key in the hash.
-   **Behavior:**
    -   Should return `true` if the hash contains the given `key`.
    -   Should return `false` otherwise.
-   **Pseudo-code:**
    ```typescript
    has_key(key: K): boolean {
      return this.internal_map.has(key);
    }
    ```

### 2.3. `item(key: K): V`

-   **Purpose:** Retrieves the value associated with a given key.
-   **Behavior:**
    -   Should return the value `V` for the given `key`.
    -   Should return `undefined` or throw an error if the key is not found, consistent with the underlying map implementation. The specification implies retrieval, so returning `undefined` is appropriate for TypeScript.
-   **Pseudo-code:**
    ```typescript
    item(key: K): V | undefined {
      return this.internal_map.get(key);
    }
    ```

### 2.4. `count(): number` (Inherited from Container)

-   **Purpose:** Returns the number of key-value pairs in the hash.
-   **Pseudo-code:**
    ```typescript
    count(): number {
      return this.internal_map.size;
    }
    ```

### 2.5. `is_empty(): boolean` (Inherited from Container)

-   **Purpose:** Checks if the hash is empty.
-   **Pseudo-code:**
    ```typescript
    is_empty(): boolean {
      return this.internal_map.size === 0;
    }
    ```

## 3. Invariants

-   **Count_valid:** `count() >= 0`
-   **Empty_valid:** `is_empty() = (count() = 0)`
-   **Has_key_valid:** `has_key(k) implies item(k) /= Void`

## 4. Pre-conditions

-   **item_pre:** Key must exist in hash (for item method without undefined return)
-   Keys must be of type K (Ordered)
-   Values must be of type V

## 5. Post-conditions

-   After insertion: `has_key(k) = true` and `item(k) = v`
-   After removal: `has_key(k) = false`
-   `count()` accurately reflects number of key-value pairs

## 6. Implementation Notes

-   The `Hash` class can be implemented in TypeScript using the built-in `Map<K, V>` object to store the key-value pairs.
-   The class should be generic, accepting types `K` and `V`.
-   Key comparison should use the `is_equal` method for Ordered types.

## 7. Example Usage

```typescript
// Assuming a concrete implementation using Map
const myHash = new Hash<string, number>();
myHash.internal_map.set("one", 1);
myHash.internal_map.set("two", 2);

myHash.has(2); // true
myHash.has(3); // false

myHash.has_key("one"); // true
myHash.has_key("three"); // false

myHash.item("two"); // 2

myHash.count(); // 2
myHash.is_empty(); // false
```

## 8. Test Cases

Key test cases to implement:
1. Test creation of empty hash
2. Test insertion and retrieval of key-value pairs
3. Test `has_key` with existing and non-existing keys
4. Test `has` with existing and non-existing values
5. Test `count` returns correct number of entries
6. Test `is_empty` on empty and non-empty hashes
7. Test `item` with existing key returns correct value
8. Test `item` with non-existing key returns undefined
9. Test hash with different key types (String, Integer, etc.)
10. Test hash allows duplicate values but not duplicate keys
11. Test key comparison using `is_equal` method

## 9. References

-   [openEHR BASE Specification - Hash Class](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_hash_class)
-   [openEHR BASE Specification - Container Class](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_container_class)
-   [Archie - Container implementations](https://github.com/openEHR/archie/tree/master/openehr-rm/src/main/java/com/nedap/archie)
