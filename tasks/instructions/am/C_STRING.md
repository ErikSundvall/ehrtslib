# Instruction: Implementing the `C_STRING` Class

## 1. Description

C_STRING constrains String values.

- **Reference:**
  [openEHR AM - C_STRING](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_string_class)

## 2. Behavior

### 2.1. Properties

- `list: List<String>` - Allowed string values
- `pattern: String` - Regex pattern

### 2.2. Methods

#### 2.2.1. `is_valid(): Boolean`

Check if string constraint is valid.

**Pseudo-code:**

```typescript
is_valid(): Boolean {
  // Must have either list or pattern (or both)
  if (!this.list && !this.pattern) {
    return Boolean.from(false);
  }
  
  // If pattern exists, validate it's a valid regex
  if (this.pattern) {
    try {
      new RegExp(this.pattern);
    } catch (e) {
      return Boolean.from(false);
    }
  }
  
  return Boolean.from(true);
}
```

#### 2.2.2. `valid_value(value: String): Boolean`

Check if a string value satisfies this constraint.

**Pseudo-code:**

```typescript
valid_value(value: String): Boolean {
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
  
  // If pattern is defined, value must match pattern
  if (this.pattern) {
    const regex = new RegExp(this.pattern);
    if (!regex.test(value)) {
      return Boolean.from(false);
    }
  }
  
  return Boolean.from(true);
}
```

## 3. Example Usage

```typescript
const cString = new C_STRING();
cString.list = ["male", "female", "other"];

// Or with pattern
const cPattern = new C_STRING();
cPattern.pattern = "[A-Z]{2}"; // Two uppercase letters
```

## 4. References

- **Official Specification:**
  [openEHR AM - C_STRING](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_string_class)
