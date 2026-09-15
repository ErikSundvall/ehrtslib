/**
 * Curated GitHub clinical-model URLs for the TAAAT example picker.
 */

export type TaaatLoadKind = "template" | "archetype";

export interface TaaatExample {
  id: string;
  label: string;
  url: string;
  kind: TaaatLoadKind;
}

export const TAAAT_EXAMPLES: TaaatExample[] = [
  {
    id: "accident-report-vitals",
    label: "Accident report + vital signs (Ehrlibs)",
    url:
      "https://github.com/Ehrlibs/openEHR-model-examples/blob/main/local/theme-packs/sport-event-details/templates/Accident%20report%20including%20vital%20signs.t.json",
    kind: "template",
  },
  {
    id: "simple-diagnose-and-vitals",
    label: "Simple diagnose and vitals (Ehrlibs)",
    url:
      "https://github.com/Ehrlibs/openEHR-model-examples/blob/main/local/theme-packs/simple-diagnose-and-vitals/simple-diagnose-and-vitals.t.json",
    kind: "template",
  },
  {
    id: "mdt-lung",
    label: "MDT Lung cancer (Region Stockholm)",
    url:
      "https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek/blob/MultiDiciplinery_Tumor_meetings/local/Diagnostic_MDT_Lung_cancer.t.json",
    kind: "template",
  },
  {
    id: "composition-review",
    label: "COMPOSITION.review (Region Stockholm)",
    url:
      "https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek/blob/main/local/archetypes/composition/openEHR-EHR-COMPOSITION.review.v0.adl",
    kind: "archetype",
  },
];

export const DEFAULT_TEMPLATE_EXAMPLE_ID = "accident-report-vitals";
export const DEFAULT_ARCHETYPE_EXAMPLE_ID = "composition-review";

export function examplesForKind(kind: TaaatLoadKind): TaaatExample[] {
  return TAAAT_EXAMPLES.filter((e) => e.kind === kind);
}

export function getExample(
  id: string,
  kind?: TaaatLoadKind,
): TaaatExample | undefined {
  return TAAAT_EXAMPLES.find((e) =>
    e.id === id && (kind == null || e.kind === kind)
  );
}

export function exampleMatchingUrl(
  url: string,
  kind?: TaaatLoadKind,
): TaaatExample | undefined {
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  return TAAAT_EXAMPLES.find((e) =>
    e.url === trimmed && (kind == null || e.kind === kind)
  );
}

export function defaultExampleUrl(kind: TaaatLoadKind): string {
  const id = kind === "archetype"
    ? DEFAULT_ARCHETYPE_EXAMPLE_ID
    : DEFAULT_TEMPLATE_EXAMPLE_ID;
  return getExample(id, kind)?.url ?? examplesForKind(kind)[0]?.url ?? "";
}
