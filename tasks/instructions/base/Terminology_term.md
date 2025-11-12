# Instruction: Implementing the `Terminology_term` Class

## 1. Description

The `Terminology_term` class represents a term from a terminology with both code and text.

-   **Reference:** [openEHR BASE - Terminology_term](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_terminology_term_class)

## 2. Behavior

### 2.1. Properties

-   **`code: Terminology_code`** - The terminology code
-   **`text: String`** - Display text for the term

## 3. Example Usage

```typescript
const term = new Terminology_term();
term.code = Terminology_code.from("at0001");
term.text = String.from("Blood pressure");
```

## 4. References

-   [openEHR BASE - Terminology_term](https://specifications.openehr.org/releases/BASE/latest/base_types.html#_terminology_term_class)
