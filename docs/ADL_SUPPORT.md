# ADL support (1.4 and 2.x)



ehrtslib parses **ADL 2** natively and accepts **ADL 1.4** via automatic conversion to ADL 2 before parsing. **Legacy OPT XML** and **OET XML** are supported for template input.



## Quick start



```typescript

import { parseAdl, parseTemplateInput, ArchetypeRepository } from "./parser/mod.ts";

import { OptXmlSerializer, OPT2Serializer } from "./generation/mod.ts";



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

// Compact ADL2 operational_template (OPT2) for LLM / tooling (#130)

const opt2 = new OPT2Serializer().serializeOperationalTemplate(opt!);

// Optional: keep only selected languages in terminology / localized bags

const enOnly = new OPT2Serializer().serializeOperationalTemplate(opt!, {
  languages: ["en"],
});

// Optional enrichment: inline human-readable `--` labels on cADL nodes (adds bytes)

const withLabels = new OPT2Serializer().serializeOperationalTemplate(opt!, {
  inlineTermLabels: true,
  inlineTermLabelLanguage: "en",
});

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
| **OPT2** (ADL2 `operational_template` text) | `OPT2Serializer` / `parseAdl` | `OPERATIONAL_TEMPLATE` | Yes (definition + terminology; see `test_data/tests/generation/opt2_serializer.test.ts`) |

| **OET XML** (`.oet`, CKM) | `parseOetXml` / `compileOetToOperational` | `OPERATIONAL_TEMPLATE` (with repo) | Yes |

| ADL 1.4 serialize | `ADL14Serializer` | `.adl` text | Round-trip tests |

| ADL 2 template + overlays → **OPT 1.4 XML** | `Adl2TemplateLibrary` + `exportAdl2TemplateToOpt14`, CLI `deno task export:opt14` | `.opt` text (all languages, `component_ontologies`, optional `L10n.*` annotations) | Web Template round-trip tests (#123) |

| ADL 2 template + overlays → **OET 1.4 XML** | `Adl2TemplateLibrary` + `exportAdl2TemplateToOet14`, CLI `deno task export:oet14` | `.oet` text (original language, `Rule` deltas, optional `L10n.*` annotations) | Structure, OPT-consistency and XSD tests (#123) |



Fixtures: [`test_data/README.md`](../test_data/README.md) — `opt14/` (20 OPT), `oet14/`, `adl14/`, `archie-tests/`.

## Terminology lookup (`at0001` is not global)

Archetype at-codes (`at0001`, `at0000`, …) are **local to one archetype**. A blood-pressure OPT typically has a different `at0001` on the composition, the observation, and a nested device cluster.

`RMInstanceGenerator.locatableLabel` looks up labels with:

1. `term_archetype_scope` on the constraint node (archetype id, or a Better template id such as `ChemoQ-fatigue` when the slot's `archetypeRef` is a template id)
2. `archetype_term_definitions[scope][language][atCode]` — one bag per scope key. A second template that specialises the same archetype id keeps its own bag under its `templateId` (and under the `.t.json` basename when that string was the reference). The shared archetype id keeps the first bag and does not erase the others
3. `term_name_fallback_node_id` on an inlined root, the embedded concept code (`at0000` / `at0000.1`), so a use-site id such as `at0039.1` is named **Fatigue** rather than left as a raw id or another template's question
4. only then the merged `ontology.term_definitions` map

Those scoped fields are filled by:

| Input | When scopes are attached |
|-------|--------------------------|
| ADL / `.t.json` flatten | `flattenToOperationalTemplate` |
| Legacy **OPT XML** | `parseOptXml` / `parseTemplateInput` (same as flatten) |
| Web Template → OPT | `webTemplateToOpt` (from node names under the nearest archetype-id ancestor) |

Do **not** treat `opt.ontology.term_definitions.en.at0001` as the name of a specific node. That flat map still last-wins when the same at-code appears in several inlined archetypes. It remains for consumers that only need a merged dictionary.

`buildWebTemplate` uses the same scoped lookup as the generator, so Web Template node `name` / `localizedName` stay correct even when at-codes collide across archetypes **or** across Better templates that share one archetype id. Pass `defaultLanguage` to read another language bag (`sv` → `Trötthet`). The reconstructed OPT's flat ontology from `webTemplateToOpt` is still last-wins; use `archetype_term_definitions` or the names already on the Web Template tree.

Flatten copies the source Better `templateId` onto `OPERATIONAL_TEMPLATE.template_id`. Web Template `templateId` and OPT XML `<template_id>` use that value when it is set, so a ChemoForm export is `ChemoForm-MBA.v8` rather than the composition archetype id. Archetype id stays on `archetype_id`.

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

#### Exporting ADL2 templates to OPT 1.4

`exportAdl2TemplateToOpt14(library, templateId, options)` flattens an ADL2 template (overlays, specialisations, exclusions), maps codes to 1.4 form (`id1`→`at0000`, `id1.1`→`at0000.1`, `id0.1`→`at0.1`, overlay codes collapse onto the base archetype; node/value code collisions in the single 1.4 at-code space follow #127: value codes keep the shifted code, a node and value code with identical terms share it, other clashing nodes move to `at9000+` with a warning, and synthetic `id9000+` ids without a term are dropped) and writes every language.

Option `multilingualRepeatWorkaround` (**default `true`**; CLI `--no-multilingual-repeat-workaround` turns it off):

- **on**: for every archetype used more than once whose texts differ between occurrences, `L10n.{lang}` path annotations are written for each occurrence, with `and name/value='…'` predicates. Repeated or renamed archetype roots also get a `name` constraint so paths stay distinct.
- **off**: only the single `component_ontologies` block per archetype id is written; `warnings` names each archetype id, path and language whose text is lost, and `translationsDropped` is `true`.

The default is on because readers that do not know the annotations ignore them, while leaving them out silently loses translations. `repeatedTranslationConflicts` lists the affected texts in both modes.

Limits: tuples, ordinals and rules are not exported; filled slots are closed; there is no OPT 1.4 parser in Archie, so output is checked with the ITS-XML `Template.xsd` (test enabled with `OPENEHR_OPT14_XSD=<path to Template.xsd>`) and by the Ehrtslib OPT parser.

#### Exporting ADL2 templates to OET 1.4

`exportAdl2TemplateToOet14(library, templateId, options)` (CLI: `deno task export:oet14 --lib <dir> --template <file> [--out x.oet] [--no-multilingual-repeat-workaround] [--lang en,sv]`) writes an OET (`openEHR/v1/Template`, ITS-XML `CompositionTemplate.xsd`):

- Each `use_archetype` becomes `Content` (under COMPOSITION `/content`), `Item` (under SECTION) or `Items` (other parents). It carries the 1.4 `archetype_id` of the published base archetype (the last non-template artefact in the specialisation chain), the slot `path` in its parent (1.4 codes), `name` when the overlay renames the root, and `max`/`min` from the use-site occurrences.
- The flattened overlay is compared with the flattened base archetype. The differences are written as `Rule`s: `max="0"` for excluded nodes, `min`/`max` for changed occurrences, `name` for renamed nodes, and constraints: `textConstraint` (DV_TEXT value lists; `excludedValues local::atN` for narrowed local codes), `quantityConstraint`, `countConstraint` and `multipleConstraint` (narrowed DV type choice).
- Codes go through the same spec-aligned id → at mapping as the OPT export (including the collision rule).
- OET holds names in one language only, the template's original language. With `multilingualRepeatWorkaround` (**default `true`**), translations of renamed nodes and of repeated archetypes are written as `L10n.{lang}` path annotations. The path annotations are the same as in the OPT export, with the root archetype id as a prefix. When the option is off, a warning lists what is dropped and `translationsDropped` is set.

Limits: OET cannot add nodes, so new nodes in an overlay only produce a warning. Constraints with no OET equivalent (for example ordinals, intervals, rules and terminology bindings) are warned about and only exist in the OPT export. Archetypes used outside `/content` of a COMPOSITION (for example in `context`) are not written. There is no independent OET → OPT compiler in the test chain. Output is checked with `CompositionTemplate.xsd` (test enabled with `OPENEHR_OET14_XSD=<path>`, needs python3 + lxml), by `parseOetXml`, and against the archetype roots and names of the direct OPT export.

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



**ADL 1.4 down-convert:** `ADL14Serializer` emits `ontology`, `[at####]` node ids, ADL 1.4 header, `concept`, `language` (with translations), `specialize`, quoted ODIN keys, and expands `value_sets` to `[local::…]` (#113–#116).

### ADL2 template → OET / OPT 1.4 (status)

| Path | Status | Notes |
|------|--------|-------|
| ADL2 `.adls` archetype → ADL 1.4 `.adl` | **Supported** via `ADL14Serializer` (see round-trip tests under `test_data/tests/adl14/`) | Prefer ADL2 as source of truth |
| ADL2 `template` / `use_archetype` → OET 1.4 XML | **Partial** (`exportAdl2TemplateToOet14`) | Exclusions, occurrences, renames, text/coded/quantity/count/type narrowing become `Rule`s; other constraints are reported as warnings and only exist in the OPT export |
| ADL2 template → OPT 1.4 XML | **Yes** (`exportAdl2TemplateToOpt14`) | See "Exporting ADL2 templates to OPT 1.4" |
| Interim flow for ADL 1.4-only CDRs | ADL2 authoring → `ADL14Serializer` for dependent archetypes → import into an ADL 1.4 template editor → build OET/OPT there | Tracked in #117 |




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
deno test test_data/tests/adl14/ test_data/tests/am/ test_data/tests/parser/ test_data/tests/generation/ test_data/tests/validation/ --allow-read --no-check

deno test examples/demo-app/src/converter.template.test.ts --allow-read --no-check
```

## Related

- PRD: [`tasks/prd-phase6b-adl14-full-roundtrip.md`](../tasks/prd-phase6b-adl14-full-roundtrip.md)
- BMM survey: [`tasks/bmm_survey_phase6b.md`](../tasks/bmm_survey_phase6b.md)
- [Roadmap](maintainers/roadmap.md) (Phase 6b) · root stub [ROADMAP.md](../ROADMAP.md)

