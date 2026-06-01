# Complete Archetype Lint Rules (22 Rules)

**Purpose:** Offline reference for all 22 normative archetype lint rules with severity, description, and violation/fix examples. Use when reviewing or linting local archetype files.

---

## Core Semantic Rules (ERROR)

### Rule 1 — Single Concept
An archetype SHALL model exactly one coherent clinical or domain concept.

**Violation:**
```adl
OBSERVATION[at0000] -- Vital signs and medication
```
**Fix:** Split into separate archetypes: OBSERVATION for vital signs, INSTRUCTION for medication order.

---

### Rule 2 — ENTRY Type Semantics
Use the correct ENTRY subtype for the clinical statement:
- OBSERVATION — observed/measured facts
- EVALUATION — clinical judgement or interpretation
- INSTRUCTION — intended future action
- ACTION — action actually performed
- ADMIN_ENTRY — administrative fact

**Violation:**
```adl
OBSERVATION[at0000] -- Diagnosis of diabetes
```
**Fix:**
```adl
EVALUATION[at0000] -- Diagnosis of diabetes
```

---

### Rule 3 — Root RM Type Match
Root C_OBJECT.rm_type_name SHALL match the declared archetype RM type.

**Violation:**
```adl
archetype (openEHR-EHR-OBSERVATION.bp.v1)
CLUSTER[at0000]
```
**Fix:** Root must be `OBSERVATION[at0000]`.

---

### Rule 4 — Valid RM Attributes Only
All attribute names SHALL exactly match the openEHR Reference Model. Do not invent or alias attributes.

**Violation:**
```adl
blood_pressure matches {
    DV_QUANTITY
}
```
**Fix:**
```adl
data matches {
    ITEM_TREE
}
```

---

### Rule 5 — occurrences vs cardinality
- **occurrences** — object nodes only (how many times an object may appear)
- **cardinality** — multi-valued container attributes only (how many children allowed)

Never interchange them.

**Violation:**
```adl
items cardinality matches {1..*}
```
**Fix:**
```adl
ELEMENT occurrences matches {1..*}
```

---

### Rule 6 — Specialisation Integrity
A specialised archetype SHALL NOT redefine or contradict parent semantics. Only further constrain.

**Violation:** Specialised archetype removes a mandatory parent data element.
**Fix:** Retain parent meaning; only further constrain.

---

### Rule 7 — Path Stability
Any change that alters archetype paths requires a MAJOR version increment. Paths are a public API.

**Violation:** Node moved for "cleaner structure" in minor version.
**Fix:** Restore original structure, or increment MAJOR version.

---

### Rule 8 — Term Definition Completeness
Every at-code used in the definition SHALL have `text` and `description` in the ontology/terminology section.

**Violation:**
```adl
ELEMENT[at0005]
```
No term definition for at0005 in ontology.

**Fix:** Add `["at0005"] = <text = "..."; description = "...">` in ontology.

---

## Structural Modelling Rules (WARNING)

### Rule 9 — Mandatory Data Justification
Minimum occurrences > 0 only if absence would invalidate the clinical concept.

**Violation:**
```adl
ELEMENT occurrences matches {1..1}
```
No clinical justification for mandatory.

**Fix:** Change to `0..1` (optional) or document why mandatory.

---

### Rule 10 — Arbitrary Upper Bounds
Upper bounds must be clinically justified. No magic numbers.

**Violation:**
```adl
occurrences matches {0..7}
```
**Fix:** Use `0..*` unless a specific clinical limit exists.

---

### Rule 11 — CLUSTER Semantics
CLUSTER must represent an inseparable semantic group, not a generic container.

**Violation:** CLUSTER used as a generic wrapper for unrelated elements.
**Fix:** Use ITEM_TREE for general grouping, or split into semantically meaningful CLUSTERs.

---

### Rule 12 — Slot Discipline
ARCHETYPE_SLOT should be constrained; wildcard slots are discouraged.

**Violation:**
```adl
allow_archetype any
```
**Fix:** Constrain slot to specific archetype family or RM type.

---

### Rule 13 — Template Leakage
Workflow, UI, or document-specific constraints must not appear in archetypes. These belong in templates.

**Violation:** Archetype encodes form layout order or display instructions.
**Fix:** Move layout/workflow logic to the template.

---

## ADL & AOM Syntax Rules

### Rule 14 — Unconstrained Leaf Nodes (WARNING)
DV_* matches {*} shall not be used as a default without justification.

**Violation:**
```adl
DV_TEXT matches {*}
```
**Fix:** Add constraints, or document why narrative/free-text is appropriate.

---

### Rule 15 — Attribute Multiplicity Compliance (ERROR)
- C_SINGLE_ATTRIBUTE — exactly one child constraint
- C_MULTIPLE_ATTRIBUTE — explicit or inherited cardinality

**Violation:** C_SINGLE_ATTRIBUTE with multiple children.
**Fix:** Use C_MULTIPLE_ATTRIBUTE or reduce to one child.

---

### Rule 16 — Ontology Integrity (ERROR)
ac-codes must reference valid at-codes. Every ac-code value set must resolve.

**Violation:** ac-code references non-existent at-code.
**Fix:** Correct value set membership or add missing at-code definition.

---

## Terminology Rules (WARNING)

### Rule 17 — Terminology Neutrality
Archetypes are terminology-neutral. External code systems are bound, not embedded.

**Violation:** Hardcoded SNOMED code without proper binding section.
**Fix:** Add proper `term_bindings` section with terminology reference.

---

### Rule 18 — Semantic Binding Accuracy
Terminology bindings must reflect semantic equivalence, not approximate matches.

**Violation:** Binding maps to an approximate rather than equivalent external term.
**Fix:** Bind the correct semantic equivalent or remove the binding.

---

## Demographic Modelling Rules

### Rule 19 — Archetypable Demographics (INFO)
PERSON, ROLE, ADDRESS, ORGANISATION, GROUP may be archetyped. This is encouraged when modelling reusable demographic semantics.

---

### Rule 20 — Identity vs Role Separation (ERROR)
PERSON archetypes must not encode role-specific semantics. Roles belong in ROLE archetypes.

**Violation:** PERSON archetype includes "patient" role data.
**Fix:** Move role-specific data to a ROLE archetype.

---

## Versioning Rules

### Rule 21 — Patch Version Discipline (ERROR)
Patch versions SHALL NOT include semantic or structural changes. Patch = formatting/typo fixes only.

**Violation:** Semantic change shipped as patch version.
**Fix:** Increment minor or major version.

---

### Rule 22 — Deprecation Handling (WARNING)
Deprecated nodes should be retained and explicitly marked, not deleted.

**Violation:** Node removed without notice.
**Fix:** Mark deprecated (e.g., via description text) and document rationale. Retain for backward compatibility.

---

## Severity Summary

| Severity | Rules |
|----------|-------|
| **ERROR** | 1, 2, 3, 4, 5, 6, 7, 8, 15, 16, 20, 21 |
| **WARNING** | 9, 10, 11, 12, 13, 14, 17, 18, 22 |
| **INFO** | 19 |

## Lint Output Format

Report each finding as:
- **Severity** (ERROR / WARNING / INFO)
- **Rule number and name**
- **Explanation** of the violation
- **Location** in the archetype (path or line)
- **Suggested fix**

Overall status: **PASS** if zero ERRORs; **FAIL** if any ERROR.
