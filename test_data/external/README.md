# External fixture corpora

Full upstream repositories are **not** vendored into ehrtslib (size, duplication). Clone or sparse-checkout locally for broader regression runs.

```bash
git clone --depth 1 https://github.com/openEHR/archie.git
git clone --depth 1 https://github.com/openEHR/adl-archetypes.git
git clone --depth 1 -b develop https://github.com/ehrbase/openEHR_SDK.git
git clone --depth 1 https://github.com/openEHR/CKM-mirror.git
```

| Repo | Relevant path | Notes |
|------|---------------|-------|
| openEHR/archie | `tools/src/test/resources/adl2-tests/` | ~270 ADL2 `.adls`; OPT2 generated in Java tests |
| openEHR/adl-archetypes | `ADL2-reference/`, `Example/` | Reference archetypes; 4 single-file ADL2 templates |
| ehrbase/openEHR_SDK | `test-data/.../operationaltemplate/` | ~54 ADL 1.4 XML `.opt` |
| openEHR/CKM-mirror | `local/templates/` (`.oet`), `local/archetypes/` | CKM snapshot; ADL 1.4 era |

Curated subsets are copied into `test_data/` via `scripts/download_fixtures.ts`.
