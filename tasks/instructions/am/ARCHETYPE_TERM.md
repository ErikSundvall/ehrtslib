# Instruction: Implementing the `ARCHETYPE_TERM` Class

## 1. Description

ARCHETYPE_TERM represents a term definition for an archetype node.

-   **Reference:** [openEHR AM - ARCHETYPE_TERM](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_archetype_term_class)

## 2. Behavior

- `code: String` - Node ID (at0001, etc.)
- `items: Hash<String, String>` - text, description, comment, etc.

## 3. Example Usage

```typescript
const term = new ARCHETYPE_TERM();
term.code = "at0000";
term.items = {
  "text": "Blood pressure",
  "description": "Blood pressure measurement archetype"
};
```

## 4. References

-   **Official Specification:** [openEHR AM - ARCHETYPE_TERM](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_archetype_term_class)
