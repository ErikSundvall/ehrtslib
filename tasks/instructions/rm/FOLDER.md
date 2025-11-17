# Instruction: Implementing the `FOLDER` Class

## 1. Description

FOLDER organizes compositions into hierarchical structures.

- **Reference:**
  [openEHR RM - FOLDER](https://specifications.openehr.org/releases/RM/latest/ehr.html#_folder_class)

## 2. Behavior

- `folders: List<FOLDER>` - Subfolders
- `items: List<OBJECT_REF>` - References to compositions

## 3. Example Usage

```typescript
const folder = new FOLDER();
folder.archetype_node_id = "openEHR-EHR-FOLDER.generic.v1";
folder.name = DV_TEXT.from("Episodes");

const subfolder = new FOLDER();
folder.folders = new List<FOLDER>();
folder.folders.append(subfolder);
```

## 4. References

- **Official Specification:**
  [openEHR RM - FOLDER](https://specifications.openehr.org/releases/RM/latest/ehr.html#_folder_class)
