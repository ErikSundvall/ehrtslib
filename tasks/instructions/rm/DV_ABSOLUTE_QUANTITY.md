# DV_ABSOLUTE_QUANTITY

## Description

Abstract class for absolute quantified amounts - amounts with specific units. Parent of DV_QUANTITY.

**Specification Reference:** [openEHR RM Data Types](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_absolute_quantity_class)

## Behavior

### Properties

- `accuracy`: Real (optional) - Inherited from DV_AMOUNT
- `magnitude`: Real - Inherited from DV_QUANTIFIED
- Inherits full hierarchy from DV_AMOUNT -> DV_QUANTIFIED -> DV_ORDERED

### Methods

All methods inherited from parent classes. This class adds constraints ensuring absolute (rather than relative) quantification.

## Invariants

Inherits all invariants from parent classes.

## Pre-conditions

None - abstract class

## Post-conditions

None - abstract class

## Example Usage

```typescript
// Abstract - see DV_QUANTITY for concrete implementation
const quantity = new DV_QUANTITY(); // Concrete subclass
quantity.magnitude = 75.5;
quantity.units = "kg";
quantity.accuracy = 0.1; // ±0.1kg
```

## Test Cases

1. **Absolute measurement**: Value represents absolute quantity (not relative)
2. **Has magnitude**: All absolute quantities have magnitude
3. **Has accuracy**: Accuracy can be specified
4. **Unit-based**: Must have units (in concrete DV_QUANTITY)
5. **Inheritance**: Full DV_ORDERED hierarchy
6. **Comparison**: Can compare absolute quantities
7. **Arithmetic**: Support add/subtract operations
8. **Type checking**: Type ensures absolute quantities

## References

- [openEHR RM Data Types Specification](https://specifications.openehr.org/releases/RM/latest/data_types.html)
