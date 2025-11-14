# Instruction: Implementing the `C_REAL` Class

## 1. Description

C_REAL constrains Real (floating-point) values.

- **Reference:**
  [openEHR AM - C_REAL](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_real_class)

## 2. Behavior

### 2.1. Properties

- `list: List<Real>` - Allowed values
- `range: Interval<Real>` - Allowed range

### 2.2. Methods

#### 2.2.1. `valid_value(value: Real): Boolean`

Check if a real value satisfies this constraint.

**Pseudo-code:**

```typescript
valid_value(value: Real): Boolean {
  // If list is defined, value must be in list (with tolerance for floating point)
  if (this.list && this.list.length > 0) {
    let found = false;
    const EPSILON = 0.000001;
    for (const allowed of this.list) {
      if (Math.abs(value - allowed) < EPSILON) {
        found = true;
        break;
      }
    }
    if (!found) {
      return Boolean.from(false);
    }
  }
  
  // If range is defined, value must be in range
  if (this.range) {
    if (!this.range.has(value)) {
      return Boolean.from(false);
    }
  }
  
  return Boolean.from(true);
}
```

## 3. Example Usage

```typescript
const cReal = new C_REAL();
cReal.list = [0.0, 0.5, 1.0];

// Or with range
const cRange = new C_REAL();
cRange.range = new Interval<Real>();
cRange.range.lower = 0.0;
cRange.range.upper = 100.0;
```

## 4. References

- **Official Specification:**
  [openEHR AM - C_REAL](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_real_class)
