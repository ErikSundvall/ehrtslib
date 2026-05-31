# Product Requirements Document: Phase 6b — Full ADL 1.x Round-Trip Support

**Version:** 1.0  
**Date:** 2026-05-29  
**Status:** Draft for review  
**Project:** ehrtslib — TypeScript/Deno openEHR implementation  
**Related:** [ROADMAP.md](../ROADMAP.md#phase-6b), [docs/ADL_SUPPORT.md](../docs/ADL_SUPPORT.md), [test_data/README.md](../test_data/README.md)

---

## 1. BMM baseline refresh (prerequisite)

Before extending ADL 1.x round-trip behaviour, align ehrtslib’s generated AM/RM/BASE/LANG/TERM types with the **latest published BMM artefacts** so parsers and serializers target current specification semantics.

### 1.1 Current ehrtslib BMM pins

From [`tasks/bmm_versions.json`](../tasks/bmm_versions.json) (sebastian-iancu/code-generator JSON exports):

| Package | Pinned version | Source |
|---------|----------------|--------|
| openehr_am | 2.4.0 | code-generator BMM-JSON |
| openehr_base | 1.3.0 | code-generator BMM-JSON |
| openehr_rm | 1.2.0 | code-generator BMM-JSON |
| openehr_lang | 1.1.0 | code-generator BMM-JSON |
| openehr_term | 3.1.0 | code-generator BMM-JSON |

### 1.2 Authoritative BMM sources to survey

| Repository | Role | Latest observed |
|------------|------|-----------------|
| [openEHR/specifications-ITS-BMM](https://github.com/openEHR/specifications-ITS-BMM) | Official ODIN BMM schemas (`components/*/Release-*`, `components/*/latest`) | AM Release-2.3.0; RM `latest/` split files |
| [sebastian-iancu/code-generator](https://github.com/sebastian-iancu/code-generator/tree/master/code/BMM-JSON) | JSON BMM exports used by ehrtslib codegen | AM 2.4.0 (newer than ITS-BMM AM 2.3.0 ODIN) |
| [openEHR/archie](https://github.com/openEHR/archie) | Runtime reference; BMM 2.2 + P_BMM 2.3.0 | Embedded in `BuiltinReferenceModels` |

### 1.3 Required survey tasks (Phase 0)

1. **Inventory** all component releases in `specifications-ITS-BMM/components/{AM,RM,BASE,LANG,PROC,TERM}/` and compare schema_id / version metadata to code-generator JSON filenames.
2. **Diff** ehrtslib’s pinned JSON BMMs against newest code-generator exports (reuse [`tasks/compare_bmm_versions.ts`](../tasks/compare_bmm_versions.ts), [`tasks/get_latest_bmm_versions.ts`](../tasks/get_latest_bmm_versions.ts)).
3. **Decide ingestion path:**
   - **Option A (recommended):** Continue JSON codegen from code-generator when JSON is ahead of ODIN in ITS-BMM (current AM case).
   - **Option B:** Add ODIN→JSON conversion pipeline from ITS-BMM for components without code-generator JSON (future-proofing).
4. **Regenerate** `generated/` and reconcile `enhanced/` AM classes if AM 2.4.x (or newer RM/BASE) introduces attributes needed for ADL 1.4 OPT/OET handling (e.g. legacy OPT XML binding types if modelled in AM).
5. **Document** chosen versions in `tasks/bmm_versions.json` and [`README-FOR-LIB-MAINTENANCE.md`](../README-FOR-LIB-MAINTENANCE.md).

### 1.4 Success criteria for BMM refresh

- Pin rationale recorded (why AM 2.4.0 JSON vs AM 2.3.0 ODIN, etc.).
- Codegen + tests pass after any bump.
- No silent drift between AM object model used by ADL2 parser and BMM-generated TypeScript types.

---

## 2. Background and motivation

### 2.1 Problem statement

ehrtslib’s primary investment is **ADL 2 / AOM 2** (parse, serialize, flatten to OPT2, validate). However, the **operational ecosystem** still largely runs on **ADL 1.4** artefacts:

- **Operational templates** in production are predominantly **ADL 1.4 XML OPT** files, not ADL2 OPT2 text.
- **CKM** publishes mostly ADL 1.4 archetypes and OET source templates; ADL2 exports are limited and tooling support is uneven.
- **Better Archetype Designer** (primary community authoring tool) works internally with AOM2 but commonly **imports/exports ADL 1.4**; raw ADL2 downloads from CKM often **fail to open** in desktop tooling or require conversion workflows users do not have locally.
- **No substantial public bank of ADL2 operational templates** exists: Archie and adl-archetypes provide **source** `.adls` templates (~14 curated examples now in `test_data/`), while the largest ready-made OPT corpus is **ehrbase/openEHR_SDK** (~54 **ADL 1.4 XML** files — 20 curated into `test_data/opt14/`).

Without credible ADL 1.x round-trip support, ehrtslib cannot:

- Validate against real-world OPT fixtures and CKM-era templates.
- Cross-check behaviour with Archetype Designer and ehrbase tooling.
- Offer a practical test loop while ADL2 OPT2 adoption matures.

### 2.2 Investigation summary (2026-05-29)

| Corpus | ADL version | Operational? | Scale | Usable for ehrtslib today |
|--------|-------------|--------------|-------|---------------------------|
| Archie `adl2-tests` | ADL 2 source | No (flatten in tests) | ~270 `.adls` | Yes — parser/flattening |
| openEHR/adl-archetypes Example templates | ADL 2 source | No | 4 templates | Yes — downloaded |
| ehrbase/openEHR_SDK OPT | ADL 1.4 XML | **Yes** | ~54 `.opt` | Yes — 20 in `test_data/opt14/` |
| CKM-mirror | ADL 1.4 `.adl`/`.oet` | OET source only | 44 `.oet` | Clone externally |
| Public ADL2 OPT2 banks | ADL 2 | **Yes** | **None found at scale** | Generate via flattener |

**Conclusion:** Proceed with **full ADL 1.x round-trip** as the pragmatic validation path; keep ADL2 as the strategic authoring format.

### 2.3 Relationship to existing work

Phase 5b delivered:

- Syntactic ADL 1.4 → ADL 2 conversion before parse ([`enhanced/parser/adl14_to_adl2_converter.ts`](../enhanced/parser/adl14_to_adl2_converter.ts))
- ADL 2 serialize path for archetypes/templates/operational templates
- MVP flattening and template validation

Phase 6b extends this to **faithful ADL 1.4 semantics**, **legacy OPT/OET**, and **round-trip fidelity** suitable for regression against external tooling.

---

## 3. Overview

Implement **full round-trip support for ADL 1.x family artefacts** (ADL 1.4 archetypes, OET source templates, XML operational templates) so ehrtslib can ingest, transform, validate, and emit formats that interoperate with Archetype Designer, CKM exports, and ehrbase — while retaining ADL 2 as the internal canonical model where possible.

**Goal:** A developer can load a CKM ADL 1.4 archetype or ehrbase OPT, validate/generate instances, and export ADL 1.4/OET/OPT XML that opens in legacy tools without manual repair.

---

## 4. Goals

1. **Parse ADL 1.4 archetypes and OET templates** into AOM with semantic fidelity (not only syntactic pre-conversion).
2. **Parse ADL 1.4 XML operational templates** into an internal operational template model usable for validation and instance generation.
3. **Serialize back to ADL 1.4** (archetype `.adl`, OET) with stable, diff-minimal output on round-trip fixtures.
4. **Convert between legacy OPT XML and internal operational model** (and optionally to/from ADL2 OPT2 via existing flattener).
5. **Regression suite** using `test_data/adl14/`, `test_data/opt14/`, expandable CKM-mirror subsets, and Archie JVM cross-checks where feasible.
6. **Document** supported conversions, known limits, and tooling compatibility (BAD, ehrbase, AWB).

---

## 5. User stories

1. **As a library maintainer**, I want to run round-trip tests on ADL 1.4 archetypes from CKM so I know our parser matches community artefacts.
2. **As a demo app user**, I want to paste an ehrbase OPT into the Template tab and generate example instances validated against that template.
3. **As a modeller**, I want to export an archetype edited via ehrtslib as ADL 1.4 that opens in Archetype Designer without syntax errors.
4. **As an integrator**, I want to load OET + referenced archetypes and produce the same operational constraints as legacy OPT XML.
5. **As a tester**, I want a documented fixture refresh script and manifest so CI can pin upstream commits.

---

## 6. Functional requirements

### 6.1 ADL 1.4 archetype semantics

1. The system must complete **deep AOM migration** for ADL 1.4 inputs: ac-code / value_sets reshaping, `constraint_definitions` merge into term tables, tuple syntax for quantities/ordinals where present.
2. The system must **serialize AOM to ADL 1.4** preserving at-codes, flat specialisation copies where required by 1.4, and terminology shape expected by CKM/BAD.
3. The system must expose `detectedVersion`, `convertedFrom14`, and round-trip diff metrics in test APIs.
4. The system should use [openEHR ADL 1.4→2 conversion guide](https://specifications.openehr.org/releases/AM/development/ADL2.html) and Archie/AWB behaviour as reference (external JVM optional).

### 6.2 OET (ADL 1.4 template source)

5. The system must parse **OET XML** template definitions (CKM-mirror format) into template AOM.
6. The system must resolve archetype references from a **file-based repository** (directory of `.adl` files).
7. The system must apply the **narrowing principle** when validating template constraints against archetypes.
8. The system must serialize OET XML for round-trip on a curated fixture set (≥10 templates from CKM-mirror).

### 6.3 Legacy operational templates (OPT XML)

9. The system must parse **ADL 1.4 XML OPT** (`OPERATIONALTEMPLATE`) into internal operational template representation.
10. The system must support validation of RM instances against parsed OPT XML (reuse `TemplateValidator` pipeline).
11. The system must serialize OPT XML for round-trip on `test_data/opt14/` subset (target ≥15/20 byte-stable or semantically equivalent per normalisation rules).
12. The system should map OPT XML ↔ ADL2 OPT2 where flattening pipeline allows (document gaps).

### 6.4 Conversion matrix

| From | To | Priority |
|------|-----|----------|
| ADL 1.4 `.adl` | AOM 2 (internal) | P0 — extend existing converter |
| AOM 2 | ADL 1.4 `.adl` | P0 |
| OET + archetypes | AOM template | P1 |
| OET + archetypes | OPT XML | P1 |
| OPT XML | AOM operational | P0 |
| OPT XML | ADL2 OPT2 | P2 |
| ADL2 template | OPT XML (down-convert) | P2 |

### 6.5 Tooling and fixtures

13. Add `test_data/oet14/` curated subset (≥5 OET from CKM-mirror) with manifest URLs.
14. Extend `test_data/scripts/download_fixtures.ts` to fetch OET and additional ADL 1.4 `.adl` samples.
15. Add optional CI job that clones Archie and compares parse/validation results for shared fixtures (non-blocking initially).

---

## 7. Non-goals (out of scope)

- Replacing Archetype Designer or CKM as authoring systems.
- Full CKM API integration or live template sync.
- Implementing id-coded ADL2 as primary path (openEHR RM uses at-coded).
- Bundling entire CKM-mirror or adl-archetypes repos into git.
- JVM Archie as a runtime dependency (optional external benchmark only).
- Web Template JSON generation (separate Phase 7b scope).

---

## 8. Design considerations

### 8.1 Internal canonical model

Keep **AOM 2 / operational template** as the internal hub:

```
ADL1.4 .adl ──► AOM2 ◄── ADL2 .adls
OET XML ──────► AOM2 template
OPT XML ──────► OperationalTemplate (AOM2)
                    │
                    ├──► validate RM instances
                    ├──► serialize ADL1.4 / OET / OPT XML
                    └──► serialize ADL2 / OPT2
```

### 8.2 Serializer normalisation

Round-trip tests should allow **semantic equivalence** (ordering, whitespace, redundant sections) via normalised comparison — document rules like existing ADL2 tests.

### 8.3 Archetype Designer compatibility

BAD exports ADL 1.4 with flat specialisations. Serializers must emit constructs BAD accepts (avoid ADL2-only constructs in 1.4 output). Document known CKM ADL2 export issues separately (may require AWB conversion, not ehrtslib).

### 8.4 Module layout (suggested)

- `enhanced/parser/adl14/` — deep parse helpers, OET/OPT XML parsers
- `enhanced/serializer/adl14/` — ADL 1.4 and XML emitters
- `enhanced/am/legacy/` — 1.4-specific AOM transforms
- `tests/adl14/` — round-trip and fixture tests

---

## 9. Technical considerations

- **Dependencies:** Prefer zero new runtime deps; XML via existing `fast-xml-parser` where needed.
- **BMM:** AM package must reflect OPT/OET-related classes after §1 refresh.
- **Performance:** Reuse Phase 5 targets (<100ms parse typical archetype) for 1.4 paths.
- **Reference implementations:** openEHR/archie (OPT/OET Java), openEHR_SDK `opt-1.4` module, ADL Workbench for difficult legacy artefacts.
- **Specs:** AM ADL 1.4, OET syntax guide (`openehr://guides/templates/oet-syntax`), OPT 1.4 XML schema (legacy), AM2 OPT2 for forward path.

---

## 10. Success metrics

| Metric | Target |
|--------|--------|
| ADL 1.4 archetype round-trip | ≥90% of curated CKM/Archie adl14 fixtures semantically equivalent |
| OPT XML parse | 20/20 files in `test_data/opt14/` parse without error |
| OPT-backed instance validation | ≥5 templates validate example instances (manual or generated) |
| BAD open test | ≥3 ehrtslib-exported ADL 1.4 files open in Archetype Designer without manual fix |
| Documentation | ADL_SUPPORT.md updated with 1.4 round-trip matrix and fixture guide |

---

## 11. Implementation phases

### Phase 0 — BMM refresh (§1)
Survey, pin, regenerate, test.

### Phase 1 — Deep ADL 1.4 archetype migration
Extend converter; ADL 1.4 serializer; expand `test_data/adl14/`; round-trip tests.

### Phase 2 — OPT XML ingest
Parser for `test_data/opt14/`; hook to `TemplateValidator`; instance validation demo.

### Phase 3 — OET support
OET parser; archetype repo; flatten to operational; CKM-mirror fixture subset.

### Phase 4 — Cross-format and tooling
OPT ↔ ADL2 OPT2 where feasible; BAD compatibility pass; optional Archie benchmark script.

---

## 12. Open questions

1. **OET XML schema version:** Single CKM export variant or multiple historical schemas?
2. **OPT XML normalisation:** Byte-identical round-trip vs semantic — which do ehrbase consumers require?
3. **CKM licence:** Confirm redistribution terms for bundled OET/adl fixtures beyond Apache-licensed upstreams.
4. **AM BMM 2.4 vs 2.3:** Is code-generator 2.4.0 JSON authoritative over ITS-BMM 2.3.0 ODIN for ehrtslib?
5. **Demo app scope:** Should Template tab accept OPT XML only, or also OET + archetype folder upload?

---

## 13. References

- [OPT2 digest](https://specifications.openehr.org/releases/AM/development/OPT2.html) — ADL2 operational form (compiled, not authored)
- [ADL2 spec — evolution from 1.4](https://specifications.openehr.org/releases/AM/development/ADL2.html)
- [openEHR/specifications-ITS-BMM](https://github.com/openEHR/specifications-ITS-BMM)
- [ehrbase/openEHR_SDK operational templates](https://github.com/ehrbase/openEHR_SDK/tree/develop/test-data/src/main/resources/operationaltemplate)
- [openEHR/archie adl2-tests](https://github.com/openEHR/archie/tree/master/tools/src/test/resources/adl2-tests)
- [Archetype tooling overview (Discourse)](https://discourse.openehr.org/t/draft-archetype-authoring-tools-openehr-tooling-overview-series/16860)
- ehrtslib: [`docs/ADL_SUPPORT.md`](../docs/ADL_SUPPORT.md), [`tasks/prd-phase5a-am-implementation.md`](prd-phase5a-am-implementation.md)
