# Template validation limitations (Phase 5b)

## RM subtype checking

`TemplateValidator` compares `TypeRegistry.getTypeNameFromInstance()` to `C_OBJECT.rm_type_name` with **exact string equality**. It does not yet resolve RM inheritance (e.g. `DV_TEXT` instance vs `DV_CODED_TEXT` constraint). A future `RMInfo` plugin or registry subtype map will narrow this gap (PRD §6).

## Archetype paths

`ValidationMessage.archetypePath` is populated with the RM JSON path for now. ADL constraint paths (`/content/data/...`) will be added when path tracking exists on `C_ATTRIBUTE`.

## Deferred

- Rules / invariants evaluation (`tasks/phase5b-deferred.md`)
- Full Archie `RMObjectValidator` parity (benchmark in `tests/validation/archie_benchmark.test.ts`)
