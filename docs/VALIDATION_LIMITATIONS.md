# Template validation limitations

Known gaps in `TemplateValidator` and related validators. Capabilities that **do** work are listed in [ADL_SUPPORT.md](ADL_SUPPORT.md).

## RM subtype checking

`TemplateValidator` accepts an instance whose `_type` is the constrained `C_OBJECT.rm_type_name` **or a subtype** (`isSubtypeOf` from [`meta`](../meta/mod.ts)). `POINT_EVENT` satisfies `EVENT`; `DV_CODED_TEXT` satisfies `DV_TEXT`. Primitive RM types (`INTEGER`, `STRING`, …) are not compared as `_type` tags.

## RM specification walk

`RMSpecificationValidator.validateInstance` walks the canonical JSON tree, not only OPT-constrained attributes. That is required because ADL 1.4 OPTs often omit `composer`, `language`, `territory`, and `EVENT_CONTEXT.setting`. The walk applies:

- openEHR terminology groups (`COMPOSITION.category`, `EVENT_CONTEXT.setting`, …)
- ISO 639-1 / ISO 3166-1 checks on `language` / `territory`
- RM-mandatory attributes (`COMPOSITION.composer`, `ENTRY.subject`, …) when the object has `_type` and is not a skeletal identity stub

`C_ARCHETYPE_ROOT.archetype_ref` is compared to `archetype_node_id` when the instance uses a full archetype id.

Remaining CONT catalogue gaps (cardinality overlays on CLUSTER/COMPOSITION context, some temporal patterns, HISTORY `data` in FLAT paths vs Veredictum’s omitted segment, EVENT `time` not exposed on the web template) are tracked by the pass-rate floor in `veredictum_content.test.ts`.

## Primitive constraints from OPT XML

Legacy OPT XML wraps `C_INTEGER` / `C_STRING` / `C_BOOLEAN` / temporal types in `C_PRIMITIVE_OBJECT.item`. The OPT mapper now keeps that `item`, and `PrimitiveValidator` unwraps it. `C_INTEGER.list` and range, `C_CODE_PHRASE.code_list`, `C_DV_QUANTITY.list` units, and `C_MULTIPLE_ATTRIBUTE.cardinality` are enforced.

## Veredictum CNF content corpus

In-process tests under `test_data/tests/validation/veredictum_*.test.ts` replay [Veredictum](https://github.com/rubentalstra/Veredictum) `CONT-*` decision tables and composition/FLAT fixtures. REST-only cases (versioning, AQL, EHR lifecycle) are not executed. Attribution: [veredictum-attribution.md](maintainers/veredictum-attribution.md).

## Archetype paths

`ValidationMessage.archetypePath` is populated with the RM JSON path for now. ADL constraint paths (`/content/data/...`) will be added when path tracking exists on `C_ATTRIBUTE`.

## Rules / invariants

MVP evaluation is implemented (`InvariantEvaluator`: `for_all`, `there_exists`, and common operators). Remaining work is fuller expression-language coverage and Archie `RMObjectValidator` parity — see [roadmap.md](maintainers/roadmap.md) Phase 6b follow-ups.

## Archie parity

Full Archie `RMObjectValidator` parity is out of scope for the MVP. Benchmark scaffolding lives at `test_data/tests/validation/archie_benchmark.test.ts` (run from the repo root with `--allow-read --no-check`).
