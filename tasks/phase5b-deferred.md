# Phase 5b — Deferred work

Product decisions recorded 2026-05-22. Updated when scope ships or moves.

## ADL 1.4 parser and converter

**Status:** Deferred.

**Decision:** Ship ADL2-only parsing and serialization first. Archetype Editor and similar tools already export/import ADL2.

**Planned later:**

- ADL 1.4 lexer/parser or conversion layer (AOM 1.4 ↔ 2.x mapping per openEHR AM release notes).
- Regression suite against 1.4 fixtures if we adopt community archetypes still published in legacy ADL.
- Document conversion limits (rules syntax, terminology blocks) in PRD §11.

**Tracking:** ROADMAP Phase 5b; task list §8.2.

## Rules and invariants

**Status:** **Done** (parse, serialize, evaluate MVP — 2026-05-22).

- `rules` → `ARCHETYPE.invariants`; evaluation in `InvariantEvaluator` + `TemplateValidator.validateInvariants`.
- Tests: `tests/parser/rules_section.test.ts`, `tests/validation/invariant_evaluator.test.ts`.

**Still future (not blocking ADL2 commit):**

- Full Expression Language AST parity with openEHR grammar.
- Archie parity for invariant failures on all `test_data/archie-tests/` fixtures.

## Annotations and rm_overlay

**Status:** **Done** (parse + serialize ODIN trees — 2026-05-22).

- `tests/parser/annotations_overlay.test.ts`, fixture `test_data/adl2/openEHR-TEST_PKG-annotations_overlay.v1.0.0.adls`.

## Deserializer `validateAgainstTemplate` (PRD V-2.4)

**Status:** **Done** — optional on JSON / YAML / XML deserializers via `validateAgainstTemplate` config.

## Archie validation parity benchmark

**Status:** Parse benchmark met (task list §8.4).

`tests/validation/archie_benchmark.test.ts`: **8/8 (100%)** tokenize+parse on curated `test_data/archie-tests/` fixtures. Full Archie semantic validation parity remains future work.

## What is in scope now

- ADL2 hand-written parser + serializer (definition, terminology, rules, annotations, rm_overlay).
- External `TemplateValidator` with structural checks and invariant evaluation.
- **Bidirectional flattening** (`enhanced/am/`) for editor tooling.
- Post-deserialize template validation on serializers.

See **`docs/ADL2_SUPPORT.md`** for a concise user-facing matrix.
