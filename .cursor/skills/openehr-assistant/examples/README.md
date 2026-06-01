# Gold-Standard Archetype Examples

**Purpose:** Curated, published CKM archetypes (English-only) as few-shot references for writing, editing, and reviewing archetypes. Load specific examples by RM type as needed — do not load all at once.

**Source:** Exported from CKM (2026-03). Translations stripped to English-only for context efficiency.
**Synced from:** openehr-assistant-mcp v0.16.0 (`resources/examples/archetypes/`). When the plugin bumps MCP compatibility, diff this directory against the MCP's `resources/examples/archetypes/` and sync any changed files — then update this header. See `CONTRIBUTING.md` → "Syncing bundled examples".

---

## Example Index

### 1. OBSERVATION — Blood Pressure (v2)

**File:** `openEHR-EHR-OBSERVATION.blood_pressure.v2.adl` (~1800 lines)

**Why this example:** The canonical openEHR archetype. Demonstrates virtually every common ADL pattern.

**Key patterns:**
- HISTORY/EVENT structure with point events and interval events
- DV_QUANTITY with units (mm[Hg]) and magnitude ranges
- DV_CODED_TEXT with internal value sets (cuff size, position, method)
- DV_ORDINAL (Korotkoff sounds)
- Protocol section (method, device, cuff details)
- State section (position, exertion, tilt)
- ARCHETYPE_SLOT for device and exertion CLUSTERs
- Terminology bindings (SNOMED CT)
- Comprehensive description (purpose, use, misuse)

**Load when:** Writing OBSERVATION archetypes, understanding HISTORY/EVENT structure, or working with quantity/coded text patterns.

---

### 2. EVALUATION — Problem/Diagnosis (v1)

**File:** `openEHR-EHR-EVALUATION.problem_diagnosis.v1.adl` (~1400 lines)

**Why this example:** Core clinical evaluation archetype used in every openEHR deployment.

**Key patterns:**
- EVALUATION structure (no HISTORY — single assessment)
- DV_CODED_TEXT for diagnosis name (external terminology binding expected)
- DV_TEXT for free text descriptions
- DV_DATE_TIME for dates (onset, resolution)
- DV_CODED_TEXT with internal value sets (severity, course, diagnostic certainty)
- Multiple ARCHETYPE_SLOTs (status, structured body site, staging)
- Protocol section (last updated, extension slot)

**Load when:** Writing EVALUATION archetypes, working with clinical assessment patterns, or understanding slot usage.

---

### 3. INSTRUCTION — Medication Order (v3)

**File:** `openEHR-EHR-INSTRUCTION.medication_order.v3.adl` (~1500 lines)

**Why this example:** Complex ordering archetype demonstrating ACTIVITY and deep nesting.

**Key patterns:**
- INSTRUCTION with ACTIVITY (order items)
- Deep CLUSTER nesting (dosage → therapeutic direction → dose amount)
- Multiple ARCHETYPE_SLOTs at different levels
- DV_CODED_TEXT, DV_TEXT, DV_DURATION, DV_COUNT, DV_BOOLEAN
- DV_PARSABLE for structured dose syntax
- Complex protocol section with multiple elements

**Load when:** Writing INSTRUCTION archetypes, understanding ACTIVITY patterns, or working with complex nested structures.

---

### 4. ACTION — Procedure (v1)

**File:** `openEHR-EHR-ACTION.procedure.v1.adl` (~1700 lines)

**Why this example:** Demonstrates the ISM (Instruction State Machine) state transitions.

**Key patterns:**
- ACTION structure with ism_transition (careflow_step + current_state)
- ISM states: planned, postponed, cancelled, scheduled, active, suspended, aborted, completed
- DV_CODED_TEXT for procedure name
- DV_TEXT for description, comment
- DV_DATE_TIME for scheduled/actual dates
- ARCHETYPE_SLOTs for multimedia, body site, procedure detail
- Protocol section with requestor, receiver details

**Load when:** Writing ACTION archetypes, understanding ISM state machine, or working with procedure/activity patterns.

---

### 5. CLUSTER — Anatomical Location (v1)

**File:** `openEHR-EHR-CLUSTER.anatomical_location.v1.adl` (~800 lines)

**Why this example:** Widely reused CLUSTER demonstrating reusable data group design.

**Key patterns:**
- CLUSTER as a reusable semantic group (slotted into many archetypes)
- DV_CODED_TEXT with large internal value sets (body sites)
- DV_TEXT for free text alternative
- ARCHETYPE_SLOT for relative location sub-cluster
- DV_MULTIMEDIA for image markup
- Compact, focused single-concept design

**Load when:** Writing CLUSTER archetypes, understanding reusable data group design, or working with coded value sets.

---

### 6. COMPOSITION — Encounter (v1)

**File:** `openEHR-EHR-COMPOSITION.encounter.v1.adl` (~460 lines)

**Why this example:** Simple event composition showing the COMPOSITION root structure.

**Key patterns:**
- COMPOSITION root structure (category, context, content)
- EVENT_CONTEXT with other_context ITEM_TREE
- Content ARCHETYPE_SLOT (wide open for any SECTION, OBSERVATION, EVALUATION, etc.)
- SECTION slot alongside direct ENTRY slots
- Minimal but complete COMPOSITION pattern

**Load when:** Writing COMPOSITION archetypes, understanding the root document structure, or working with event/persistent/episodic patterns.

---

### 7. ADMIN_ENTRY — Translation Requirements (v1)

**File:** `openEHR-EHR-ADMIN_ENTRY.translation_requirements.v1.adl` (~130 lines)

**Why this example:** Smallest ENTRY type, good for understanding ADMIN_ENTRY structure.

**Key patterns:**
- ADMIN_ENTRY structure (data only, no protocol/state/history)
- ITEM_TREE with simple elements
- DV_CODED_TEXT, DV_TEXT, DV_BOOLEAN
- ARCHETYPE_SLOT for language CLUSTER
- Compact, easy to read end-to-end

**Load when:** Writing ADMIN_ENTRY archetypes, or when a simple end-to-end archetype example is needed.

---

## Usage Notes

- **Progressive disclosure:** Read this index first, then load only the specific .adl file(s) relevant to your task.
- **English-only:** Translations have been stripped. The `language` section shows only `original_language = en`. This is sufficient for understanding structure and patterns.
- **CKM-published:** These are real, published archetypes — they represent best practice as validated by the international community.
