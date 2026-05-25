# Task List: Phase 5b — AM Layer (Parser, Validation, Generation)



**PRD:** [`prd-phase5a-am-implementation.md`](prd-phase5a-am-implementation.md)  

**Roadmap:** [`ROADMAP.md`](../ROADMAP.md) Phase 5a (planning) / Phase 5b (implementation choices)  

**Review basis:** Code review 2026-05-22 (parser, validator, tests vs PRD)



**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.



Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)



Update the file after completing each sub-task, not just after completing an entire parent task. If implementation steps happen to fulfil several things at once then ticking off several boxes is OK.



If running in interactive mode then stop after each parent task and let user review. If running in autonomous batch mode, stop when user input is crucial (flattening strategy, ADL 1.4 scope).



## Relevant Files



- `enhanced/parser/adl2_parser.ts` — Top-level ADL2 parse; section collection

- `enhanced/parser/adl2_tokenizer.ts` — Tokens for archetype/template/OPT

- `enhanced/parser/cadl_parser.ts` — Definition (cADL) constraints

- `enhanced/parser/odin_parser.ts` — ODIN sections

- `enhanced/validation/template_validator.ts` — External validator (PRD §6 Option 1)

- `enhanced/am/` — Flattening + differential extraction (`flattenToOperationalTemplate`, `extractDifferentialDefinition`)

- `tasks/phase5b-deferred.md` — ADL 1.4 and rules/invariants deferred scope

- `enhanced/generation/adl2_serializer.ts` — AOM → ADL2

- `enhanced/generation/rm_instance_generator.ts` — OPT → RM instances

- `enhanced/generation/typescript_generator.ts` — OPT → TS scaffolding

- `tests/parser/adl2_parser.test.ts` — Parser + round-trip tests

- `tests/parser/archie_compatibility.test.ts` — Archie ADL2 fixtures

- `tests/parser/archie_primitives.test.ts` — Archie `primitives/` fixtures

- `tests/validation/archie_validation.test.ts` — Archie-inspired validator tests

- `tests/validation/archie_benchmark.test.ts` — Parse pass-rate benchmark (§8.4)

- `tests/validation/template_validator.test.ts` — Validator unit tests

- `test_data/archie-tests/` — Archie-derived ADL2 samples

- `grammars/Adl.g4`, `cadl.g4`, `odin.g4` — Grammar reference

- `tasks/prd-phase5a-am-implementation.md` — Requirements source



### Notes



- Run tests: `deno test tests/parser/ tests/validation/ tests/am/ --allow-read --no-check` (**85 pass** baseline 2026-05-22)

- Type-check: `deno check` on individual `enhanced/` modules; full-tree check still blocked by legacy AM stubs — use `--no-check` in CI until cleanup (§7.1)

- ROADMAP 5b choices: hand-written parser + grammar assist; external validator; **bidirectional flattening** (ADL2 only; see [`phase5b-deferred.md`](phase5b-deferred.md))

- Product decisions (2026-05-22): ADL2 only first; ADL 1.4 deferred; rules/invariants deferred; flattening bidirectional for editor tools



## Tasks



- [ ] 0.0 Create feature branch (optional — skip unless requested)

  - [ ] 0.1 `git checkout -b feature/phase5b-am-layer`



- [x] 1.0 Parser — critical correctness (MVP blockers)

  - [x] 1.1 Fix `collectDefinitionTokens()` premature stop (full definition body to cADL)

  - [x] 1.1b Fix `collectOdinTokens()` same premature stop (blocked definition section)

  - [x] 1.2 Dispatch `archetype` / `template` / `operational_template` at parse entry

  - [x] 1.3 Return typed `ADL2ParseResult` (`archetype` | `template` | `operational_template`)

  - [x] 1.4 Add parser tests for definition with `matches { }` and Archie `most_minimal` (no matches)

  - [x] 1.5 Map `original_language` from ODIN language section to `AUTHORED_RESOURCE`

  - [x] 1.6 Tokenizer: `?` / `X` in cADL date patterns (standalone + identifier)

  - [x] 1.7 Tokenizer: cADL interval bounds (`>=`, `<=`, `..<`, `|>`) + UTF-8 BOM skip



- [x] 2.0 Test harness — portable and accurate

  - [x] 2.1 Replace CI-absolute paths with repo-relative `test_data/` URLs

  - [x] 2.2 Fix Archie compatibility assertions (`archetype_id.value`, expected HRIDs from files)

  - [x] 2.3 Re-run parser + Archie tests; document pass/fail baseline (**85 pass / 0 fail**; Archie benchmark **8/8 = 100%**)



- [x] 3.0 cADL parser — constraint coverage (PRD P-1.4, P-1.7)

  - [x] 3.1 Parse `existence` and `cardinality` into `C_ATTRIBUTE` (not skip)

  - [x] 3.2 Parse primitive constraints (`C_PRIMITIVE_OBJECT` for `DV_*` leaf types)

  - [x] 3.3 Parse `ARCHETYPE_SLOT` and `use archetype` / includes-excludes

  - [x] 3.4 Fail on unknown tokens in attribute bodies (no silent skip)

  - [x] 3.5 Extend tests using `test_data/archie-tests/primitives/` (`archie_primitives.test.ts`)



- [x] 4.0 ODIN → AOM mapping (PRD P-1.5, P-1.6)

  - [x] 4.1 Map language section to archetype language fields

  - [x] 4.2 Map description to `RESOURCE_DESCRIPTION` (or equivalent)

  - [x] 4.3 Map `term_definitions` into `ARCHETYPE_ONTOLOGY`

  - [x] 4.4 Fix terminology round-trip test expectations



- [x] 5.0 Validation — PRD alignment

  - [x] 5.1 Rewrite `archie_validation.test.ts` to use real `C_*` / `OPERATIONAL_TEMPLATE` trees

  - [x] 5.2 Add `archetypePath` to `ValidationMessage` where applicable

  - [x] 5.3 Document/limitation: RM subtype check (exact `rm_type_name` until `RMInfo` plugin) — [`docs/VALIDATION_LIMITATIONS.md`](../docs/VALIDATION_LIMITATIONS.md)

  - [x] 5.4 Optional: `validateAgainstTemplate` on deserializers (V-2.4) — **done** (JSON / YAML / XML config)



- [x] 6.0 Serialization — round-trip fidelity (PRD S-1.x)

  - [x] 6.1 Serializer emits parsed terminology/language (not placeholders)

  - [x] 6.2 Round-trip tests: ADL2 → AOM → ADL2 structural equivalence

  - [x] 6.3 Document known non-lossless areas (comments, formatting) — [`docs/ADL2_ROUNDTRIP.md`](../docs/ADL2_ROUNDTRIP.md)



- [x] 7.0 Tooling and docs

  - [x] 7.1 Fix test TypeScript errors (`deno.ns`, fixture typing) or document `--no-check` (see Notes above)

  - [x] 7.2 Update PRD §2 / §9 status to match implementation (remove false ✅)

  - [x] 7.3 Add `tools/generate_from_antlr.ts` stub generator (PRD §5.3.2 hybrid) — optional



- [x] 8.0 Deferred / product decisions (see [`phase5b-deferred.md`](phase5b-deferred.md))

  - [x] 8.1 Template flattening engine — MVP bidirectional (`enhanced/am/`: flatten + `extractDifferentialDefinition`)

  - [x] 8.2 ADL 1.4 → ADL2 syntactic converter + `parseAdl()` — **done** ([`docs/ADL_SUPPORT.md`](../docs/ADL_SUPPORT.md))

  - [x] 8.3 Rules section parse/serialize/evaluate — **done** (`InvariantEvaluator`, `validateInvariants`)
  - [x] 8.5 Annotations + rm_overlay parse/serialize — **done**

  - [ ] 8.4 Archie validation parity benchmark (>95% vs Archie) — **8/8 parse = 100%** (`archie_benchmark.test.ts`)


