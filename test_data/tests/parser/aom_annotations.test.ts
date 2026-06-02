/**
 * RESOURCE_ANNOTATIONS helpers and compact AOM tree tests.
 */

import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Serializer } from "../../enhanced/generation/adl2_serializer.ts";
import {
  buildAomTree,
  getAnnotationsForPath,
  listAnnotations,
  parseAdl,
  parseTemplateJson,
  removeAnnotation,
  setAnnotation,
} from "../../enhanced/parser/mod.ts";

const SIMPLE_ADL = `archetype (adl_version=2.0.6; rm_release=1.0.4)
    openEHR-EHR-COMPOSITION.annotation_demo.v1.0.0

language
    original_language = <[ISO_639-1::en]>

definition
    COMPOSITION[id1] matches {
        content matches {
            SECTION[id2]
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = < text = <"Demo composition"> >
            ["id2"] = < text = <"Demo section"> >
        >
    >

annotations
    documentation = <
        ["en"] = <
            ["/content[id2]"] = <
                ["ui"] = <"compact">
            >
        >
    >
`;

Deno.test("AOM annotations - list, set, remove, and serialize", () => {
  const parsed = parseAdl(SIMPLE_ADL);
  const archetype = parsed.archetype!;

  assertEquals(listAnnotations(archetype), [{
    language: "en",
    path: "/content[id2]",
    key: "ui",
    value: "compact",
  }]);

  setAnnotation(archetype, {
    language: "en",
    path: "/content[id2]",
    key: "FHIR",
    value: "Composition.section",
  });
  assertEquals(getAnnotationsForPath(archetype, "/content[id2]"), {
    FHIR: "Composition.section",
    ui: "compact",
  });

  removeAnnotation(archetype, {
    language: "en",
    path: "/content[id2]",
    key: "ui",
  });
  assertEquals(getAnnotationsForPath(archetype, "/content[id2]"), {
    FHIR: "Composition.section",
  });

  const serialized = new ADL2Serializer().serialize(archetype);
  assertEquals(serialized.includes("FHIR"), true);
  assertEquals(serialized.includes("Composition.section"), true);
});

Deno.test("AOM annotations - tree nodes expose annotation counts", () => {
  const archetype = parseAdl(SIMPLE_ADL).archetype!;
  const tree = buildAomTree(archetype);

  assertEquals(tree.path, "/");
  assertEquals(tree.children[0].path, "/content[id2]");
  assertEquals(tree.children[0].hasAnnotations, true);
  assertEquals(tree.children[0].annotationCount, 1);
});

Deno.test("Template JSON parser maps RESOURCE_ANNOTATIONS", () => {
  const source = JSON.stringify({
    "@type": "TEMPLATE",
    archetypeId: "openEHR-EHR-COMPOSITION.json_annotations.v1",
    definition: {
      "@type": "C_COMPLEX_OBJECT",
      rmTypeName: "COMPOSITION",
      nodeId: "id1",
    },
    annotations: {
      "@type": "RESOURCE_ANNOTATIONS",
      documentation: {
        en: {
          "/": {
            ui: "readonly",
          },
        },
      },
    },
  });

  const parsed = parseTemplateJson(source);
  assertEquals(listAnnotations(parsed.template), [{
    language: "en",
    path: "/",
    key: "ui",
    value: "readonly",
  }]);
});
