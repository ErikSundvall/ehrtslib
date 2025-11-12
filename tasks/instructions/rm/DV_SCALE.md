# Instruction: Implementing the `DV_SCALE` Class

## 1. Description

DV_SCALE represents a coded ordinal value with symbol and value.

-   **Reference:** [openEHR RM - DV_SCALE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_scale_class)

## 2. Behavior

### 2.1. Properties

- `value: Real` - Numeric value
- `symbol: DV_CODED_TEXT` - Coded symbol/term

### 2.2. Methods

#### 2.2.1. `is_strictly_comparable_to(other: DV_SCALE): Boolean`

Check if comparable to another scale value (same scale system).

**Pseudo-code:**
```typescript
is_strictly_comparable_to(other: DV_SCALE): Boolean {
  // Must have same terminology/code system
  if (!this.symbol || !other.symbol) {
    return Boolean.from(false);
  }
  
  return Boolean.from(this.symbol.defining_code.terminology_id === 
                      other.symbol.defining_code.terminology_id);
}
```

## 3. Example Usage

```typescript
const scale = new DV_SCALE();
scale.value = 2.5;
scale.symbol = new DV_CODED_TEXT("moderate pain", "pain_scale::at0002");
```

## 4. References

-   **Official Specification:** [openEHR RM - DV_SCALE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_scale_class)
