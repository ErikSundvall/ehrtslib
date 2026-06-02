/**
 * Clinical model workspace — ZIP and export API.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.220.0/path/mod.ts";
import { ClinicalModelWorkspace } from "../../../enhanced/parser/clinical_model_workspace.ts";
import { parseGitHubRepoSpec } from "../../../enhanced/parser/github_repo_loader.ts";

Deno.test("parseGitHubRepoSpec parses owner/repo@branch:path", () => {
  const ref = parseGitHubRepoSpec(
    "regionstockholm/CKM-mirror-via-modellbibliotek@MultiDiciplinery_Tumor_meetings:local",
  );
  assertEquals(ref.owner, "regionstockholm");
  assertEquals(ref.repo, "CKM-mirror-via-modellbibliotek");
  assertEquals(ref.ref, "MultiDiciplinery_Tumor_meetings");
  assertEquals(ref.pathPrefix, "local");
});

Deno.test("ClinicalModelWorkspace exportEntries reflects edits", () => {
  const ws = new ClinicalModelWorkspace();
  ws.addFile("demo.adl", "archetype (adl_version=2.0)\n    openEHR-EHR-OBSERVATION.demo.v1\n");
  ws.updateFileContent("demo.adl", "archetype (adl_version=2.0)\n    openEHR-EHR-OBSERVATION.demo_edited.v1\n");
  const exported = ws.exportFile("demo.adl");
  assert(exported?.includes("demo_edited"));
  assert(ws.getFile("demo.adl")?.dirty);
});

Deno.test("ClinicalModelWorkspace Vital signs zip includes .t.json", async () => {
  const zipPath = fromFileUrl(
    new URL("../../file-sets/Vital signs_2026_05_29-18_08_54.zip", import.meta.url),
  );
  const buf = await Deno.readFile(zipPath);
  const { unzipSync, strFromU8 } = await import("fflate");
  const entries = Object.entries(unzipSync(buf)).map(([path, data]) => ({
    path: path.replace(/\\/g, "/").replace(/^\/+/, ""),
    content: strFromU8(data),
  }));
  const ws = new ClinicalModelWorkspace();
  ws.loadFromZipEntries(entries);
  const oet = ws.listFiles().find((f) => /Vital signs\.oet$/i.test(f.path));
  assert(oet);
  assertEquals(oet.loadResult?.kind, "oet_xml");
});
