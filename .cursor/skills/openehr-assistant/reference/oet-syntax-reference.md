# OET Syntax Reference

**Purpose:** Offline reference for the OET (Ocean Template) XML format. Use when writing, editing, or validating template (.oet) files locally.

---

## Overview

OET is an XML-based design-time format for openEHR templates. Templates aggregate archetypes into use-case-specific datasets and narrow their constraints.

- **Root element:** `<template>`
- **Namespace:** `xmlns="openEHR/v1/Template"`
- **OET** = design-time (authoring); **OPT** = runtime (flattened, resolves all archetype references)

---

## Top-Level Structure

```xml
<template xmlns="openEHR/v1/Template"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <id>...</id>
  <name>...</name>
  <description>...</description>
  <definition>...</definition>
  <annotations>...</annotations>
  <integrity_checks archetype_id="...">
    <digest>...</digest>
  </integrity_checks>
</template>
```

| Element | Purpose |
|---------|---------|
| `<id>` | UUID or unique string identifier |
| `<name>` | Human-readable template name |
| `<description>` | Metadata: lifecycle_state, purpose, use, misuse, other_details |
| `<definition>` | Constraint tree (archetypes + rules) |
| `<annotations>` | Free-form key/value metadata (e.g., fhir_mapping) |
| `<integrity_checks>` | Archetype digest for version verification |

---

## The `<definition>` Element

The definition tree consists of structural elements and constraint directives.

### Root definition
```xml
<definition archetype_id="openEHR-EHR-COMPOSITION.encounter.v1"
            xsi:type="COMPOSITION">
  <!-- Content and Rules go here -->
</definition>
```

The root always references a COMPOSITION archetype.

### `<Content>` — Top-level entries
Represents a top-level ENTRY placed in the composition:
```xml
<Content archetype_id="openEHR-EHR-OBSERVATION.blood_pressure.v2"
         path="/content" xsi:type="OBSERVATION">
  <!-- Rules and nested Items -->
</Content>
```

### `<Items>` — Nested archetypes (slot filling)
Represents an archetype placed into a slot:
```xml
<Items archetype_id="openEHR-EHR-CLUSTER.anatomical_location.v1"
       path="/protocol[at0011]/items[at0014]"
       xsi:type="CLUSTER">
  <!-- Rules -->
</Items>
```

The `path` is relative to the parent archetype's constraint tree.

---

## The `<Rule>` Element

Rules apply constraints to specific nodes by path.

### Common attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `path` | openEHR path to constrained node | `/data[at0001]/events[at0006]/data[at0003]/items[at0004]` |
| `name` | Override display name | `name="Heart Rate"` |
| `min` | Minimum occurrences | `min="1"` (make mandatory) |
| `max` | Maximum occurrences | `max="0"` (exclude) |
| `hide_on_form` | UI hint: hide structural node | `hide_on_form="true"` |
| `clone` | Create named variant of repeated structure | `clone="true"` |

### Exclude a node (max=0)
```xml
<Rule path="/data[at0001]/events[at0006]/data[at0003]/items[at0033]" max="0" />
```

### Make a node mandatory (min=1)
```xml
<Rule path="/data[at0001]/events[at0006]/data[at0003]/items[at0004]" min="1" />
```

### Rename a node
```xml
<Rule path="/data[at0001]/events[at0006]/data[at0003]/items[at0004]"
      name="Systolic Pressure" />
```

### Hide a structural node
```xml
<Rule path="/data[at0001]/events[at0006]" hide_on_form="true" />
```

### Clone for multiple instances
```xml
<Rule path="/data[at0001]/events[at0006]" clone="true" name="Standing" />
```

---

## Constraint Types

Rules may contain a `<constraint>` child element with a specific `xsi:type`.

### textConstraint (DV_TEXT / DV_CODED_TEXT)

Restrict coded values to a subset:
```xml
<Rule path="/data[at0001]/items[at0002]">
  <constraint xsi:type="textConstraint">
    <includedValues>local::at0003::Present</includedValues>
    <includedValues>local::at0004::Absent</includedValues>
    <limitToList>true</limitToList>
  </constraint>
</Rule>
```

### quantityConstraint (DV_QUANTITY)

Restrict units and magnitude ranges:
```xml
<Rule path="/data[at0001]/items[at0005]">
  <constraint xsi:type="quantityConstraint">
    <unitMagnitude>
      <unit>mm[Hg]</unit>
      <minMagnitude>0</minMagnitude>
      <maxMagnitude>1000</maxMagnitude>
    </unitMagnitude>
    <excludedUnits>kPa</excludedUnits>
  </constraint>
</Rule>
```

### multipleConstraint (type choice)

Restrict which RM types are permitted at a choice node:
```xml
<Rule path="/data[at0001]/items[at0010]">
  <constraint xsi:type="multipleConstraint">
    <includedTypes>Coded_text</includedTypes>
  </constraint>
</Rule>
```

---

## Metadata: `<description>`

```xml
<description>
  <lifecycle_state>in_development</lifecycle_state>
  <details>
    <purpose>Record blood pressure measurement during encounter</purpose>
    <use>Use for clinical encounters requiring BP recording</use>
    <misuse>Not for 24-hour ambulatory monitoring</misuse>
  </details>
  <other_details>
    <item>
      <key>MetaDataSet:Sample Set</key>
      <value>Template metadata sample set</value>
    </item>
  </other_details>
</description>
```

---

## Annotations

Free-form metadata, often used for implementation mappings:
```xml
<annotations path="/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]">
  <items>
    <key>fhir_mapping</key>
    <value>Observation</value>
  </items>
</annotations>
```

---

## Template Design Idioms

### Narrowing Principle
Templates can only further constrain archetypes, never relax:
- Mandatory stays mandatory
- Optional can become mandatory (`min="1"`) or excluded (`max="0"`)
- Value sets can be reduced but not expanded

### Exclude unused fields
Set `max="0"` on every archetype field not needed for the use case.

### Make fields mandatory for workflow
Set `min="1"` on optional fields that are required for the specific use case.

### Subset coded values
Use `textConstraint` with `limitToList="true"` to reduce a large value set to a local subset.

### Constrain quantity units
Use `quantityConstraint` to restrict to facility-specific units and safe magnitude ranges.

### Fill slots explicitly
Place `<Items>` elements for each archetype that should fill a slot. Close unused slots with `max="0"` on the slot path.

### Composition type
Choose based on CGEM:
- **Event** — each submission is a new record (encounters, lab results)
- **Persistent** — single maintained instance (problem list, allergies)
- **Episodic** — scoped to a care period (admission, care plan)

---

## Validation Checklist

When reviewing an OET file:
- [ ] Root definition references a valid COMPOSITION archetype
- [ ] All `<Content>` and `<Items>` reference valid archetype IDs
- [ ] All `path` attributes are valid openEHR paths against the referenced archetypes
- [ ] `min` values do not exceed archetype `max`
- [ ] `min` values are not lower than archetype `min`
- [ ] All coded value subsets use `limitToList="true"` where appropriate
- [ ] Units are UCUM-compliant
- [ ] Unused fields and slots are excluded (`max="0"`)
- [ ] `<description>` includes purpose, use, and misuse
