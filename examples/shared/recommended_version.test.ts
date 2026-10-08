import { assertEquals } from "@std/assert";
import { dirname, fromFileUrl, join } from "@std/path";
import {
  bleedingEdgeUrlFromManifestUrl,
  detectAppDeployment,
  formatBuildLabel,
  isGithubPagesHost,
  recommendedPopupMessage,
  recommendedUrlFromManifestUrl,
  resolveVersionsManifestUrl,
  shouldShowRecommendedPopup,
  versionWarningPreview,
} from "./recommended_version.ts";

const MANIFEST = "https://eriksundvall.github.io/ehrtslib/versions.json";

Deno.test("isGithubPagesHost matches *.github.io only", () => {
  assertEquals(isGithubPagesHost("eriksundvall.github.io"), true);
  assertEquals(isGithubPagesHost("localhost"), false);
  assertEquals(isGithubPagesHost("127.0.0.1"), false);
  assertEquals(isGithubPagesHost("notgithub.io"), false);
});

Deno.test("detectAppDeployment reads bleeding-edge and frozen app directories", () => {
  assertEquals(detectAppDeployment("/ehrtslib/demo/"), {
    app: "demo",
    tag: null,
    segmentIndex: 1,
  });
  assertEquals(detectAppDeployment("/ehrtslib/demo/index.html"), {
    app: "demo",
    tag: null,
    segmentIndex: 1,
  });
  assertEquals(detectAppDeployment("/ehrtslib/demo-v0.2/"), {
    app: "demo",
    tag: "demo-v0.2",
    segmentIndex: 1,
  });
  assertEquals(detectAppDeployment("/ehrtslib/demo-v0.2.1/index.html"), {
    app: "demo",
    tag: "demo-v0.2.1",
    segmentIndex: 1,
  });
  assertEquals(detectAppDeployment("/ehrtslib/taaat/"), {
    app: "taaat",
    tag: null,
    segmentIndex: 1,
  });
  assertEquals(detectAppDeployment("/ehrtslib/taaat-v0.1/"), {
    app: "taaat",
    tag: "taaat-v0.1",
    segmentIndex: 1,
  });
});

Deno.test("detectAppDeployment ignores the site root and other paths", () => {
  assertEquals(detectAppDeployment("/ehrtslib/"), null);
  assertEquals(detectAppDeployment("/ehrtslib/index.html"), null);
  assertEquals(detectAppDeployment("/"), null);
  assertEquals(detectAppDeployment("/ehrtslib/docs/"), null);
});

Deno.test("resolveVersionsManifestUrl is the parent of the app directory", () => {
  const demo = detectAppDeployment("/ehrtslib/demo/")!;
  assertEquals(
    resolveVersionsManifestUrl(
      "https://eriksundvall.github.io/ehrtslib/demo/",
      demo,
    ),
    MANIFEST,
  );
  assertEquals(
    resolveVersionsManifestUrl(
      "https://eriksundvall.github.io/ehrtslib/demo/index.html?x=1",
      demo,
    ),
    MANIFEST,
  );
  const frozen = detectAppDeployment("/ehrtslib/taaat-v0.1/index.html")!;
  assertEquals(
    resolveVersionsManifestUrl(
      "https://eriksundvall.github.io/ehrtslib/taaat-v0.1/index.html",
      frozen,
    ),
    MANIFEST,
  );
});

Deno.test("release URLs are siblings of versions.json", () => {
  assertEquals(
    bleedingEdgeUrlFromManifestUrl(MANIFEST, "demo"),
    "https://eriksundvall.github.io/ehrtslib/demo/",
  );
  assertEquals(
    bleedingEdgeUrlFromManifestUrl(MANIFEST, "taaat"),
    "https://eriksundvall.github.io/ehrtslib/taaat/",
  );
  assertEquals(
    recommendedUrlFromManifestUrl(MANIFEST, "demo-v0.2"),
    "https://eriksundvall.github.io/ehrtslib/demo-v0.2/",
  );
});

Deno.test("shouldShowRecommendedPopup stays quiet off Pages and on the recommended tag", () => {
  assertEquals(
    shouldShowRecommendedPopup({
      isGithubPages: false,
      app: "demo",
      currentTag: null,
      recommended: "demo-v0.2",
    }),
    false,
  );
  assertEquals(
    shouldShowRecommendedPopup({
      isGithubPages: true,
      app: "demo",
      currentTag: null,
      recommended: undefined,
    }),
    false,
  );
  assertEquals(
    shouldShowRecommendedPopup({
      isGithubPages: true,
      app: "demo",
      currentTag: "demo-v0.2",
      recommended: "demo-v0.2",
    }),
    false,
  );
  assertEquals(
    shouldShowRecommendedPopup({
      isGithubPages: true,
      app: null,
      currentTag: null,
      recommended: "demo-v0.2",
    }),
    false,
  );
});

Deno.test("shouldShowRecommendedPopup warns on bleeding edge and older freezes", () => {
  assertEquals(
    shouldShowRecommendedPopup({
      isGithubPages: true,
      app: "taaat",
      currentTag: null,
      recommended: "taaat-v0.1",
    }),
    true,
  );
  assertEquals(
    shouldShowRecommendedPopup({
      isGithubPages: true,
      app: "demo",
      currentTag: "demo-v0.1",
      recommended: "demo-v0.2",
    }),
    true,
  );
});

Deno.test("shouldShowRecommendedPopup honours a dismissal for the current recommendation", () => {
  assertEquals(
    shouldShowRecommendedPopup({
      isGithubPages: true,
      app: "demo",
      currentTag: "demo-v0.1",
      recommended: "demo-v0.2",
      dismissedFor: "demo-v0.2",
    }),
    false,
  );
  assertEquals(
    shouldShowRecommendedPopup({
      isGithubPages: true,
      app: "demo",
      currentTag: "demo-v0.1",
      recommended: "demo-v0.3",
      dismissedFor: "demo-v0.2",
    }),
    true,
  );
});

Deno.test("version-warning preview forces the dialog and can name tags", () => {
  assertEquals(versionWarningPreview("", "demo"), null);
  assertEquals(versionWarningPreview("?version-warning=preview", "demo"), {
    recommended: "demo-v0.1",
    currentTag: null,
  });
  assertEquals(
    versionWarningPreview(
      "?version-warning=preview&recommended=taaat-v0.2&current=taaat-v0.1",
      "taaat",
    ),
    { recommended: "taaat-v0.2", currentTag: "taaat-v0.1" },
  );
  assertEquals(
    shouldShowRecommendedPopup({
      isGithubPages: false,
      app: "demo",
      currentTag: null,
      recommended: "demo-v0.1",
      forcePreview: true,
    }),
    true,
  );
});

Deno.test("recommendedPopupMessage names the app and the deployment", () => {
  assertEquals(
    recommendedPopupMessage("demo", "demo-v0.1", "demo-v0.2"),
    "You are using the format converter demo-v0.1, which is not the recommended version (demo-v0.2).",
  );
  assertEquals(
    recommendedPopupMessage("taaat", null, "taaat-v0.1"),
    "You are using the bleeding-edge TAAAT (updated on every change to main), not the recommended stable version (taaat-v0.1).",
  );
});

Deno.test("formatBuildLabel includes the package version and build stamp", () => {
  const info = {
    version: "0.1.0",
    buildId: "AB12CD34",
    timestamp: "2026-10-08T07:00:00.000Z",
  };
  const local = formatBuildLabel("TAAAT", info, null);
  assertEquals(local.startsWith("TAAAT v0.1.0 · Build AB12CD34 ("), true);
  const edge = formatBuildLabel("Format converter", info, {
    app: "demo",
    tag: null,
    segmentIndex: 1,
  });
  assertEquals(
    edge.startsWith(
      "Format converter v0.1.0 · bleeding edge · Build AB12CD34 (",
    ),
    true,
  );
  const frozen = formatBuildLabel("TAAAT", info, {
    app: "taaat",
    tag: "taaat-v0.1",
    segmentIndex: 1,
  });
  assertEquals(
    frozen.startsWith("TAAAT v0.1.0 · taaat-v0.1 · Build AB12CD34 ("),
    true,
  );
});

Deno.test("recommended-version dialogs keep links in the same tab", async () => {
  const root = dirname(fromFileUrl(import.meta.url));
  for (
    const rel of [
      "../demo-app/public/index.html",
      "../taaat-app/public/index.html",
    ]
  ) {
    const html = await Deno.readTextFile(join(root, rel));
    const start = html.indexOf('id="dialog-recommended-version"');
    const end = html.indexOf("</dialog>", start);
    const dialog = html.slice(start, end);
    assertEquals(start > 0, true, rel);
    assertEquals(dialog.includes('target="_blank"'), false, rel);
  }
});
