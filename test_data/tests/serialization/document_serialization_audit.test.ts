/**
 * Audit document serializers across templated composition fixtures.
 */
import { assert, assertEquals } from "@std/assert";
import { join } from "@std/path";
import Asciidoctor from "@asciidoctor/core";
import {
  AsciidocDeserializer,
  AsciidocSerializer,
  COMPACT_ASCIIDOC_CONFIG,
  EMBEDDING_ASCIIDOC_CONFIG,
  STRUCTURAL_ASCIIDOC_CONFIG,
  WIKILINK_ASCIIDOC_CONFIG,
} from "../../../serialization/asciidoc/mod.ts";
import {
  COMPACT_MARKDOWN_CONFIG,
  EMBEDDING_MARKDOWN_CONFIG,
  MarkdownDeserializer,
  MarkdownSerializer,
  STRUCTURAL_MARKDOWN_CONFIG,
  WIKILINK_MARKDOWN_CONFIG,
} from "../../../serialization/markdown/mod.ts";
import {
  collectLossySensitiveSpots,
  lossyOutputCoversSpot,
  LOSSY_INTENTIONAL_ROOT_OMISSIONS,
  structuralPathDiff,
  type LossySensitiveSpot,
  type StructuralPathDiff,
} from "../../../serialization/documents_common/document_audit_paths.ts";
import { assertNoLeadingColonDlistLines } from "../../../serialization/documents_common/document_list_layout.ts";
import {
  assertNoForbiddenDocumentMarkers,
  assertNoForbiddenWholeTreeOeRmAnnotations,
} from "../../../serialization/documents_common/document_rm_render.ts";
import { rmTreesSemanticallyEqual } from "../../../serialization/documents_common/mod.ts";
import { DOCUMENT_PRESET_IDS } from "../../../serialization/documents_common/document_preset_rules.ts";
import {
  bloodPressureComposition,
  chemoContextComposition,
  loadTemplatedCompositionFixtures,
} from "./document_audit_fixtures.ts";

const FINDINGS_PATH = "/opt/cursor/artifacts/document_audit_findings.json";

const MD_CONFIGS: Record<string, Record<string, unknown>> = {
  structural: STRUCTURAL_MARKDOWN_CONFIG,
  compact: COMPACT_MARKDOWN_CONFIG,
  embedding: EMBEDDING_MARKDOWN_CONFIG,
  wikilink: WIKILINK_MARKDOWN_CONFIG,
};

const AD_CONFIGS: Record<string, Record<string, unknown>> = {
  structural: STRUCTURAL_ASCIIDOC_CONFIG,
  compact: COMPACT_ASCIIDOC_CONFIG,
  embedding: EMBEDDING_ASCIIDOC_CONFIG,
  wikilink: WIKILINK_ASCIIDOC_CONFIG,
};

type StructuralRow = {
  fixture: string;
  codec: "markdown" | "asciidoc";
  equal: boolean;
  droppedCount: number;
  alteredCount: number;
  dropped: string[];
  altered: StructuralPathDiff["altered"];
  error?: string;
};

type LossyRow = {
  fixture: string;
  preset: string;
  codec: "markdown" | "asciidoc";
  silentDrops: { path: string; attribute: string; samples: string[] }[];
};

function summarizeStructural(rows: StructuralRow[]) {
  return rows.map((r) => ({
    fixture: r.fixture,
    codec: r.codec,
    equal: r.equal,
    dropped: r.droppedCount,
    altered: r.alteredCount,
    topDropped: r.dropped.slice(0, 8),
    topAltered: r.altered.slice(0, 5),
    error: r.error,
  }));
}

function intentionalLossyDrop(spot: LossySensitiveSpot): boolean {
  if (LOSSY_INTENTIONAL_ROOT_OMISSIONS.has(spot.attribute)) return true;
  if (spot.path === "context.participations" || spot.path.startsWith("context.participations")) {
    return true;
  }
  if (spot.path === "feeder_audit" || spot.path.startsWith("feeder_audit.")) return true;
  if (spot.attribute === "links" || spot.path.includes("links[")) return true;
  if (spot.attribute === "feeder_audit") return true;
  if (spot.path.includes("archetype_details")) return true;
  if (spot.path.includes("uid") || spot.path.includes("version_")) return true;
  return false;
}

Deno.test("document audit: veredictum compositions — no forbidden placeholders", async () => {
  const dir = new URL("../../veredictum/compositions", import.meta.url).pathname;
  let checked = 0;
  for await (const entry of Deno.readDir(dir)) {
    if (!entry.isFile || !entry.name.endsWith(".json")) continue;
    if (/invalid|missing_mandatory/.test(entry.name)) continue;
    const raw = await Deno.readTextFile(join(dir, entry.name));
    let comp: Record<string, unknown>;
    try {
      comp = JSON.parse(raw);
    } catch {
      continue;
    }
    if (comp._type !== "COMPOSITION") continue;
    for (const preset of DOCUMENT_PRESET_IDS) {
      const md = new MarkdownSerializer(MD_CONFIGS[preset]).serialize(comp);
      const ad = new AsciidocSerializer(AD_CONFIGS[preset]).serialize(comp);
      assertNoForbiddenDocumentMarkers(md);
      assertNoForbiddenDocumentMarkers(ad);
      if (preset === "embedding" || preset === "compact") {
        assertNoLeadingColonDlistLines(ad);
      }
    }
    checked++;
  }
  assert(checked >= 5, `expected several composition fixtures, got ${checked}`);
});

Deno.test("AsciiDoc Chemo-like fixture: nested dlist under block titles", () => {
  const ad = new AsciidocSerializer(EMBEDDING_ASCIIDOC_CONFIG).serialize(
    chemoContextComposition(),
  );
  assertNoLeadingColonDlistLines(ad);
  assert(/Namn:: Stockholms läns sjukvårdsområde/.test(ad));
  assertEquals(/^::Namn::/m.test(ad), false);
  const html = Asciidoctor().convert(ad, { safe: "secure" }) as string;
  assert(html.includes("<dt"));
  assert(html.includes("Stockholms"));
  assertEquals(html.includes("::Namn"), false);
});

Deno.test("document audit: full fixture sweep (structural paths + lossy silent drops)", async () => {
  const fixtures = await loadTemplatedCompositionFixtures();
  assert(fixtures.length >= 10, `expected templated fixtures, got ${fixtures.length}`);

  const structuralRows: StructuralRow[] = [];
  const lossyRows: LossyRow[] = [];

  for (const { id, comp } of fixtures) {
    for (const codec of ["markdown", "asciidoc"] as const) {
      const Ser = codec === "markdown" ? MarkdownSerializer : AsciidocSerializer;
      const Des = codec === "markdown" ? MarkdownDeserializer : AsciidocDeserializer;
      const cfg = codec === "markdown"
        ? STRUCTURAL_MARKDOWN_CONFIG
        : STRUCTURAL_ASCIIDOC_CONFIG;
      try {
        const text = new Ser(cfg).serialize(comp);
        assertNoForbiddenWholeTreeOeRmAnnotations(text);
        const back = new Des().deserialize(text);
        const equal = rmTreesSemanticallyEqual(comp, back);
        const diff = structuralPathDiff(comp, back);
        structuralRows.push({
          fixture: id,
          codec,
          equal,
          droppedCount: diff.dropped.length,
          alteredCount: diff.altered.length,
          dropped: diff.dropped,
          altered: diff.altered,
        });
      } catch (e) {
        structuralRows.push({
          fixture: id,
          codec,
          equal: false,
          droppedCount: 0,
          alteredCount: 0,
          dropped: [],
          altered: [],
          error: String(e),
        });
      }
    }

    const spots = collectLossySensitiveSpots(comp);
    for (const preset of ["compact", "embedding", "wikilink"] as const) {
      let md = "";
      let ad = "";
      try {
        md = new MarkdownSerializer(MD_CONFIGS[preset]).serialize(comp);
        ad = new AsciidocSerializer(AD_CONFIGS[preset]).serialize(comp);
      } catch (e) {
        lossyRows.push({
          fixture: id,
          preset,
          codec: "markdown",
          silentDrops: [{
            path: "$serialize",
            attribute: "error",
            samples: [String(e)],
          }],
        });
        continue;
      }
      assertNoLeadingColonDlistLines(ad);
      for (const codec of ["markdown", "asciidoc"] as const) {
        const text = codec === "markdown" ? md : ad;
        const silent = spots
          .filter((s) => !intentionalLossyDrop(s))
          .filter((s) => !lossyOutputCoversSpot(text, s))
          .map((s) => ({
            path: s.path,
            attribute: s.attribute,
            samples: s.samples,
          }));
        if (silent.length) {
          lossyRows.push({ fixture: id, preset, codec, silentDrops: silent });
        }
      }
    }
  }

  function o200kEstimate(chars: number): number {
    return Math.round(chars / 4);
  }

  const sizeFixtures = [
    ["codec-matrix-blood-pressure", bloodPressureComposition()],
    ["chemo-like-cluster", chemoContextComposition()],
    ["veredictum/minimal_event.v1", fixtures.find((f) => f.id.endsWith("minimal_event.v1.json"))?.comp],
  ].filter(([, c]) => c) as [string, Record<string, unknown>][];

  const structuralSize = sizeFixtures.map(([id, comp]) => {
    const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(comp);
    const ad = new AsciidocSerializer(STRUCTURAL_ASCIIDOC_CONFIG).serialize(comp);
    assertNoForbiddenWholeTreeOeRmAnnotations(md);
    assertNoForbiddenWholeTreeOeRmAnnotations(ad);
    return {
      fixture: id,
      markdownChars: md.length,
      markdownO200k: o200kEstimate(md.length),
      asciidocChars: ad.length,
      asciidocO200k: o200kEstimate(ad.length),
    };
  });

  /** Sizes with fb50336 composition-tail snapshots (removed in this PR). */
  const structuralSizeBeforeSparseOnly = [
    { fixture: "codec-matrix-blood-pressure", markdownChars: 1916, markdownO200k: 479, asciidocChars: 1913, asciidocO200k: 478 },
    { fixture: "chemo-like-cluster", markdownChars: 3713, markdownO200k: 928, asciidocChars: 3644, asciidocO200k: 911 },
    { fixture: "veredictum/minimal_event.v1", markdownChars: 4635, markdownO200k: 1159, asciidocChars: 4646, asciidocO200k: 1162 },
  ];

  const failuresDetailed = structuralRows.filter((r) => !r.equal).map((r) => ({
    fixture: r.fixture,
    codec: r.codec,
    dropped: r.droppedCount,
    altered: r.alteredCount,
    error: r.error,
    rootCause: r.error ??
      (r.droppedCount ? `dropped paths e.g. ${r.dropped.slice(0, 5).join(", ")}` : undefined) ??
      (r.alteredCount ? `altered paths e.g. ${r.altered.slice(0, 3).map((a) => a.path).join(", ")}` : undefined),
  }));

  const findings = {
    generatedAt: new Date().toISOString(),
    fixtureCount: fixtures.length,
    structural: summarizeStructural(structuralRows),
    structuralSize,
    structuralSizeBeforeSparseOnly,
    lossySilentDrops: lossyRows,
    structuralPass: structuralRows.filter((r) => r.equal).map((r) =>
      `${r.fixture}:${r.codec}`
    ),
    structuralFail: structuralRows.filter((r) => !r.equal).map((r) =>
      `${r.fixture}:${r.codec}`
    ),
    structuralFailuresDetailed: failuresDetailed,
  };

  await Deno.mkdir("/opt/cursor/artifacts", { recursive: true });
  await Deno.writeTextFile(FINDINGS_PATH, JSON.stringify(findings, null, 2));

  const failures = structuralRows.filter((r) => !r.equal);
  if (failures.length > 0) {
    const fullList = failuresDetailed.map((f) =>
      `${f.fixture}/${f.codec}: ${f.rootCause}`,
    ).join("\n");
    throw new Error(
      `Structural round-trip not lossless (${failures.length}/${structuralRows.length}); see ${FINDINGS_PATH}:\n${fullList}`,
    );
  }

  const chemoClusterMd = new MarkdownSerializer(EMBEDDING_MARKDOWN_CONFIG).serialize(
    chemoContextComposition(),
  );
  assertStringIncludesChemo(chemoClusterMd);
});

function assertStringIncludesChemo(md: string) {
  if (!md.includes("2321000057")) {
    throw new Error("Chemo-like fixture must surface nested identifier in markdown embedding");
  }
}
