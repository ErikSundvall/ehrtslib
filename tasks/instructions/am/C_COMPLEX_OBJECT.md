# Instruction: Implementing the `C_COMPLEX_OBJECT` Class

## 1. Description

C_COMPLEX_OBJECT represents a constraint on a non-primitive RM type.

- **Reference:**
  [openEHR AM - C_COMPLEX_OBJECT](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_complex_object_class)

## 2. Behavior

### 2.1. Properties

- `attributes: List<C_ATTRIBUTE>` - Attribute constraints

### 2.2. Methods

#### 2.2.1. `is_valid(): Boolean`

Check if complex object constraint is valid.

**Pseudo-code:**

```typescript
is_valid(): Boolean {
  // Call parent validation
  if (!super.is_valid()) {
    return Boolean.from(false);
  }
  
  // All attributes must be valid
  if (this.attributes) {
    for (const attr of this.attributes) {
      if (!attr.is_valid()) {
        return Boolean.from(false);
      }
    }
  }
  
  return Boolean.from(true);
}
```

#### 2.2.2. `attribute_at_path(path: String): C_ATTRIBUTE`

Get attribute constraint at specified path.

**Pseudo-code:**

```typescript
attribute_at_path(path: String): C_ATTRIBUTE {
  if (!path || path === "") {
    return null;
  }
  
  // Parse first segment of path
  const segments = path.split('/');
  const firstSegment = segments[0];
  
  // Find matching attribute
  for (const attr of this.attributes) {
    if (attr.rm_attribute_name === firstSegment) {
      if (segments.length === 1) {
        return attr;
      }
      // Continue down path if more segments
      // ... recursive logic for deeper paths
    }
  }
  
  return null;
}
```

## 3. Example Usage

```typescript
const cComplex = new C_COMPLEX_OBJECT();
cComplex.rm_type_name = "OBSERVATION";
cComplex.node_id = "at0000";

const dataAttr = new C_ATTRIBUTE();
dataAttr.rm_attribute_name = "data";
cComplex.attributes = [dataAttr];
```

## 4. References

- **Official Specification:**
  [openEHR AM - C_COMPLEX_OBJECT](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_complex_object_class)
