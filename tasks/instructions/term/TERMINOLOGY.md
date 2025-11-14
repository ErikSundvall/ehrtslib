# Instruction: Implementing the `TERMINOLOGY` Class

## 1. Description

The `TERMINOLOGY` class is the top-level container for all terminology content
in openEHR, including both code sets and vocabularies.

- **Reference:**
  [openEHR TERM - TERMINOLOGY](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html)

## 2. Behavior

### 2.1. Properties

- `code_sets: List<CODE_SET>` - Collection of code sets
- `vocabularies: List<TERMINOLOGY_GROUP>` - Collection of vocabularies

### 2.2. Methods

- `has_code_set(name: String): Boolean` - Check if code set exists
- `code_set(name: String): CODE_SET` - Get code set by name
- `has_terminology_group(name: String): Boolean` - Check if vocabulary exists
- `terminology_group(name: String): TERMINOLOGY_GROUP` - Get vocabulary

## 3. Example Usage

```typescript
const terminology = new TERMINOLOGY();

// Check for code set
if (terminology.has_code_set("countries")) {
  const countries = terminology.code_set("countries");
}

// Check for vocabulary
if (terminology.has_terminology_group("composition_category")) {
  const categories = terminology.terminology_group("composition_category");
}
```

## 4. References

- **Official Specification:**
  [openEHR TERM](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html)
