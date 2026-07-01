import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ClinicalModelWorkspace } from "../../../enhanced/parser/clinical_model_workspace.ts";
import {
  availableTemplateLanguages,
  RMInstanceGenerator,
} from "../../../enhanced/generation/mod.ts";

const BLOB_URL =
  "https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek/blob/MultiDiciplinery_Tumor_meetings/local/Diagnostic_MDT_Lung_cancer.t.json";

Deno.test({
  name: "RMInstanceGenerator language override and availableTemplateLanguages",
  permissions: { net: true },
  async fn() {
    const ws = new ClinicalModelWorkspace();
    await ws.loadFromGitHubTemplateUrl(BLOB_URL, { maxFiles: 120 });
    const { operationalTemplate } = ws.resolveOperational();

    const langs = availableTemplateLanguages(operationalTemplate);
    assert(langs.includes("sv"), `expected sv in ${langs.join(",")}`);
    assert(langs.includes("en"), `expected en in ${langs.join(",")}`);
    assert(langs.length >= 2);

    const svInstance = new RMInstanceGenerator({
      mode: "example",
      language: "sv",
    }).generate(operationalTemplate);
    const enInstance = new RMInstanceGenerator({
      mode: "example",
      language: "en",
    }).generate(operationalTemplate);

    assertEquals(svInstance.name?.value, "Granskning");
    assert(
      svInstance.name?.value !== enInstance.name?.value,
      "sv and en should produce different composition names",
    );
  },
});
