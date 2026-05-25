# ADL support (1.4 and 2.x)

ehrtslib parses **ADL 2** natively and accepts **ADL 1.4** via automatic syntactic conversion to ADL 2 before parsing.

## Quick start

```typescript
import { parseAdl } from "./enhanced/parser/mod.ts";

const result = parseAdl(adlText); // 1.4 or 2.x
const archetype = result.archetype;
```

- `result.detectedVersion` — `"1.4"`, `"2.x"`, or `"unknown"`
- `result.convertedFrom14` — `true` when 1.4 normalisation ran
- `result.adl2Source` — text passed to the ADL2 parser (after conversion)

## ADL 1.4 conversion (syntactic)

`convertAdl14ToAdl2()` in [`enhanced/parser/adl14_to_adl2_converter.ts`](../enhanced/parser/adl14_to_adl2_converter.ts) applies:

| Change | Notes |
|--------|--------|
| Header metadata | Inserts `adl_version=2.0.6`, `rm_release`, optional `generated` |
| `ontology` → `terminology` | Also parsed directly via `ONTOLOGY` token |
| `concept` / `revision` sections | Removed (deprecated in ADL2) |
| `terminologies_available` | Stripped |
| `term_definitions` / `items` wrapper | Flattened (ADL 1.4 ODIN shape) |
| Node ids in definition/rules | `[at0001]` → `[id1]` |
| `matches {*}` | Removed (deprecated) |
| HRID `v1` | Normalised to `v1.0.0` |

**Not converted automatically:** full ac-code / value_sets semantic migration, `constraint_definitions` merge into term tables (logged only), ADL 1.4 tuple syntax for quantities/ordinals. Use openEHR ADL Workbench for heavy legacy artefacts.

Fixture: [`test_data/adl14/openEHR-TEST_PKG-WHOLE.most_minimal.v1.adl`](../test_data/adl14/openEHR-TEST_PKG-WHOLE.most_minimal.v1.adl)

## ADL 2 feature matrix

| Area | Status |
|------|--------|
| Parse / serialize archetype, template, operational_template | Yes |
| cADL definition, ODIN metadata, terminology | Yes |
| `rules` parse, serialize, evaluate | Yes |
| `annotations`, `rm_overlay` | Yes |
| Template flattening (`enhanced/am/`) | MVP |
| `TemplateValidator` + invariants | Yes |
| Deserializer `validateAgainstTemplate` | JSON / YAML / XML |
| `ArchetypeValidator` (AOM structure) | Yes |
| Archie ADL2 parse benchmark | 8/8 fixtures |

## Expression language

Rules support paths, variables, comparisons, boolean operators, `exists`, `for_all` / `there_exists`, `not`, `member_of` (MVP). Complex expressions fall back to `string_expression` storage.

## Verify

```bash
deno test tests/parser/ tests/validation/ tests/am/ --allow-read --no-check
deno test tests/parser/adl14_converter.test.ts --allow-read --no-check
```

## Merge to main

See [MERGE_TO_MAIN.md](MERGE_TO_MAIN.md).
