# Simplified openEHR Formats (Phase 7a / 7b)

Library support for **Web Template**, **FLAT**, and **STRUCTURED** simplified composition formats as defined in the openEHR ITS-REST simplified formats specification.

**Related:** `openehr://guides/specs/its-rest-simplified_formats`, `openehr://guides/simplified_formats/rules`

## Module

`serialization/simplified/` exports:

| Export | Purpose |
|--------|---------|
| `buildWebTemplate(opt, { languages, idLanguage })` | Build Web Template JSON. `languages[0]` is the primary language (labels and, by default, node ids). Further entries are additional languages for localized names and labels. `idLanguage` is `"primary"` (default) or `"original"` |
| `parseWebTemplate(json)` | Parse Web Template JSON (EHRBase/Better dialects) |
| `isWebTemplateJson(value)` | Detect Web Template JSON documents |
| `webTemplateToOpt(wt)` | Reconstruct approximate `OPERATIONAL_TEMPLATE` from Web Template |
| `serializeToFlat(instance, wt, { flavor })` | RM instance → FLAT key/value map (`flavor`: `"output"` default, or `"input"`) |
| `serializeToFlatJson(instance, wt, options)` | Same, JSON string |
| `deserializeFromFlat(flat, wt, options)` | FLAT → RM instance (plain object with `_type`); throws on error issues |
| `deserializeFromFlatJson(json, wt, options)` | Same, from JSON string |
| `deserializeFromFlatWithIssues(flat, wt, options)` | FLAT → RM instance plus issues, does not throw |
| `serializeToStructured(instance, wt, { flavor })` | RM instance → STRUCTURED nested object |
| `serializeToStructuredJson(instance, wt, options)` | Same, JSON string |
| `deserializeFromStructured(structured, wt, options)` | STRUCTURED → RM instance |
| `deserializeFromStructuredWithIssues(structured, wt, options)` | STRUCTURED → RM instance plus issues |
| `structuredToFlat(structured, wt)` / `flatToStructured(flat)` | STRUCTURED ↔ FLAT (shared path) |
| `validateFlatPayload(flat, wt)` | Validate FLAT keys against template schema |
| `toTypedRm(plain)` | Plain `_type` tree → typed RM class instances |

Re-exported from `serialization/mod.ts`.

## Workflow

```
OPT / ADL template  →  buildWebTemplate()  →  Web Template JSON
                              ↓
Web Template JSON  →  webTemplateToOpt()  →  OPERATIONAL_TEMPLATE (approx.)
                              ↓
RM instance  ←→  serializeToFlat / deserializeFromFlat
              ←→  serializeToStructured / deserializeFromStructured
              ←→  toTypedRm() for typed RM classes
```

1. Parse template input to an `OPERATIONAL_TEMPLATE` (`parseTemplateInput`, `getOperationalTemplateFromInput`).
2. Build Web Template: `const wt = buildWebTemplate(template)`.
3. Generate or load RM instance (canonical JSON, generator, etc.).
4. Serialize: `serializeToFlatJson(instance, wt)` or `serializeToStructuredJson(instance, wt)`.
5. Deserialize: `deserializeFromFlatJson(flatJson, wt)` or `deserializeFromStructuredJson(structuredJson, wt)`.

### Canonical round-trip

```
RM instance → JsonCanonicalSerializer → JSON
     → JsonCanonicalDeserializer → RM
     → serializeToFlat → deserializeFromFlat → RM
     → JsonCanonicalSerializer → JSON
```

The output flavour round-trips every RM-mandatory attribute: the Web Template has a node for each of them (see [Input and output flavours](#input-and-output-flavours)). RM attributes without a node or `_` path (see [Limitations](#limitations)) are not preserved.

Background: [research note on FLAT/STRUCTURED input and output flavours and `ctx` defaults (2026-10)](research/flat-input-output-ctx-2026-10.md).

## FLAT format

- Keys are fully qualified from the normalised template root id. RM attributes such as `language`, `composer` or `context/start_time` have their own paths. In the input flavour, composition metadata uses the `ctx/` prefix instead (`ctx/language`, `ctx/territory`, `ctx/composer_name`, …).
- HISTORY and a single EVENT with max 1 have no path segment (spec "Level Removal").
- Repeating nodes use zero-based `:n` indices (`blood_pressure:0/any_event:0/...`).
- Typed attributes use pipe suffixes on the key (`|magnitude`, `|unit`, `|code`, `|value`, `|terminology`).

Example (from openEHR curated example `openehr://examples/flat/vital_signs_blood_pressure`):

```json
{
  "ctx/language": "en",
  "ctx/territory": "US",
  "vital_signs/blood_pressure:0/any_event:0/systolic|magnitude": 128,
  "vital_signs/blood_pressure:0/any_event:0/systolic|unit": "mm[Hg]"
}
```

## STRUCTURED format

- Top-level `ctx` object (not prefixed keys), input flavour only.
- Template root id as nested object key.
- Built from FLAT with the spec's "Flat to Structured" rule, so it carries the same values in both flavours.
- Arrays at every data-bearing node, even cardinality 1.
- Pipe-prefixed keys inside leaf objects (`{"|magnitude": 128, "|unit": "mm[Hg]"}`).

## Input and output flavours

openEHR platforms use two forms of FLAT and STRUCTURED. Better calls them `INPUT` and `OUTPUT` (web template examples, `exampleFilter`), and the openEHR REST API has `example?type=input|output`. ehrtslib supports both, so it can serve as a front end for, and a converter between, platforms that expect either form.

| | `output` (default) | `input` |
|---|---|---|
| Composition language, territory, composer, context time and setting | at their own paths | `ctx/` keys |
| Entry language and encoding, subject, event and action times | at their own paths | left out when equal to the default |
| Lossless | yes | yes, with the same defaults on input |
| Typical use | storage, comparison, conversion | forms and hand-written payloads |

The serializers take `flavor`. The deserializers accept both flavours, also mixed, with this fill order for every value: **explicit path → `ctx/` → template or RM default.**

Deserializer options (FLAT and STRUCTURED, next to `codedTextMismatch` and `codedTextDisplayValue`):

- `contextDefaults`: `"apply"` (default) fills missing RM-mandatory values: LOCATABLE names and `archetype_details`, composition language (Web Template default), category (when the template fixes it), `context/start_time` (`ctx/time`, else the clock), `context/setting` (238 "other care"), entry `language` (composition language), `encoding` (UTF-8), `subject` (PARTY_SELF), `HISTORY.origin`, `EVENT.time`, `ACTION.time`, `ACTIVITY.action_archetype_id` (`/.*/`). A missing EVENT_CONTEXT is created when the template requires one or the payload has `ctx/` keys. `"none"` fills nothing and reports each missing value. Missing values that have no default (territory, composer, instruction narrative, an action state) are always reported. Issues have `kind: "missing-mandatory"`.
- `clock`: function returning the current time as ISO 8601, used for times that are neither in the payload nor in `ctx/`. Default `() => new Date().toISOString()`. `null` reports such times instead. Inject it for reproducible results.
- `unknownKeys`: `"error"` (default) | `"warning"` | `"ignore"` for keys that match no Web Template node (`kind: "unknown-key"`). `deserializeFromFlat` and `deserializeFromStructured` throw `UnknownFlatKeyError` on such errors. Unknown `ctx/` fields and unsupported `_` attributes are warnings.

Times: `HISTORY.origin` comes from its path, else `ctx/history_origin`, else the earliest event time, else `ctx/time`, else the clock. An `EVENT.time` without a value gets `HISTORY.origin`. The spec has two rules for the origin (earliest event time, and `ctx/time`); ehrtslib uses the event time when events have times.

The first path segment may be the template id, the Web Template tree id, or the normalised composition name (as EHRbase writes it). Keys in the older ehrtslib form with a `data` segment for HISTORY are accepted with a `legacy-path` warning.

Why options: platforms differ. Some fill defaults from the server clock, some reject what is missing, some keep `ctx/` keys in their output. The defaults suit a converter: lossless output, complete RM on input, and no key dropped without an issue. See the [research note](research/flat-input-output-ctx-2026-10.md).

## Coded text input (`DV_CODED_TEXT`)

FLAT → RM completes a partial `DV_CODED_TEXT` from the Web Template code list (`|code` alone fills `value`, `|value` alone fills `defining_code`). Input that does not fit the code list exactly is handled by two independent options. Both are on `deserializeFromFlat`, `deserializeFromFlatJson`, `deserializeFromFlatWithIssues`, `FlatDeserializer`, the STRUCTURED deserializers, and `DvValueBuildContext` (`buildRmValue` / `buildDvValue`).

### Why these are options

openEHR platforms handle such input differently, and the Simplified Formats specification does not settle every case. ehrtslib can serve as a front end for different platforms and as a converter between them, so it lets the caller choose the behaviour instead of building one platform's choices into the library. Pick the modes that match the platform you send to, or the stricter defaults when testing producers.

Behaviour observed in October 2026 (it may change between versions; see #231 and #235):

| Input | EHRbase 2.36.0 | FerroEHR 5.4.2 | Better web-template 3.2.9 |
|---|---|---|---|
| `\|value` / bare key with no exact match | rejected | rejected | stored as sent |
| valid `\|code` with a `\|value` that is no listed term | `value` overwritten with the rubric | `value` kept | `value` kept |

### `codedTextMismatch`: input without an exact match

`"reject"` (default) | `"keep"` | `"correct"`. This applies to a `|code`, `|value`, or bare key with no exact (case-sensitive) match, to a code/value conflict (`|value` is the term of a different code), and to a `|code` sent with its rubric in another template language.

| Mode | Case-only mismatch | No match | Conflict | Other-language rubric |
|---|---|---|---|---|
| `"reject"` | error | error | error | error |
| `"keep"` | kept + warning | kept + warning | both kept + warning | kept + warning |
| `"correct"` | normalised + warning | error | `value` := rubric of `\|code` + warning | translated + warning |

`deserializeFromFlatWithIssues` returns errors as issues (`kind: "coded-text-mismatch"`). `deserializeFromFlat`, the STRUCTURED deserializers, and `buildRmValue` / `buildDvValue` without an `issues` array throw `CodedTextMismatchError`.

### `codedTextDisplayValue`: display text next to a valid code

A valid local `|code` whose `|value` matches no listed term is not a mismatch. The value is display text, i.e. what the user saw. `code_string` and `preferred_term` must correspond, but `value` may differ.

- `"keep"` (default): `value` is kept as sent, and `defining_code.preferred_term` is set only from `|preferred_term`.
- `"keep-and-set-preferred-term"`: `value` is kept, and `preferred_term` is set to the template rubric in the composition language unless `|preferred_term` is sent. This also applies to a `|value` that `codedTextMismatch: "keep"` keeps next to a valid `|code`.
- `"replace-with-rubric"`: **not recommended.** This compatibility mode is for platforms that overwrite `value`: it replaces `value` with the template rubric and warns with the value that was sent. The original display text is lost.

openEHR instruction-state values (`ISM_TRANSITION.current_state` / `careflow_step` in terminology `openehr`) must match the rubric. They follow `codedTextMismatch`, not this option.

## Demo app features related to simplified formats

### Template → simplified output

On the **Template (schema)** input tab, enable **FLAT**, **STRUCTURED**, or **Web Template** output checkboxes. The converter builds a Web Template from the operational template, generates an example RM instance, and emits the selected simplified formats.

### OPT XML export (L10n)

Enable **OPT XML** in the output checkboxes. Options on that tab:

- **Include annotations** — emit path `<annotations>` already on the OPT
- **Emit L10n annotations** — synthesize Better/AD `L10n.{lang}` keys from Web Template `localizedNames` (workaround for multilingual renamed repetitions; see Discourse #2760)

### FLAT / STRUCTURED → RM input

On the **Instance** input tab, choose **FLAT (simplified)** or **STRUCTURED (simplified)** as the input format. Paste or upload JSON in that format; the converter deserializes to an RM instance and can emit canonical JSON, XML, YAML, etc.

**Template schema is required** for FLAT/STRUCTURED input (and for simplified output from instance mode). When no schema is loaded, the demo shows a **Web Template schema** upload section and highlights it if conversion fails for that reason. You can supply:

- Operational template: `.opt`, `.oet`, `.adl`, `.adls`, `.zip`, `.t.json`
- Web Template JSON (standalone `.json` with `templateId` and `tree`)
- A template already loaded on the **Template** input tab (shared with the Simplified output tab)

Upload multiple `.adl`/`.opt`/`.oet` files or a ZIP: the demo shows a **scrollable tab bar** per file. The **radio** on a tab marks the **generation root** (drives example/stub output); clicking the tab name switches the editor buffer. The full file set stays in `ClinicalModelWorkspace` (backed by `TemplateWorkspace`) for ADL2 flattening.

**Auto detect** (the default input format) recognises simplified JSON: `ctx/` keys, `|` attributes, or only path keys with primitive values → FLAT; a top-level `ctx` object, or one root object with `|` attributes → STRUCTURED. This also covers output-flavour payloads without `ctx/`.

The deserializer panel shows the FLAT/STRUCTURED options when such input is detected: **Coded text mismatch**, **Coded text display value**, **RM defaults** (`contextDefaults`) and **Unknown keys**. Presets set them; **Custom…** unlocks them. Errors that stop the conversion (`CodedTextMismatchError`, `UnknownFlatKeyError`) list each path. Warnings and notes are listed above the output. The Simplified output tab has a **Flavour** select (output or input).

## Limitations

- Web Template tree follows the spec's level removal (ITEM_STRUCTURE, HISTORY, and a single EVENT with max 1), as Better and EHRbase do. Node **names** use scoped term lookup (`term_archetype_scope` + `archetype_term_definitions`), matching `RMInstanceGenerator`. Scope keys are archetype ids and, for nested Better templates, template ids, so two templates that share an archetype id keep distinct question text. `templateId` on the Web Template is `OPERATIONAL_TEMPLATE.template_id` when flatten copied a Better template id, otherwise the archetype id. The demo **language** control is passed as `languages: [templateLanguage]` (the primary language). Node ids follow that language. Omitting it uses the template's original language only. OPT path annotations `L10n.{lang}` are promoted into `localizedNames` (Better/AD workaround for multilingual renamed repetitions — see `docs/ADL_SUPPORT.md`). The reconstructed OPT from `webTemplateToOpt()` still has a flat `ontology.term_definitions` map that last-wins on colliding at-codes — prefer names on the Web Template nodes, `archetype_term_definitions`, or the emitted `L10n.*` annotations.
- `webTemplateToOpt()` reconstructs an approximate operational template from a derived Web Template. Leaf **unit lists**, **coded `code_list`**, **assumed_value defaults**, and **magnitude/precision ranges** (`inputs[].validation`) are copied when present (OPT parse + WT builder: #73, #75–#77). Invariants and other AOM facets that the Web Template never carried remain dropped. Sufficient for structural round-trip, instance generation, and FLAT/STRUCTURED (de)serialization.
- Example instances from `RMInstanceGenerator` may omit primitive values on optional DV types; FLAT/STRUCTURED leaf keys appear only when RM values are populated.
- Deserialization returns plain RM object trees by default; use `toTypedRm()` (or `JsonCanonicalDeserializer`) for typed class instances.
- Not preserved: RM attributes without a Web Template node or supported `_` path, such as participations, `feeder_audit`, `links`, `work_flow_id`, `EVENT.offset`, and data values inside `DV_INTERVAL`. The context `_end_time`, `_location`, `_health_care_facility`, the composition `_uid`, and ELEMENT `_null_flavour` / `_null_reason` are supported.
- The RM types and names of collapsed objects (HISTORY, a single EVENT, ITEM_TREE/ITEM_LIST/…) come from `tree.collapsed`, an ehrtslib addition to the Web Template. Web Templates from other tools do not have it; then FLAT → RM uses HISTORY, POINT_EVENT (INTERVAL_EVENT when the template has `width`), ITEM_TREE, and generic names.
- DV field maps follow `docs/vendor/simplified_formats.md` (ITS-REST); bare-path keys for single-field types (`DV_TEXT`, `DV_DATE_TIME`, …) and `|suffix` for multi-field types.

## Tests

```bash
deno test test_data/tests/serialization/simplified/ examples/demo-app/src/converter.template.test.ts --allow-read --no-check
```
