# Markdown Serialization for openEHR

Token-efficient Markdown serializers for openEHR RM instances, designed for LLM context windows. Pair with `MarkdownDeserializer` for the **structural** dialect only.

See also [`../documents-codecs.md`](../documents-codecs.md) for the cross-codec round-trip matrix.

## Preset overview

| Preset | Config | Parser accepts? | Emits / omits | Intended use |
| :--- | :--- | :--- | :--- | :--- |
| **Structural** (default) | `STRUCTURAL_MARKDOWN_CONFIG` | **Yes** (`MarkdownDeserializer`) | Frontmatter, heading hierarchy, `_[TYPE]_`, node-id HTML comments, terse codes, sparse `<!-- oe:v1:b64:… -->` only when display text is ambiguous; `_structure:` for non-`ITEM_TREE` item structures | Round-trip RM instances with operational template validation |
| **Clinical** | `CLINICAL_MARKDOWN_CONFIG` | **No** (output-only) | GFM tables, wikilinks; omits node IDs, types, most metadata | Human clinical documents |
| **Compact** | `COMPACT_MARKDOWN_CONFIG` | **No** | Inline values, minimal headings; strips structural carriers | Minimum tokens for LLM context |
| **Embedding** | `EMBEDDING_MARKDOWN_CONFIG` | **No** | Clinical hierarchy and display text only; **no** frontmatter, node IDs, `oe:v1`, or terse codes (`useTerseFormat: false`) | RAG / embedding corpora (smallest readable clinical text) |
| **Wikilink URN** | `WIKILINK_MARKDOWN_CONFIG` | **No** | AOM `urn:openehr:aom:…` wikilinks; hides type annotations for display | Wiki tools (Obsidian, Logseq) |

**Structural vs compact vs embedding:** compact and embedding both drop path-identifying markers; **embedding** is the dedicated minimal clinical dialect (no `oe:v1`, no codes in line). **Compact** is similar but can still use terse inlined codes. Only **structural** is accepted by `MarkdownDeserializer` (`MARKDOWN_CODEC_MATRIX.losslessDialects`).

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

Lossless dialect for round-tripping **when the operational template is available**. Uses HTML comments for archetype node ids, type annotations, and sparse `oe:v1:b64` value typing.

**Use case:** LLM context that must parse back to RM JSON with template validation

### 3. Compact Markdown (`COMPACT_MARKDOWN_CONFIG`)

Maximum token efficiency. Strips structural overhead; only clinical surface content remains.

### 4. Embedding Markdown (`EMBEDDING_MARKDOWN_CONFIG`)

Human-readable hierarchy without machine annotations — intentionally **not** parseable as structural Markdown (`InvalidFormatError` if you try).

### 5. Wikilink URN (`WIKILINK_MARKDOWN_CONFIG`)

Clinical-style layout with `[[urn:openehr:aom:…|label]]` links; output-only.

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
import {
  MarkdownSerializer,
  MarkdownDeserializer,
  CLINICAL_MARKDOWN_CONFIG,
  COMPACT_MARKDOWN_CONFIG,
  EMBEDDING_MARKDOWN_CONFIG,
} from "ehrtslib/serialization-markdown";

const structural = new MarkdownSerializer();
const md = structural.serialize(composition);
const round = new MarkdownDeserializer({ validateAgainstTemplate: opt })
  .deserialize(md);
```

## Round-tripping (Structural variant)

`MarkdownDeserializer` accepts **structural** dialect only. It preserves:

1. YAML frontmatter (composition metadata)
2. HTML comments for `archetype_node_id`
3. Type annotations on entries
4. Sparse `<!-- oe:v1:b64:… -->` when display text alone is ambiguous

Tests: `test_data/tests/serialization/markdown_roundtrip.test.ts`, `documents_codec_matrix.test.ts`, `opt_template_roundtrip.test.ts`.

**Limits:** Round-trip is **template-validated** RM instance reconstruction, not guaranteed **canonical JSON equality** when optional document branches are elided on large OPT-generated instances. Embedding/clinical/compact/wikilink output is rejected with `InvalidFormatError`.

## Token Efficiency

Approximate token savings vs canonical JSON for a typical blood pressure composition:

| Format | Relative Size |
| :--- | :--- |
| Canonical JSON | 100% (baseline) |
| Structural Markdown | ~35-40% |
| Clinical Markdown | ~25-30% |
| Compact / Embedding | ~15-25% (embedding often smallest) |
