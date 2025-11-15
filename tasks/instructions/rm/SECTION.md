# Instruction: Implementing the `SECTION` Class

## 1. Description

The `SECTION` class organizes content within a COMPOSITION into logical groups.

- **Reference:**
  [openEHR RM - SECTION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_section_class)

## 2. Behavior

### 2.1. Properties

#### `items: List<CONTENT_ITEM>`

- **Purpose:** Content items (SECTION or ENTRY).
- **Optional:** Yes

### 2.2. Structure

```
COMPOSITION
└── SECTION ("History")
    ├── SECTION ("Medical History")
    │   └── EVALUATION (Problem list)
    └── SECTION ("Surgical History")
        └── EVALUATION (Procedures)
```

## 3. Example Usage

```typescript
const section = new SECTION();
section.archetype_node_id = "openEHR-EHR-SECTION.adhoc.v1";

const name = new DV_TEXT();
name.value = "History";
section.name = name;

const subsection = new SECTION();
// ... populate subsection

section.items = new List<CONTENT_ITEM>();
section.items.append(subsection);
```

## 4. References

- **Official Specification:**
  [openEHR RM - SECTION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_section_class)
