# Instruction: Implementing the `C_ATTRIBUTE` Class

## 1. Description

C_ATTRIBUTE represents a constraint on a reference model attribute.

- **Reference:**
  [openEHR AM - C_ATTRIBUTE](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_attribute_class)

## 2. Behavior

### 2.1. Properties

- `rm_attribute_name: String` - RM attribute being constrained
- `existence: Multiplicity_interval` - Whether attribute must exist
- `children: List<C_OBJECT>` - Constraints on attribute value(s)

### 2.2. Methods

#### 2.2.1. `is_valid(): Boolean`

Check if attribute constraint is valid.

**Pseudo-code:**

```typescript
is_valid(): Boolean {
  // Must have an attribute name
  if (!this.rm_attribute_name || this.rm_attribute_name === "") {
    return Boolean.from(false);
  }
  
  // All children must be valid
  if (this.children) {
    for (const child of this.children) {
      if (!child.is_valid()) {
        return Boolean.from(false);
      }
    }
  }
  
  // Existence must be valid if specified
  if (this.existence && !this.existence.is_valid()) {
    return Boolean.from(false);
  }
  
  return Boolean.from(true);
}
```

#### 2.2.2. `is_multiple(): Boolean`

Returns true if this is a multiple-valued attribute.

**Pseudo-code:**

```typescript
is_multiple(): Boolean {
  // Check if attribute allows multiple values based on cardinality
  // This is implemented differently in subclasses
  return Boolean.from(false);  // Override in subclasses
}
```

### 2.3. Subclasses

- C_SINGLE_ATTRIBUTE (single-valued)
- C_MULTIPLE_ATTRIBUTE (multiple-valued)

## 3. Example Usage

```typescript
const cAttr = new C_ATTRIBUTE();
cAttr.rm_attribute_name = "data";
cAttr.existence = Multiplicity_interval.mandatory();
cAttr.children = [new C_COMPLEX_OBJECT()];
```

## 4. References

- **Official Specification:**
  [openEHR AM - C_ATTRIBUTE](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_attribute_class)
