# Template validation limitations (Phase 5b)

## RM subtype checking

`TemplateValidator` compares `TypeRegistry.getTypeNameFromInstance()` to `C_OBJECT.rm_type_name` with **exact string equality**. It does not yet resolve RM inheritance (e.g. `DV_TEXT` instance vs `DV_CODED_TEXT` constraint).

BMM-backed hierarchy helpers now exist in [`enhanced/meta`](../enhanced/meta/mod.ts) (`isSubtypeOf`, `subtypesOf`, `isDataValueType`) — see [RM_ATTRIBUTES.md](RM_ATTRIBUTES.md). Wiring them into `TemplateValidator` remains a follow-up (PRD §6 / `RMInfo`).

## Archetype paths

`ValidationMessage.archetypePath` is populated with the RM JSON path for now. ADL constraint paths (`/content/data/...`) will be added when path tracking exists on `C_ATTRIBUTE`.

## Deferred

- Rules / invariants: MVP evaluation in `InvariantEvaluator`; fuller expression AST → ROADMAP Phase 6b
- Full Archie `RMObjectValidator` parity (benchmark in `tests/validation/archie_benchmark.test.ts`)
