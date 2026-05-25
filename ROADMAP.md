# Roadmap

Partly done - completed steps are marked `✅ (done)` 

This file (ROADMAP.md) contains the latest parts. Once in a while finished 
things are moved to ROADMAP-FINISHED-TASKS.md  in order to reduce the file size.

## Phase 5a
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

## Phase 5b
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

## Phase 6a
Exploration of:
Serialisation and deserialisation of RM object instance tree examples (and associated serialisations) based on templates + validation of RM instances related to templates

## Phase 6b
Follow-up enhancements after Phase 5b AM/ADL MVP (non-blocking).

### ADL / AOM
- **Deep ADL 1.4 AOM migration** — ac-code / value_sets reshaping per openEHR conversion guide; full `constraint_definitions` merge into `term_definitions`; use ADL Workbench for difficult legacy artefacts
- **Expression language** — fuller AST for rare operators and nested forms (beyond current `string_expression` + MVP tree)
- **ADL 1.4 regression suite** — curated `.adl` fixtures and round-trip tests beyond the minimal `test_data/adl14/` sample

### Validation
- **Archie AOM structural parity** — raise `ArchetypeValidator` pass rate on all `test_data/archie-tests/` (parse is 8/8; primitive-constraint archetypes need richer `rm_type_name` mapping)
- **Archie semantic parity** — optional benchmark against Archie JVM validator (out of scope for a dependency-free TS library unless run as external tool)

### Tooling / docs
- Performance profiling vs PRD targets (<100ms parse, <50ms validation typical archetype)
- Expand [`docs/ADL_SUPPORT.md`](docs/ADL_SUPPORT.md) with conversion limit examples

## Phase 7a
Exploration of:
Serialisation and deserialisation of RM object instance trees to and from
openEHRs simplified JSON formats (likely using other already existing library if
it can be made fairly dependency free)

## Phase 7b
Explore other Simplified openEHR template specific forms of instance tree creation and
validation. (Take inspiration from Archie and openEHR's simplified formats and
"web template" but also allow ADL2 flattened templates as validatiadl-toolson
source).

- One version of this code needs to be small so that it can fit and be run
  eficiently inside form engines etc.
- Also make a (less lightweight) version that can be synchronously multiuser
  updated using Y.js or
- Create build step to genenrate minivfed and web component versions

## Phase X - dist and docs

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
