# Roadmap

Partly done - completed steps are marked `✅ (done)` 

This file (ROADMAP.md) contains the latest parts. Once in a while finished 
things are moved to ROADMAP-FINISHED-TASKS.md  in order to reduce the file size.

## Phase 5a ✅ (done)
Now we will add the archetyping/templating layer to out openEHR implementation. Make a plan inspired by a PRD, but since there are several potential design options for many of the points below present alterantive pahways through that PRD so that I can consider which ways to select for future implementaion (in leter phase).

- Implement/refine any remaining classes of the AM package, use deepwiki and the files in /instructions to understand. If needed improve the files in /instructions first.
- A central piece is creating an ADL parser that can parse ADL2 files for temnplates and archetypes and generate a (usually in-memory) Archetype model (AOM) instance tree that can then with some addtional wrapper/utility code be used for example for:
  - validate RM object instance trees based on a certain template
  - generate example RM instances based on a template
  - generate typescritp skeleton/scaffolding code (initially typescript) based on a certain template
  - serve as basis for furher editing the template/archetype and serialise back to ADL and other serialisation formats
  
- Note that there is an official grammar for the ADL language available form openEHR - documentation of it is also available via Deepwiki. 
- We want to base our AM implementation primarily on verstion 2 of ADL and AOM and later make conversions to/from version 1.4 etc. 
- We need to find a fairly non intrusive way of adding AM validation to the existing BASE+RM implementation. Remember that we want to be able to add more classes or alternative RMs (or RM verions) in the future and still use the same AM and validation mechanisms. Not that already we have an inital implemtation of a type registry in the serialisation code of the existing RM implementation.
- Feel free to use any existing AM implementation (like Archie and other previously mentioned implementations) as a reference, but try to make it as TypeScript native/natural as possible adn with few dependencies.
- When maiking the PRD for this step do the research to find the best way to implement this so that the suggestion can be inspected in the PRD before actual implementation.

## Phase 5b ✅ (done)
Implement the ideas from Phase 5 a experessed in the PRD file tasks/prd-phase5a-am-implementation.md with the following choises

### Regarding validation (section 6 of tasks/prd-phase5a-am-implementation.md)
Pick "**Option 1: External Validator (RECOMMENDED)**" note that the code examples in the PRD are just examples and you may deviate from them to produce something better tailored to requirements etc.

### Regarding section 11.2 Open Questions (in tasks/prd-phase5a-am-implementation.md)
1. **Parser Approach:** Which alternative (A, B, C, or D)? → Recommended: A with grammar-assisted stub generation
* From section "5.3.2 Using ANTLR Grammar to Accelerate Alternative Parser Implementations" pick "### Recommendation: Hybrid Approach" summarized on line 897-936
2. **Archetype Repository:** File-based or in-memory? → File-based initially, abstract later
* Not needed now
4. **Performance Targets:** What's acceptable for parsing/validation? → <100ms parse, <50ms validation typical archetype
* Sounds like OK targets but not critical now
5. **Template Flattening Implementation Strategy:**
* Bidirectional abilities — **done (MVP)** (`enhanced/am/`: `flattenToOperationalTemplate`, `extractDifferentialDefinition` for editor round-trip)
* **ADL 2** — parse, serialize, rules, annotations, rm_overlay ([`docs/ADL_SUPPORT.md`](docs/ADL_SUPPORT.md))
* **ADL 1.4** — syntactic conversion + `parseAdl()` **done**; deeper AOM migration → Phase 6b
* **Rules/invariants** — parse, serialize, evaluate **done**
* **Validation** — `TemplateValidator`, `InvariantEvaluator`, `ArchetypeValidator`, deserializer `validateAgainstTemplate` **done**

Phase 5b is substantially complete on branch `ui-restoration-2026-02-18`. See [`docs/MERGE_TO_MAIN.md`](docs/MERGE_TO_MAIN.md) for merge checklist.

## Phase 6a.1 ✅ (done)
Interactive UI refinement for the demo app was performed using pencil.dev and cursor after phase 5. 
Now we want Exploration of generating instance examples and typescript code stubs in the output column based on operational ADL templates being inserted in an editor in the so far unpopulated "template" tab of the input column. 

## Phase 6a.2 — Done
Library example generation via `RMInstanceGenerator` (already in `enhanced/generation/`). Template file sets:
`TemplateWorkspace` + extended `ArchetypeRepository` flatten ADL2 differential `template` → operational when archetypes are in the set.
Demo: multi-file + ZIP upload, active-file selector, workspace-backed conversion (not textarea concat). See `docs/ADL_SUPPORT.md` and `tests/parser/template_workspace.test.ts`.

Serialisation/deserialisation of RM instances from templates: covered in Phase 7a/7b (simplified formats); canonical validation via `TemplateValidator` (Phase 5b).

## Phase 6b
Follow-up enhancements after Phase 5b AM/ADL MVP — see [`tasks/prd-phase6b-adl14-full-roundtrip.md`](tasks/prd-phase6b-adl14-full-roundtrip.md).

### Done (2026-05-29)
- **Legacy OPT XML parser** — `parseOptXml()`; 20/20 `test_data/opt14/` fixtures; demo Template tab accepts `.opt`
- **Unified template input** — `parseTemplateInput()` for ADL / OPT / OET detection
- **OET XML parser** — CKM Ocean Template format; `test_data/oet14/` fixtures
- **ADL 1.4 serializer** — `ADL14Serializer` + round-trip test on `adl14/` fixture
- **ArchetypeRepository** — file-based `.adl`/`.adls` lookup for future OET compile
- **test_data compatibility scan** — parse-all corpora test with failure reporting
- **BMM survey** — [`tasks/bmm_survey_phase6b.md`](tasks/bmm_survey_phase6b.md) (pins unchanged; AM 2.4.0 JSON authoritative)
- **Demo app** — Template upload button (`.opt`, `.oet`, `.adl`, `.adls`)
- **cADL parser fix** — inline `--` comments no longer cause infinite parse loops (flattening fixtures)
- **Deep ADL 1.4 AOM migration** — ac-code / value_sets; `constraint_definitions` → `term_definitions` merge
- **OET → operational compile** — `compileOetToOperational()` with path rules + archetype repository + flattener
- **OPT XML serialize** — `OptXmlSerializer` + round-trip tests on `opt14/`
- **Expression language** — `for_all` / `there_exists` AST in rules parser + invariant evaluator
- **ZIP extract in demo** — browser-side unzip via `fflate` for template/archetype folders
- **Docs** — [`docs/ADL_SUPPORT.md`](docs/ADL_SUPPORT.md) conversion limit examples



## Phase 7a — ✅ (done)
Exploration of serialisation and deserialisation of RM object instance trees to and from
openEHR simplified JSON formats (FLAT, STRUCTURED via Web Template).

Implemented `deserializeFromFlat`, `deserializeFromStructured`, and `structuredToFlat` in
`enhanced/serialization/simplified/`. Round-trip tests in `tests/serialization/simplified/roundtrip.test.ts`
cover canonical JSON ↔ FLAT/STRUCTURED via Web Template.

## Phase 7b — ✅ (done)
Explore other Simplified openEHR template specific forms of instance tree creation and
validation. (Take inspiration from Archie and openEHR's simplified formats using
"web template"-based formalisms)
Create library functionality and make sure the demo tool also allows convertion at least TO the different simplified formats

Implemented in `enhanced/serialization/simplified/` (Web Template builder, FLAT/STRUCTURED serializers, FLAT validator). Demo app template tab supports FLAT, STRUCTURED, and Web Template outputs. See `docs/SIMPLIFIED_FORMATS.md`.

## Phase 7d Better `.t.json` + GitHub file sets — done
- `parseTemplateJson` / `template_json` repository kind (Archetype Designer JSON AOM)
- `normalizeBetterTemplateJson` — Better/AD export dialect (camelCase AM fields, occurrences, terminology codes, intervals; see [Discourse #4389](https://discourse.openehr.org/t/incompatibility-issues-when-using-archetype-designer-s-export-fileset-t-json-files/4389))
- `ClinicalModelWorkspace`: `updateFileContent` / `exportFile` / `exportEntries` (dirty flag for future annotation editor), ZIP + read-only GitHub (`owner/repo@branch:path`, optional `GITHUB_TOKEN`)
- Docs: `docs/CLINICAL_MODEL_FILESETS.md`; fixture `test_data/tjson/Care unit v2.t.json`
- Demo: `.t.json` in ZIP upload, GitHub toolbar, blue `t.json` tab badge, validation labels for `template_json`

## Phase 7c Refining UI + debugging OPT — done
- File-set hint moved to info icon + tooltip (`examples/demo-app`)
- Template (schema) editor has Disable Line Wrap
- Tab badges colored: archetype/template/oet/opt = blue, error = red, skipped = dark orange
- OET/OPT XML classified as `oet_xml` / `opt_xml` in `ArchetypeRepository` (was misleading `skipped`; Vital signs `templates/composition/Vital signs.oet` covered by test)

## Remaining (Phase 8b+)
- OPT ↔ ADL2 OPT2 round-trip (no public OPT2 corpus yet)
- More OET test compile with CKM archetype bank (needs larger fixture download)

## Phase X - dist and docs

- One version of this code needs to be small so that it can fit and be run
  eficiently inside form engines etc.
- Also make a (less lightweight) version that can be synchronously multiuser
  updated using Y.js or
- Create build step to genenrate minivfed and web component versions


Create /dist directory and subdirectories with different distributions for
targeted purposes for example
- compact code for browser use
- simultaneous multi-user editing
- complete release e.g. for making advanced tooling

create end user docs using same format as openEHR specs include static website app for conversion and example generation

## Phase Y - inspire future work
- semi automated generation of python impl. - dont do myself
= UI/form impl - started pencil-in project
- ...
