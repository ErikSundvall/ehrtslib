# Instruction: Implementing the `Multiplicity_interval` Class

## 1. Description

The `Multiplicity_interval` class represents intervals of integers used to
specify multiplicities in UML-like constraints (e.g., 0..1, 1.._, 0.._).

- **Reference:**
  [openEHR BASE - Multiplicity_interval](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_multiplicity_interval_class)

## 2. Behavior

Multiplicity_interval extends Proper_interval<Integer> with special semantics
for unbounded upper limits (* in UML).

### 2.1. Constructor

- **Pseudo-code:**
  ```typescript
  static from(lower: number, upper: number | undefined): Multiplicity_interval {
    const interval = new Multiplicity_interval();
    interval.lower = Integer.from(lower);
    
    if (upper === undefined) {
      // Unbounded (*)
      interval.upper = undefined;
      interval.upper_unbounded = true;
    } else {
      interval.upper = Integer.from(upper);
      interval.upper_unbounded = false;
    }
    
    interval.lower_included = true;
    interval.upper_included = true;
    interval.lower_unbounded = false;
    
    return interval;
  }

  // Common patterns
  static optional(): Multiplicity_interval {
    return Multiplicity_interval.from(0, 1);  // 0..1
  }

  static mandatory(): Multiplicity_interval {
    return Multiplicity_interval.from(1, 1);  // 1..1
  }

  static zeroOrMore(): Multiplicity_interval {
    return Multiplicity_interval.from(0, undefined);  // 0..*
  }

  static oneOrMore(): Multiplicity_interval {
    return Multiplicity_interval.from(1, undefined);  // 1..*
  }
  ```

### 2.2. `is_optional(): Boolean`

- **Purpose:** Check if lower bound is 0.
- **Pseudo-code:**
  ```typescript
  is_optional(): Boolean {
    return new Boolean(this.lower.value === 0);
  }
  ```

### 2.3. `is_mandatory(): Boolean`

- **Purpose:** Check if lower bound is >= 1.
- **Pseudo-code:**
  ```typescript
  is_mandatory(): Boolean {
    return new Boolean(this.lower.value >= 1);
  }
  ```

### 2.4. `is_open(): Boolean`

- **Purpose:** Check if upper bound is unbounded (*).
- **Pseudo-code:**
  ```typescript
  is_open(): Boolean {
    return new Boolean(this.upper_unbounded);
  }
  ```

## 3. Invariants

- **Lower_non_negative:** `lower >= 0`
- **Upper_greater_or_equal:** `upper_unbounded or upper >= lower`

## 4. Example Usage

```typescript
// Common patterns
const optional = Multiplicity_interval.optional(); // 0..1
console.log(optional.is_optional()); // true

const mandatory = Multiplicity_interval.mandatory(); // 1..1
console.log(mandatory.is_mandatory()); // true

const zeroOrMore = Multiplicity_interval.zeroOrMore(); // 0..*
console.log(zeroOrMore.is_open()); // true

const oneOrMore = Multiplicity_interval.oneOrMore(); // 1..*
console.log(oneOrMore.is_mandatory()); // true
console.log(oneOrMore.is_open()); // true

// Custom
const twoToFive = Multiplicity_interval.from(2, 5); // 2..5
console.log(twoToFive.has(Integer.from(3))); // true
```

## 5. Use in Archetypes

Multiplicity intervals are fundamental in archetype constraints:

- `0..1` - Optional, single value
- `1..1` - Mandatory, single value
- `0..*` - Optional, multiple values
- `1..*` - Mandatory, at least one value
- `2..5` - Between 2 and 5 values

## 6. Test Cases

1. Test optional() factory method (0..1)
2. Test mandatory() factory method (1..1)
3. Test zeroOrMore() factory method (0..*)
4. Test oneOrMore() factory method (1..*)
5. Test custom multiplicity (e.g., 2..5)
6. Test is_optional() query
7. Test is_mandatory() query
8. Test is_open() query
9. Test has() with various values
10. Test that lower is always non-negative

## 7. References

- [openEHR BASE - Multiplicity_interval](https://specifications.openehr.org/releases/BASE/latest/foundation_types.html#_multiplicity_interval_class)
- [UML Multiplicities](https://www.uml-diagrams.org/multiplicity.html)
