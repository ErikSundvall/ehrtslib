# Instruction: Implementing the `CODE_PHRASE` Class

## 1. Description

CODE_PHRASE represents a coded term from a terminology or code set.

- **Reference:**
  [openEHR RM - CODE_PHRASE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_code_phrase_class)

## 2. Behavior

### 2.1. Properties

- `terminology_id: TERMINOLOGY_ID` - Source terminology
- `code_string: String` - Code value

### 2.2. Methods

#### 2.2.1. `equals(other: CODE_PHRASE): Boolean`

Check equality with another CODE_PHRASE.

**Pseudo-code:**

```typescript
equals(other: CODE_PHRASE): Boolean {
  if (!other) {
    return Boolean.from(false);
  }
  
  return Boolean.from(
    this.terminology_id.value === other.terminology_id.value &&
    this.code_string === other.code_string
  );
}
```

## 3. Example Usage

```typescript
const code = new CODE_PHRASE();
code.terminology_id = new TERMINOLOGY_ID("SNOMED-CT");
code.code_string = "38341003"; // Hypertension
```

## 4. References

- **Official Specification:**
  [openEHR RM - CODE_PHRASE](https://specifications.openehr.org/releases/RM/latest/data_types.html#_code_phrase_class)
