# Phase 5b — Deferred / follow-up work

Updated 2026-05-22 after ADL 1.4 conversion and validation MVP.

## Shipped in this branch

- **ADL 2:** parse, serialize, rules, annotations, rm_overlay, invariant evaluation.
- **ADL 1.4:** detect + syntactic conversion → ADL2 + `parseAdl()` ([`docs/ADL_SUPPORT.md`](../docs/ADL_SUPPORT.md)).
- **Validation:** `TemplateValidator`, `InvariantEvaluator`, `ArchetypeValidator`, deserializer `validateAgainstTemplate`.
- **Flattening:** `enhanced/am/` bidirectional MVP.

## Follow-up (non-blocking)

| Item | Notes |
|------|--------|
| **Deep ADL 1.4 AOM migration** | ac-code / value_sets reshaping per openEHR conversion guide; use ADL Workbench for difficult artefacts |
| **constraint_definitions merge** | Converter strips or comments; full merge into `term_definitions` not implemented |
| **Expression AST** | Rare operators / nested forms may remain as `string_expression` only |
| **Archie AOM validation 100%** | Parse 8/8; structural AOM checks vary on primitive-constraint-heavy archetypes |
| **Full Archie JVM validator** | Out of scope for this TypeScript library |

## Merge

See [`docs/MERGE_TO_MAIN.md`](../docs/MERGE_TO_MAIN.md).
