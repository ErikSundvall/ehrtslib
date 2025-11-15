# Instruction: Implementing the `Container` Class

## 1. Description

The `Container<T>` class is an abstract ancestor of container types whose items
are addressable in some way. It provides the fundamental interface for
collections of items.

- **Reference:**
  [openEHR BASE - Container](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_container_class)

## 2. Behavior

### 2.1. `has(v: T): Boolean`

- **Purpose:** Test for membership of a value.
- **Behavior:**
  - Should return `true` if the container contains the value `v`.
  - Should return `false` otherwise.
  - Comparison should use value equality (`is_equal`).
- **Pseudo-code:**
  ```typescript
  abstract has(v: T): Boolean;
  ```

### 2.2. `count(): Integer`

- **Purpose:** Return the number of items in the container.
- **Behavior:**
  - Should return the total count of items.
  - Must be non-negative.
- **Pseudo-code:**
  ```typescript
  abstract count(): Integer;
  ```

### 2.3. `is_empty(): Boolean`

- **Purpose:** Check if the container is empty.
- **Behavior:**
  - Should return `true` if `count() = 0`.
  - Should return `false` otherwise.
- **Pseudo-code:**
  ```typescript
  abstract is_empty(): Boolean;
  ```

### 2.4. `there_exists(test: (v: T) => Boolean): Boolean`

- **Purpose:** Existential quantifier - test if any item satisfies a condition.
- **Behavior:**
  - Takes a test function as parameter.
  - Returns `true` if at least one item satisfies the test.
  - Returns `false` if no items satisfy the test.
- **Pseudo-code:**
  ```typescript
  there_exists(test: (v: T) => Boolean): Boolean {
    // Iterate through items
    // Return true if any item satisfies test
    // Return false otherwise
  }
  ```

### 2.5. `for_all(test: (v: T) => Boolean): Boolean`

- **Purpose:** Universal quantifier - test if all items satisfy a condition.
- **Behavior:**
  - Takes a test function as parameter.
  - Returns `true` if all items satisfy the test.
  - Returns `false` if any item doesn't satisfy the test.
- **Pseudo-code:**
  ```typescript
  for_all(test: (v: T) => Boolean): Boolean {
    // Iterate through items
    // Return false if any item doesn't satisfy test
    // Return true if all items satisfy test
  }
  ```

## 3. Invariants

- **Count_valid:** `count() >= 0`
- **Empty_valid:** `is_empty() = (count() = 0)`

## 4. Pre-conditions

- None for the abstract class. Concrete implementations may have specific
  requirements.

## 5. Post-conditions

- `there_exists` and `for_all` don't modify the container.
- Results are consistent with the current state of the container.

## 6. Example Usage

```typescript
// Using a concrete implementation like List
const list = new List<Integer>();
list.append(Integer.from(1));
list.append(Integer.from(2));
list.append(Integer.from(3));

// has - membership test
console.log(list.has(Integer.from(2))); // true
console.log(list.has(Integer.from(5))); // false

// count
console.log(list.count().value); // 3

// is_empty
console.log(list.is_empty()); // false

// there_exists - at least one even number
const hasEven = list.there_exists((v) => new Boolean(v.value % 2 === 0));
console.log(hasEven); // true

// for_all - all positive
const allPositive = list.for_all((v) => new Boolean(v.value > 0));
console.log(allPositive); // true
```

## 7. Test Cases

Key test cases to implement:

1. Test abstract class serves as base for concrete containers
2. Test `has` with existing and non-existing values
3. Test `count` returns correct number
4. Test `is_empty` on empty and non-empty containers
5. Test `there_exists` with conditions that match some, all, or no items
6. Test `for_all` with conditions that match all or some items
7. Test quantifiers on empty containers
8. Test with different item types (Integer, String, complex objects)

## 8. References

- [openEHR BASE Specification - Container](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_container_class)
- [Archie - Collection types](https://github.com/openEHR/archie/tree/master/openehr-rm/src/main/java/com/nedap/archie)
