# Layout migration (drop `enhanced/` name)

## Target top-level layout

Elevate former `enhanced/` to repo root. Keep `generated/` untouched.

| Path | Role |
|------|------|
| `base/` | BASE model — BMM packages under `org.openehr.base.*` |
| `rm/` | RM model — BMM packages under `org.openehr.rm.*` |
| `am/` | AM model (`org.openehr.am.*`) + former `enhanced/am` utilities in `am/util/` |
| `lang/` | LANG model — `org.openehr.lang.*` |
| `term/` | TERM model + terminology/UCUM services |
| `parser/` | ADL / template parsers (was `enhanced/parser`) |
| `serialization/` | Formats + shared walker (was `enhanced/serialization`) |
| `validation/` | Validators + `validation/mod.ts` |
| `generation/` | Instance / ADL / OPT / TS generators |
| `meta/` | RM attribute introspection |
| `mod.ts` | Public library barrel |
| `generated/` | BMM stubs — do not hand-edit |
| `openehr_*.ts` | Stable root re-exports (unchanged public paths) |

Package file splits follow `tasks/bmm_package_map.json` (from BMM JSON via `tasks/bmm_dependencies.json` topo order in `tasks/generate_ts_libs.ts`).

RM top-level BMM packages (one directory each):
`common`, `composition`, `data_structures`, `data_types`, `demographic`, `ehr`, `ehr_extract`, `integration`, `support`, `security` (if present).

Nested BMM packages (e.g. `org.openehr.rm.composition.content.entry`) live as files under the parent directory.

## Compatibility

After move, rewrite imports `../enhanced/` and `./enhanced/` → new paths. Root `openehr_rm.ts` etc. point at `rm/mod.ts`. Temporary `enhanced/` shims optional only if needed for mid-migration; remove when green.
