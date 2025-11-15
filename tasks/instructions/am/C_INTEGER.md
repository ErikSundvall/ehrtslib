# Instruction: Implementing the `C_INTEGER` Class

## 1. Description

C_INTEGER constrains Integer values.

- **Reference:**
  [openEHR AM - C_INTEGER](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_integer_class)

## 2. Behavior

### 2.1. Properties

- `list: List<Integer>` - Allowed values
- `range: Interval<Integer>` - Allowed range

### 2.2. Methods

#### 2.2.1. `valid_value(value: Integer): Boolean`

Check if an integer value satisfies this constraint.

**Pseudo-code:**

```typescript
valid_value(value: Integer): Boolean {
  // If list is defined, value must be in list
  if (this.list && this.list.length > 0) {
    let found = false;
    for (const allowed of this.list) {
      if (value === allowed) {
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
const cInt = new C_INTEGER();
cInt.list = [0, 1, 2, 3, 4, 5];

// Or with range
const cRange = new C_INTEGER();
cRange.range = new Interval<Integer>();
cRange.range.lower = 0;
cRange.range.upper = 200;
```

## 4. References

- **Official Specification:**
  [openEHR AM - C_INTEGER](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_integer_class)
