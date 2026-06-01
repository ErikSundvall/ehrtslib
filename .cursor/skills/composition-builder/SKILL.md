---
name: composition-builder
description: >
  This skill should be used when the user asks to "build a composition", "create a composition",
  "validate a composition", "convert a composition", or "generate FLAT/STRUCTURED/CANONICAL format".
  Covers building, validating, and converting openEHR compositions in all simplified formats.
argument-hint: "<template-id> [format: flat|structured|canonical]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - mcp__openehr-assistant__ckm_template_get
  - mcp__openehr-assistant__guide_get
  - mcp__openehr-assistant__type_specification_get
  - mcp__openehr-assistant__terminology_resolve
  - mcp__openehr-assistant__examples_search
  - mcp__openehr-assistant__examples_get
---

# Composition Builder

## Step 1: Load Guides (MANDATORY)

Before building any composition, load the authoritative guides:

```
guide_get("simplified_formats/principles")
guide_get("simplified_formats/rules")
guide_get("simplified_formats/idioms-cheatsheet")
```

### Consult worked examples (when applicable)

For sample payloads on common concepts (e.g. blood pressure / vital signs, encounter with RM attributes, coded-text handling, raw-escape patterns), consult `examples_search(kind="flat")` or `examples_search(kind="structured")` before hand-crafting. Curated samples live under `openehr://examples/{flat|structured}/{name}` with pattern and related-guide metadata. Skip this step for novel or highly template-specific payloads.

## Step 2: Retrieve Template

Load the target template to understand the structure:

```
ckm_template_get("<template-id>")
```

**Important:** Simplified format field identifiers are ONLY valid for the specific target OPT. Always state the target template and validate paths against it. A field identifier valid for one template may be invalid or mean something different in another.

This reveals the archetype structure, constraints, and required fields.

## Step 3: Choose Format

### FLAT Format
Pipe-delimited paths with value suffixes. Best for simple integrations and form submissions.

```json
{
  "ctx/language": "en",
  "ctx/territory": "NL",
  "ctx/composer_name": "Dr. Smith",
  "vitals/body_temperature/any_event/temperature|magnitude": 37.2,
  "vitals/body_temperature/any_event/temperature|unit": "Cel"
}
```

Key suffixes: `|magnitude`, `|unit`, `|code`, `|value`, `|terminology`, `|name`

### STRUCTURED Format
Nested JSON mirroring the archetype hierarchy. Best for complex UIs and programmatic construction.

```json
{
  "ctx": { "language": "en", "territory": "NL" },
  "vitals": {
    "body_temperature": [{
      "any_event": [{
        "temperature": [{ "|magnitude": 37.2, "|unit": "Cel" }]
      }]
    }]
  }
}
```

### CANONICAL Format
Full Reference Model representation with `_type` annotations. Best for archival and CDR interactions.

```json
{
  "_type": "COMPOSITION",
  "archetype_details": { ... },
  "content": [{
    "_type": "OBSERVATION",
    "data": { ... }
  }]
}
```

## Step 4: Composition Metadata

Every composition requires context fields (`ctx/` in FLAT, `ctx` object in STRUCTURED):
- **composer** (`ctx/composer_name`): Who created the data (name, optionally ID)
- **language** (`ctx/language`): ISO 639-1 code (e.g., `en`, `nl`)
- **territory** (`ctx/territory`): ISO 3166-1 code (e.g., `NL`, `US`)
- **category**: `event` (point-in-time) or `persistent` (ongoing)
- **context**: `start_time` (`ctx/time`) and `setting` (e.g., `primary medical care`, `secondary medical care`)
- **id_namespace** (`ctx/id_namespace`): Optional, for identification context
- **id_scheme** (`ctx/id_scheme`): Optional, for identification scheme

## Step 5: RM Data Types

Use `type_specification_get` for detailed type structure when needed.

| RM Type | Example Use | Key Fields |
|---------|------------|------------|
| DV_TEXT | Free text | `value` |
| DV_CODED_TEXT | Coded values | `value`, `defining_code` (terminology_id + code_string) |
| DV_QUANTITY | Measurements | `magnitude`, `units`, optionally `precision` |
| DV_DATE_TIME | Timestamps | ISO 8601 value |
| DV_ORDINAL | Ordered scales | `value` (integer), `symbol` (DV_CODED_TEXT) |
| DV_BOOLEAN | True/false | `value` |
| DV_COUNT | Counts | `magnitude` |
| DV_PROPORTION | Ratios/percentages | `numerator`, `denominator`, `type` |
| DV_DURATION | Time periods | ISO 8601 duration (e.g., `P2D`, `PT4H`) |
| DV_IDENTIFIER | External IDs | `id`, `type`, `issuer`, `assigner` |
| DV_URI | URIs/URLs | `value` |
| DV_PARSABLE | Structured text | `value`, `formalism` |

## Step 6: Validation

Before finalizing a composition, verify:
- [ ] All required fields are present (check template constraints)
- [ ] Cardinality constraints are met (min/max occurrences)
- [ ] `_type` annotations are correct (CANONICAL format)
- [ ] Terminology codes are valid (use `terminology_resolve` if needed)
- [ ] Date/time values are valid ISO 8601
- [ ] Quantity units match archetype constraints
- [ ] Composition metadata is complete (composer, language, territory, category)
