# Instruction: Implementing the `COMPOSITION` Class

## 1. Description

The `COMPOSITION` class is the root container for clinical content in an EHR. It
represents a clinical document like a consultation note, discharge summary, or
lab report.

- **Reference:**
  [openEHR RM - COMPOSITION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_composition_class)

## 2. Behavior

### 2.1. Properties

#### `language: CODE_PHRASE`

- **Purpose:** Language of the composition.
- **Mandatory:** Yes

#### `territory: CODE_PHRASE`

- **Purpose:** Territory (country) where composed.
- **Mandatory:** Yes

#### `category: DV_CODED_TEXT`

- **Purpose:** Category (event, persistent, episode).
- **Mandatory:** Yes

#### `composer: PARTY_PROXY`

- **Purpose:** Person who authored the composition.
- **Mandatory:** Yes

#### `context: EVENT_CONTEXT`

- **Purpose:** Clinical session context.
- **Optional:** Yes (mandatory for event category)

#### `content: List<CONTENT_ITEM>`

- **Purpose:** Clinical content (SECTION, ENTRY).
- **Optional:** Yes

### 2.2. Methods

#### `is_persistent(): Boolean`

```typescript
is_persistent(): Boolean {
  return new Boolean(
    this.category.defining_code.code_string === "431"
  );
}
```

## 3. Invariants

- **Language_valid:** `language /= Void`
- **Territory_valid:** `territory /= Void`
- **Category_valid:** `category /= Void and then valid_category(category)`
- **Composer_valid:** `composer /= Void`
- **Context_valid:** `category.value = 'event' implies context /= Void`

## 4. Example Usage

```typescript
const composition = new COMPOSITION();
composition.archetype_node_id = "openEHR-EHR-COMPOSITION.encounter.v1";

composition.language = CODE_PHRASE.from("en", "ISO_639-1");
composition.territory = CODE_PHRASE.from("US", "ISO_3166-1");

const category = new DV_CODED_TEXT();
category.value = "event";
category.defining_code = CODE_PHRASE.from("433", "openehr");
composition.category = category;

const composer = new PARTY_IDENTIFIED();
// ... set composer details
composition.composer = composer;

// Add content
const section = new SECTION();
composition.content = new List<CONTENT_ITEM>();
composition.content.append(section);
```

## 5. References

- [openEHR RM - COMPOSITION](https://specifications.openehr.org/releases/RM/latest/ehr.html#_composition_class)
- [Archie COMPOSITION](https://github.com/openEHR/archie/blob/master/openehr-rm/src/main/java/com/nedap/archie/rm/composition/Composition.java)
