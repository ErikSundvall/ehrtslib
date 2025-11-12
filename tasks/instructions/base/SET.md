# Instruction: Implementing the `Set` Class

## 1. Description

The `Set<T>` class represents an unordered collection of items where duplicates are not allowed. It extends `Container<T>` and enforces uniqueness of elements.

-   **Reference:** [openEHR BASE - Set](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_set_class)

## 2. Behavior

### 2.1. Internal Storage

-   **Purpose:** Store set items without duplicates.
-   **Pseudo-code:**
    ```typescript
    private _items: T[] = [];
    // Or use a native Set with custom equality
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

-   **Purpose:** Return the number of items in the set.
-   **Pseudo-code:**
    ```typescript
    count(): Integer {
      const int = new Integer();
      int.value = this._items.length;
      return int;
    }
    ```

### 2.4. `is_empty(): Boolean`

-   **Purpose:** Check if the set is empty.
-   **Pseudo-code:**
    ```typescript
    is_empty(): Boolean {
      return new Boolean(this._items.length === 0);
    }
    ```

### 2.5. `add(v: T): void`

-   **Purpose:** Add an item to the set if not already present.
-   **Pseudo-code:**
    ```typescript
    add(v: T): void {
      if (!this.has(v).value) {
        this._items.push(v);
      }
    }
    ```

### 2.6. `remove(v: T): void`

-   **Purpose:** Remove an item from the set.
-   **Pseudo-code:**
    ```typescript
    remove(v: T): void {
      const index = this._items.findIndex(item => 
        item.is_equal(v).value === true
      );
      if (index !== -1) {
        this._items.splice(index, 1);
      }
    }
    ```

### 2.7. `union(other: Set<T>): Set<T>`

-   **Purpose:** Return the union of this set with another.
-   **Pseudo-code:**
    ```typescript
    union(other: Set<T>): Set<T> {
      const result = new Set<T>();
      // Add all items from this set
      for (const item of this._items) {
        result.add(item);
      }
      // Add all items from other set
      const otherCount = other.count().value;
      for (let i = 0; i < otherCount; i++) {
        result.add(other.item(Integer.from(i)));
      }
      return result;
    }
    ```

### 2.8. `intersection(other: Set<T>): Set<T>`

-   **Purpose:** Return the intersection of this set with another.
-   **Pseudo-code:**
    ```typescript
    intersection(other: Set<T>): Set<T> {
      const result = new Set<T>();
      for (const item of this._items) {
        if (other.has(item).value) {
          result.add(item);
        }
      }
      return result;
    }
    ```

### 2.9. `difference(other: Set<T>): Set<T>`

-   **Purpose:** Return items in this set but not in other.
-   **Pseudo-code:**
    ```typescript
    difference(other: Set<T>): Set<T> {
      const result = new Set<T>();
      for (const item of this._items) {
        if (!other.has(item).value) {
          result.add(item);
        }
      }
      return result;
    }
    ```

## 3. Invariants

-   **No_duplicates:** All items in the set are unique
-   **Count_valid:** `count() >= 0`
-   **Empty_valid:** `is_empty() = (count() = 0)`

## 4. Pre-conditions

-   Items must have proper `is_equal` implementation for uniqueness checking.

## 5. Post-conditions

-   **add_post:** After add, `has(v) = true`
-   **remove_post:** After remove, `has(v) = false`
-   **no_duplicates_post:** Set never contains duplicate items

## 6. Example Usage

```typescript
const set1 = new Set<Integer>();
set1.add(Integer.from(1));
set1.add(Integer.from(2));
set1.add(Integer.from(3));
set1.add(Integer.from(2)); // Duplicate, won't be added

console.log(set1.count().value);  // 3 (not 4)
console.log(set1.has(Integer.from(2)));  // true

const set2 = new Set<Integer>();
set2.add(Integer.from(2));
set2.add(Integer.from(3));
set2.add(Integer.from(4));

// Union
const unionSet = set1.union(set2);
console.log(unionSet.count().value);  // 4 (1,2,3,4)

// Intersection
const intersectSet = set1.intersection(set2);
console.log(intersectSet.count().value);  // 2 (2,3)

// Difference
const diffSet = set1.difference(set2);
console.log(diffSet.count().value);  // 1 (only 1)
```

## 7. Test Cases

Key test cases to implement:
1. Test creation of empty set
2. Test add prevents duplicates
3. Test add and count
4. Test has with existing and non-existing values
5. Test remove existing and non-existing values
6. Test union of sets
7. Test intersection of sets
8. Test difference of sets
9. Test set operations don't modify original sets
10. Test with different types (String, complex objects)
11. Test uniqueness is based on value equality, not reference

## 8. References

-   [openEHR BASE Specification - Set](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_set_class)
-   [Archie - Set implementations](https://github.com/openEHR/archie/tree/master/openehr-rm/src/main/java/com/nedap/archie)
