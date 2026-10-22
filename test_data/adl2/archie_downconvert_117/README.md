# ADL2 fixtures for Archie down-convert regression tests

Fixtures for issues #114–#117 and related ADL 1.4 serializer tests. Vendored so the suite runs on a fresh clone without an external `openehr-genomik-templates` checkout.

| File | Source / licence |
|------|------------------|
| `openEHR-EHR-CLUSTER.organisation.v1.0.4.adls` | ADL 1.4 `organisation.v1` from [openEHR/CKM-mirror](https://github.com/openEHR/CKM-mirror) (`local/archetypes/cluster/…`, revision 1.0.4), converted to id-coded ADL2 with [openEHR/archie](https://github.com/openEHR/archie) `ADL14Converter` (Apache 2.0). CKM archetype © openEHR Foundation, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). |
| `openEHR-EHR-CLUSTER.genomic_copy_number_variant-cancer.v1.0.0.adls` | Minimal stand-in (specialize, bilingual `sv`, `id1.1` overlay) derived from `template_export_123/openEHR-EHR-CLUSTER.analyte_demo-genomic.v1.0.0.adls` in this repo; preserves parser/serializer assertions from the genomics workspace drafts. |
| `openEHR-EHR-CLUSTER.variant_clinical_implication.v1.0.0.adls` | Same pattern as the cancer CNV stand-in; specialised archetype with `specialize` for round-trip coverage (#117). |

See also `test_data/adl2/ckm_roundtrip_127/` for the paired ADL 1.4 + ADL2 organisation files used in #127.
