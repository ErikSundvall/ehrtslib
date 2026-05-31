# ADL support (1.4 and 2.x)



ehrtslib parses **ADL 2** natively and accepts **ADL 1.4** via automatic conversion to ADL 2 before parsing. **Legacy OPT XML** and **OET XML** are supported for template input.



## Quick start



```typescript

import { parseAdl, parseTemplateInput, ArchetypeRepository } from "./enhanced/parser/mod.ts";

import { OptXmlSerializer } from "./enhanced/generation/mod.ts";



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



## ADL 1.4 conversion



`convertAdl14ToAdl2()` in [`enhanced/parser/adl14_to_adl2_converter.ts`](../enhanced/parser/adl14_to_adl2_converter.ts) applies:



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

| OPT XML serialize | Structural round-trip; whitespace/metadata may differ | Compare parsed AOM, not bytes |

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

| Template flattening (`enhanced/am/`) | MVP |

| `TemplateValidator` + invariants | Yes |

| Deserializer `validateAgainstTemplate` | JSON / YAML / XML |

| `ArchetypeValidator` (AOM structure) | Yes |

| Demo app Template tab | ADL + OPT + OET upload; ZIP extract |



## Verify



```bash

deno test tests/adl14/ tests/am/ tests/test_data/ tests/parser/ tests/validation/ --allow-read --no-check

deno test examples/demo-app/src/converter.template.test.ts --allow-read --no-check

```



## Related



- PRD: [`tasks/prd-phase6b-adl14-full-roundtrip.md`](../tasks/prd-phase6b-adl14-full-roundtrip.md)

- BMM survey: [`tasks/bmm_survey_phase6b.md`](../tasks/bmm_survey_phase6b.md)

- [ROADMAP.md](../ROADMAP.md#phase-6b)

