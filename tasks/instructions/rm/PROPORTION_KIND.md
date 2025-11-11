# Instruction: Implementing the `PROPORTION_KIND` Class

## 1. Description

PROPORTION_KIND is an enumeration of types of proportion relationships.

-   **Reference:** [openEHR RM - PROPORTION_KIND](https://specifications.openehr.org/releases/RM/latest/data_types.html#_proportion_kind_enumeration)

## 2. Behavior

### 2.1. Values

- `RATIO` (0) - Numerator/denominator (e.g., 1:128)
- `UNITARY` (1) - Numerator/denominator where denominator is 1 (e.g., 5/1)
- `PERCENT` (2) - Numerator is percent of denominator (0-100)
- `FRACTION` (3) - Numerator/denominator fraction (e.g., 1/2, 3/4)
- `INTEGER_FRACTION` (4) - Integer + fraction (e.g., 1 1/2)

## 3. Example Usage

```typescript
const proportion = new DV_PROPORTION();
proportion.numerator = 50.0;
proportion.denominator = 100.0;
proportion.type = PROPORTION_KIND.PERCENT;
```

## 4. References

-   **Official Specification:** [openEHR RM - PROPORTION_KIND](https://specifications.openehr.org/releases/RM/latest/data_types.html#_proportion_kind_enumeration)
