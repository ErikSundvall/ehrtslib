# BMM baseline survey — Phase 6b (2026-05-29)

Prerequisite check before ADL 1.x round-trip work. Documents pin rationale for ehrtslib codegen.

## Sources compared

| Source | URL | Role |
|--------|-----|------|
| code-generator BMM-JSON | [sebastian-iancu/code-generator](https://github.com/sebastian-iancu/code-generator/tree/master/code/BMM-JSON) | JSON exports used by ehrtslib `tasks/bmm_versions.json` |
| specifications-ITS-BMM | [openEHR/specifications-ITS-BMM](https://github.com/openEHR/specifications-ITS-BMM) | Official ODIN BMM schemas |
| Archie | [openEHR/archie](https://github.com/openEHR/archie) | Runtime reference (BMM 2.2, P_BMM 2.3.0) |

## Current ehrtslib pins (`tasks/bmm_versions.json`)

| Package | Version | Notes |
|---------|---------|-------|
| openehr_am | **2.4.0** (JSON) | Ahead of ITS-BMM `AM/Release-2.3.0` ODIN — **keep JSON** |
| openehr_base | 1.3.0 | Matches latest code-generator JSON |
| openehr_rm | 1.2.0 | ITS-BMM has RM `latest/` split ODIN files (newer RM spec) — JSON still primary for codegen |
| openehr_lang | 1.1.0 | Stable |
| openehr_term | 3.1.0 | Stable |

## Decision (Phase 0)

**Option A — continue JSON codegen from code-generator** when JSON semver ≥ ITS-BMM release ODIN.

- AM 2.4.0 JSON is authoritative for ehrtslib until ITS-BMM publishes matching 2.4.x ODIN.
- No BMM bump required for Phase 6b ADL 1.4/OPT parsing (AOM classes unchanged).
- Future: run `tasks/get_latest_bmm_versions.ts` and `tasks/compare_bmm_versions.ts` before RM/BASE bumps.

## Regeneration command

When pins change, regenerate per `README-FOR-LIB-MAINTENANCE.md` and run full test suite.

## Related

- PRD: `tasks/prd-phase6b-adl14-full-roundtrip.md` §1
- Maintenance: `README-FOR-LIB-MAINTENANCE.md`
