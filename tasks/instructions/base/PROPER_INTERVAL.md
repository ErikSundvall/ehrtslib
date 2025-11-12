# Instruction: Implementing the `Proper_interval` Class

## 1. Description

The `Proper_interval<T>` class represents an interval where lower and upper bounds are properly defined (not both unbounded).

-   **Reference:** [openEHR BASE - Proper_interval](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_proper_interval_class)

## 2. Behavior

Proper_interval extends Interval<T> with the additional constraint that at least one bound must be defined.

### 2.1. Constructor

-   **Pseudo-code:**
    ```typescript
    constructor() {
      super();
    }
    
    static from(lower: T | undefined, upper: T | undefined,
                lowerIncluded: boolean, upperIncluded: boolean): Proper_interval<T> {
      if (lower === undefined && upper === undefined) {
        throw new Error("At least one bound must be defined for Proper_interval");
      }
      
      const interval = new Proper_interval<T>();
      interval.lower = lower;
      interval.upper = upper;
      interval.lower_included = lowerIncluded;
      interval.upper_included = upperIncluded;
      interval.lower_unbounded = (lower === undefined);
      interval.upper_unbounded = (upper === undefined);
      
      return interval;
    }
    ```

## 3. Invariants

-   **Not_both_unbounded:** `not (lower_unbounded and upper_unbounded)`
-   Inherits all invariants from Interval<T>

## 4. Pre-conditions

-   At least one of lower or upper must be defined.

## 5. Post-conditions

-   Is a valid interval with at least one bound.

## 6. Example Usage

```typescript
// Bounded below only: [5, +∞)
const interval1 = Proper_interval.from(
  Integer.from(5),
  undefined,
  true,
  false
);

// Bounded above only: (-∞, 10]
const interval2 = Proper_interval.from(
  undefined,
  Integer.from(10),
  false,
  true
);

// Fully bounded: [1, 10]
const interval3 = Proper_interval.from(
  Integer.from(1),
  Integer.from(10),
  true,
  true
);
```

## 7. Test Cases

1. Test creation with lower bound only
2. Test creation with upper bound only
3. Test creation with both bounds
4. Test creation throws error with no bounds
5. Test all Interval operations work correctly

## 8. References

-   [openEHR BASE - Proper_interval](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_proper_interval_class)
