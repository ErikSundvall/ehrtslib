# EXTRACT_ENTITY_CHAPTER

## Description

Chapter within an extract organized by entity (e.g., per patient).

**Specification Reference:**
[openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- `entity_identifier`: HIER_OBJECT_ID - Identifier of the entity
- Inherits from EXTRACT_CHAPTER: directory, items

## Invariants

- `Entity_identifier_valid`: entity_identifier /= Void

## Example Usage

\`\`\`typescript const entityChapter = new EXTRACT_ENTITY_CHAPTER();
entityChapter.entity_identifier = patientId; entityChapter.items =
extractContentItems; \`\`\`

## Test Cases

1. **Entity ID required**: Must have entity identifier
2. **Content items**: Contains extract items for entity
3. **Organization**: Organizes extract by entity

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)
