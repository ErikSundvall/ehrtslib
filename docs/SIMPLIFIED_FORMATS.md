# Simplified openEHR Formats (Phase 7a / 7b)

Library support for **Web Template**, **FLAT**, and **STRUCTURED** simplified composition formats as defined in the openEHR ITS-REST simplified formats specification.

**Related:** `openehr://guides/specs/its-rest-simplified_formats`, `openehr://guides/simplified_formats/rules`

## Module

`enhanced/serialization/simplified/` exports:

| Export | Purpose |
|--------|---------|
| `buildWebTemplate(opt)` | Build Web Template JSON from an operational template |
| `parseWebTemplate(json)` | Parse Web Template JSON (EHRBase/Better dialects) |
| `isWebTemplateJson(value)` | Detect Web Template JSON documents |
| `webTemplateToOpt(wt)` | Reconstruct approximate `OPERATIONAL_TEMPLATE` from Web Template |
| `serializeToFlat(instance, wt)` | RM instance → FLAT key/value map |
| `serializeToFlatJson(instance, wt)` | Same, JSON string |
| `deserializeFromFlat(flat, wt)` | FLAT → RM instance (plain object with `_type`) |
| `deserializeFromFlatJson(json, wt)` | Same, from JSON string |
| `serializeToStructured(instance, wt)` | RM instance → STRUCTURED nested object |
| `serializeToStructuredJson(instance, wt)` | Same, JSON string |
| `deserializeFromStructured(structured, wt)` | STRUCTURED → RM instance |
| `structuredToFlat(structured, wt)` | STRUCTURED → FLAT (shared path) |
| `validateFlatPayload(flat, wt)` | Validate FLAT keys against template schema |
| `toTypedRm(plain)` | Plain `_type` tree → typed RM class instances |

Re-exported from `enhanced/serialization/mod.ts`.

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

Template-scoped fields (ctx + template content paths) round-trip; RM attributes not in the Web Template are not preserved.

## FLAT format

- Composition metadata uses `ctx/` prefix (`ctx/language`, `ctx/territory`, `ctx/composer_name`, …).
- Clinical data keys are fully qualified from the normalised template root id.
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

- Top-level `ctx` object (not prefixed keys).
- Template root id as nested object key.
- Arrays at every data-bearing node, even cardinality 1.
- Pipe-prefixed keys inside leaf objects (`{"|magnitude": 128, "|unit": "mm[Hg]"}`).

## Demo app features related to simplified formats

### Template → simplified output

On the **Template (schema)** input tab, enable **FLAT**, **STRUCTURED**, or **Web Template** output checkboxes. The converter builds a Web Template from the operational template, generates an example RM instance, and emits the selected simplified formats.

### FLAT / STRUCTURED → RM input

On the **Instance** input tab, choose **FLAT (simplified)** or **STRUCTURED (simplified)** as the input format. Paste or upload JSON in that format; the converter deserializes to an RM instance and can emit canonical JSON, XML, YAML, etc.

**Template schema is required** for FLAT/STRUCTURED input (and for simplified output from instance mode). When no schema is loaded, the demo shows a **Web Template schema** upload section and highlights it if conversion fails for that reason. You can supply:

- Operational template: `.opt`, `.oet`, `.adl`, `.adls`, `.zip`, `.t.json`
- Web Template JSON (standalone `.json` with `templateId` and `tree`)
- A template already loaded on the **Template** input tab (shared with the Simplified output tab)

Upload multiple `.adl`/`.opt`/`.oet` files or a ZIP: the demo shows a **scrollable tab bar** per file. The **radio** on a tab marks the **generation root** (drives example/stub output); clicking the tab name switches the editor buffer. The full file set stays in `TemplateWorkspace` for ADL2 flattening.

**Auto** input format detects simplified JSON (`ctx/` keys → FLAT; top-level `ctx` object → STRUCTURED).

## Limitations

- Web Template tree follows EHRbase-style flattening (ITEM_TREE/HISTORY level removal); terminology rubrics from OPT XML may be incomplete when term text is nested XML objects.
- `webTemplateToOpt()` reconstructs an approximate operational template from a derived Web Template; constraint detail (value sets, invariants) is not preserved — sufficient for structural round-trip, instance generation, and FLAT/STRUCTURED (de)serialization.
- Example instances from `RMInstanceGenerator` may omit primitive values on optional DV types; FLAT/STRUCTURED leaf keys appear only when RM values are populated.
- Deserialization returns plain RM object trees by default; use `toTypedRm()` (or `JsonCanonicalDeserializer`) for typed class instances.
- Only template-scoped paths round-trip; extraneous RM metadata outside the Web Template is dropped.
- DV field maps follow `docs/vendor/simplified_formats.md` (ITS-REST); bare-path keys for single-field types (`DV_TEXT`, `DV_DATE_TIME`, …) and `|suffix` for multi-field types.

## Tests

```bash
deno test test_data/tests/serialization/simplified/ examples/demo-app/src/converter.template.test.ts --allow-read --no-check
```
