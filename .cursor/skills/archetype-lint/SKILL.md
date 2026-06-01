---
name: archetype-lint
description: >
  This skill should be used when the user asks to "lint an archetype", "validate an archetype",
  "check archetype compliance", "review archetype quality", or "run archetype rules". Applies
  22 normative lint rules with ERROR/WARNING/INFO severity. Supports STRICT and PERMISSIVE modes.
allowed-tools:
  - Read
  - Glob
  - Grep
  - mcp__openehr-assistant__guide_get
  - mcp__openehr-assistant__ckm_archetype_get
  - mcp__openehr-assistant__type_specification_get
  - mcp__openehr-assistant__terminology_resolve
---

# Archetype Lint

An openEHR archetype linting engine. Evaluate archetypes against 22 normative rules. Classify each violation as ERROR, WARNING, or INFO. ERROR means the archetype is invalid or unsafe.

## Step 1: Load Guides (MANDATORY)

```
guide_get("archetypes/rules")
guide_get("archetypes/structural-constraints")
guide_get("archetypes/anti-patterns")
guide_get("archetypes/terminology")
```

## Step 2: Determine Mode

- **STRICT**: Zero WARNING tolerance. For publication candidates and CKM submissions.
- **PERMISSIVE** (default): WARNINGs allowed with justification. For early modeling iterations.

If the user does not specify a mode, use PERMISSIVE.

## Step 3: Apply Lint Rules

### Core Semantic Rules (ERROR)

1. **Single Concept Rule** — An archetype SHALL model exactly one coherent clinical or domain concept.
2. **ENTRY Type Semantics** — OBSERVATION: observed/measured facts. EVALUATION: clinical judgement. INSTRUCTION: intended future action. ACTION: action performed. ADMIN_ENTRY: administrative fact.
3. **Root RM Type Match** — Root C_OBJECT.rm_type_name SHALL match the declared archetype RM type.
4. **Valid RM Attributes Only** — All attribute names SHALL exactly match the openEHR Reference Model. Use `type_specification_get` to verify when uncertain.
5. **occurrences vs cardinality** — occurrences: object nodes only. cardinality: multi-valued attributes only.
6. **Specialisation Integrity** — A specialised archetype SHALL NOT redefine or contradict parent semantics.
7. **Path Stability** — Any change that alters archetype paths requires a MAJOR version increment.
8. **Term Definition Completeness** — Every at-code used SHALL have text and description in the terminology section.

### Structural Modelling Rules (WARNING)

9. **Mandatory Data Justification** — Minimum occurrences > 0 only if absence invalidates the concept.
10. **Arbitrary Upper Bounds** — Upper bounds must be clinically justified (no magic numbers like 0..7).
11. **CLUSTER Semantics** — CLUSTER must represent an inseparable semantic group, not a generic container.
12. **Slot Discipline** — ARCHETYPE_SLOT should be constrained; wildcard `include all` slots are discouraged.
13. **Template Leakage** — Workflow, UI, or document-specific constraints must not appear in archetypes.

### ADL & AOM Syntax Rules (ERROR / WARNING)

14. **Unconstrained Leaf Nodes** (WARNING) — DV_* matches {*} shall not be used as default without justification.
15. **Attribute Multiplicity Compliance** (ERROR) — C_SINGLE_ATTRIBUTE: exactly one child. C_MULTIPLE_ATTRIBUTE: explicit or inherited cardinality.
16. **Ontology Integrity** (ERROR) — ac-codes must reference valid at-codes.

### Terminology Rules (WARNING)

17. **Terminology Neutrality** — Archetypes are terminology-neutral; bindings are optional, not hardcoded.
18. **Semantic Binding Accuracy** — Bindings must reflect semantic equivalence, not approximate matches.

### Demographic Modelling Rules

19. **Archetypable Demographics** (INFO) — PERSON, ROLE, ADDRESS, ORGANISATION, GROUP may be archetyped.
20. **Identity vs Role Separation** (ERROR) — PERSON archetypes must not encode role-specific semantics.

### Versioning Rules

21. **Patch Version Discipline** (ERROR) — Patch versions SHALL NOT include semantic or structural changes.
22. **Deprecation Handling** (WARNING) — Deprecated nodes should be retained and explicitly marked.

## Step 4: Generate Report

### Required Output Format

```
## Lint Report

**Archetype:** <archetype-id>
**Mode:** STRICT | PERMISSIVE
**Overall Status:** PASS | FAIL

### Violations

| # | Severity | Rule | Explanation | Suggested Fix |
|---|----------|------|-------------|---------------|
| 1 | ERROR    | R4   | Attribute `blood_pressure` is not a valid RM attribute on ITEM_TREE | Use `items` (valid RM path) |

### Summary
- ERRORs: N
- WARNINGs: N
- INFOs: N
```

**Gating logic:**
- Any ERROR -> overall status = FAIL
- STRICT mode: any WARNING -> overall status = FAIL
- PERMISSIVE mode: WARNINGs allowed if justified

## Step 5: Fix Guidance (Optional)

If the user asks for fixes after linting, provide a minimal-diff fix plan:
- For each violation: which rule it resolves, whether it changes paths, whether it affects semantics
- Version bump recommendation (patch/minor/major) with justification
- Prefer template-level constraints over archetype constraints where applicable

Do NOT apply fixes automatically. Present the plan and wait for user approval.
