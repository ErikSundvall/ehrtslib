# Instruction: Implementing the `ARCHETYPE_TERMINOLOGY` Class

## 1. Description

ARCHETYPE_TERMINOLOGY contains the terminology definitions for an archetype.

-   **Reference:** [openEHR AM - ARCHETYPE_TERMINOLOGY](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_archetype_terminology_class)

## 2. Behavior

### 2.1. Properties

- `term_definitions: Hash<String, Hash<String, ARCHETYPE_TERM>>` - Term definitions by language and code
- `value_sets: Hash<String, VALUE_SET>` - Value set definitions
- `term_bindings: Hash<String, Hash<String, URI>>` - External terminology bindings

### 2.2. Methods

#### 2.2.1. `has_term(code: String): Boolean`

Check if a term definition exists for a code in any language.

**Pseudo-code:**
```typescript
has_term(code: String): Boolean {
  if (!this.term_definitions) {
    return Boolean.from(false);
  }
  
  // Check all languages
  for (const lang in this.term_definitions) {
    const terms = this.term_definitions[lang];
    if (terms[code]) {
      return Boolean.from(true);
    }
  }
  
  return Boolean.from(false);
}
```

#### 2.2.2. `term_definition(code: String, language: String): ARCHETYPE_TERM`

Get term definition for a code in a specific language.

**Pseudo-code:**
```typescript
term_definition(code: String, language: String): ARCHETYPE_TERM {
  if (!this.term_definitions || !this.term_definitions[language]) {
    return null;
  }
  
  return this.term_definitions[language][code] || null;
}
```

#### 2.2.3. `value_set(id: String): VALUE_SET`

Get value set by ID.

**Pseudo-code:**
```typescript
value_set(id: String): VALUE_SET {
  if (!this.value_sets) {
    return null;
  }
  
  return this.value_sets[id] || null;
}
```

## 3. Example Usage

```typescript
const terminology = new ARCHETYPE_TERMINOLOGY();

// Add term definitions
terminology.term_definitions = {
  "en": {
    "at0000": new ARCHETYPE_TERM("blood pressure", "Blood pressure measurement"),
    "at0001": new ARCHETYPE_TERM("systolic", "Systolic pressure")
  },
  "sv": {
    "at0000": new ARCHETYPE_TERM("blodtryck", "Blodtrycksmätning"),
    "at0001": new ARCHETYPE_TERM("systoliskt", "Systoliskt tryck")
  }
};
```

## 4. References

-   **Official Specification:** [openEHR AM - ARCHETYPE_TERMINOLOGY](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_archetype_terminology_class)
