# ADL support (1.4 and 2.x)



ehrtslib parses **ADL 2** natively and accepts **ADL 1.4** via automatic conversion to ADL 2 before parsing. **Legacy OPT XML** and **OET XML** are supported for template input.



## Quick start



```typescript

import { parseAdl, parseTemplateInput, ArchetypeRepository } from "./parser/mod.ts";

import { OptXmlSerializer } from "./generation/mod.ts";



// Archetype / ADL2 template

const result = parseAdl(adlText); // 1.4 or 2.x



// Any template format (ADL operational_template, OPT XML, OET XML)

const tpl = parseTemplateInput(text);

const opt = tpl.operationalTemplate; // when OPT or ADL operational_template



// OET compile (requires archetype repository)

const repo = await ArchetypeRepository.fromDirectory("./test_data/archie-tests/flattening");

const compiled = parseTemplateInput(oetXml, { archetypeRepository: repo });



// OPT XML round-trip

const xml = new OptXmlSerializer().serialize(opt!);

```



- `result.detectedVersion` — `"1.4"`, `"2.x"`, or `"unknown"`

- `result.convertedFrom14` — `true` when 1.4 normalisation ran

- `parseTemplateInput().format` — `"adl14"`, `"adl2"`, `"opt_xml"`, `"oet_xml"`



## Format matrix (Phase 6b)



| Input | Parser | Output model | Instance generation |

|-------|--------|--------------|---------------------|

| ADL 2 `.adls` operational_template | `parseAdl` / `parseTemplateInput` | `OPERATIONAL_TEMPLATE` | Yes |

| ADL 1.4 `.adl` (convert → ADL2) | `parseAdl` | `ARCHETYPE` / template | After flatten |

| Legacy **OPT XML** (`.opt`) | `parseOptXml` / `OptXmlSerializer` | `OPERATIONAL_TEMPLATE` | Yes |

| **OET XML** (`.oet`, CKM) | `parseOetXml` / `compileOetToOperational` | `OPERATIONAL_TEMPLATE` (with repo) | Yes |

| ADL 1.4 serialize | `ADL14Serializer` | `.adl` text | Round-trip tests |



Fixtures: [`test_data/README.md`](../test_data/README.md) — `opt14/` (20 OPT), `oet14/`, `adl14/`, `archie-tests/`.

## Terminology lookup (`at0001` is not global)

Archetype at-codes (`at0001`, `at0000`, …) are **local to one archetype**. A blood-pressure OPT typically has a different `at0001` on the composition, the observation, and a nested device cluster.

`RMInstanceGenerator.locatableLabel` looks up labels with:

1. `term_archetype_scope` on the constraint node (which archetype this node came from)
2. `archetype_term_definitions[archetypeId][language][atCode]` (per-archetype bags)
3. only then the merged `ontology.term_definitions` map

Those scoped fields are filled by:

| Input | When scopes are attached |
|-------|--------------------------|
| ADL / `.t.json` flatten | `flattenToOperationalTemplate` |
| Legacy **OPT XML** | `parseOptXml` / `parseTemplateInput` (same as flatten) |
| Web Template → OPT | `webTemplateToOpt` (from node names under the nearest archetype-id ancestor) |

Do **not** treat `opt.ontology.term_definitions.en.at0001` as the name of a specific node. That flat map still last-wins when the same at-code appears in several inlined archetypes. It remains for consumers that only need a merged dictionary.

`buildWebTemplate` uses the same scoped lookup as the generator, so Web Template node `name` / `localizedName` stay correct even when at-codes collide. The reconstructed OPT's flat ontology from `webTemplateToOpt` is still last-wins; use `archetype_term_definitions` or the names already on the Web Template tree.

`OptXmlSerializer` emits `xsi:type="C_ARCHETYPE_ROOT"` (the subclass must be tested **before** `C_COMPLEX_OBJECT`) and writes that root's `<term_definitions>`. It does not serialize term bindings or value sets.

### L10n annotations (multilingual repeated parts)

Legacy OPT XML can store **only one** ontology / `component_ontologies` block per archetype id. Renamed repetitions of the same archetype therefore lose independent translations. Better Studio and related tools work around this with path annotations:

```xml
<annotations path="[openEHR-EHR-COMPOSITION.x.v1]/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']">
  <items id="L10n.sv">Medicinsk utrustning i hemmet</items>
  <items id="L10n.fr">Équipement médical à domicile</items>
</annotations>
```

ehrtslib support:

| Direction | Behaviour |
|-----------|-----------|
| **Parse** OPT XML | Top-level `<annotations>` → `RESOURCE_ANNOTATIONS.documentation` (incl. `L10n.*`) |
| **Serialize** OPT XML | Emits annotations when present; `OptXmlSerializer({ l10nFromWebTemplate })` can synthesize `L10n.{lang}` from Web Template `localizedNames` |
| **Web Template** | `buildWebTemplate` promotes `L10n.{lang}` into `node.localizedNames` and copies all path items onto `node.annotations` |
| **Web Template → OPT** | `webTemplateToOpt` writes `L10n.*` path annotations from each node's `localizedNames` |

Helpers live in [`generation/opt_l10n.ts`](../generation/opt_l10n.ts). Background: [openEHR Discourse #2760](https://discourse.openehr.org/t/limitation-preventing-multilingual-repeated-parts-in-the-opt-operational-template-export-format/2760).

## ADL 1.4 conversion



`convertAdl14ToAdl2()` in [`parser/adl14_to_adl2_converter.ts`](../parser/adl14_to_adl2_converter.ts) applies:



| Change | Notes |

|--------|--------|

| Header metadata | Inserts `adl_version=2.0.6`, `rm_release`, optional `generated` |

| `ontology` → `terminology` | Also parsed directly via `ONTOLOGY` token |

| `concept` / `revision` sections | Removed (deprecated in ADL2) |

| `terminologies_available` | Stripped |

| `term_definitions` / `items` wrapper | Flattened (ADL 1.4 ODIN shape) |

| **ac-code keys** | `[at0001]` / `[ac1]` → `[id1]` in terminology |

| **constraint_definitions** | Merged into `term_definitions` by code key |

| **value_sets** | ac-code keys normalised under terminology |

| Node ids in definition/rules | `[at0001]` → `[id1]` |

| `matches {*}` | Removed (deprecated) |

| HRID `v1` | Normalised to `v1.0.0` |



**ADL 1.4 down-convert:** `ADL14Serializer` emits `ontology`, `[at####]` node ids, and ADL 1.4 header for BAD/CKM compatibility.



### Conversion limits (examples)



| Scenario | Behaviour | Workaround |

|----------|-----------|------------|

| Complex tuple / ODIN syntax in legacy files | May fail cADL parse | Use AWB export or hand-fix |

| OET without local archetypes | Parse only; compile throws | Provide `ArchetypeRepository` directory |

| OET `hide_on_form` rules | Ignored (UI metadata, not AOM) | N/A |

| OPT XML serialize | Structural round-trip plus per-`C_ARCHETYPE_ROOT` `term_definitions` and path `<annotations>` (incl. `L10n.*`); bindings/value sets still omitted | Compare parsed AOM, not bytes; use `l10nFromWebTemplate` when exporting multilingual repeated names |

| ADL 1.4 → 2 → 1.4 | Node ids and ontology shape restored; comments lost | Use ADL2 as source of truth |

| `for_all` / `there_exists` in rules | Parsed to AST; string fallback if parse fails | Keep rules on single lines |



## ADL 2 feature matrix



| Area | Status |

|------|--------|

| Parse / serialize archetype, template, operational_template | Yes |

| Legacy OPT XML ↔ operational template | Yes (parse + serialize, `test_data/opt14/`) |

| OET XML parse + compile (with repo) | Yes |

| cADL definition, ODIN metadata, terminology | Yes |

| `rules` parse, serialize, evaluate (`for_all`, `there_exists`) | Yes |

| `annotations`, `rm_overlay` | Yes |

| Template flattening (`am/util/`) | MVP |

| `TemplateValidator` + invariants | Yes |

| Deserializer `validateAgainstTemplate` | JSON / YAML / XML |

| `ArchetypeValidator` (AOM structure) | Yes |

| Demo app Template tab | ADL + OPT + OET upload; ZIP extract |



## Verify

From the repository root. Prefer `--no-check`; `deno task test` typechecks and currently fails on many test files.

```bash
deno test test_data/tests/adl14/ test_data/tests/am/ test_data/tests/parser/ test_data/tests/validation/ --allow-read --no-check

deno test examples/demo-app/src/converter.template.test.ts --allow-read --no-check
```

## Related

- PRD: [`tasks/prd-phase6b-adl14-full-roundtrip.md`](../tasks/prd-phase6b-adl14-full-roundtrip.md)
- BMM survey: [`tasks/bmm_survey_phase6b.md`](../tasks/bmm_survey_phase6b.md)
- [Roadmap](maintainers/roadmap.md) (Phase 6b) · root stub [ROADMAP.md](../ROADMAP.md)

