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

## Unreleased

`Opt14ExportResult` includes `componentCodeMaps` (ADL2 → ADL 1.4 per component archetype id). `TemplateBinding` may carry optional `opt14Export` (`templateId` + `componentCodeMaps`) for commit down-conversion; set it only via `bindTemplate({ opt14Export })` (caller-supplied from the CDR OPT export; not part of the binding hash; bind does not run `exportAdl2TemplateToOpt14`). Alternatively pass maps through per-draft `adl14` on commit or `Adl14DownconversionOptions` / `resolveAdl14DownconversionOptions`. `hasAdl14CdrExportContext` and `adl14DownconversionCdrWarnings` support the commit warning when ADL2-native bindings commit with default mapping only ([#178](https://github.com/ErikSundvall/ehrtslib/issues/178)).

`parser/mod.ts` exports `collectAdl14NodeAndValueCodes` and `opt14TerminologyKeyToAdl2` from `opt14_code_mapping.ts` ([#168](https://github.com/ErikSundvall/ehrtslib/issues/168)).

`buildWebTemplate` options are `languages` (primary language first) and `idLanguage` (`"primary"` or `"original"`, default `"primary"`) (issue #159). The input options `defaultLanguage` and `language` are removed. Omitting `languages` uses the template's `original_language` only. Output `defaultLanguage` is the primary language (the Web Template field). Output `languages` is the selected list, not every language on the OPT; `availableTemplateLanguages` still lists all of them. `original_language` on the operational template is unchanged. The demo passes `languages: [templateLanguage]` when a language is selected. `applyOperationalTemplateTermScopes(opt, language)` files inline OPT terms under the template's original language when that is known; `language` is only the inline-term language when the template has none.

`OPT2Serializer`, `filterOperationalTemplateLanguages`, and `opt2SizeMetrics` in `generation/mod.ts` export in-memory `OPERATIONAL_TEMPLATE` to ADL2 `operational_template` text (OPT2), with optional language filtering and separate `inlineTermLabels` enrichment (issue #130).

Flatten of a Better `.t.json` keeps a separate `archetype_term_definitions` bag per template id when several templates specialise one archetype (issue #110). `OPERATIONAL_TEMPLATE.template_id` carries that Better id. Web Template `templateId` and OPT XML `<template_id>` use it when set; `archetype_id` is unchanged. Applications that rebuilt those bags themselves (including [regionstockholm/intehrgrator](https://github.com/regionstockholm/intehrgrator)) can read the operational template directly.

## 0.5.1 (tag `v0.5.1`)

- Canonical-strict JSON deserialization of BASE types (for example `TERMINOLOGY_ID`) ([#132](https://github.com/ErikSundvall/ehrtslib/pull/132)): `registerOpenEhrModelTypes()` registers RM + BASE classes on `TypeRegistry` (filters non-type exports like `registerType`). JSON deserializers invoke it on `deserialize()`. `TypeRegistry.registerModule` accepts optional `{ typeNamePattern }`.

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
