# Instruction: Implementing the `AUTHORED_ARCHETYPE` Class

## 1. Description

AUTHORED_ARCHETYPE extends ARCHETYPE with authoring metadata.

- **Reference:**
  [openEHR AM - AUTHORED_ARCHETYPE](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_authored_archetype_class)

## 2. Behavior

- `description: RESOURCE_DESCRIPTION` - Authoring metadata
- `translations: Hash<String, TRANSLATION_DETAILS>` - Translations
- `original_language: Terminology_code` - Original language

### 2.2. Subclasses

- TEMPLATE
- OPERATIONAL_TEMPLATE

## 3. References

- **Official Specification:**
  [openEHR AM - AUTHORED_ARCHETYPE](https://specifications.openehr.org/releases/AM/latest/AOM2.html#_authored_archetype_class)
