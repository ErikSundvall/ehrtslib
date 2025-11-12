# EXTRACT_FOLDER

## Description

Folder structure within an extract, similar to FOLDER but for extracts.

**Specification Reference:** [openEHR RM Extract](https://specifications.openehr.org/releases/RM/latest/integration.html)

## Behavior

### Properties

- `items`: List<OBJECT_REF> - References to items in folder
- `folders`: List<EXTRACT_FOLDER> - Sub-folders
- Inherits from LOCATABLE: archetype_node_id, name, uid

## Example Usage

\`\`\`typescript
const extractFolder = new EXTRACT_FOLDER();
extractFolder.name = new DV_TEXT();
extractFolder.name.value = "Medications";
extractFolder.items = [compositionRefs];
extractFolder.folders = [subFolders];
\`\`\`

## Test Cases

1. **Folder hierarchy**: Can contain sub-folders
2. **Item references**: References to extract content
3. **Organization**: Organizes extract content
4. **LOCATABLE**: Is a LOCATABLE with UID

## References

- [openEHR RM Integration](https://specifications.openehr.org/releases/RM/latest/integration.html)
