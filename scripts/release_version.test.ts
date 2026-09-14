import { assertEquals, assertThrows } from "@std/assert";
import {
  bumpVersionInText,
  parseReleaseTag,
  parseSemver,
  releaseTagForVersion,
} from "./release_version.ts";
import {
  emptyManifest,
  normalizeManifest,
  pickRecommendedVersion,
} from "./pages_site.ts";

Deno.test("releaseTagForVersion drops patch 0 like intEHRgrator", () => {
  assertEquals(releaseTagForVersion("library", "0.1.0"), "v0.1");
  assertEquals(releaseTagForVersion("library", "0.1.1"), "v0.1.1");
  assertEquals(releaseTagForVersion("demo", "0.2.0"), "demo-v0.2");
  assertEquals(releaseTagForVersion("taaat", "1.0.3"), "taaat-v1.0.3");
});

Deno.test("parseReleaseTag round-trips package and version", () => {
  assertEquals(parseReleaseTag("v0.1"), {
    pkg: "library",
    version: "0.1",
  });
  assertEquals(parseReleaseTag("demo-v0.2.1"), {
    pkg: "demo",
    version: "0.2.1",
  });
  assertEquals(parseReleaseTag("taaat-v0.3"), {
    pkg: "taaat",
    version: "0.3",
  });
  assertThrows(() => parseReleaseTag("foo-v1.0"));
  assertThrows(() => parseSemver("1"));
});

Deno.test("bumpVersionInText replaces the version field", () => {
  const src = `{ "name": "ehrtslib", "version": "0.0.0", "tasks": {} }`;
  assertEquals(
    JSON.parse(bumpVersionInText(src, "0.1.0")).version,
    "0.1.0",
  );
  assertThrows(() => bumpVersionInText("{ }", "0.1.0"));
});

Deno.test("normalizeManifest keeps per-package tags and recommended", () => {
  const m = normalizeManifest({
    library: { current: "0.4.0", versions: ["v0.4", "v0.3", "nope"] },
    demo: { versions: ["demo-v0.2", "demo-v0.1"], recommended: "demo-v0.1" },
    taaat: { versions: ["taaat-v0.1"] },
  }, "0.0.0");
  assertEquals(m.library.current, "0.4.0");
  assertEquals(m.library.versions[0], "v0.4");
  assertEquals(m.demo.recommended, "demo-v0.1");
  assertEquals(m.taaat.versions, ["taaat-v0.1"]);
  assertEquals(emptyManifest("1.2.3").library.current, "1.2.3");
});

Deno.test("pickRecommendedVersion prefers override, then previous, then newest", () => {
  const versions = ["demo-v0.3", "demo-v0.2", "demo-v0.1"];
  assertEquals(
    pickRecommendedVersion(versions, { override: "demo-v0.1" }),
    "demo-v0.1",
  );
  assertEquals(
    pickRecommendedVersion(versions, { previous: "demo-v0.2" }),
    "demo-v0.2",
  );
  assertEquals(pickRecommendedVersion(versions), "demo-v0.3");
  assertEquals(pickRecommendedVersion([]), undefined);
});
