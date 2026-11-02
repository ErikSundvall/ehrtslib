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

// Compact ADL2 operational_template (OPT2) for LLM / tooling (#130, #157).
// Leaf constraints and archetype slots are included. Node ids stay at-codes
// (ADL 2.4, the default); pass `adl2CodingSystem: "id-coded"` for ADL2
// id-codes (`at0000` → `id1`). Value-set at-codes and ac-codes are unchanged.
// `languages` filters terminology only and keeps the definition.

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

1. `term_occurrence_scope`, else `term_archetype_scope`, on the constraint node (`termScopeOf`). The archetype scope is the archetype id, or a Better template id such as `ChemoQ-fatigue` when the slot's `archetypeRef` is a template id. The occurrence scope `<archetype id>#<n>` marks a later OPT 1.4 occurrence of an archetype whose inline terms differ from the first (two `SECTION.adhoc` roots with at0000 "Vital signs" and "Calculated scales"); its table is in `occurrence_term_definitions`. `termTablesByScope` and `archetypeTermBagsForLanguage` return both kinds of table
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

`buildWebTemplate` uses the same scoped lookup as the generator, so Web Template node `name` / `localizedName` stay correct even when at-codes collide across archetypes **or** across Better templates that share one archetype id. Pass `languages: ["sv", "en"]` to choose a primary language and the additional languages to include (`sv` → `Trötthet`, or `Systoliskt` from an OPT 1.4 `<component_ontologies>` block). Omitting `languages` uses the template's `original_language` only. A term missing in the primary language falls back through the other listed languages and then to `original_language`. Node `id` follows that resolved label, so FLAT path segments follow the primary language. Pass `idLanguage: "original"` to slug `original_language` instead. AQL paths stay archetype node ids plus any fixed `name/value` predicate from the OPT. Output `defaultLanguage` is the primary language and output `languages` is the selected list. `availableTemplateLanguages` still lists every language the template has terms for (original first, then OPT order, including codes such as `ar-sy` or `qq` as written). `localizedNames` and `localizedDescriptions` carry each selected language that actually defines the term, which is the EHRbase Web Template shape, and coded value lists do the same in `localizedLabels` when more than one selected language has a label. The flat merged ontology is still last-wins and often only the original language; the other languages stay on `archetype_term_definitions`. The reconstructed OPT's flat ontology from `webTemplateToOpt` is still last-wins; use `archetype_term_definitions` or the names already on the Web Template tree.

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

`exportAdl2TemplateToOpt14(library, templateId, options)` flattens an ADL2 template (overlays, specialisations, exclusions), maps codes to 1.4 form (`id1`→`at0000`, `id1.1`→`at0000.1`, `id0.1`→`at0.1`, overlay codes collapse onto the base archetype; node/value code collisions in the single 1.4 at-code space follow #127: value codes keep the shifted code, a node and value code with identical terms share it, other clashing nodes move to `at9000+` with a warning, and synthetic `id9000+` ids without a term are dropped) and writes every language. Every locatable node that keeps a node id gets a term. When the flat ADL2 terminology has none, the exporter synthesises one from the RM type (`ITEM_TREE` → Tree, `HISTORY` → History, `ITEM_LIST` → List, `CLUSTER` → Cluster) and warns.

Option `multilingualRepeatWorkaround` (**default `true`**; CLI `--no-multilingual-repeat-workaround` turns it off):

- **on**: for every archetype used more than once whose texts differ between occurrences, `L10n.{lang}` path annotations are written for each occurrence, with `and name/value='…'` predicates. Repeated or renamed archetype roots also get a `name` constraint so paths stay distinct.
- **off**: only the single `component_ontologies` block per archetype id is written; `warnings` names each archetype id, path and language whose text is lost, and `translationsDropped` is `true`.

The default is on because readers that do not know the annotations ignore them, while leaving them out silently loses translations. `repeatedTranslationConflicts` lists the affected texts in both modes.

`component_ontologies` also writes `term_bindings`. `[terminology::code]`, `http(s)://<host>[/ver/<version>]/id/<code>`, FHIR `…#code` URIs and OBO `…/obo/<PREFIX>_<id>` PURLs become a terminology id plus `code_string`. A `/ver/<version>` segment is kept as an ADL 1.4 terminology id, `LOINC(2.65)`. An OBO PURL's code is the CURIE `PREFIX:id` (`SO:0001583`). Path bindings and `ac` codes are skipped with a warning (OPT 1.4 item codes are at-codes, and there is no `constraint_bindings` section). Any other target is omitted with a warning.

A local value set (`ac` code with members) stays `terminology="local"` and lists the at-codes, including when every member has a term binding. The bindings are the `term_bindings` entries, which is what keeps the local texts (for example "missense_variant") available to a web template. Members that are synthetic `at9xxx` placeholders, and a single `at9xxx` constraint, are still replaced by the external code. `substituteBoundValueSets: true` restores replacement of an ordinary fully-bound value set.

Limits: tuples, ordinals and rules are not exported; filled slots are closed; there is no OPT 1.4 parser in Archie, so output is checked with the ITS-XML `Template.xsd` (test enabled with `OPENEHR_OPT14_XSD=<path to Template.xsd>`) and by the Ehrtslib OPT parser.

#### Exporting ADL2 templates to OET 1.4

`exportAdl2TemplateToOet14(library, templateId, options)` (CLI: `deno task export:oet14 --lib <dir> --template <file> [--out x.oet] [--no-multilingual-repeat-workaround] [--lang en,sv]`) writes an OET (`openEHR/v1/Template`, ITS-XML `CompositionTemplate.xsd`):

- Each `use_archetype` becomes `Content` (under COMPOSITION `/content`), `Item` (under SECTION) or `Items` (other parents). It carries the 1.4 `archetype_id` of the published base archetype (the last non-template artefact in the specialisation chain), the slot `path` in its parent (1.4 codes), `name` when the overlay renames the root, and `max`/`min` from the use-site occurrences.
- The flattened overlay is compared with the flattened base archetype. The differences are written as `Rule`s: `max="0"` for excluded nodes, `min`/`max` for changed occurrences, `name` for renamed nodes, and constraints: `textConstraint` (DV_TEXT value lists; `excludedValues local::atN` for narrowed local codes), `quantityConstraint`, `countConstraint` and `multipleConstraint` (narrowed DV type choice).
- Codes go through the same spec-aligned id → at mapping as the OPT export (including the collision rule).
- OET holds names in one language only, the template's original language. With `multilingualRepeatWorkaround` (**default `true`**), translations of renamed nodes and of repeated archetypes are written as `L10n.{lang}` path annotations. The path annotations are the same as in the OPT export, with the root archetype id as a prefix. When the option is off, a warning lists what is dropped and `translationsDropped` is set.

Limits: OET cannot add nodes, so new nodes in an overlay only produce a warning. Constraints with no OET equivalent (for example ordinals, intervals, rules and terminology bindings) are warned about and only exist in the OPT export. The exporter also returns those element paths on `optOnlyValuePaths`. Archetypes used outside `/content` of a COMPOSITION (for example in `context`) are not written. There is no independent OET → OPT compiler in the test chain. Output is checked with `CompositionTemplate.xsd` (test enabled with `OPENEHR_OET14_XSD=<path>`, needs python3 + lxml), by `parseOetXml`, and against the archetype roots and names of the direct OPT export.

**Local coded-text redefinitions.** OET `textConstraint` can narrow a value set that already exists on the archetype, by listing `excludedValues` (`local::atN`) for codes the template drops. It cannot introduce a new local value set. When an overlay redefines a `DV_CODED_TEXT` with template-level codes (`at0.x` / `ac0.x`, or any codes that are not a subset of the parent value set), `exportAdl2TemplateToOet14` does not write a `textConstraint`. It records the ADL 1.4 element path on `optOnlyValuePaths` and warns:

```
<archetype id>: value constraint at <path> has no OET equivalent; kept only in the OPT export
```

That constraint is in the OPT 1.4 export (`exportAdl2TemplateToOpt14`), which is the complete artefact. This shows up on CLUSTER elements such as specimen type, collection method, and fixation method when the template supplies its own code list.

Helpers live in [`generation/opt_l10n.ts`](../generation/opt_l10n.ts). Background: [openEHR Discourse #2760](https://discourse.openehr.org/t/limitation-preventing-multilingual-repeated-parts-in-the-opt-operational-template-export-format/2760).

## ADL2 coding systems (at-codes and id-codes)

ADL 2.4 (AM 2.4.0, not yet released) has two node coding systems ([ADL2, node identifiers](https://specifications.openehr.org/releases/AM/development/ADL2.html#_node_identifier_and_coding_systems)). ehrtslib supports both in one build; there is no separate build. See [ADR 0015](adr/0015-adl2-coding-system-at-vs-id.md).

| Coding system | Root node id | Header written | Use |
|---|---|---|---|
| `"at-coded"` (default) | `at0000` (`at0000.1` specialised) | `adl_version=2.4.0` | ADL 2.4, required for openEHR RM. **Experimental until AM 2.4.0 is released.** Same codes as ADL 1.4 and OPT 1.4, so the same data paths |
| `"id-coded"` | `id1` (`id1.1`) | `adl_version=2.0.5` (OPT2) / `2.0.6` (archetype) | ADL 2.0–2.3, as Archie and other AM 2.3 tools read and write. Non-openEHR models |

- **Choosing.** `adl2CodingSystem: "at-coded" | "id-coded"` on `upconvertOpt14ToAdl2`, `convertAdl14ToAdl2`, `OPT2Serializer.serializeOperationalTemplate` and `bindTemplate` picks the coding system of converted output. An id-coded input stays id-coded.
- **Reading.** The ADL2 parser reads both. `adl2CodingSystemOf(artefact)` tells which one an archetype or template uses, from its root node id. `isAdl14Artefact` tells an OPT 1.4 (at-codes, no ADL 2 header) from at-coded ADL2. An at-coded artefact with an ADL 2.0–2.3 header parses with a warning, since AM 2.3 tools would read it as id-coded.
- **Data paths.** RM data always carries at-codes in `archetype_node_id`. Web Template, FLAT, STRUCTURED and AQL paths are at-codes for both coding systems; id-codes map by the ADL2 rule (`id1` → `at0000`, `id5` → `at0004`, `id1.1` → `at0000.1`; `nodeIdToAtCode`). A template up-converted from OPT 1.4 gives the same Web Template as the OPT 1.4 in either coding system. Node ids minted on up-conversion (for OPT 1.4 nodes without one) are marked on the in-memory objects and in the ADL2 text, and left out of paths.
- **OPT2 text round trip** ([#252](https://github.com/ErikSundvall/ehrtslib/issues/252)). An up-converted template written with `OPT2Serializer` and parsed again gives the same Web Template as the OPT 1.4, for every `test_data/opt14` fixture in both coding systems. A template id with characters the ADL2 parser cannot read (for example the spaces in `IDCR - Problem List.v1`) is written with `_` in their place (`IDCR_-_Problem_List.v1`). The original is kept in `description.other_details["template_id"]` and restored on parse, so the Web Template `templateId` stays the same. The written id is still not a full archetype HRID (`openEHR-EHR-COMPOSITION.x.v1`); neither are most OPT 1.4 template ids.
- **Minted node ids.** Up-conversion mints `at9000+` (at-coded) or `id9000+` (id-coded) for OPT 1.4 objects without a node id, as Archie does. `OPT2Serializer` marks each one in `annotations`, keyed by the node's own path, which includes its minted code, so two id-less siblings of one RM type each get their own entry:

  ```
  annotations
      documentation = <
          ["en"] = <
              ["/category[at9000]"] = <
                  ["synthetic_node_id"] = <"true">
              >
          >
      >
  ```

  The parser turns the entries back into the in-memory flag and removes them. This is on by default; `syntheticNodeIdAnnotations: false` leaves the marker out, and the minted ids are then ordinary node ids after a re-parse.
- **Conversion log (optional, off by default).** For compatibility with Archie's format, `upconvertOpt14ToAdl2(opt, header, { conversionLog: true })` returns the created codes in the JSON shape of Archie's conversion log (`converted_archetypes` → `created_codes` / `created_value_sets`; `serializeConversionRunLog`, `parseConversionRunLog`). Pass a previous log as `conversionLog` to reuse its codes: each entry is reused for the next id-less object with the same attribute path (`path_created`) and RM type, in document order. Archie applies a previous code to the first object with that path and type, so with two id-less siblings of one type Archie cannot tell which one a code belonged to; the in-text annotations do not have that limit.
- **id-coded node ids that collide with value codes** ([#252](https://github.com/ErikSundvall/ehrtslib/issues/252)). Node ids never move: a LOCATABLE node id always maps `idN` → `at(N−1)`, and node ids of data values (DV_*, CODE_PHRASE, …), which ADL 1.4 does not have, are dropped in ADL 1.4 output. A value code that would get a node's at-code shares it when the terms are the same, is written back to its bound external code (CKM-mirror faeces `property matches {[at19]}` → `[openehr::128]`), or else moves to `at9000+` with a warning. The OPT 1.4 export, `ADL14Serializer` (archetype text), Web Template value codes, FLAT/STRUCTURED codes and Contribution Builder down-conversion use the same rule; for a template it is one cached map per archetype (`adl14CodeFor`, `adl14CodeMapFor`). `prepareContribution` takes the map from each draft's bound template; standalone `downConvertToAdl14` takes it from its `operationalTemplate` option.

## ADL 1.4 conversion



`convertAdl14ToAdl2()` in [`parser/adl14_to_adl2_converter.ts`](../parser/adl14_to_adl2_converter.ts) applies:



| Change | Notes |

|--------|--------|

| Header metadata | Inserts `adl_version=2.4.0` (at-coded, default) or `2.0.6` (id-coded), `rm_release`, optional `generated` |

| `ontology` → `terminology` | Also parsed directly via `ONTOLOGY` token |

| `concept` / `revision` sections | Removed (deprecated in ADL2) |

| `terminologies_available` | Stripped |

| `term_definitions` / `items` wrapper | Flattened (ADL 1.4 ODIN shape) |

| **at-code keys** (id-coded only) | `[at0000]` → `[id1]`, `[at0001]` → `[id2]`, `[at0000.1]` → `[id1.1]` in terminology (same shift as node ids). `at0.1` is not shifted. Section boundaries are column 0, so an indented `description` key does not end the terminology block |

| **constraint_definitions** | Merged into `term_definitions` by code key |

| **value_sets** | ac-code keys normalised under terminology |

| Node ids in definition/rules | `[at0000]` → `[id1]`, `[at0003]` → `[id4]`, including nodes under `description matches` |

| `matches {*}` | Removed (deprecated) |

| HRID `v1` | Normalised to `v1.0.0` |



**ADL 1.4 down-convert:** `ADL14Serializer` emits `ontology`, `[at####]` node ids, ADL 1.4 header, `concept`, `language` (with translations), `specialize`, quoted ODIN keys, `term_bindings` (same mapping as the OPT export; path bindings stay, with id-codes rewritten to at-codes), `constraint_bindings` for `ac` codes, and expands `value_sets` to `[local::…]` (#113–#116, #141).

### ADL2 template → OET / OPT 1.4 (status)

| Path | Status | Notes |
|------|--------|-------|
| ADL2 `.adls` archetype → ADL 1.4 `.adl` | **Supported** via `ADL14Serializer` (see round-trip tests under `test_data/tests/adl14/`) | Prefer ADL2 as source of truth |
| ADL2 `template` / `use_archetype` → OET 1.4 XML | **Partial** (`exportAdl2TemplateToOet14`) | Exclusions, occurrences, renames, text/coded/quantity/count/type narrowing become `Rule`s. A new local coded-text value set is not an OET `textConstraint`; its path is returned on `optOnlyValuePaths` and the constraint exists only in the OPT export |
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

