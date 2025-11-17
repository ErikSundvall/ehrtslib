# Instruction: Implementing the `C_BOOLEAN` Class

## 1. Description

C_BOOLEAN constrains Boolean values.

- **Reference:**
  [openEHR AM - C_BOOLEAN](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_boolean_class)

## 2. Behavior

### 2.1. Properties

- `true_valid: Boolean` - Whether true is allowed
- `false_valid: Boolean` - Whether false is allowed

### 2.2. Methods

#### 2.2.1. `valid_value(value: Boolean): Boolean`

Check if a boolean value satisfies this constraint.

**Pseudo-code:**

```typescript
valid_value(value: Boolean): Boolean {
  if (value === true) {
    return Boolean.from(this.true_valid);
  } else {
    return Boolean.from(this.false_valid);
  }
}
```

## 3. Example Usage

```typescript
const cBool = new C_BOOLEAN();
cBool.true_valid = true;
cBool.false_valid = false; // Only true allowed
```

## 4. References

- **Official Specification:**
  [openEHR AM - C_BOOLEAN](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_boolean_class)
