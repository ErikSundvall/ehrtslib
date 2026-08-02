# Markdown Serialization for openEHR

Token-efficient Markdown serializers for openEHR Reference Model objects, designed for LLM context windows.

## Variants

### 1. Clinical Markdown (`CLINICAL_MARKDOWN_CONFIG`)

Maximum human readability. Renders compositions as clinical documents with tables for structured data and wikilinks for terminology codes.

**Use case:** Clinical review, human consumption, documentation

**Example output:**
```markdown
---
template_id: "Blood Pressure Template v1"
composer: "Dr. Smith"
---
# Emergency Consultation

## Vital Signs

### Blood pressure

| Item | Value | Code |
| :--- | :--- | :--- |
| Systolic | 145 mm[Hg] | [SNOMED-CT:271649006] |
| Diastolic | 90 mm[Hg] | [SNOMED-CT:271650006] |
```

### 2. Structural Markdown (`STRUCTURAL_MARKDOWN_CONFIG`) - Default

Lossless format that preserves all information needed for round-tripping when combined with the template. Uses HTML comments for archetype_node_ids and type annotations.

**Use case:** LLM context that needs to be converted back to canonical JSON/XML

**Example output:**
```markdown
---
uid: "907a3c-..."
template_id: "Blood Pressure Template v1"
archetype_id: "openEHR-EHR-COMPOSITION.encounter.v1"
composer: "Dr. Smith"
language: "ISO_639-1::en"
territory: "ISO_3166-1::GB"
category: "openehr::433|event|"
---
# Blood Pressure Recording <!-- openEHR-EHR-COMPOSITION.encounter.v1 -->

## Blood pressure _[OBSERVATION]_ <!-- openEHR-EHR-OBSERVATION.blood_pressure.v2 -->

- _origin:_ 2026-04-13T10:30:00Z
**Any event** <!-- at0006 -->

- _time:_ 2026-04-13T10:30:00Z
- **Systolic:** 145 mm[Hg] <!-- at0004 -->
- **Diastolic:** 90 mm[Hg] <!-- at0005 -->
```

### 3. Compact Markdown (`COMPACT_MARKDOWN_CONFIG`)

Maximum token efficiency. Strips all structural overhead. Only clinical content remains.

**Use case:** Fitting maximum patient data into LLM context windows (~70-80% reduction vs canonical JSON)

**Example output:**
```markdown
# Blood Pressure Recording

## Blood pressure

- Systolic: 145 mm[Hg]
- Diastolic: 90 mm[Hg]
- Mean arterial pressure: 108 mm[Hg]
```

## Structural Mapping

| openEHR RM Type | Markdown Representation |
| :--- | :--- |
| COMPOSITION | Document with frontmatter + H1 heading |
| SECTION | H2/H3/H4 headings |
| OBSERVATION/EVALUATION/etc. | H2/H3/H4 headings (with type annotation) |
| HISTORY/EVENT | Bold label + list items |
| CLUSTER | Nested list with bold label |
| ELEMENT | List item: `name: value` |
| DV_QUANTITY | `magnitude units` (e.g., "145 mm[Hg]") |
| DV_CODED_TEXT | `text [terminology::code]` |
| DV_TEXT | Plain text |
| DV_DATE_TIME | ISO 8601 string |
| CODE_PHRASE | Terse format: `terminology::code` |

## Usage

```typescript
import { MarkdownSerializer, CLINICAL_MARKDOWN_CONFIG, COMPACT_MARKDOWN_CONFIG } from './mod.ts';

// Clinical (human-readable)
const clinical = new MarkdownSerializer(CLINICAL_MARKDOWN_CONFIG);
const doc = clinical.serialize(composition);

// Structural (lossless, default)
const structural = new MarkdownSerializer();
const lossless = structural.serialize(composition);

// Compact (max token efficiency)
const compact = new MarkdownSerializer(COMPACT_MARKDOWN_CONFIG);
const efficient = compact.serialize(composition);

// One-shot with custom config
const custom = MarkdownSerializer.serializeWith(composition, {
  style: 'structural',
  includeArchetypeNodeIds: true,
  codeRendering: 'wikilink',
  maxHeadingDepth: 3,
});
```

## Round-tripping (Structural variant)

The structural variant preserves enough information for round-tripping **when the template is available**:

1. YAML frontmatter stores composition-level metadata (uid, template_id, archetype_id, composer, language, territory, category)
2. HTML comments store archetype_node_ids at each level
3. Type annotations (e.g., `_[OBSERVATION]_`) disambiguate entry types
4. All data values are preserved with their types
5. Given the template, the deserializer can reconstruct the full path structure

## Token Efficiency

Approximate token savings vs canonical JSON for a typical blood pressure composition:

| Format | Relative Size |
| :--- | :--- |
| Canonical JSON | 100% (baseline) |
| Structural Markdown | ~35-40% |
| Clinical Markdown | ~25-30% |
| Compact Markdown | ~15-25% |
