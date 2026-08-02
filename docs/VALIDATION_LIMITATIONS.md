# Template validation limitations

Known gaps in `TemplateValidator` and related validators. Capabilities that **do** work are listed in [ADL_SUPPORT.md](ADL_SUPPORT.md).

## RM subtype checking

`TemplateValidator` compares `TypeRegistry.getTypeNameFromInstance()` to `C_OBJECT.rm_type_name` with **exact string equality**. It does not yet resolve RM inheritance (e.g. `DV_TEXT` instance vs `DV_CODED_TEXT` constraint).

BMM-backed hierarchy helpers exist in [`meta`](../meta/mod.ts) (`isSubtypeOf`, `subtypesOf`, `isDataValueType`) — see [RM_ATTRIBUTES.md](RM_ATTRIBUTES.md). Wiring them into `TemplateValidator` remains a follow-up.

## Archetype paths

`ValidationMessage.archetypePath` is populated with the RM JSON path for now. ADL constraint paths (`/content/data/...`) will be added when path tracking exists on `C_ATTRIBUTE`.

## Rules / invariants

MVP evaluation is implemented (`InvariantEvaluator`: `for_all`, `there_exists`, and common operators). Remaining work is fuller expression-language coverage and Archie `RMObjectValidator` parity — see [roadmap.md](maintainers/roadmap.md) Phase 6b follow-ups.

## Archie parity

Full Archie `RMObjectValidator` parity is out of scope for the MVP. Benchmark scaffolding lives at `test_data/tests/validation/archie_benchmark.test.ts` (run from the repo root with `--allow-read --no-check`).
