# Instruction: Implementing the `C_TERMINOLOGY_CODE` Class

## 1. Description

C_TERMINOLOGY_CODE constrains terminology-coded values.

- **Reference:**
  [openEHR AM - C_TERMINOLOGY_CODE](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_terminology_code_class)

## 2. Behavior

### 2.1. Properties

- `constraint: List<String>` - Allowed codes (at codes or external codes)

### 2.2. Methods

#### 2.2.1. `valid_value(code: String): Boolean`

Check if a code satisfies this constraint.

**Pseudo-code:**

```typescript
valid_value(code: String): Boolean {
  if (!this.constraint || this.constraint.length === 0) {
    // No constraint means any code is valid
    return Boolean.from(true);
  }
  
  // Check if code is in constraint list
  for (const allowed of this.constraint) {
    if (code === allowed) {
      return Boolean.from(true);
    }
  }
  
  return Boolean.from(false);
}
```

## 3. Example Usage

```typescript
const cCode = new C_TERMINOLOGY_CODE();
cCode.constraint = ["at0001", "at0002", "at0003"];
```

## 4. References

- **Official Specification:**
  [openEHR AM - C_TERMINOLOGY_CODE](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_terminology_code_class)
