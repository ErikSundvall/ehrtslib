# Instruction: Implementing the `Terminology_code` Class

## 1. Description

The `Terminology_code` class represents a single code from a terminology,
without full terminology context.

- **Reference:**
  [openEHR BASE - Terminology_code](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_terminology_code_class)

## 2. Behavior

Simpler than CODE_PHRASE - just holds a code string.

### 2.1. Properties

- **`code_string: String`** - The code value

## 3. Example Usage

```typescript
const code = new Terminology_code();
code.code_string = String.from("at0001");
```

## 4. References

- [openEHR BASE - Terminology_code](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_terminology_code_class)
