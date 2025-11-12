# Instruction: Implementing the `REFERENCE_RANGE<T>` Class

## 1. Description

REFERENCE_RANGE represents a normal or reference range for an ordered value.

-   **Reference:** [openEHR RM - REFERENCE_RANGE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_reference_range_class)

## 2. Behavior

### 2.1. Properties

- `meaning: DV_TEXT` - Meaning of range (e.g., "normal", "critical high")
- `range: DV_INTERVAL<T>` - The range interval

### 2.2. Methods

#### 2.2.1. `is_in_range(value: T): Boolean`

Check if value is within this reference range.

**Pseudo-code:**
```typescript
is_in_range(value: T): Boolean {
  if (!this.range) {
    return Boolean.from(false);
  }
  
  return this.range.has(value);
}
```

## 3. Example Usage

```typescript
const refRange = new REFERENCE_RANGE<DV_QUANTITY>();
refRange.meaning = new DV_TEXT("normal");

const interval = new DV_INTERVAL<DV_QUANTITY>();
interval.lower = new DV_QUANTITY(120, "mm[Hg]");
interval.upper = new DV_QUANTITY(140, "mm[Hg]");
interval.lower_included = Boolean.from(true);
interval.upper_included = Boolean.from(true);
refRange.range = interval;
```

## 4. References

-   **Official Specification:** [openEHR RM - REFERENCE_RANGE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_reference_range_class)
