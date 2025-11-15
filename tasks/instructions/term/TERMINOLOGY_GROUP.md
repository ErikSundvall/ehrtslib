# Instruction: Implementing the `TERMINOLOGY_GROUP` Class

## 1. Description

The `TERMINOLOGY_GROUP` class represents a vocabulary - a collection of coded
concepts with human-readable rubrics that can be translated.

- **Reference:**
  [openEHR TERM - Vocabularies](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html#_vocabularies)

## 2. Behavior

### 2.1. Properties

- `name: String` - Name of the vocabulary
- `openehr_id: String` - Identifier used in openEHR RM
- `concepts: List<TERMINOLOGY_CONCEPT>` - Coded terms with rubrics
- `status: TERMINOLOGY_STATUS` - Active/deprecated status

### 2.2. Methods

- `has_concept(code: String): Boolean` - Check if concept exists
- `concept(code: String): TERMINOLOGY_CONCEPT` - Get concept by code
- `all_codes(): List<String>` - Get all concept codes

## 3. Examples

Common vocabularies:

- `composition_category` - "event", "persistent", "episode"
- `attestation_reason` - "witnessed", "signed"
- `audit_change_type` - "creation", "amendment", "deletion"
- `null_flavours` - "no information", "not applicable", "masked"

## 4. Example Usage

```typescript
const categories = new TERMINOLOGY_GROUP();
categories.name = "composition_category";
categories.openehr_id = "composition category";

// Check if concept exists
if (categories.has_concept("433")) { // event
  const eventConcept = categories.concept("433");
  console.log(eventConcept.rubric); // "event"
}
```

## 5. References

- **Official Specification:**
  [openEHR TERM - Vocabularies](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html#_vocabularies)
