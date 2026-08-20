# Inconsistencies log

Spec vs implementation notes for ehrtslib maintainers. Add an entry when a deliberate divergence or open ambiguity is discovered.

---

## TemplateValidator — exact RM type match (open)

- **Class / area:** `TemplateValidator` vs RM inheritance
- **Nature:** Instance type must equal `C_OBJECT.rm_type_name` string; subtypes (e.g. `DV_CODED_TEXT` under `DV_TEXT`) are rejected
- **Sources:** openEHR AM validation expectations; Archie `RMObjectValidator` is more inheritance-aware
- **ehrtslib choice:** Exact match for MVP; `meta` already exposes `isSubtypeOf` for a follow-up
- **See:** [VALIDATION_LIMITATIONS.md](../VALIDATION_LIMITATIONS.md)

## ValidationMessage.archetypePath uses RM JSON paths (open)

- **Class / area:** Validation diagnostics
- **Nature:** Messages carry JSON/RM paths, not ADL constraint paths
- **ehrtslib choice:** Temporary until `C_ATTRIBUTE` path tracking exists
- **See:** [VALIDATION_LIMITATIONS.md](../VALIDATION_LIMITATIONS.md)

## Annotations / rm_overlay mapping (partial)

- **Class / area:** ADL2 parse/serialize
- **Nature:** ODIN annotation and `rm_overlay` trees are stored and re-serialized; typed field mapping is incomplete
- **ehrtslib choice:** Preserve ODIN blob for round-trip; defer full overlay object model
- **See:** [ADL2_ROUNDTRIP.md](../ADL2_ROUNDTRIP.md)

## Dual type registration (documented)

- **Class / area:** `openehr_base` `registerType` / `instance_of` vs `serialization/common/TypeRegistry`
- **Nature:** Two registries serve RM identity vs serialization type inference
- **ehrtslib choice:** Keep both; document which to use for validation vs (de)serialize
- **See:** [serialization/README.md](../../serialization/README.md)

## Archetype-local at-codes vs flat ontology (documented)

- **Class / area:** OPT XML parse, Web Template, `OptXmlSerializer`, `RMInstanceGenerator`
- **Nature:** `at0001` (and other at-codes) collide across inlined archetypes. A merged `ontology.term_definitions` map keyed only on at-code last-wins. `instanceof C_COMPLEX_OBJECT` also matches `C_ARCHETYPE_ROOT` (subclass), so serializers must test the subclass first.
- **ehrtslib choice:** Attach `term_archetype_scope` and `archetype_term_definitions` on OPT XML parse (same as ADL/`.t.json` flattening). Generator and `buildWebTemplate` look up through that index. `OptXmlSerializer` emits `C_ARCHETYPE_ROOT` plus per-root `term_definitions`. The flat ontology map is kept for backward compatibility and is not a reliable node-name dictionary.
- **See:** [ADL_SUPPORT.md](../ADL_SUPPORT.md#terminology-lookup-at0001-is-not-global), [SIMPLIFIED_FORMATS.md](../SIMPLIFIED_FORMATS.md#limitations)
