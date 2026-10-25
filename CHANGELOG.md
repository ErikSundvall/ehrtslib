# Changelog

Notable changes per release, newest first. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

ehrtslib versions three artefacts independently. Headings are library versions (tags `vX.Y`, with patch `0` omitted) unless marked **demo** or **TAAAT**.

Add an entry under **Unreleased** in every PR that changes user-visible behaviour. The release PR renames that section to the new version. History before 0.1.0 is in git, not here.

## [Unreleased]

- Contribution builder phase 1: commit (`contributionBuilder.prepareContribution`, `ItsRestContributionAdapter`, [ADR 0010](docs/adr/0010-cb-commit-envelope-and-provenance.md)). Builds the REST ITS `NewContribution` body for validated drafts and sends it to `POST /ehr/{ehr_id}/contribution` on any conformant CDR (`fetch` and headers are injectable). A missing committer or composer, or a draft that fails validation, stops the commit before any request. The contribution audit carries `oplog sha256:<hex>` and the log URI. Each COMPOSITION gets a `FEEDER_AUDIT`. `originating_system_audit` comes from the caller; if it is missing, a placeholder is used and a warning is given (`silenceMissingOriginatingAudit` turns it off). `feeder_system_audit` holds the deploying organisation's system id, with builder name and version, log format and CRDT library in `other_details`. Codes are down-converted to ADL 1.4 (node ids, local value codes, `template_id`) by default ([#166](https://github.com/ErikSundvall/ehrtslib/issues/166)).
- `EHRTSLIB_VERSION` (`version.ts`, exported from `mod.ts`) gives the library version at runtime. `deno task release` keeps it equal to `deno.json`.
- `RMInstanceGenerator` no longer puts `archetype_node_id` on non-LOCATABLE types such as `EVENT_CONTEXT`, and fills `DV_CODED_TEXT.value` from the template term or the openEHR rubric. FLAT `ctx/category: "event"` next to `|code` keeps the value.
- Contribution builder phase 1: draft validation (`contributionBuilder.DraftValidator`, [ADR 0008](docs/adr/0008-cb-validation-and-lifecycle.md)). Validate a draft against its bound template in `complete` (lifecycle 532) or `incomplete` (553) mode. Incomplete mode lists missing template content without failing, but still fails on wrong values and on missing RM-required attributes (composer, `ENTRY.subject`). RM-level checks cover language, territory, category, composer and subject. Each problem carries the node's short key and uid, the instance path and the archetype path ([#165](https://github.com/ErikSundvall/ehrtslib/issues/165)).
- `TemplateValidator` matches sibling instances to constraints by node id before RM type, so a second `ELEMENT` under `items` is checked against its own constraint, not the first one. Messages about a missing node carry `constraintNodeId`.
- `RMInstanceGenerator` picks a value-set member (not the `ac` code) for a coded value, and a `DURATION` within the constraint's range.
- Contribution builder phase 1: core build and operation log (`contributionBuilder.ContributionBuild`, ADRs [0003](docs/adr/0003-cb-identity-and-uids.md) and [0004](docs/adr/0004-cb-operation-log-and-sync.md)). Start a COMPOSITION draft from a bound template, then change it only through logged operations (`set-value`, `add-instance`, `remove-instance`, `set-composer`) addressed by node uid. Each operation records author, replica, sequence and time. Inner LOCATABLE nodes get `<uuid>::<replica>.<n>` uids; the root's uid is left for commit. `exportLog` / `fromLog` round-trip a versioned log (`ehrtslib-cb-oplog` v1), and replay gives identical RM output ([#164](https://github.com/ErikSundvall/ehrtslib/issues/164)).
- Contribution builder phase 1: template binding (`contributionBuilder.bindTemplate`, [ADR 0007](docs/adr/0007-cb-template-binding.md)). A draft binds to an ADL2 operational template, or to an OPT 1.4 XML up-converted to ADL2 with id-codes (`parser.upconvertOpt14ToAdl2`). The binding records template id, version (ADL2 HRID, or OPT 1.4 `sem_ver`), a sha256 over the RFC 8785 form of ehrtslib's JSON for the template, and the serialisation version. `MD5-CAM-1.0.1`, `PARENT:MD5-CAM-1.0.1`, `build_uid` and `uid` are kept for information only. `checkTemplateBinding` reports a changed template id, version or hash as needing `migrate-template` (`TemplateBindingMismatchError`); a changed MD5-CAM or `build_uid` only warns ([#163](https://github.com/ErikSundvall/ehrtslib/issues/163)).

- **Breaking.** `buildWebTemplate` no longer accepts `defaultLanguage` or `language`. Pass `languages` (primary language first, then any additional languages for `localizedNames` / `localizedDescriptions` / `localizedLabels`). Omitting `languages` uses the template's original language only. Labels fall back per term from the primary language, through the other listed languages, to the original language. Node ids follow the primary language unless `idLanguage` is `"original"`. AQL paths stay on archetype ids. OPT 1.4 translations in `<ontology>` and `<component_ontologies>` are part of `availableTemplateLanguages` (original language first, then the rest in OPT order, codes kept as written). `applyOperationalTemplateTermScopes` stores inline `C_ARCHETYPE_ROOT` terms under the original language and no longer overwrites a translation when called with another language ([#159](https://github.com/ErikSundvall/ehrtslib/issues/159)).
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
