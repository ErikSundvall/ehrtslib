# Instruction: Implementing the `TERMINOLOGY_CONCEPT` Class

## 1. Description

The `TERMINOLOGY_CONCEPT` class represents a coded term with human-readable
rubric and description.

- **Reference:**
  [openEHR TERM](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html)

## 2. Behavior

### 2.1. Properties

- `code: String` - Concept code
- `rubric: String` - Human-readable term
- `description: String` - Detailed description
- `language: String` - Language code for rubric

## 3. Example Usage

```typescript
const concept = new TERMINOLOGY_CONCEPT();
concept.code = "433";
concept.rubric = "event";
concept.description = "Composition category for event-based clinical sessions";
concept.language = "en";
```

## 4. References

- **Official Specification:**
  [openEHR TERM](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html)
