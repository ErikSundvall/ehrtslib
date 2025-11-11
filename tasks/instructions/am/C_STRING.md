# Instruction: Implementing the `C_STRING` Class

## 1. Description

C_STRING constrains String values.

-   **Reference:** [openEHR AM - C_STRING](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_string_class)

## 2. Behavior

- `list: List<String>` - Allowed string values
- `pattern: String` - Regex pattern

## 3. Example Usage

```typescript
const cString = new C_STRING();
cString.list = ["male", "female", "other"];

// Or with pattern
const cPattern = new C_STRING();
cPattern.pattern = "[A-Z]{2}";  // Two uppercase letters
```

## 4. References

-   **Official Specification:** [openEHR AM - C_STRING](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_c_string_class)
