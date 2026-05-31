# Test data for ehrtslib

Curated openEHR archetype and template fixtures for parser, validation, and serialization tests.

## Layout

| Directory | Format | Count (approx.) | Purpose |
|-----------|--------|-----------------|---------|
| `adl2/` | ADL 2 source (`.adl`, `.adls`) | Hand-picked + templates | Local ADL2 regression |
| `adl2/templates/` | ADL 2 source templates | 4 | Single-file template examples from openEHR/adl-archetypes |
| `adl14/` | ADL 1.4 source (`.adl`) | 1+ | Legacy syntactic conversion tests |
| `archie-tests/` | ADL 2 `.adls` | 8 + 14 new | Archie-compatible parser/validator parity |
| `archie-tests/flattening/` | ADL 2 `.adls` | 10 | Template flattening / OPT2 source scenarios |
| `archie-tests/validity-templates/` | ADL 2 `.adls` | 4 | Template validity edge cases |
| `opt14/` | ADL 1.4 XML operational templates | 20 | Legacy OPT interop (ehrbase, REST `adl1.4`) |
| `external/` | — | — | Pointers to full upstream repos (not vendored) |

## Important: ADL2 operational templates (OPT2)

There is **no public bank of pre-built ADL2 operational templates** (`.opt` in ADL2/OPT2 form) comparable to the ADL 1.4 XML OPT corpus. OPT2 artefacts are normally **compiled** from ADL2 source templates plus referenced archetypes (see [OPT2 spec digest](https://specifications.openehr.org/releases/AM/development/OPT2.html)).

For ADL2 template testing we use **source templates** (`.adls`) from Archie and openEHR/adl-archetypes, and generate operational form in tests via the flattener when needed.

For **deployed operational templates** used by ehrbase and most CDRs today, see `opt14/` (ADL 1.4 XML).

## Refresh fixtures

```bash
deno run --allow-net --allow-write test_data/scripts/download_fixtures.ts
```

## Upstream sources

| Source | URL | Licence |
|--------|-----|---------|
| openEHR Archie `adl2-tests` | https://github.com/openEHR/archie | Apache 2.0 |
| openEHR adl-archetypes | https://github.com/openEHR/adl-archetypes | Apache 2.0 |
| ehrbase openEHR_SDK OPT fixtures | https://github.com/ehrbase/openEHR_SDK | Apache 2.0 |

See `archie-tests/README.md` and `opt14/README.md` for attribution detail.

## Larger corpora (clone locally, do not commit)

- **Archie full ADL2 tests** (~270 `.adls`): `archie/tools/src/test/resources/adl2-tests/`
- **CKM mirror** (~44 `.oet` source templates, 1000+ archetypes): https://github.com/openEHR/CKM-mirror
- **ehrbase SDK full OPT set** (~54 `.opt`): `openEHR_SDK/test-data/.../operationaltemplate/`

Documented in `external/README.md`.

## Related docs

- [`docs/ADL_SUPPORT.md`](../docs/ADL_SUPPORT.md) — ADL 1.4 vs 2.x support matrix
- [`tasks/prd-phase6b-adl14-full-roundtrip.md`](../tasks/prd-phase6b-adl14-full-roundtrip.md) — ADL 1.4 round-trip PRD (motivated by tooling/ecosystem gap)
