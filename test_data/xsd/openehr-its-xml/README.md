# openEHR ITS XML schemas (test fixtures, not in Git)

Unmodified XSD files from [openEHR/specifications-ITS-XML](https://github.com/openEHR/specifications-ITS-XML) for OPT 1.4 `Template.xsd` validation in tests. **Not** shipped in library bundles, `deno publish`, or jsDelivr (`test_data/` is excluded from `pack:library`).

| Fetched path | Upstream source |
|--------------|-----------------|
| `components/AM/Release-1.4/` | `components/AM/Release-1.4/` |
| `components/RM/Release-1.1.0/` | `components/RM/Release-1.1.0/` (included by AM `Resource.xsd`) |
| `components/BASE/latest/` | `components/BASE/latest/` (included by RM `DataTypes.xsd`) |

- **Pinned commit:** `265752ffb01db88a8ced56b7b371ba0ed9aa531c` (see [`PIN`](PIN))
- **License:** Apache 2.0 — `UPSTREAM-LICENSE` is written by the refresh task from upstream `LICENSE`

## Fetch (required for XSD tests)

`deno task test` runs this automatically. You can also run:

```bash
deno task refresh:openehr-its-xml
```

The task is idempotent: if `.stamp` matches `PIN` and `components/AM/Release-1.4/Template.xsd` exists, it does nothing. Template.xsd tests **fail** (they do not skip) if fixtures or `xmllint` are missing.

Downloaded paths are listed in [`.gitignore`](../../../.gitignore) (`components/`, `UPSTREAM-LICENSE`, `.stamp`).

CI caches the fetched tree keyed on `PIN` + `scripts/refresh_openehr_its_xml.ts`, then runs the same task before `deno task test`.

**Note:** `docs/vendor/v1-xsd/` may hold documentation mirrors only; tests use the fetched tree here.
