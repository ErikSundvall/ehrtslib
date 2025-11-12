# Instruction: Implementing the `DV_INTERVAL<T>` Class

## 1. Description

DV_INTERVAL represents an interval of ordered data values.

-   **Reference:** [openEHR RM - DV_INTERVAL](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_interval_class)

## 2. Behavior

### 2.1. Properties

- `lower: T` - Lower bound (where T extends DV_ORDERED)
- `upper: T` - Upper bound
- `lower_included: Boolean` - Whether lower bound is included
- `upper_included: Boolean` - Whether upper bound is included
- `lower_unbounded: Boolean` - Whether lower is unbounded
- `upper_unbounded: Boolean` - Whether upper is unbounded

### 2.2. Methods

#### 2.2.1. `has(value: T): Boolean`

Check if value is in interval.

**Pseudo-code:**
```typescript
has(value: T): Boolean {
  // Check lower bound
  if (!this.lower_unbounded) {
    if (this.lower_included) {
      if (value < this.lower) return Boolean.from(false);
    } else {
      if (value <= this.lower) return Boolean.from(false);
    }
  }
  
  // Check upper bound
  if (!this.upper_unbounded) {
    if (this.upper_included) {
      if (value > this.upper) return Boolean.from(false);
    } else {
      if (value >= this.upper) return Boolean.from(false);
    }
  }
  
  return Boolean.from(true);
}
```

## 3. Example Usage

```typescript
const interval = new DV_INTERVAL<DV_QUANTITY>();
interval.lower = new DV_QUANTITY(120, "mm[Hg]");
interval.upper = new DV_QUANTITY(140, "mm[Hg]");
interval.lower_included = Boolean.from(true);
interval.upper_included = Boolean.from(true);
```

## 4. References

-   **Official Specification:** [openEHR RM - DV_INTERVAL](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_interval_class)
