# Instruction: Implementing the `C_TERMINOLOGY_CODE` Class

## 1. Description

C_TERMINOLOGY_CODE constrains terminology-coded values.

-   **Reference:** [openEHR AM - C_TERMINOLOGY_CODE](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_terminology_code_class)

## 2. Behavior

- `constraint: List<String>` - Allowed codes (at codes or external)

## 3. Example Usage

```typescript
const cCode = new C_TERMINOLOGY_CODE();
cCode.constraint = ["at0001", "at0002", "at0003"];
```

## 4. References

-   **Official Specification:** [openEHR AM - C_TERMINOLOGY_CODE](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_terminology_code_class)
