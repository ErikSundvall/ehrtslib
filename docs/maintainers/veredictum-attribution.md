# Attribution to Veredictum

## Overview

ehrtslib vendors a **curated subset** of fixtures from **Veredictum**, an independent openEHR CNF 2.0 conformance instrument, to regression-test library validators (`TemplateValidator`, `RMSpecificationValidator`, FLAT `validateFlatPayload`).

## Project

- **Name:** Veredictum
- **Repository:** https://github.com/rubentalstra/Veredictum
- **Licence:** Apache License 2.0
- **Site:** https://veredictum.eu

## What is copied

| ehrtslib path | Veredictum source |
|---------------|-------------------|
| `test_data/veredictum/content/` | `artifacts/schedule/content/CONT-*.yaml` |
| `test_data/veredictum/templates/` | `artifacts/corpus/templates/*.opt` (not `ckm/`) |
| `test_data/veredictum/compositions/` | `artifacts/corpus/fixtures/composition/` |
| `test_data/veredictum/sf/` | `artifacts/corpus/fixtures/sf/` |
| `test_data/veredictum/template_map.json` | `cnf.tpl.*` keys from `artifacts/corpus/MANIFEST.yaml` |

The REST runner, operation bindings, and performance catalogue are **not** copied. ehrtslib is not a CDR; those cases cannot be executed in-process.

## How the fixtures are used

Content cases are decision tables (`accepted` / `rejected`). Tests build an RM instance from each row, parse the matching OPT, and compare ehrtslib's `TemplateValidator` verdict to the table. Composition JSON fixtures exercise RM vocabulary constraints (for example an out-of-group `COMPOSITION.category`). FLAT reject fixtures exercise `validateFlatPayload`.
