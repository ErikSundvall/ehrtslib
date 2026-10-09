# API changes before 1.0

Before 1.0, do not keep TypeScript aliases or duplicate classes so an older
ehrtslib import name still compiles. Remove the old name, update Demo
(`examples/demo-app`) and TAAAT (`examples/taaat-app`) in the same change, and
add a row here.

Loading published openEHR artefacts stays: ADL 1.4, OPT, OET, compositions,
BMM JSON/ODIN (`P_BMM_*` `_type` values), and archetype rules (BEOM).

`generated/` still lists official classic BMM class names. Those files are a
spec mirror. Do not import them, and do not copy a removed name back into
`base/`, `rm/`, `am/`, `lang/`, or `term/` just to match a stub.

Check these consumers when the public API changes:

- `examples/demo-app`
- `examples/taaat-app`

## 0.2.0 (tag `v0.2`)

- Removed `Iso8601_date.timezone()`. Timezone stays on `Iso8601_date_time` and `Iso8601_time`.

## 0.3.0 (tag `v0.3`)

Classic BMM 2 names that shipped on tag `v0.2` are removed from the hand-written API.

| Removed | Use instead |
| --- | --- |
| `BMM_CLASSIFIER`, `BMM_TYPE_ELEMENT`, `BMM_OPEN_TYPE`, `BMM_GENERIC_PARAMETER` (`lang/bmm/core/classic.ts`) | `BMM_TYPE` and `BMM_PARAMETER_TYPE` in `lang/bmm/core/entity.ts` |
| `BMM_SCHEMA_CORE` | `BMM_MODEL_METADATA` |
| `REFERENCE_MODEL_ACCESS` | `BMM_MODEL_ACCESS` |
| `SCHEMA_DESCRIPTOR` (`p_schema`, `schema`) | `BMM_SCHEMA_DESCRIPTOR` (`bmm_schema`, `bmm_model`) |

`P_BMM_GENERIC_PARAMETER`, `P_BMM_OPEN_TYPE`, and `P_BMM_SCHEMA_DESCRIPTOR` stay.
BMM files still name those classes in `_type`.
