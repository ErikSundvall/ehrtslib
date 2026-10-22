/**
 * Vendored ADL2 fixtures for #114–#117 / #127 (see test_data/adl2/archie_downconvert_117).
 */
import { fromFileUrl } from "https://deno.land/std@0.220.0/path/mod.ts";

const ARCHIE_DOWNCONVERT = new URL(
  "../../adl2/archie_downconvert_117/",
  import.meta.url,
);
const CKM_ROUNDTRIP = new URL("../../adl2/ckm_roundtrip_127/", import.meta.url);

function fixture(base: URL, name: string): string {
  return fromFileUrl(new URL(name, base));
}

export const ORGANISATION_ADL2_V104 = fixture(
  ARCHIE_DOWNCONVERT,
  "openEHR-EHR-CLUSTER.organisation.v1.0.4.adls",
);

export const GENOMIC_CNV_CANCER_ADL2 = fixture(
  ARCHIE_DOWNCONVERT,
  "openEHR-EHR-CLUSTER.genomic_copy_number_variant-cancer.v1.0.0.adls",
);

export const VARIANT_CLINICAL_IMPLICATION_ADL2 = fixture(
  ARCHIE_DOWNCONVERT,
  "openEHR-EHR-CLUSTER.variant_clinical_implication.v1.0.0.adls",
);

export const ORGANISATION_ADL14_V1 = fixture(
  CKM_ROUNDTRIP,
  "openEHR-EHR-CLUSTER.organisation.v1.adl",
);

export const ORGANISATION_ADL2_V104_CKM = fixture(
  CKM_ROUNDTRIP,
  "openEHR-EHR-CLUSTER.organisation.v1.0.4.adls",
);

/** All ADL2 files used by the #117 down-convert regression. */
export const ARCHIE_DOWNCONVERT_FIXTURES = [
  ORGANISATION_ADL2_V104,
  VARIANT_CLINICAL_IMPLICATION_ADL2,
  GENOMIC_CNV_CANCER_ADL2,
] as const;
