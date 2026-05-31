# OET source templates (CKM-mirror)

Five Ocean Template Editor (`.oet`) XML files from [openEHR/CKM-mirror](https://github.com/openEHR/CKM-mirror).

These are **source templates** with path-based rules, not operational OPT XML. ehrtslib parses them via `parseOetXml()`; full AOM compilation requires a local archetype repository.

Refresh: `deno run --allow-net --allow-write test_data/scripts/download_fixtures.ts`
