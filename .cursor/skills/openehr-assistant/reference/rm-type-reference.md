# RM Type Reference

**Purpose:** Compact offline reference for RM type validation (lint rule 4 — Valid RM Attributes Only).
**Source:** Extracted from openEHR BMM (Basic Meta-Model) definitions.

> Only **own** (non-inherited) attributes are listed per type. To check inherited attributes,
> follow the parent chain. Multiplicity notation: `1..1` = mandatory single, `0..1` = optional single,
> `0..*` = optional list, `1..*` = mandatory list.

---

## Inheritance Quick-Reference

```
PATHABLE
  LOCATABLE (name, archetype_node_id, uid, links, archetype_details, feeder_audit)
    CONTENT_ITEM
      ENTRY (language, encoding, subject, provider, other_participations, workflow_id)
        CARE_ENTRY (protocol, guideline_id)
          OBSERVATION (data, state)
          EVALUATION (data)
          INSTRUCTION (narrative, expiry_time, wf_definition, activities)
          ACTION (time, ism_transition, instruction_details, description)
        ADMIN_ENTRY (data)
      SECTION (items)
    DATA_STRUCTURE
      ITEM_STRUCTURE
        ITEM_TREE (items)
        ITEM_LIST (items)
        ITEM_SINGLE (item)
        ITEM_TABLE (rows)
      HISTORY<T> (origin, period, duration, summary, events)
    EVENT<T> (time, data, state)
      POINT_EVENT<T>
      INTERVAL_EVENT<T> (width, sample_count, math_function)
    ITEM
      CLUSTER (items)
      ELEMENT (value, null_flavour, null_reason)
    ACTIVITY (description, timing, action_archetype_id)
  ISM_TRANSITION (current_state, transition, careflow_step, reason)
  EVENT_CONTEXT (start_time, end_time, location, setting, other_context, health_care_facility, participations)

DATA_VALUE
  DV_BOOLEAN (value)
  DV_TEXT (value, formatting, mappings, language, encoding)
    DV_CODED_TEXT (defining_code)
  DV_URI (value)
    DV_EHR_URI
  DV_IDENTIFIER (id, issuer, assigner, type)
  DV_ORDERED (normal_status, normal_range, other_reference_ranges)
    DV_QUANTIFIED (magnitude_status, accuracy)
      DV_AMOUNT (accuracy, accuracy_is_percent)
        DV_QUANTITY (magnitude, units, precision, units_system, units_display_name)
        DV_COUNT (magnitude)
        DV_DURATION (value)
        DV_PROPORTION (numerator, denominator, type, precision)
      DV_TEMPORAL (accuracy)
        DV_DATE_TIME (value)
        DV_DATE (value)
        DV_TIME (value)
    DV_SCALE (symbol, value)
    DV_ORDINAL (symbol, value)  [integer scores; sibling use-case to DV_SCALE per RM — DV_SCALE also allows Real magnitudes]
  DV_INTERVAL<T> (lower, upper, lower_unbounded, upper_unbounded, lower_included, upper_included)
  DV_ENCAPSULATED (charset, language)
    DV_PARSABLE (value, formalism)
    DV_MULTIMEDIA (alternate_text, uri, data, media_type, compression_algorithm, integrity_check, integrity_check_algorithm, thumbnail, size)

CODE_PHRASE (terminology_id, code_string, preferred_term)
```

---

## Core Structural Types

### LOCATABLE

**Parent:** PATHABLE (abstract)
**Description:** Base of all archetyped objects. Provides naming, node identification, and audit linking.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| name | DV_TEXT | 1..1 | Runtime name of this node |
| archetype_node_id | String | 1..1 | Design-time at-code from generating archetype |
| uid | UID_BASED_ID | 0..1 | Globally unique object identifier |
| links | List\<LINK> | 0..* | Links to other archetyped structures |
| archetype_details | ARCHETYPED | 0..1 | Archetyping meta-data (present at archetype roots) |
| feeder_audit | FEEDER_AUDIT | 0..1 | Audit trail from non-openEHR systems |

---

### COMPOSITION

**Parent:** LOCATABLE
**Description:** Root container for clinical documents. Unit of modification, transmission, and attestation.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| language | CODE_PHRASE | 1..1 | Language of the composition |
| territory | CODE_PHRASE | 1..1 | Country of origin (ISO 3166) |
| category | DV_CODED_TEXT | 1..1 | Temporal category: persistent, episodic, or event |
| context | EVENT_CONTEXT | 0..1 | Clinical session context |
| composer | PARTY_PROXY | 1..1 | Person primarily responsible for content |
| content | List\<CONTENT_ITEM> | 0..* | Entries and sections |

---

### SECTION

**Parent:** CONTENT_ITEM (extends LOCATABLE)
**Description:** Heading in a heading structure (e.g. SOAP sections, exam sections).

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| items | List\<CONTENT_ITEM> | 0..* | Ordered list of entries and sub-sections |

---

### ITEM_TREE

**Parent:** ITEM_STRUCTURE (extends DATA_STRUCTURE extends LOCATABLE)
**Description:** Logical tree data structure. Most common data container in archetypes.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| items | List\<ITEM> | 0..* | CLUSTERs and/or ELEMENTs |

---

### ITEM_LIST

**Parent:** ITEM_STRUCTURE
**Description:** Logical list data structure. Each item has a value, name, and positional index.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| items | List\<ELEMENT> | 0..* | Ordered list of ELEMENTs |

---

### ITEM_SINGLE

**Parent:** ITEM_STRUCTURE
**Description:** Single value data structure (e.g. person's height or weight).

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| item | ELEMENT | 1..1 | The single element |

---

### CLUSTER

**Parent:** ITEM (extends LOCATABLE)
**Description:** Grouping variant of ITEM. Contains further CLUSTERs and/or ELEMENTs.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| items | List\<ITEM> | 1..* | Ordered list of CLUSTERs and/or ELEMENTs |

---

### ELEMENT

**Parent:** ITEM (extends LOCATABLE)
**Description:** Leaf variant of ITEM. Carries a single DATA_VALUE.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| value | DATA_VALUE | 0..1 | The data value (any concrete DV_* subtype) |
| null_flavour | DV_CODED_TEXT | 0..1 | Flavour of null: unknown, no information, masked, not applicable |
| null_reason | DV_TEXT | 0..1 | Specific reason for null value |

---

## Entry Types

### ENTRY (abstract)

**Parent:** CONTENT_ITEM (extends LOCATABLE)
**Description:** Abstract parent of all ENTRY subtypes. Minimum unit of clinical information.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| language | CODE_PHRASE | 1..1 | Language of the entry |
| encoding | CODE_PHRASE | 1..1 | Character set encoding |
| subject | PARTY_PROXY | 1..1 | Subject of this entry |
| provider | PARTY_PROXY | 0..1 | Provider of the information |
| other_participations | List\<PARTICIPATION> | 0..* | Other participations |
| workflow_id | OBJECT_REF | 0..1 | External workflow engine reference |

---

### CARE_ENTRY (abstract)

**Parent:** ENTRY
**Description:** Abstract parent of clinical ENTRY subtypes (OBSERVATION, EVALUATION, INSTRUCTION, ACTION).

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| protocol | ITEM_STRUCTURE | 0..1 | Method/instrument/guideline description |
| guideline_id | OBJECT_REF | 0..1 | External guideline identifier |

---

### OBSERVATION

**Parent:** CARE_ENTRY
**Description:** Recorded observations and measurements. Data structured as temporal history.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| data | HISTORY\<ITEM_STRUCTURE> | 1..1 | Observation data (events over time) |
| state | HISTORY\<ITEM_STRUCTURE> | 0..1 | Subject state during observation |

---

### EVALUATION

**Parent:** CARE_ENTRY
**Description:** Clinical judgements, assessments, diagnoses, risk evaluations, goals, plans.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| data | ITEM_STRUCTURE | 1..1 | Evaluation data (spatial, not temporal) |

---

### INSTRUCTION

**Parent:** CARE_ENTRY
**Description:** Future actions: medication orders, therapeutic orders, monitoring requests.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| narrative | DV_TEXT | 1..1 | Human-readable description of the instruction |
| expiry_time | DV_DATE_TIME | 0..1 | When the instruction expires |
| wf_definition | DV_PARSABLE | 0..1 | Workflow engine expression |
| activities | List\<ACTIVITY> | 0..* | List of activities in the instruction |

---

### ACTION

**Parent:** CARE_ENTRY
**Description:** Clinical actions already performed, linked to instruction state machine.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| time | DV_DATE_TIME | 1..1 | Time the action completed |
| ism_transition | ISM_TRANSITION | 1..1 | Instruction state machine transition |
| instruction_details | INSTRUCTION_DETAILS | 0..1 | Link to originating Instruction |
| description | ITEM_STRUCTURE | 1..1 | Description of the action performed |

---

### ADMIN_ENTRY

**Parent:** ENTRY
**Description:** Administrative information (admission, discharge, appointment, ward location).

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| data | ITEM_STRUCTURE | 1..1 | Administrative data content |

---

## History / Event Types

### HISTORY\<T>

**Parent:** DATA_STRUCTURE (extends LOCATABLE)
**Description:** Container for temporal events. Generic parameter T conforms to ITEM_STRUCTURE.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| origin | DV_DATE_TIME | 1..1 | Time origin of the event history |
| period | DV_DURATION | 0..1 | Period between samples (if periodic) |
| duration | DV_DURATION | 0..1 | Duration of the entire history |
| summary | ITEM_STRUCTURE | 0..1 | Summary aggregating the event series |
| events | List\<EVENT\<T>> | 0..* | The events in the series |

---

### EVENT\<T> (abstract)

**Parent:** LOCATABLE
**Description:** Abstract single event in a series. Generic parameter T conforms to ITEM_STRUCTURE.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| time | DV_DATE_TIME | 1..1 | Time of this event |
| data | T | 1..1 | The event data |
| state | ITEM_STRUCTURE | 0..1 | Subject state at this event |

---

### POINT_EVENT\<T>

**Parent:** EVENT\<T>
**Description:** Single point-in-time event. No additional own attributes.

_(Inherits all attributes from EVENT\<T>)_

---

### INTERVAL_EVENT\<T>

**Parent:** EVENT\<T>
**Description:** Event over a time interval (period-based observation).

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| width | DV_DURATION | 1..1 | Duration of the interval |
| sample_count | Integer | 0..1 | Count of original samples |
| math_function | DV_CODED_TEXT | 1..1 | Mathematical function (mean, max, actual, etc.) |

---

## Supporting Types

### ACTIVITY

**Parent:** LOCATABLE
**Description:** Single activity within an INSTRUCTION (e.g. a medication administration).

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| description | ITEM_STRUCTURE | 1..1 | Archetyped description of the activity |
| timing | DV_PARSABLE | 0..1 | Timing (ISO 8601 R format preferred) |
| action_archetype_id | String | 1..1 | Regex pattern for valid ACTION archetype IDs |

---

### ISM_TRANSITION

**Parent:** PATHABLE
**Description:** Transition in the Instruction State Machine caused by a careflow step.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| current_state | DV_CODED_TEXT | 1..1 | ISM current state (openEHR terminology) |
| transition | DV_CODED_TEXT | 0..1 | ISM transition that occurred |
| careflow_step | DV_CODED_TEXT | 0..1 | Clinical label for the step (archetype-defined) |
| reason | List\<DV_TEXT> | 0..* | Reasons for this careflow step |

---

### EVENT_CONTEXT

**Parent:** PATHABLE
**Description:** Clinical session context of a healthcare event.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| start_time | DV_DATE_TIME | 1..1 | Start time of the clinical session |
| end_time | DV_DATE_TIME | 0..1 | End time of the session |
| location | String | 0..1 | Actual location (e.g. "ward A3", "home") |
| setting | DV_CODED_TEXT | 1..1 | Clinical setting (openEHR terminology) |
| other_context | ITEM_STRUCTURE | 0..1 | Additional archetyped context |
| health_care_facility | PARTY_IDENTIFIED | 0..1 | Facility under whose care the event occurred |
| participations | List\<PARTICIPATION> | 0..* | Parties involved |

---

### CODE_PHRASE

**Parent:** _(none in RM data_types)_
**Description:** Fully coordinated term from a terminology service.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| terminology_id | TERMINOLOGY_ID | 1..1 | Terminology identifier |
| code_string | String | 1..1 | Term code within the terminology |
| preferred_term | String | 0..1 | Preferred display term |

---

## Data Value Types

### DV_TEXT

**Parent:** DATA_VALUE
**Description:** Free or structured text item. May contain markdown formatting and term mappings.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| value | String | 1..1 | Displayable text value |
| formatting | String | 0..1 | "plain", "plain_no_newlines", or "markdown" |
| mappings | List\<TERM_MAPPING> | 0..* | Mappings to external terminologies |
| language | CODE_PHRASE | 0..1 | Language (if different from enclosing Entry) |
| encoding | CODE_PHRASE | 0..1 | Character encoding |

---

### DV_CODED_TEXT

**Parent:** DV_TEXT
**Description:** Text whose value is the rubric of a coded term. Combines code + display text.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| defining_code | CODE_PHRASE | 1..1 | The terminology code |

---

### DV_QUANTITY

**Parent:** DV_AMOUNT (extends DV_QUANTIFIED extends DV_ORDERED)
**Description:** Scientific quantities: magnitude + units (UCUM by default).

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| magnitude | Real | 1..1 | Numeric magnitude |
| units | String | 1..1 | Units (UCUM syntax, case-sensitive) |
| precision | Integer | 0..1 | Decimal places (0 = integral, -1 = unlimited) |
| units_system | String | 0..1 | Units system URI (default: UCUM) |
| units_display_name | String | 0..1 | Display form of units (e.g. "deg C") |

---

### DV_COUNT

**Parent:** DV_AMOUNT
**Description:** Countable integer quantities (pregnancies, steps, cigarettes/day).

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| magnitude | Integer64 | 1..1 | Integer count value |

---

### DV_SCALE

**Parent:** DV_ORDERED
**Description:** Scale values with implied ordering and finite range. Allows non-integer values (e.g. Borg CR10 scale).

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| symbol | DV_CODED_TEXT | 1..1 | Coded label for this scale point |
| value | Real | 1..1 | Numeric scale value |

> **Note:** DV_ORDINAL is the integer-only predecessor (symbol: DV_CODED_TEXT, value: Integer).
> Both may appear in archetypes. DV_SCALE is preferred for new designs.

---

### DV_BOOLEAN

**Parent:** DATA_VALUE
**Description:** True/false values. Design questions carefully so only true/false are valid.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| value | Boolean | 1..1 | Boolean value |

---

### DV_DATE_TIME

**Parent:** DV_TEMPORAL (extends DV_ABSOLUTE_QUANTITY extends DV_QUANTIFIED extends DV_ORDERED)
**Description:** Absolute point in time, specified to the second. ISO 8601 format.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| value | String | 1..1 | ISO 8601 date/time string |

---

### DV_DATE

**Parent:** DV_TEMPORAL
**Description:** Absolute date, specified to the day. ISO 8601 format. Supports partial dates.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| value | String | 1..1 | ISO 8601 date string |

---

### DV_TIME

**Parent:** DV_TEMPORAL
**Description:** Time of day, specified to a fraction of a second. ISO 8601 format.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| value | String | 1..1 | ISO 8601 time string |

---

### DV_DURATION

**Parent:** DV_AMOUNT
**Description:** Period of time. ISO 8601 duration format. Supports negative sign and mixed W designator.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| value | String | 1..1 | ISO 8601 duration string (e.g. "PT1H30M") |

---

### DV_PROPORTION

**Parent:** DV_AMOUNT
**Description:** Ratio of values (titers, concentration ratios, percentages).

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| numerator | Real | 1..1 | Numerator of ratio |
| denominator | Real | 1..1 | Denominator of ratio |
| type | Integer | 1..1 | Proportion kind (ratio, unitary, percent, fraction, integer_fraction) |
| precision | Integer | 0..1 | Decimal places for numerator/denominator |

---

### DV_MULTIMEDIA

**Parent:** DV_ENCAPSULATED (extends DATA_VALUE)
**Description:** Audiovisual and bio-signal content. May be inline or external.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| media_type | CODE_PHRASE | 1..1 | IANA MIME type |
| size | Integer | 1..1 | Size in bytes of unencoded data |
| alternate_text | String | 0..1 | Text to display in lieu of content |
| uri | DV_URI | 0..1 | External URI reference |
| data | Array\<Octet> | 0..* | Inline binary data |
| compression_algorithm | CODE_PHRASE | 0..1 | Compression type |
| integrity_check | Array\<Octet> | 0..* | Cryptographic checksum |
| integrity_check_algorithm | CODE_PHRASE | 0..1 | Checksum algorithm |
| thumbnail | DV_MULTIMEDIA | 0..1 | Thumbnail image |

---

### DV_URI

**Parent:** DATA_VALUE
**Description:** Universal Resource Identifier (RFC 3986). Supports plain-text URIs.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| value | String | 1..1 | URI string |

---

### DV_IDENTIFIER

**Parent:** DATA_VALUE
**Description:** Real-world entity identifiers (licence numbers, prescription IDs, order IDs).

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| id | String | 1..1 | The identifier value |
| issuer | String | 0..1 | Authority that issues this kind of ID |
| assigner | String | 0..1 | Organisation that assigned the ID |
| type | String | 0..1 | Identifier type (e.g. "prescription") |

---

### DV_PARSABLE

**Parent:** DV_ENCAPSULATED
**Description:** Encapsulated parsable string content (e.g. GLIF, Proforma, timing expressions).

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| value | String | 1..1 | The parsable string |
| formalism | String | 1..1 | Formalism name (e.g. "GLIF 1.0") |

---

### DV_INTERVAL\<T>

**Parent:** DATA_VALUE, Interval\<T>
**Description:** Range of a comparable type (T extends DV_ORDERED). Used for intervals of dates, times, quantities. Attributes inherited from Interval\<T>.

| Attribute | Type | Mult | Description |
|-----------|------|------|-------------|
| lower | T | 0..1 | Lower bound |
| upper | T | 0..1 | Upper bound |
| lower_unbounded | Boolean | 1..1 | True if lower boundary is -infinity |
| upper_unbounded | Boolean | 1..1 | True if upper boundary is +infinity |
| lower_included | Boolean | 1..1 | True if lower value is included in range |
| upper_included | Boolean | 1..1 | True if upper value is included in range |

> Common uses: `DV_INTERVAL<DV_QUANTITY>` (dose ranges), `DV_INTERVAL<DV_COUNT>` (count ranges),
> `DV_INTERVAL<DV_DATE_TIME>` (date/time ranges), `DV_INTERVAL<DV_DURATION>` (duration ranges).

---

## Abstract Intermediate Types (for inheritance lookups)

These types have no archetypable attributes of their own but appear in the inheritance chain.

| Type | Parent | Description |
|------|--------|-------------|
| PATHABLE | Any | Defines pathing capabilities |
| CONTENT_ITEM | LOCATABLE | Abstract ancestor of ENTRY and SECTION |
| ITEM | LOCATABLE | Abstract parent of CLUSTER and ELEMENT |
| DATA_STRUCTURE | LOCATABLE | Abstract parent of all data structure types |
| ITEM_STRUCTURE | DATA_STRUCTURE | Abstract parent of ITEM_TREE, ITEM_LIST, ITEM_SINGLE, ITEM_TABLE |
| DATA_VALUE | — | Abstract parent of all DV_* types |
| DV_ORDERED | DATA_VALUE | Ordered values (own: normal_status, normal_range, other_reference_ranges) |
| DV_QUANTIFIED | DV_ORDERED | Quantified values (own: magnitude_status, accuracy) |
| DV_AMOUNT | DV_QUANTIFIED | Relative quantities (own: accuracy, accuracy_is_percent) |
| DV_TEMPORAL | DV_ABSOLUTE_QUANTITY | Temporal values (own: accuracy as DV_DURATION) |
| DV_ENCAPSULATED | DATA_VALUE | Encapsulated data (own: charset, language) |
