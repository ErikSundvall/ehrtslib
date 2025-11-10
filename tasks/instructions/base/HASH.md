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

## 3. Implementation Notes

-   The `Hash` class can be implemented in TypeScript using the built-in `Map<K, V>` object to store the key-value pairs.
-   The class should be generic, accepting types `K` and `V`.

## 4. Example Usage

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
