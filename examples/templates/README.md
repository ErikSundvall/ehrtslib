# Template Documentation

This directory contains information about the openEHR templates and archetypes used in the ehrtslib examples.

## About openEHR Archetypes

openEHR archetypes are reusable, vendor-independent specifications of clinical concepts. Each archetype defines:
- The structure of clinical data
- Constraints on values
- Terminology bindings
- Data types for each element

## Archetypes Used in Examples

### openEHR-EHR-COMPOSITION.encounter.v1

**Purpose**: A general-purpose composition for recording clinical encounters.

**Structure**:
- COMPOSITION (root)
  - context: EVENT_CONTEXT (optional but commonly used)
  - content: Array of CONTENT_ITEM (OBSERVATION, EVALUATION, INSTRUCTION, ACTION)

**Key Properties**:
- `category`: Must be set (typically "event" with code 433)
- `language`: ISO 639-1 language code (e.g., "en", "sv")
- `territory`: ISO 3166-1 territory code (e.g., "US", "SE")
- `composer`: Who created the composition

**Used In**: Both `basic-composition.ts` and `simple-observation.ts`

### openEHR-EHR-OBSERVATION.blood_pressure.v2

**Purpose**: Records blood pressure measurements.

**Structure**:
- OBSERVATION
  - data: HISTORY
    - events: Array of EVENT (typically POINT_EVENT)
      - data: ITEM_TREE
        - items: Array of ELEMENT
          - Systolic: DV_QUANTITY (mm[Hg])
          - Diastolic: DV_QUANTITY (mm[Hg])
          - Optional: Mean arterial pressure, Pulse pressure, etc.

**Common Node IDs**:
- `at0001`: Event Series (history)
- `at0002`: Any event (point event)
- `at0003`: Blood Pressure (item tree)
- `at0004`: Systolic (element)
- `at0005`: Diastolic (element)

**Used In**: `basic-composition.ts`

**Reference**: https://ckm.openehr.org/ckm/archetypes/1013.1.4049

### openEHR-EHR-OBSERVATION.body_temperature.v2

**Purpose**: Records body temperature measurements.

**Structure**:
- OBSERVATION
  - data: HISTORY
    - events: Array of EVENT
      - data: ITEM_TREE
        - items: Array of ELEMENT
          - Temperature: DV_QUANTITY (°C or °F)

**Common Node IDs**:
- `at0001`: History
- `at0002`: Any event
- `at0003`: Tree
- `at0004`: Temperature

**Used In**: `simple-observation.ts`

**Reference**: https://ckm.openehr.org/ckm/archetypes/1013.1.419

## Understanding Archetype Node IDs

Archetype node IDs (like `at0001`, `at0004`) are internal identifiers within archetypes that:
- Uniquely identify each node in the archetype tree
- Are used to reference specific elements
- Are typically not changed when creating instances
- Start with "at" followed by a number

The `archetype_node_id` property on RM classes should match these IDs when following a specific archetype.

## Data Types Reference

### DV_QUANTITY
Used for measurements with units:
```typescript
const quantity = new openehr_rm.DV_QUANTITY();
quantity.magnitude = 120.0;
quantity.units = "mm[Hg]";  // Use UCUM syntax
```

Common units:
- Blood pressure: `mm[Hg]`
- Temperature: `°C`, `°F`, `K`
- Weight: `kg`, `lb`
- Height: `cm`, `m`, `in`

### DV_TEXT
Plain text without coding:
```typescript
const text = new openehr_rm.DV_TEXT();
text.value = "Patient is well";
```

### DV_CODED_TEXT
Text with terminology binding:
```typescript
const coded = new openehr_rm.DV_CODED_TEXT();
coded.value = "event";
coded.defining_code = codePhrase;  // CODE_PHRASE instance
```

### DV_DATE_TIME
ISO 8601 date/time:
```typescript
const datetime = new openehr_rm.DV_DATE_TIME();
datetime.value = "2024-12-08T14:30:00";  // YYYY-MM-DDTHH:MM:SS
```

## Template vs Archetype vs RM

Understanding the distinction:

1. **Reference Model (RM)**: The classes in ehrtslib (COMPOSITION, OBSERVATION, ELEMENT, etc.)
   - Defines the structure of health data
   - General-purpose, not specific to any clinical concept
   - What ehrtslib implements

2. **Archetypes**: Clinical concept definitions
   - Specifies how to use RM classes for specific purposes
   - E.g., "blood_pressure" archetype defines which elements are needed
   - Constrains the RM (e.g., units must be mm[Hg])
   - Published in Clinical Knowledge Manager (CKM)

3. **Templates**: Collections of archetypes for specific use cases
   - Combines multiple archetypes
   - Further constrains archetypes for local needs
   - E.g., "vital signs template" might include blood pressure, temperature, pulse
   - Often organization-specific

**Current State**: ehrtslib examples use RM classes and reference archetype IDs, but don't enforce archetype constraints yet. Template support coming in Phase 5.

## Finding More Archetypes

- **Clinical Knowledge Manager**: https://ckm.openehr.org/ckm/
- **Archie Repository**: https://github.com/openEHR/archie/tree/master/tools/src/test/resources/ckm-mirror
- **openEHR Specifications**: https://specifications.openehr.org/

## Future Template Support

In future phases (5a, 5b), ehrtslib will add:
- Loading and parsing of operational templates
- Validation of COMPOSITION instances against templates
- Template-guided creation of valid instances
- Automatic constraint enforcement

For now, you must manually ensure your COMPOSITION structures follow archetype definitions by:
- Using correct archetype node IDs
- Including required elements
- Using appropriate data types and units
- Following the archetype's tree structure

## Example Structure Summary

Both examples follow this pattern:

```
COMPOSITION (encounter.v1)
  └─ context: EVENT_CONTEXT
  └─ content: [
       OBSERVATION (blood_pressure.v2 or body_temperature.v2)
         └─ data: HISTORY
              └─ events: [
                   POINT_EVENT
                     └─ data: ITEM_TREE
                          └─ items: [
                               ELEMENT (Systolic / Temperature)
                                 └─ value: DV_QUANTITY
                               ELEMENT (Diastolic) [optional, blood pressure only]
                                 └─ value: DV_QUANTITY
                             ]
                 ]
     ]
```

This structure aligns with openEHR's hierarchical design and demonstrates proper use of data structures for clinical observations.
