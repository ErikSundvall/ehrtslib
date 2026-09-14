/**
 * In-memory sample template for the TAAAT UI prototype.
 * Throwaway data — not loaded from GitHub.
 */

import type { AnnotationDocumentation } from "../../../../parser/clinical_model_annotations.ts";
import type { L10nSourceNode } from "../../../../parser/l10n_annotation_generate.ts";

export const PROTO_LANGUAGES = ["en", "sv", "fr"] as const;

export interface ProtoNode {
  id: string;
  path: string;
  name: string;
  rmType: string;
  nodeId?: string;
  archetypeRef?: string;
  occurrences: string;
  localizedNames: Record<string, string>;
  children: ProtoNode[];
}

export function cloneSampleTree(): ProtoNode {
  return structuredClone(SAMPLE_TREE);
}

export function cloneSampleDocumentation(): AnnotationDocumentation {
  return structuredClone(SAMPLE_DOCUMENTATION);
}

export function flattenNodes(node: ProtoNode, out: ProtoNode[] = []): ProtoNode[] {
  out.push(node);
  for (const child of node.children) flattenNodes(child, out);
  return out;
}

export function findNode(node: ProtoNode, path: string): ProtoNode | undefined {
  if (node.path === path) return node;
  for (const child of node.children) {
    const hit = findNode(child, path);
    if (hit) return hit;
  }
  return undefined;
}

export function asL10nSources(root: ProtoNode): L10nSourceNode[] {
  return flattenNodes(root).map((n) => ({
    path: n.path,
    localizedNames: n.localizedNames,
    archetypeRef: n.archetypeRef,
  }));
}

export function countArchetypeRefs(root: ProtoNode): Map<string, number> {
  const counts = new Map<string, number>();
  for (const n of flattenNodes(root)) {
    if (!n.archetypeRef) continue;
    counts.set(n.archetypeRef, (counts.get(n.archetypeRef) ?? 0) + 1);
  }
  return counts;
}

export function isRepeated(node: ProtoNode, counts: Map<string, number>): boolean {
  if (!node.archetypeRef) return false;
  return (counts.get(node.archetypeRef) ?? 0) > 1;
}

export function l10nCoverage(
  doc: AnnotationDocumentation,
  node: ProtoNode,
  languages: readonly string[],
): { present: string[]; missing: string[] } {
  const present: string[] = [];
  const missing: string[] = [];
  for (const lang of languages) {
    const key = `L10n.${lang}`;
    const has = languages.some((bag) => doc[bag]?.[node.path]?.[key]);
    if (has) present.push(lang);
    else missing.push(lang);
  }
  return { present, missing };
}

export function otherAnnotations(
  doc: AnnotationDocumentation,
  path: string,
  language: string,
): Record<string, string> {
  const bag = doc[language]?.[path] ?? {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(bag)) {
    if (!/^L10n\./i.test(k)) out[k] = v;
  }
  return out;
}

const SAMPLE_TREE: ProtoNode = {
  id: "root",
  path: "/",
  name: "Home care encounter",
  rmType: "COMPOSITION",
  nodeId: "openEHR-EHR-COMPOSITION.encounter.v1",
  archetypeRef: "openEHR-EHR-COMPOSITION.encounter.v1",
  occurrences: "1..1",
  localizedNames: {
    en: "Home care encounter",
    sv: "Hemvårdsbesök",
    fr: "Rencontre de soins à domicile",
  },
  children: [
    {
      id: "ctx",
      path: "/context",
      name: "Context",
      rmType: "EVENT_CONTEXT",
      occurrences: "0..1",
      localizedNames: { en: "Context", sv: "Kontext", fr: "Contexte" },
      children: [
        {
          id: "setting",
          path: "/context/setting",
          name: "Setting",
          rmType: "DV_CODED_TEXT",
          nodeId: "setting",
          occurrences: "1..1",
          localizedNames: { en: "Setting", sv: "Miljö", fr: "Cadre" },
          children: [],
        },
      ],
    },
    {
      id: "eq",
      path:
        "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']",
      name: "Medical equipment at home",
      rmType: "SECTION",
      nodeId: "at0000",
      archetypeRef: "openEHR-EHR-SECTION.adhoc.v1",
      occurrences: "0..1",
      localizedNames: {
        en: "Medical equipment at home",
        sv: "Medicinsk utrustning i hemmet",
        fr: "Équipement médical à domicile",
      },
      children: [
        {
          id: "eq-note",
          path:
            "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']/items[at0001]",
          name: "Narrative",
          rmType: "ELEMENT",
          nodeId: "at0001",
          occurrences: "0..1",
          localizedNames: { en: "Narrative", sv: "Berättelse", fr: "Récit" },
          children: [],
        },
      ],
    },
    {
      id: "soc",
      path:
        "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Social situation']",
      name: "Social situation",
      rmType: "SECTION",
      nodeId: "at0000",
      archetypeRef: "openEHR-EHR-SECTION.adhoc.v1",
      occurrences: "0..1",
      localizedNames: {
        en: "Social situation",
        sv: "Social situation",
        fr: "Situation sociale",
      },
      children: [
        {
          id: "soc-note",
          path:
            "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Social situation']/items[at0001]",
          name: "Narrative",
          rmType: "ELEMENT",
          nodeId: "at0001",
          occurrences: "0..1",
          localizedNames: { en: "Narrative", sv: "Berättelse", fr: "Récit" },
          children: [],
        },
      ],
    },
    {
      id: "bp",
      path: "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]",
      name: "Blood pressure",
      rmType: "OBSERVATION",
      nodeId: "at0000",
      archetypeRef: "openEHR-EHR-OBSERVATION.blood_pressure.v2",
      occurrences: "0..1",
      localizedNames: {
        en: "Blood pressure",
        sv: "Blodtryck",
        fr: "Pression artérielle",
      },
      children: [
        {
          id: "bp-data",
          path: "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]",
          name: "Data",
          rmType: "HISTORY",
          nodeId: "at0001",
          occurrences: "1..1",
          localizedNames: { en: "Data", sv: "Data", fr: "Données" },
          children: [
            {
              id: "bp-any",
              path:
                "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0002]",
              name: "Any event",
              rmType: "POINT_EVENT",
              nodeId: "at0002",
              occurrences: "0..*",
              localizedNames: {
                en: "Any event",
                sv: "Valfri händelse",
                fr: "Tout événement",
              },
              children: [
                {
                  id: "sys",
                  path:
                    "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0002]/data[at0003]/items[at0004]",
                  name: "Systolic",
                  rmType: "ELEMENT",
                  nodeId: "at0004",
                  occurrences: "1..1",
                  localizedNames: {
                    en: "Systolic",
                    sv: "Systoliskt",
                    fr: "Systolique",
                  },
                  children: [],
                },
                {
                  id: "dia",
                  path:
                    "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0002]/data[at0003]/items[at0005]",
                  name: "Diastolic",
                  rmType: "ELEMENT",
                  nodeId: "at0005",
                  occurrences: "1..1",
                  localizedNames: {
                    en: "Diastolic",
                    sv: "Diastoliskt",
                    fr: "Diastolique",
                  },
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "dx",
      path: "/content[openEHR-EHR-EVALUATION.problem_diagnosis.v1]",
      name: "Problem/Diagnosis",
      rmType: "EVALUATION",
      nodeId: "at0000",
      archetypeRef: "openEHR-EHR-EVALUATION.problem_diagnosis.v1",
      occurrences: "0..*",
      localizedNames: {
        en: "Problem/Diagnosis",
        sv: "Problem/diagnos",
        fr: "Problème/diagnostic",
      },
      children: [
        {
          id: "dx-name",
          path:
            "/content[openEHR-EHR-EVALUATION.problem_diagnosis.v1]/data[at0001]/items[at0002]",
          name: "Diagnosis name",
          rmType: "ELEMENT",
          nodeId: "at0002",
          occurrences: "1..1",
          localizedNames: {
            en: "Diagnosis name",
            sv: "Diagnosnamn",
            fr: "Nom du diagnostic",
          },
          children: [],
        },
      ],
    },
  ],
};

/** Partial L10n + a design note that generation must not destroy. */
const SAMPLE_DOCUMENTATION: AnnotationDocumentation = {
  en: {
    "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']":
      {
        "design note": "Renamed occurrence — needs L10n on OPT export",
        "L10n.en": "Medical equipment at home",
      },
    "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]/data[at0001]/events[at0002]/data[at0003]/items[at0004]":
      {
        ui: "passthrough",
        comment: "mmHg",
      },
  },
  sv: {
    "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']":
      {
        "design note": "Renamed occurrence — needs L10n on OPT export",
      },
  },
  fr: {},
};
