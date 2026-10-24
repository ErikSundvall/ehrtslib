# Changelog

Notable changes per release, newest first. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

ehrtslib versions three artefacts independently. Headings are library versions (tags `vX.Y`, with patch `0` omitted) unless marked **demo** or **TAAAT**.

Add an entry under **Unreleased** in every PR that changes user-visible behaviour. The release PR renames that section to the new version. History before 0.1.0 is in git, not here.

## [Unreleased]

- OPT2 keeps the definition when a language filter is applied, emits ADL2 leaf constraints (`DV_QUANTITY`, code phrases, strings, durations, ordinals) and `allow_archetype` slots, and writes a balanced `use_archetype` root with id-codes. Value-set at-codes and ac-codes stay value codes ([#157](https://github.com/ErikSundvall/ehrtslib/issues/157)).
- OPT 1.4 export synthesises a term for a locatable node whose ADL2 terminology has none (`ITEM_TREE` → "Tree", `HISTORY` → "History", `ITEM_LIST` → "List", `CLUSTER` → "Cluster") and warns. The openEHR Java SDK web-template parser requires a term for every node id ([#145](https://github.com/ErikSundvall/ehrtslib/issues/145)).
- OPT 1.4 keeps a local value set as `local` at-codes and writes the external mappings as `term_bindings`, so the value-set texts stay available. Substitution is limited to synthetic `at9xxx` placeholders unless `substituteBoundValueSets` is set. OBO PURLs export as a CURIE (`SO:0001583`) ([#147](https://github.com/ErikSundvall/ehrtslib/issues/147)).
- OPT 1.4 and ADL 1.4 export accept versioned terminology URIs `http(s)://<host>/ver/<version>/id/<code>` (the CKM form for LOINC and SNOMED CT). The version stays on the terminology id as `LOINC(2.65)` ([#146](https://github.com/ErikSundvall/ehrtslib/issues/146)).
- OPT 1.4 and ADL 1.4 export keep term bindings that are FHIR code-system URIs (`…#code`) or OBO PURLs (`…/obo/<PREFIX>_<id>`), as well as `[terminology::code]` and `http(s)://<host>/id/<code>`. A binding that cannot be mapped is omitted with a warning. ADL 1.4 writes `term_bindings`, and `ac`-coded targets go to `constraint_bindings` ([#141](https://github.com/ErikSundvall/ehrtslib/issues/141)).
- OPT 1.4 export keeps a `term_definitions` entry for every locatable node, including structural `ITEM_TREE` and `HISTORY` nodes. ADL 1.4 → ADL2 conversion uses the 0-based to 1-based shift (`at0000` ↔ `id1`) and no longer treats an indented `description` key as a section break ([#142](https://github.com/ErikSundvall/ehrtslib/issues/142)).
- ODIN URI values accept RFC 3986 fragments and query strings, so ADL2 terminology bindings such as FHIR CodeSystem URIs load ([#133](https://github.com/ErikSundvall/ehrtslib/issues/133)).
- Differential paths through `description` (and other attribute names that are also ADL section keywords) resolve. A specialised code in the path redefines the node it addresses. The constraint is kept in the flattened template and in the OPT 1.4 export ([#134](https://github.com/ErikSundvall/ehrtslib/issues/134)).
- OET 1.4 cannot carry a new local coded-text value set. Those element paths are returned on `optOnlyValuePaths` and named in the export warnings; the OPT 1.4 export is the complete artefact ([#135](https://github.com/ErikSundvall/ehrtslib/issues/135)). Documented in `docs/ADL_SUPPORT.md`.
- Finished roadmap phases moved to `docs/maintainers/roadmap-archive.md`. This changelog is the place for user-visible notes ([#136](https://github.com/ErikSundvall/ehrtslib/issues/136)).

## [0.5.1] - 2026-10-20

- Canonical-strict JSON registers BASE types ([#132](https://github.com/ErikSundvall/ehrtslib/pull/132)).

## [0.5.0] - 2026-10-19

- ADL2 templates export to OPT 1.4 and OET 1.4, including the multilingual repeated-archetype workaround ([#123](https://github.com/ErikSundvall/ehrtslib/pull/123)).
- Spec-aligned id/at code mapping, and collision renumbering at the same specialisation level ([#126](https://github.com/ErikSundvall/ehrtslib/pull/126), [#127](https://github.com/ErikSundvall/ehrtslib/issues/127), [#116](https://github.com/ErikSundvall/ehrtslib/issues/116)).
- cADL accepts RM attribute names that collide with section keywords, Archie cardinality and slots, dotted specialised codes, and treats an empty definition as a hard error ([#113](https://github.com/ErikSundvall/ehrtslib/issues/113), [#114](https://github.com/ErikSundvall/ehrtslib/issues/114)).
- ADL 1.4 serializer round-trip: `concept`, `language`, `specialize`, ontology quoting, and value sets ([#115](https://github.com/ErikSundvall/ehrtslib/issues/115), [#117](https://github.com/ErikSundvall/ehrtslib/issues/117)).
- OPT2 serializer, with component terminologies and OPT2-friendly cADL roots ([#130](https://github.com/ErikSundvall/ehrtslib/issues/130)).

## [0.4.2] - 2026-10-09

- Inlined Better template terms are scoped by template id ([#111](https://github.com/ErikSundvall/ehrtslib/pull/111)).

## [0.4.1] - 2026-10-09

- Release notes list a jsDelivr import beside each runtime bundle ([#109](https://github.com/ErikSundvall/ehrtslib/pull/109)).

## [0.4.0] - 2026-10-08

- Packed library source, development docs, and runtime bundles ([#107](https://github.com/ErikSundvall/ehrtslib/pull/107)).
- ISO 8601 values use Deno's built-in `Temporal` ([#100](https://github.com/ErikSundvall/ehrtslib/pull/100)).
- RM and BASE class invariants are checked from the BMM catalogue ([#102](https://github.com/ErikSundvall/ehrtslib/pull/102)).
- Nested Better templates referenced by template id are flattened ([#101](https://github.com/ErikSundvall/ehrtslib/pull/101)).
- openEHR terminology XML is parsed without `deno_dom` ([#99](https://github.com/ErikSundvall/ehrtslib/pull/99)).
- **demo** `demo-v0.2.1` and **TAAAT** `taaat-v0.2.1`: recommended-release notice.

## [0.3.1] - 2026-10-08

- Recommended library, demo, and TAAAT tags pinned for the version notice.
- **demo** `demo-v0.2` and **TAAAT** `taaat-v0.2`.

## [0.3.0] - 2026-10-08

- Model classes regenerated from the openEHR-hosted BMM JSON. Classic BMM 2 names removed from the hand-written API ([#92](https://github.com/ErikSundvall/ehrtslib/pull/92)).
- **TAAAT**: clinical template node names in the outline ([#94](https://github.com/ErikSundvall/ehrtslib/pull/94)).

## [0.2.0] - 2026-09-16

- BMM import aligned with ITS-BMM, and model classes updated.

## [0.1.0] - 2026-09-16

- First library tag.
- **demo** `demo-v0.1`: format converter, including the template-workspace conversion fix ([#86](https://github.com/ErikSundvall/ehrtslib/pull/86)).
- **TAAAT** `taaat-v0.1`: outline explorer, original-language copy, download, and optional GitHub commit-back ([#85](https://github.com/ErikSundvall/ehrtslib/pull/85), [#87](https://github.com/ErikSundvall/ehrtslib/pull/87), [#88](https://github.com/ErikSundvall/ehrtslib/pull/88)).
