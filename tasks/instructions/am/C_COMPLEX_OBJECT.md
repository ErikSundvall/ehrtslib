# Instruction: Implementing the `C_COMPLEX_OBJECT` Class

## 1. Description

C_COMPLEX_OBJECT represents a constraint on a non-primitive RM type.

-   **Reference:** [openEHR AM - C_COMPLEX_OBJECT](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_complex_object_class)

## 2. Behavior

- `attributes: List<C_ATTRIBUTE>` - Attribute constraints

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

-   **Official Specification:** [openEHR AM - C_COMPLEX_OBJECT](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_complex_object_class)
