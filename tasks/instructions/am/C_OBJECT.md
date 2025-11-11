# Instruction: Implementing the `C_OBJECT` Class

## 1. Description

C_OBJECT is the abstract parent for all object constraints in archetypes.

-   **Reference:** [openEHR AM - C_OBJECT](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_object_class)

## 2. Behavior

### 2.1. Properties

- `rm_type_name: String` - Reference model type being constrained
- `node_id: String` - Archetype node identifier (at0001, etc.)
- `occurrences: Multiplicity_interval` - Occurrence constraint

### 2.2. Subclasses

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
