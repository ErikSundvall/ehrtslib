# EXTRACT_ENTITY_MANIFEST

## Description

Manifest describing entities included in an extract.

**Specification Reference:** [openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- `entity_identifier`: HIER_OBJECT_ID - Entity identifier
- `item_count`: Integer - Number of items for this entity
- `version_count`: Integer (optional) - Number of versions

## Invariants

- `Entity_identifier_valid`: entity_identifier /= Void
- `Item_count_valid`: item_count >= 0

## Example Usage

\`\`\`typescript
const manifest = new EXTRACT_ENTITY_MANIFEST();
manifest.entity_identifier = patientId;
manifest.item_count = 25;
manifest.version_count = 32;
\`\`\`

## Test Cases

1. **Entity ID required**: Must have identifier
2. **Item count**: Non-negative count
3. **Version count**: Optional version tracking
4. **Manifest info**: Describes extract contents

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)
