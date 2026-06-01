---
name: aql-query
description: >
  This skill should be used when the user asks to "write an AQL query", "explain an AQL query",
  "optimize an AQL query", "review AQL", or "query openEHR data". Covers writing, explaining,
  and optimizing AQL (Archetype Query Language) queries for openEHR clinical data repositories.
argument-hint: "<clinical question or AQL query>"
allowed-tools:
  - Read
  - Glob
  - Grep
  - mcp__openehr-assistant__guide_get
  - mcp__openehr-assistant__ckm_archetype_get
  - mcp__openehr-assistant__ckm_template_get
  - mcp__openehr-assistant__type_specification_get
  - mcp__openehr-assistant__examples_search
  - mcp__openehr-assistant__examples_get
---

# AQL Query Authoring

## Step 1: Load Guides (MANDATORY)

Before writing or reviewing any AQL query, load the authoritative guides:

```
guide_get("aql/principles")
guide_get("aql/syntax")
guide_get("aql/idioms-cheatsheet")
```

### Consult worked examples (when applicable)

When the user asks for a query to adapt, or when the clinical question matches a common pattern (cohort selection, pagination with total count, time-window filtering, cross-composition joins, terminology value-set matching, "latest per EHR", ISM-state filtering), try `examples_search(kind="aql")` before drafting. The curated AQL examples are under `openehr://examples/aql/{name}` and include pattern metadata and related-spec links — reuse and adapt rather than invent. Skip this step if the question is clearly novel or the user already provided the skeleton.

## Step 2: Understand the Data Model

AQL queries operate on archetypes. Before writing a query:

1. State assumptions about deployed templates/archetypes — verify path endpoints and RM types against the deployed template, not display labels
2. Identify which archetypes contain the data you need
3. Load the archetype to understand its path structure:
   ```
   ckm_archetype_get("<archetype-id>")
   ```
4. Use `type_specification_get` if you need to understand RM type details

## Step 3: AQL Syntax

### Basic Structure
```sql
SELECT <paths>
FROM EHR e
  CONTAINS COMPOSITION c[openEHR-EHR-COMPOSITION.<name>.v1]
    CONTAINS OBSERVATION o[openEHR-EHR-OBSERVATION.<name>.v1]
WHERE <conditions>
ORDER BY <paths>
```

### Containment
Define the archetype hierarchy using `CONTAINS`:
```sql
FROM EHR e
  CONTAINS COMPOSITION c
    CONTAINS OBSERVATION o[openEHR-EHR-OBSERVATION.blood_pressure.v2]
```

### Path Syntax
Navigate archetype structure using at-codes:
```
o/data[at0001]/events[at0006]/data[at0003]/items[at0004]/value/magnitude
```

### EHR Predicates
Filter by patient:
```sql
FROM EHR e[ehr_id/value = $ehr_id]
```

### Parameterized Queries
Use `$parameter` syntax for reusable queries:
```sql
WHERE o/data[at0001]/events[at0006]/time/value > $start_date
```

## Step 4: Common Patterns

### Latest Composition by Type
```sql
SELECT c
FROM EHR e[ehr_id/value = $ehr_id]
  CONTAINS COMPOSITION c[openEHR-EHR-COMPOSITION.encounter.v1]
ORDER BY c/context/start_time/value DESC
LIMIT 1
```

### Observations in Date Range
```sql
SELECT o/data[at0001]/events[at0006]/data[at0003]/items[at0004]/value/magnitude AS systolic
FROM EHR e[ehr_id/value = $ehr_id]
  CONTAINS COMPOSITION c
    CONTAINS OBSERVATION o[openEHR-EHR-OBSERVATION.blood_pressure.v2]
WHERE c/context/start_time/value >= $start_date
  AND c/context/start_time/value <= $end_date
```

### Aggregates
```sql
SELECT
  COUNT(o) AS count,
  AVG(o/data[at0001]/events[at0006]/data[at0003]/items[at0004]/value/magnitude) AS avg_systolic
FROM EHR e
  CONTAINS COMPOSITION c
    CONTAINS OBSERVATION o[openEHR-EHR-OBSERVATION.blood_pressure.v2]
GROUP BY e/ehr_id/value
```

## Step 5: Optimization

- Use specific archetype node IDs in containment (avoid unqualified `CONTAINS OBSERVATION o`)
- Avoid `SELECT *` — select only needed paths
- Place most selective WHERE conditions first
- Use parameterized queries for repeated execution
- Consider index-friendly patterns (ehr_id, composition time, archetype node IDs)
- Do not assume engine-specific behavior beyond the AQL specification

## Step 6: Review

Run through the AQL checklist:

```
guide_get("aql/checklist")
```

Verify:
- [ ] Correct containment hierarchy matching the archetype structure
- [ ] Valid archetype paths (matching at-codes from the archetype definition)
- [ ] Proper use of aliases for readability
- [ ] Parameters used for variable values
- [ ] Results ordered meaningfully
- [ ] Query is optimized for the CDR
