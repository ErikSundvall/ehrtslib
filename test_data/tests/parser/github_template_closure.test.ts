/**
 * GitHub template closure loader — URL parsing, dependency extraction, live fetch.
 */

import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { fromFileUrl } from "https://deno.land/std@0.220.0/path/mod.ts";
import {
  buildClinicalModelPathIndex,
  loadGitHubTemplateClosure,
  parseGitHubTemplateFileUrl,
  resolveClinicalModelRef,
} from "../../../enhanced/parser/github_template_closure.ts";
import {
  collectTemplateJsonExternalRefsFromText,
} from "../../../enhanced/parser/template_json_dependencies.ts";
import { ClinicalModelWorkspace } from "../../../enhanced/parser/clinical_model_workspace.ts";

const BLOB_URL =
  "https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek/blob/MultiDiciplinery_Tumor_meetings/local/Diagnostic_MDT_Lung_cancer.t.json";

Deno.test("parseGitHubTemplateFileUrl parses blob and raw links", () => {
  const blob = parseGitHubTemplateFileUrl(BLOB_URL);
  assertEquals(blob.owner, "regionstockholm");
  assertEquals(blob.repo, "CKM-mirror-via-modellbibliotek");
  assertEquals(blob.ref, "MultiDiciplinery_Tumor_meetings");
  assertEquals(blob.path, "local/Diagnostic_MDT_Lung_cancer.t.json");

  const raw = parseGitHubTemplateFileUrl(
    "https://raw.githubusercontent.com/regionstockholm/CKM-mirror-via-modellbibliotek/MultiDiciplinery_Tumor_meetings/local/Diagnostic_MDT_Lung_cancer.t.json",
  );
  assertEquals(raw.path, blob.path);
});

Deno.test("collectTemplateJsonExternalRefsFromText finds parent and nested template", async () => {
  const fixture = await Deno.readTextFile(
    fromFileUrl(
      new URL("../../tjson/Care unit v2.t.json", import.meta.url),
    ),
  );
  const refs = collectTemplateJsonExternalRefsFromText(fixture);
  assert(refs.some((r) => r.includes("openEHR-EHR")));
});

Deno.test("resolveClinicalModelRef finds archetype and template paths", () => {
  const index = buildClinicalModelPathIndex([
    "local/Care unit v2.t.json",
    "local/archetypes/composition/openEHR-EHR-COMPOSITION.review.v0.adl",
  ]);
  assertEquals(
    resolveClinicalModelRef("Care unit v2", index, "local"),
    "local/Care unit v2.t.json",
  );
  assertEquals(
    resolveClinicalModelRef(
      "openEHR-EHR-COMPOSITION.review.v0",
      index,
      "local",
    ),
    "local/archetypes/composition/openEHR-EHR-COMPOSITION.review.v0.adl",
  );
});

Deno.test("loadGitHubTemplateClosure accepts an archetype URL and fetches parent chain", async () => {
  const childPath = "archetypes/openEHR-EHR-CLUSTER.child.v1.0.0.adl";
  const parentPath = "archetypes/openEHR-EHR-CLUSTER.parent.v1.0.0.adl";
  const child = `archetype (adl_version=2.0.6; rm_release=1.0.4)
    openEHR-EHR-CLUSTER.child.v1.0.0
specialize
    openEHR-EHR-CLUSTER.parent.v1.0.0

language
    original_language = <[ISO_639-1::en]>

definition
    CLUSTER[id1]
`;
  const parent = `archetype (adl_version=2.0.6; rm_release=1.0.4)
    openEHR-EHR-CLUSTER.parent.v1.0.0

language
    original_language = <[ISO_639-1::en]>

definition
    CLUSTER[id1]
`;

  const fakeFetch: typeof fetch = (input) => {
    const url = String(input);
    if (url.includes("/branches/main")) {
      return Promise.resolve(
        new Response(JSON.stringify({ commit: { sha: "abc123" } })),
      );
    }
    if (url.includes("/git/trees/abc123")) {
      return Promise.resolve(
        new Response(JSON.stringify({
          tree: [
            { path: childPath, type: "blob" },
            { path: parentPath, type: "blob" },
          ],
        })),
      );
    }
    if (url.endsWith(`/${childPath}`)) {
      return Promise.resolve(new Response(child));
    }
    if (url.endsWith(`/${parentPath}`)) {
      return Promise.resolve(new Response(parent));
    }
    return Promise.resolve(new Response("not found", { status: 404 }));
  };

  const result = await loadGitHubTemplateClosure(
    `https://github.com/example/models/blob/main/${childPath}`,
    { fetch: fakeFetch },
  );

  assertEquals(result.rootPath, childPath);
  assertEquals(result.entries.map((entry) => entry.path).sort(), [
    childPath,
    parentPath,
  ]);
});

Deno.test({
  name:
    "loadGitHubTemplateClosure fetches Diagnostic_MDT_Lung_cancer dependencies",
  permissions: { net: true },
  async fn() {
    const events: string[] = [];
    const result = await loadGitHubTemplateClosure(BLOB_URL, {
      onProgress: (e) => events.push(`${e.phase}: ${e.message}`),
      maxFiles: 120,
    });

    assertEquals(result.rootPath, "local/Diagnostic_MDT_Lung_cancer.t.json");
    assert(
      result.fetched >= 3,
      `expected multiple files, got ${result.fetched}`,
    );
    assert(
      result.entries.some((e) =>
        /Diagnostic_MDT_Lung_cancer\.t\.json$/i.test(e.path)
      ),
    );
    assert(
      result.entries.some((e) => /Care unit v2\.t\.json$/i.test(e.path)),
      "should include nested template Care unit v2",
    );
    assert(
      result.entries.some((e) =>
        /openEHR-EHR-COMPOSITION\.review\.v0\.adl$/i.test(e.path)
      ),
      "should include parent archetype",
    );
    assert(events.some((e) => e.startsWith("complete:")));

    const ws = new ClinicalModelWorkspace();
    const loaded = await ws.loadFromGitHubTemplateUrl(BLOB_URL, {
      maxFiles: 120,
    });
    assertEquals(ws.getGenerationRootPath(), loaded.rootPath);
    const resolved = ws.resolveOperational();
    assert(resolved.operationalTemplate.archetype_id?.value);
    assertStringIncludes(
      resolved.operationalTemplate.archetype_id?.value ?? "",
      "t_review",
    );
  },
});
