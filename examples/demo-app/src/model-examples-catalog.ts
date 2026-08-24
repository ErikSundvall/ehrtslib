/**
 * Curated clinical-model sources for the demo AD@git / template tabs.
 * Ehrlibs entries are listed first; other mirrors remain available.
 */

export type ModelExampleEntry = {
  id: string;
  label: string;
  /** GitHub blob or raw URL to a Better Archetype Designer `.t.json` */
  githubUrl: string;
  /**
   * Optional published Web Template JSON (raw URL). Preferred schema for
   * FLAT/STRUCTURED instance presets — node ids match Better/EHRbase export.
   */
  webTemplateUrl?: string;
  /** Prefer for default URL / featured picker placement */
  featured: boolean;
  source: string;
  description?: string;
};

/** Primary demo models — [Ehrlibs/openEHR-model-examples](https://github.com/Ehrlibs/openEHR-model-examples) */
export const MODEL_EXAMPLE_CATALOG: ModelExampleEntry[] = [
  {
    id: "accident-report-vitals",
    label: "Accident report + vital signs (Ehrlibs)",
    githubUrl:
      "https://github.com/Ehrlibs/openEHR-model-examples/blob/main/local/theme-packs/sport-event-details/templates/Accident%20report%20including%20vital%20signs.t.json",
    webTemplateUrl:
      "https://raw.githubusercontent.com/Ehrlibs/openEHR-model-examples/main/local/theme-packs/sport-event-details/templates/Accident%20report%20including%20vital%20signs.wt.json",
    featured: true,
    source: "Ehrlibs/openEHR-model-examples",
    description:
      "Encounter composition with problem/diagnosis, sport-event cluster, and vital signs (pulse oximetry, respiration, pulse).",
  },
  {
    id: "accident-report-vitals-sv",
    label: "Accident report + vital signs, Swedish (Ehrlibs)",
    githubUrl:
      "https://github.com/Ehrlibs/openEHR-model-examples/blob/main/local/theme-packs/sport-event-details/templates/Accident%20report%20including%20vital%20signs.sv.t.json",
    webTemplateUrl:
      "https://raw.githubusercontent.com/Ehrlibs/openEHR-model-examples/main/local/theme-packs/sport-event-details/templates/Accident%20report%20including%20vital%20signs.sv.wt.json",
    featured: true,
    source: "Ehrlibs/openEHR-model-examples",
    description: "Same template with Swedish localisation overlays.",
  },
  {
    id: "simple-diagnose-and-vitals",
    label: "Simple diagnose and vitals (Ehrlibs)",
    githubUrl:
      "https://github.com/Ehrlibs/openEHR-model-examples/blob/main/local/theme-packs/simple-diagnose-and-vitals/simple-diagnose-and-vitals.t.json",
    featured: false,
    source: "Ehrlibs/openEHR-model-examples",
    description:
      "Differential-overlay .t.json (empty overlay termDefinitions). AD@git closure fetches TEMPLATE_OVERLAY parent archetypes so node names are ontology texts rather than at-codes. Contrast with the snapshot Accident report model above.",
  },
  {
    id: "mdt-lung",
    label: "MDT Lung cancer (Region Stockholm)",
    githubUrl:
      "https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek/blob/MultiDiciplinery_Tumor_meetings/local/Diagnostic_MDT_Lung_cancer.t.json",
    featured: false,
    source: "regionstockholm/CKM-mirror-via-modellbibliotek",
    description: "Larger multidisciplinary tumour-board template set.",
  },
];

export const DEFAULT_MODEL_EXAMPLE_ID = "accident-report-vitals";

export function getModelExample(
  id: string = DEFAULT_MODEL_EXAMPLE_ID,
): ModelExampleEntry {
  return (
    MODEL_EXAMPLE_CATALOG.find((e) => e.id === id) ??
      MODEL_EXAMPLE_CATALOG[0]!
  );
}

export function defaultModelExampleUrl(): string {
  return getModelExample().githubUrl;
}
