# Instruction: Implementing the `C_ATTRIBUTE` Class

## 1. Description

C_ATTRIBUTE represents a constraint on a reference model attribute.

-   **Reference:** [openEHR AM - C_ATTRIBUTE](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_attribute_class)

## 2. Behavior

### 2.1. Properties

- `rm_attribute_name: String` - RM attribute being constrained
- `existence: Multiplicity_interval` - Whether attribute must exist
- `children: List<C_OBJECT>` - Constraints on attribute value(s)

### 2.2. Subclasses

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

-   **Official Specification:** [openEHR AM - C_ATTRIBUTE](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_attribute_class)
