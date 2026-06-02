import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  normalizePalette,
  parsePaletteJson,
  serializePalette,
  updateTemplateJsonAnnotationSource,
  upsertPaletteItem,
} from "./state.ts";

Deno.test("TAAAT palette helpers normalize, upsert, and serialize items", () => {
  const initial = normalizePalette([{ label: "FHIR", key: "FHIR" }]);
  assertEquals(initial, [{ id: "fhir-fhir", label: "FHIR", key: "FHIR" }]);

  const updated = upsertPaletteItem(initial, {
    label: "UI readonly",
    key: "ui",
    value: "readonly",
  });
  assertEquals(updated.at(-1), {
    id: "ui-readonly-ui",
    label: "UI readonly",
    key: "ui",
    value: "readonly",
  });

  assertEquals(parsePaletteJson(serializePalette(updated)), updated);
});

Deno.test("TAAAT JSON annotation source helper adds and removes documentation entries", () => {
  const source = JSON.stringify({
    "@type": "TEMPLATE",
    archetypeId: "openEHR-EHR-COMPOSITION.demo.v1",
  });
  const added = updateTemplateJsonAnnotationSource(source, {
    language: "en",
    path: "/content[id2]",
    key: "ui",
    value: "compact",
  });
  assertEquals(
    JSON.parse(added).annotations.documentation.en["/content[id2]"],
    {
      ui: "compact",
    },
  );

  const removed = updateTemplateJsonAnnotationSource(added, {
    language: "en",
    path: "/content[id2]",
    key: "ui",
    remove: true,
  });
  assertEquals(JSON.parse(removed).annotations, undefined);
});
