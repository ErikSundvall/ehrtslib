import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  listTemplateJsonArchetypeIds,
  patchTemplateJsonAnnotations,
} from "../../../parser/template_json_annotations.ts";
import { ClinicalModelWorkspace } from "../../../parser/clinical_model_workspace.ts";
import {
  getResourceDocumentation,
  setPathAnnotation,
} from "../../../parser/clinical_model_annotations.ts";

const CARE_UNIT = "test_data/tjson/Care unit v2.t.json";

Deno.test("listTemplateJsonArchetypeIds reads root and overlays", () => {
  const text = Deno.readTextFileSync(CARE_UNIT);
  const ids = listTemplateJsonArchetypeIds(text);
  assertEquals(ids.length >= 2, true);
  assertEquals(ids.some((id) => id.includes("CLUSTER")), true);
});

Deno.test("patchTemplateJsonAnnotations updates overlay L10n without dropping other keys", () => {
  const text = Deno.readTextFileSync(CARE_UNIT);
  const ids = listTemplateJsonArchetypeIds(text);
  const overlayId = ids.find((id) => id.includes("ovl-")) ?? ids[1];
  const docs = new Map<string, Record<string, Record<string, Record<string, string>>> | undefined>();
  docs.set(overlayId, {
    en: {
      "/items[at0003.1]": {
        "L10n.en": "Org number (edited)",
        "design note": "keep me",
      },
    },
  });
  const patched = patchTemplateJsonAnnotations(text, docs);
  assertStringIncludes(patched, "Org number (edited)");
  assertStringIncludes(patched, "keep me");
  assertStringIncludes(patched, "RESOURCE_ANNOTATIONS");
  // Unrelated structural fields survive
  assertStringIncludes(patched, "templateOverlays");
});

Deno.test("ClinicalModelWorkspace.exportAnnotatedFile round-trips .t.json annotation edits", () => {
  const text = Deno.readTextFileSync(CARE_UNIT);
  const ws = new ClinicalModelWorkspace();
  ws.addFile("Care unit v2.t.json", text);
  const ids = listTemplateJsonArchetypeIds(text);
  const overlayId = ids.find((id) => id.includes("ovl-")) ?? ids[1];
  const overlay = ws.repository.get(overlayId) ?? ws.repository.getTemplate(overlayId);
  if (!overlay) throw new Error(`overlay ${overlayId} not loaded`);
  setPathAnnotation(overlay, "/items[at0003.1]", "L10n.en", "Patched via workspace", "en");
  const exported = ws.exportAnnotatedFile("Care unit v2.t.json");
  if (!exported) throw new Error("export failed");
  assertStringIncludes(exported, "Patched via workspace");
  // Re-load and confirm documentation visible
  const ws2 = new ClinicalModelWorkspace();
  ws2.addFile("Care unit v2.t.json", exported);
  const overlay2 = ws2.repository.get(overlayId) ?? ws2.repository.getTemplate(overlayId);
  const doc = getResourceDocumentation(overlay2!);
  assertEquals(doc?.en?.["/items[at0003.1]"]?.["L10n.en"], "Patched via workspace");
});
