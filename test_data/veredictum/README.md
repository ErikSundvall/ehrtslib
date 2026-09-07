# Veredictum conformance fixtures

Curated extract of [rubentalstra/Veredictum](https://github.com/rubentalstra/Veredictum) used to validate **ehrtslib's own validators** (not to grade a CDR over REST).

Veredictum is an independent openEHR CNF 2.0 instrument. Most of its 1100+ cases are Service Model / ITS-REST flows (`create_composition`, versioning, AQL, …) and need a running repository. Those are **out of scope** here.

What *is* reusable for a library validator:

| Tree | What ehrtslib runs |
|------|--------------------|
| `content/` | CNF `CONT-*` decision tables (accepted/rejected rows with spec citations) |
| `templates/` | Matching ADL 1.4 XML OPTs (`cnf.tpl.*`) |
| `compositions/` | Canonical JSON compositions (valid + semantically invalid) |
| `sf/` | FLAT/STRUCTURED payloads for simplified-format validation |
| `template_map.json` | `cnf.tpl.<id>` → OPT filename (from Veredictum `artifacts/corpus/MANIFEST.yaml`) |

## What we do not vendor

- REST operation bindings, transcripts, performance/stress packs
- The CKM `templates/ckm/` bank
- The Rust instrument / web console
- AQL and demographic functional cases

## Licence and attribution

Veredictum is **Apache License 2.0**. Fixtures here are copied from
`artifacts/schedule/content`, `artifacts/corpus/templates`, and
`artifacts/corpus/fixtures/{composition,sf}` on the `main` branch.

See [docs/maintainers/veredictum-attribution.md](../../docs/maintainers/veredictum-attribution.md).

## Refresh

```bash
# From a Veredictum clone (sparse checkout of artifacts/schedule/content,
# artifacts/corpus/templates, artifacts/corpus/fixtures/{composition,sf}):
# copy those trees into test_data/veredictum/ as laid out above.
```

Tests: `deno test --allow-read --no-check test_data/tests/validation/veredictum_*.test.ts`
