# Instruction: Implementing the `DV_PROPORTION` Class

## 1. Description

The `DV_PROPORTION` class represents ratios, percentages, and fractions.

-   **Reference:** [openEHR RM - DV_PROPORTION](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_proportion_class)

## 2. Behavior

### 2.1. Properties

- `numerator: Real` - Top of ratio
- `denominator: Real` - Bottom of ratio
- `type: Integer` - Proportion type (ratio, unitary, percent, fraction, integer_fraction)
- `precision: Integer` - Decimal precision

### 2.2. Types

- 0 = RATIO (e.g., 1:2)
- 1 = UNITARY (e.g., 0.5 where denominator is 1)
- 2 = PERCENT (e.g., 50%)
- 3 = FRACTION (e.g., 1/2)
- 4 = INTEGER_FRACTION (numerator and denominator both integers)

## 3. Example Usage

```typescript
// 50% = 50/100
const percent = new DV_PROPORTION();
percent.numerator = 50;
percent.denominator = 100;
percent.type = 2;  // PERCENT

// Ratio 1:2
const ratio = new DV_PROPORTION();
ratio.numerator = 1;
ratio.denominator = 2;
ratio.type = 0;  // RATIO
```

## 4. References

-   **Official Specification:** [openEHR RM - DV_PROPORTION](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_proportion_class)
