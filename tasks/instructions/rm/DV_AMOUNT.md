# DV_AMOUNT

## Description

Abstract class for amounts - quantified values with an accuracy indicator. Parent of DV_QUANTITY and DV_COUNT.

**Specification Reference:** [openEHR RM Data Types](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_amount_class)

## Behavior

### Properties

- `accuracy`: Real (optional) - Accuracy of measurement as a percentage (0-100 or -1 for unknown)
- `accuracy_is_percent`: Boolean (optional) - True if accuracy is a percentage
- Inherits from DV_QUANTIFIED: magnitude, magnitude_status
- Inherits from DV_ORDERED: normal_range, other_reference_ranges, normal_status

### Methods

#### valid_accuracy(): boolean

True if accuracy is in valid range.

**Pseudocode:**
```typescript
function valid_accuracy(): boolean {
  if (this.accuracy === undefined || this.accuracy === null) return true;
  return this.accuracy === -1 || (this.accuracy >= 0 && this.accuracy <= 100);
}
```

#### add(other: DV_AMOUNT): DV_AMOUNT

Arithmetic sum of two amounts (abstract).

#### subtract(other: DV_AMOUNT): DV_AMOUNT

Arithmetic difference of two amounts (abstract).

## Invariants

- `Accuracy_is_percent_validity`: accuracy = 0 implies not accuracy_is_percent
- `Accuracy_validity`: accuracy /= Void implies valid_accuracy()

## Pre-conditions

None - abstract class

## Post-conditions

For add/subtract: Result accuracy is worst of operands

## Example Usage

```typescript
// Abstract - see DV_QUANTITY for concrete example
const quantity1 = new DV_QUANTITY();
quantity1.magnitude = 5.0;
quantity1.units = "kg";
quantity1.accuracy = 1.0; // 1% accuracy

const quantity2 = new DV_QUANTITY();
quantity2.magnitude = 3.0;
quantity2.units = "kg";
quantity2.accuracy = 0.5;

const sum = quantity1.add(quantity2); // 8kg with worst accuracy (1%)
```

## Test Cases

1. **Accuracy range**: Accuracy between 0-100 or -1 (unknown)
2. **Accuracy -1**: Unknown accuracy represented as -1
3. **Percent flag**: accuracy_is_percent indicates percentage
4. **Addition**: Two amounts can be added
5. **Subtraction**: Two amounts can be subtracted
6. **Accuracy propagation**: Result accuracy is worst of operands
7. **Unit compatibility**: Add/subtract requires compatible units
8. **Inheritance**: Inherits quantified and ordered properties

## References

- [openEHR RM Data Types Specification](https://specifications.openehr.org/releases/RM/latest/data_types.html)
