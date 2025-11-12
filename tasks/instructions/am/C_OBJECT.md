# Instruction: Implementing the `C_OBJECT` Class

## 1. Description

C_OBJECT is the abstract parent for all object constraints in archetypes.

-   **Reference:** [openEHR AM - C_OBJECT](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_object_class)

## 2. Behavior

### 2.1. Properties

- `rm_type_name: String` - Reference model type being constrained
- `node_id: String` - Archetype node identifier (at0001, etc.)
- `occurrences: Multiplicity_interval` - Occurrence constraint

### 2.2. Methods

#### 2.2.1. `is_valid(): Boolean`

Check if constraint is structurally valid.

**Pseudo-code:**
```typescript
is_valid(): Boolean {
  // Must have an RM type
  if (!this.rm_type_name || this.rm_type_name === "") {
    return Boolean.from(false);
  }
  
  // Occurrences must be valid if specified
  if (this.occurrences && !this.occurrences.is_valid()) {
    return Boolean.from(false);
  }
  
  return Boolean.from(true);
}
```

#### 2.2.2. `conforms_to(other: C_OBJECT): Boolean`

Check if this constraint conforms to (is compatible with) another.

**Pseudo-code:**
```typescript
conforms_to(other: C_OBJECT): Boolean {
  // Must be same or subtype of other's RM type
  if (!this.is_subtype_of(this.rm_type_name, other.rm_type_name)) {
    return Boolean.from(false);
  }
  
  // This occurrences must be within other's occurrences
  if (this.occurrences && other.occurrences) {
    if (!this.occurrences.is_within(other.occurrences)) {
      return Boolean.from(false);
    }
  }
  
  return Boolean.from(true);
}
```

### 2.3. Subclasses

- C_COMPLEX_OBJECT
- C_PRIMITIVE_OBJECT
- ARCHETYPE_SLOT
- C_ARCHETYPE_ROOT

## 3. Example Usage

```typescript
// Use concrete subclass
const cObject = new C_COMPLEX_OBJECT();
cObject.rm_type_name = "OBSERVATION";
cObject.node_id = "at0000";
```

## 4. References

-   **Official Specification:** [openEHR AM - C_OBJECT](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_object_class)
