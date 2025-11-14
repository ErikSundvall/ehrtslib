# Instruction: Implementing the `Point_interval` Class

## 1. Description

The `Point_interval<T>` class represents an interval that is actually a single
point (lower = upper).

- **Reference:**
  [openEHR BASE - Point_interval](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_point_interval_class)

## 2. Behavior

Point_interval is a degenerate case of Interval where both bounds are the same
value.

### 2.1. Constructor

- **Pseudo-code:**
  ```typescript
  static from(value: T): Point_interval<T> {
    const interval = new Point_interval<T>();
    interval.lower = value;
    interval.upper = value;
    interval.lower_included = true;  // Must be included
    interval.upper_included = true;  // Must be included
    interval.lower_unbounded = false;
    interval.upper_unbounded = false;
    
    return interval;
  }
  ```

### 2.2. `has(v: T): Boolean`

- **Purpose:** Check if value equals the point.
- **Pseudo-code:**
  ```typescript
  has(v: T): Boolean {
    return this.lower.is_equal(v);
  }
  ```

## 3. Invariants

- **Is_point:** `lower.is_equal(upper)`
- **Both_included:** `lower_included and upper_included`

## 4. Pre-conditions

- Value must be provided.

## 5. Post-conditions

- Interval contains only the single point value.

## 6. Example Usage

```typescript
// Point interval at 5
const point = Point_interval.from(Integer.from(5));

console.log(point.has(Integer.from(5))); // true
console.log(point.has(Integer.from(4))); // false
console.log(point.has(Integer.from(6))); // false

// Date point
const datePoint = Point_interval.from(Iso8601_date.from("2024-03-15"));
console.log(datePoint.has(Iso8601_date.from("2024-03-15"))); // true
```

## 7. Test Cases

1. Test creation with single value
2. Test has() returns true only for the point value
3. Test lower and upper are equal
4. Test both bounds are included
5. Test with different types (Integer, Date, Time)

## 8. References

- [openEHR BASE - Point_interval](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_point_interval_class)
