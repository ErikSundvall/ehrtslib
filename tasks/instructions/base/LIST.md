# Instruction: Implementing the `List` Class

## 1. Description

The `List<T>` class represents an ordered collection of items where duplicates are allowed. It extends `Container<T>` and provides list-specific operations like indexed access, insertion, and removal.

-   **Reference:** [openEHR BASE - Foundation Types - List](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_list_t_class)

## 2. Behavior

### 2.1. Internal Storage

-   **Purpose:** Store the list items in an array.
-   **Pseudo-code:**
    ```typescript
    private _items: T[] = [];
    
    constructor() {
      super();
      this._items = [];
    }
    ```

### 2.2. `has(v: T): Boolean`

-   **Purpose:** Test for membership of a value.
-   **Pseudo-code:**
    ```typescript
    has(v: T): Boolean {
      for (const item of this._items) {
        if (item.is_equal(v).value === true) {
          return new Boolean(true);
        }
      }
      return new Boolean(false);
    }
    ```

### 2.3. `count(): Integer`

-   **Purpose:** Return the number of items in the list.
-   **Pseudo-code:**
    ```typescript
    count(): Integer {
      const int = new Integer();
      int.value = this._items.length;
      return int;
    }
    ```

### 2.4. `is_empty(): Boolean`

-   **Purpose:** Check if the list is empty.
-   **Pseudo-code:**
    ```typescript
    is_empty(): Boolean {
      return new Boolean(this._items.length === 0);
    }
    ```

### 2.5. `item(i: Integer): T`

-   **Purpose:** Get the item at index i.
-   **Note:** openEHR uses 0-based indexing for lists (unlike some other operations that use 1-based).
-   **Pseudo-code:**
    ```typescript
    item(i: Integer): T {
      const idx = i.value;
      if (idx < 0 || idx >= this._items.length) {
        throw new Error(`Index out of bounds: ${idx}`);
      }
      return this._items[idx];
    }
    ```

### 2.6. `first(): T`

-   **Purpose:** Get the first item in the list.
-   **Pseudo-code:**
    ```typescript
    first(): T {
      if (this._items.length === 0) {
        throw new Error("Cannot get first item of empty list");
      }
      return this._items[0];
    }
    ```

### 2.7. `last(): T`

-   **Purpose:** Get the last item in the list.
-   **Pseudo-code:**
    ```typescript
    last(): T {
      if (this._items.length === 0) {
        throw new Error("Cannot get last item of empty list");
      }
      return this._items[this._items.length - 1];
    }
    ```

### 2.8. `append(v: T): void`

-   **Purpose:** Add an item to the end of the list.
-   **Pseudo-code:**
    ```typescript
    append(v: T): void {
      this._items.push(v);
    }
    ```

### 2.9. `prepend(v: T): void`

-   **Purpose:** Add an item to the beginning of the list.
-   **Pseudo-code:**
    ```typescript
    prepend(v: T): void {
      this._items.unshift(v);
    }
    ```

### 2.10. `extend(other: List<T>): void`

-   **Purpose:** Append all items from another list.
-   **Pseudo-code:**
    ```typescript
    extend(other: List<T>): void {
      const otherCount = other.count().value;
      for (let i = 0; i < otherCount; i++) {
        this._items.push(other.item(Integer.from(i)));
      }
    }
    ```

### 2.11. `remove(i: Integer): void`

-   **Purpose:** Remove the item at index i.
-   **Pseudo-code:**
    ```typescript
    remove(i: Integer): void {
      const idx = i.value;
      if (idx < 0 || idx >= this._items.length) {
        throw new Error(`Index out of bounds: ${idx}`);
      }
      this._items.splice(idx, 1);
    }
    ```

### 2.12. `index_of(v: T): Integer`

-   **Purpose:** Find the index of the first occurrence of a value.
-   **Returns:** Index (0-based) or -1 if not found.
-   **Pseudo-code:**
    ```typescript
    index_of(v: T): Integer {
      for (let i = 0; i < this._items.length; i++) {
        if (this._items[i].is_equal(v).value === true) {
          return Integer.from(i);
        }
      }
      return Integer.from(-1);
    }
    ```

### 2.13. `for_all(test: (v: T) => Boolean): Boolean`

-   **Purpose:** Universal quantifier - test if all items satisfy a condition.
-   **Pseudo-code:**
    ```typescript
    for_all(test: (v: T) => Boolean): Boolean {
      for (const item of this._items) {
        if (!test(item).value) {
          return new Boolean(false);
        }
      }
      return new Boolean(true);
    }
    ```

### 2.14. `there_exists(test: (v: T) => Boolean): Boolean`

-   **Purpose:** Existential quantifier - test if any item satisfies a condition.
-   **Pseudo-code:**
    ```typescript
    there_exists(test: (v: T) => Boolean): Boolean {
      for (const item of this._items) {
        if (test(item).value) {
          return new Boolean(true);
        }
      }
      return new Boolean(false);
    }
    ```

## 3. Invariants

-   **Count_valid:** `count() >= 0`
-   **Empty_valid:** `is_empty() = (count() = 0)`
-   **First_valid:** `not is_empty() implies first() = item(0)`
-   **Last_valid:** `not is_empty() implies last() = item(count() - 1)`

## 4. Pre-conditions

-   **item_pre:** `0 <= i < count()` (for item method)
-   **remove_pre:** `0 <= i < count()` (for remove method)
-   **first_pre:** `not is_empty()` (for first method)
-   **last_pre:** `not is_empty()` (for last method)

## 5. Post-conditions

-   **append_post:** `count() = old_count + 1 and last() = v`
-   **prepend_post:** `count() = old_count + 1 and first() = v`
-   **remove_post:** `count() = old_count - 1`

## 6. Example Usage

```typescript
const list = new List<Integer>();

// Add items
list.append(Integer.from(1));
list.append(Integer.from(2));
list.append(Integer.from(3));

console.log(list.count().value);        // 3
console.log(list.first().value);        // 1
console.log(list.last().value);         // 3
console.log(list.item(Integer.from(1)).value); // 2

// Check membership
console.log(list.has(Integer.from(2))); // true
console.log(list.has(Integer.from(5))); // false

// Find index
const idx = list.index_of(Integer.from(2));
console.log(idx.value);                 // 1

// Remove item
list.remove(Integer.from(1)); // Remove item at index 1 (value 2)
console.log(list.count().value);        // 2

// Prepend
list.prepend(Integer.from(0));
console.log(list.first().value);        // 0

// Quantifiers
const allPositive = list.for_all(v => new Boolean(v.value > 0));
console.log(allPositive.value);         // true

const hasNegative = list.there_exists(v => new Boolean(v.value < 0));
console.log(hasNegative.value);         // false
```

## 7. Test Cases

Key test cases to implement:
1. Test creation of empty list
2. Test append and count
3. Test prepend
4. Test first and last on non-empty list
5. Test first and last throw errors on empty list
6. Test item with valid and invalid indices
7. Test has with existing and non-existing values
8. Test index_of with existing and non-existing values
9. Test remove at various positions
10. Test extend with another list
11. Test for_all with all true and some false
12. Test there_exists with some true and all false
13. Test list with different types (String, OBJECT_ID, etc.)
14. Test list allows duplicates

## 8. References

-   [openEHR BASE Specification - List](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_list_t_class)
-   [Archie - Java List usage](https://github.com/openEHR/archie/tree/master/openehr-rm/src/main/java/com/nedap/archie)
