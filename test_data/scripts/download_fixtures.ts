/**
 * Download curated openEHR test fixtures from public upstream repos.
 * Run: deno run --allow-net --allow-write test_data/scripts/download_fixtures.ts
 */
const ARCHIE_BASE =
  "https://raw.githubusercontent.com/openEHR/archie/master/tools/src/test/resources/adl2-tests";
const ADL_ARCHETYPES_BASE =
  "https://raw.githubusercontent.com/openEHR/adl-archetypes/master";
const SDK_OPT_BASE =
  "https://raw.githubusercontent.com/ehrbase/openEHR_SDK/develop/test-data/src/main/resources/operationaltemplate";

const ROOT = new URL("../", import.meta.url);

type Fixture = { url: string; dest: string };

const fixtures: Fixture[] = [
  // Archie ADL2 flattening regression set (source templates, not pre-built OPT2)
  ...[
    "openEHR-EHR-CLUSTER.lab_test_panel-lipid_studies.v1.0.0.adls",
    "openEHR-EHR-CLUSTER.lab_test_panel.v1.0.0.adls",
    "openEHR-EHR-INSTRUCTION.request-pathology_test.v1.0.0.adls",
    "openEHR-EHR-INSTRUCTION.request.v1.0.0.adls",
    "openEHR-EHR-OBSERVATION.flat_test_parent_1-add_node_use_node.v1.0.0.adls",
    "openEHR-EHR-OBSERVATION.flat_test_parent_1.v1.0.0.adls",
    "openEHR-EHR-OBSERVATION.flattening_parent_1.v1.0.0.adls",
    "openEHR-EHR-OBSERVATION.override_to_multiple.v1.0.0.adls",
    "openEHR-EHR-OBSERVATION.override_to_single_add.v1.0.0.adls",
    "openEHR-EHR-OBSERVATION.override_to_single_replace.v1.0.0.adls",
  ].map((name) => ({
    url: `${ARCHIE_BASE}/features/flattening/${name}`,
    dest: `archie-tests/flattening/${name}`,
  })),

  // Archie ADL2 template validity fixtures
  ...[
    "openEHR-EHR-COMPOSITION.base.adls",
    "openEHR-EHR-COMPOSITION.t_invalid_overlay_parent.v1.0.0.adls",
    "openEHR-EHR-COMPOSITION.t_non_existent_ext_ref.v1.0.0.adls",
    "openEHR-EHR-OBSERVATION.non_existent_parent.adls",
  ].map((name) => ({
    url: `${ARCHIE_BASE}/validity/templates/${name}`,
    dest: `archie-tests/validity-templates/${name}`,
  })),

  // openEHR/adl-archetypes single-file ADL2 template examples
  ...[
    "openEHR-DEMOGRAPHIC-PERSON.t_patient_ds_sf.v1.0.0.adls",
    "openEHR-EHR-COMPOSITION.t_clinical_info_ds_sf.v1.0.0.adls",
    "openEHR-EHR-SECTION.t_patient_event_info_ds_sf.v1.0.0.adls",
    "openEHR-EHR_EXTRACT-EXTRACT.t_basic_discharge_summary_sf.v1.0.0.adls",
  ].map((name) => ({
    url: `${ADL_ARCHETYPES_BASE}/Example/openEHR/single_file_template/templates/${name}`,
    dest: `adl2/templates/${name}`,
  })),

  // ehrbase/openEHR_SDK ADL 1.4 XML operational templates (legacy OPT, widely deployed)
  ...[
    "ehrbase_blood_pressure_simple.de.v0.opt",
    "conformance_ehrbase.de.v0.opt",
    "ips.v0.opt",
    "GECCO_Diagnose.opt",
    "test-ism.vitagroup.de.v1.opt",
    "minimal_evaluation.opt",
    "minimal_instruction.opt",
    "minimal_action2.opt",
    "RIPPLE-Conformance Test.opt",
    "Test_all_types.opt",
    "section_cardinality.opt",
    "nested.en.v1.opt",
    "language_test.opt",
    "duration_validation.opt",
    "constrain_test.opt",
    "ehrbase_multi_occurrence.de.opt",
    "IDCR - Problem List.v1.opt",
    "IDCR - Laboratory Test Report.v0.opt",
    "Virologischer Befund.opt",
    "aql_example.opt",
  ].map((name) => ({
    url: `${SDK_OPT_BASE}/${encodeURIComponent(name)}`,
    dest: `opt14/${name}`,
  })),
];

async function download(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${res.status} ${url}`);
  }
  const text = await res.text();
  const file = new URL(destPath, ROOT);
  const filePath = fromFileUrl(file);
  await Deno.mkdir(filePath.replace(/[^/\\]+$/, ""), { recursive: true });
  await Deno.writeTextFile(filePath, text);
  console.log(`OK ${destPath}`);
}

function fromFileUrl(url: URL): string {
  let p = decodeURIComponent(url.pathname);
  if (Deno.build.os === "windows" && p.startsWith("/")) p = p.slice(1);
  return p;
}

let failed = 0;
for (const { url, dest } of fixtures) {
  try {
    await download(url, dest);
  } catch (e) {
    console.error(`FAIL ${dest}: ${e}`);
    failed++;
  }
}

console.log(`\nDone: ${fixtures.length - failed}/${fixtures.length} downloaded`);
if (failed > 0) Deno.exit(1);
