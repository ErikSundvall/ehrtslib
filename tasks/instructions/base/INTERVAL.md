# Instruction: Implementing the `Interval` Class

## 1. Description

The `Interval<T>` class represents a generic interval of ordered values. It can
be bounded or unbounded on either side and can be open or closed at each
boundary. This is a fundamental type used throughout openEHR for representing
ranges of dates, times, quantities, etc.

- **Reference:**
  [openEHR BASE - Data Structures - Interval](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_interval_t_class)

## 2. Behavior

### 2.1. Properties

- **`lower?: T`**: Lower bound of interval (optional, undefined means unbounded
  below)
- **`upper?: T`**: Upper bound of interval (optional, undefined means unbounded
  above)
- **`lower_included?: Boolean`**: True if lower bound is included (closed),
  false if excluded (open)
- **`upper_included?: Boolean`**: True if upper bound is included (closed),
  false if excluded (open)
- **`lower_unbounded?: Boolean`**: True if the interval has no lower limit
- **`upper_unbounded?: Boolean`**: True if the interval has no upper limit

### 2.2. `has(v: T): Boolean`

- **Purpose:** Check if a value is contained in the interval.
- **Pseudo-code:**
  ```typescript
  has(v: T): Boolean {
    // Check lower bound
    if (!this.lower_unbounded && this.lower !== undefined) {
      const cmp = v.less_than(this.lower);
      if (cmp.value === true) return new Boolean(false);
      
      if (!this.lower_included) {
        const eq = v.is_equal(this.lower);
        if (eq.value === true) return new Boolean(false);
      }
    }
    
    // Check upper bound
    if (!this.upper_unbounded && this.upper !== undefined) {
      const cmp = this.upper.less_than(v);
      if (cmp.value === true) return new Boolean(false);
      
      if (!this.upper_included) {
        const eq = v.is_equal(this.upper);
        if (eq.value === true) return new Boolean(false);
      }
    }
    
    return new Boolean(true);
  }
  ```

### 2.3. `intersects(other: Interval<T>): Boolean`

- **Purpose:** Check if this interval intersects with another.
- **Pseudo-code:**
  ```typescript
  intersects(other: Interval<T>): Boolean {
    // Check if one interval is completely before the other
    if (!this.upper_unbounded && this.upper !== undefined &&
        !other.lower_unbounded && other.lower !== undefined) {
      if (this.upper.less_than(other.lower).value) {
        return new Boolean(false);
      }
      // Check boundary conditions
      if (this.upper.is_equal(other.lower).value &&
          (!this.upper_included || !other.lower_included)) {
        return new Boolean(false);
      }
    }
    
    if (!other.upper_unbounded && other.upper !== undefined &&
        !this.lower_unbounded && this.lower !== undefined) {
      if (other.upper.less_than(this.lower).value) {
        return new Boolean(false);
      }
      // Check boundary conditions
      if (other.upper.is_equal(this.lower).value &&
          (!other.upper_included || !this.lower_included)) {
        return new Boolean(false);
      }
    }
    
    return new Boolean(true);
  }
  ```

### 2.4. `contains(other: Interval<T>): Boolean`

- **Purpose:** Check if this interval completely contains another.
- **Pseudo-code:**
  ```typescript
  contains(other: Interval<T>): Boolean {
    // Check lower bound containment
    if (!other.lower_unbounded && other.lower !== undefined) {
      if (this.lower_unbounded) {
        // This is unbounded below, so it contains other's lower
      } else if (this.lower === undefined) {
        return new Boolean(false);
      } else {
        if (this.lower.less_than(other.lower).value) {
          // OK
        } else if (this.lower.is_equal(other.lower).value) {
          // Equal bounds - check inclusion
          if (!this.lower_included && other.lower_included) {
            return new Boolean(false);
          }
        } else {
          return new Boolean(false);
        }
      }
    }
    
    // Check upper bound containment (similar logic)
    if (!other.upper_unbounded && other.upper !== undefined) {
      if (this.upper_unbounded) {
        // This is unbounded above, so it contains other's upper
      } else if (this.upper === undefined) {
        return new Boolean(false);
      } else {
        if (other.upper.less_than(this.upper).value) {
          // OK
        } else if (this.upper.is_equal(other.upper).value) {
          // Equal bounds - check inclusion
          if (!this.upper_included && other.upper_included) {
            return new Boolean(false);
          }
        } else {
          return new Boolean(false);
        }
      }
    }
    
    return new Boolean(true);
  }
  ```

### 2.5. `is_equal(other: Any): Boolean`

- **Purpose:** Check if two intervals are equal (same bounds and inclusion).
- **Pseudo-code:**
  ```typescript
  is_equal(other: Any): Boolean {
    if (!(other instanceof Interval)) {
      return new Boolean(false);
    }
    
    // Compare lower bounds
    if (this.lower_unbounded !== other.lower_unbounded) {
      return new Boolean(false);
    }
    if (!this.lower_unbounded) {
      if (this.lower === undefined || other.lower === undefined) {
        return new Boolean(false);
      }
      if (!this.lower.is_equal(other.lower).value) {
        return new Boolean(false);
      }
      if (this.lower_included !== other.lower_included) {
        return new Boolean(false);
      }
    }
    
    // Compare upper bounds (similar logic)
    if (this.upper_unbounded !== other.upper_unbounded) {
      return new Boolean(false);
    }
    if (!this.upper_unbounded) {
      if (this.upper === undefined || other.upper === undefined) {
        return new Boolean(false);
      }
      if (!this.upper.is_equal(other.upper).value) {
        return new Boolean(false);
      }
      if (this.upper_included !== other.upper_included) {
        return new Boolean(false);
      }
    }
    
    return new Boolean(true);
  }
  ```

## 3. Invariants

- **Lower_included_valid:** `lower_unbounded implies not lower_included`
- **Upper_included_valid:** `upper_unbounded implies not upper_included`
- **Limits_consistent:**
  `(not upper_unbounded and not lower_unbounded) implies lower.less_than(upper) or lower.is_equal(upper)`
- **Limits_comparable:**
  `(not upper_unbounded and not lower_unbounded) implies lower.is_strictly_comparable_to(upper)`

## 4. Pre-conditions

- For bounded intervals, the type T must implement the Ordered interface.
- If both bounds are defined, lower must not be greater than upper.

## 5. Post-conditions

- Methods return consistent results based on the interval's bounds and inclusion
  flags.

## 6. Example Usage

```typescript
// Closed interval [1, 10]
const int1 = new Interval<Integer>();
int1.lower = Integer.from(1);
int1.upper = Integer.from(10);
int1.lower_included = true;
int1.upper_included = true;

console.log(int1.has(Integer.from(5))); // true
console.log(int1.has(Integer.from(1))); // true (lower included)
console.log(int1.has(Integer.from(10))); // true (upper included)
console.log(int1.has(Integer.from(11))); // false

// Open interval (1, 10)
const int2 = new Interval<Integer>();
int2.lower = Integer.from(1);
int2.upper = Integer.from(10);
int2.lower_included = false;
int2.upper_included = false;

console.log(int2.has(Integer.from(1))); // false (lower excluded)
console.log(int2.has(Integer.from(10))); // false (upper excluded)
console.log(int2.has(Integer.from(5))); // true

// Unbounded below (-∞, 100]
const int3 = new Interval<Integer>();
int3.lower_unbounded = true;
int3.upper = Integer.from(100);
int3.upper_included = true;

console.log(int3.has(Integer.from(-1000))); // true
console.log(int3.has(Integer.from(100))); // true
console.log(int3.has(Integer.from(101))); // false
```

## 7. Test Cases

Key test cases to implement:

1. Test closed intervals [a, b] with boundary values
2. Test open intervals (a, b) with boundary values
3. Test half-open intervals [a, b) and (a, b]
4. Test unbounded intervals (-∞, b], [a, +∞), (-∞, +∞)
5. Test has() method with various values
6. Test intersects() with overlapping and non-overlapping intervals
7. Test contains() with fully contained and partially contained intervals
8. Test is_equal() for identical and different intervals
9. Test with different types (Integer, Date, Time)
10. Test edge cases like single-point intervals [a, a]

## 8. References

- [openEHR BASE Specification - Interval](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_interval_t_class)
- [Archie Interval Implementation](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/datavalues/quantity/datetime/DvInterval.java)
- [Java-libs Interval](https://github.com/openEHR/java-libs/blob/master/openehr-rm-core/src/main/java/org/openehr/rm/datatypes/quantity/DvInterval.java)
