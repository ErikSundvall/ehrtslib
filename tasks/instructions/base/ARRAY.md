# Instruction: Implementing the `Array` Class

## 1. Description

The `Array<T>` class represents a fixed-size ordered collection of items with
indexed access. Unlike `List`, an array has a predetermined size set at
creation.

- **Reference:**
  [openEHR BASE - Array](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_array_class)

## 2. Behavior

### 2.1. Internal Storage

- **Purpose:** Store array items with fixed size.
- **Pseudo-code:**
  ```typescript
  private _items: T[];
  private _size: number;

  constructor(size: number) {
    super();
    this._size = size;
    this._items = new Array(size);
  }
  ```

### 2.2. `has(v: T): Boolean`

- **Purpose:** Test for membership of a value.
- **Pseudo-code:**
  ```typescript
  has(v: T): Boolean {
    for (let i = 0; i < this._size; i++) {
      if (this._items[i] && this._items[i].is_equal(v).value === true) {
        return new Boolean(true);
      }
    }
    return new Boolean(false);
  }
  ```

### 2.3. `count(): Integer`

- **Purpose:** Return the size of the array (not the number of non-null items).
- **Pseudo-code:**
  ```typescript
  count(): Integer {
    const int = new Integer();
    int.value = this._size;
    return int;
  }
  ```

### 2.4. `is_empty(): Boolean`

- **Purpose:** Check if the array has zero size.
- **Pseudo-code:**
  ```typescript
  is_empty(): Boolean {
    return new Boolean(this._size === 0);
  }
  ```

### 2.5. `item(i: Integer): T`

- **Purpose:** Get the item at index i (0-based).
- **Pseudo-code:**
  ```typescript
  item(i: Integer): T {
    const idx = i.value;
    if (idx < 0 || idx >= this._size) {
      throw new Error(`Index out of bounds: ${idx}`);
    }
    return this._items[idx];
  }
  ```

### 2.6. `put(v: T, i: Integer): void`

- **Purpose:** Set the item at index i.
- **Pseudo-code:**
  ```typescript
  put(v: T, i: Integer): void {
    const idx = i.value;
    if (idx < 0 || idx >= this._size) {
      throw new Error(`Index out of bounds: ${idx}`);
    }
    this._items[idx] = v;
  }
  ```

### 2.7. `valid_index(i: Integer): Boolean`

- **Purpose:** Check if an index is valid for this array.
- **Pseudo-code:**
  ```typescript
  valid_index(i: Integer): Boolean {
    const idx = i.value;
    return new Boolean(idx >= 0 && idx < this._size);
  }
  ```

## 3. Invariants

- **Count_valid:** `count() >= 0`
- **Fixed_size:** Size is set at construction and doesn't change
- **Valid_indices:** All indices from 0 to `count() - 1` are valid

## 4. Pre-conditions

- **item_pre:** `valid_index(i)` (for item method)
- **put_pre:** `valid_index(i)` (for put method)
- **construction_pre:** Size must be >= 0

## 5. Post-conditions

- **put_post:** `item(i) = v` after `put(v, i)`
- **immutable_size:** Size never changes after construction

## 6. Example Usage

```typescript
// Create fixed-size array
const arr = new Array<Integer>(5);

// Set values
arr.put(Integer.from(10), Integer.from(0));
arr.put(Integer.from(20), Integer.from(1));
arr.put(Integer.from(30), Integer.from(2));

console.log(arr.count().value); // 5 (size, not filled count)

// Get values
console.log(arr.item(Integer.from(0)).value); // 10
console.log(arr.item(Integer.from(1)).value); // 20

// Check membership
console.log(arr.has(Integer.from(20))); // true
console.log(arr.has(Integer.from(99))); // false

// Check valid index
console.log(arr.valid_index(Integer.from(4))); // true
console.log(arr.valid_index(Integer.from(5))); // false
```

## 7. Test Cases

Key test cases to implement:

1. Test creation with specified size
2. Test put and item operations
3. Test item throws error for invalid index
4. Test put throws error for invalid index
5. Test has with existing and non-existing values
6. Test count returns array size (not filled count)
7. Test is_empty for zero-size array
8. Test valid_index with valid and invalid indices
9. Test array allows null/undefined items
10. Test array with different types
11. Test bounds checking

## 8. References

- [openEHR BASE Specification - Array](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_array_class)
- [Archie - Array usage](https://github.com/openEHR/archie/tree/master/openehr-rm/src/main/java/com/nedap/archie)
