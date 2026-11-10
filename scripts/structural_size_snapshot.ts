/** One-off: structural preset output sizes for audit metrics. */
import {
  AsciidocSerializer,
  STRUCTURAL_ASCIIDOC_CONFIG,
} from "../serialization/asciidoc/mod.ts";
import {
  MarkdownSerializer,
  STRUCTURAL_MARKDOWN_CONFIG,
} from "../serialization/markdown/mod.ts";
import { bloodPressureComposition, chemoContextComposition } from "../test_data/tests/serialization/document_audit_fixtures.ts";

const fixtures: [string, Record<string, unknown>][] = [
  ["codec-matrix-blood-pressure", bloodPressureComposition()],
  ["chemo-like-cluster", chemoContextComposition()],
];

const veredictum = JSON.parse(
  await Deno.readTextFile("test_data/veredictum/compositions/minimal_event.v1.json"),
);

fixtures.push(["veredictum/minimal_event.v1", veredictum]);

function o200k(chars: number): number {
  return Math.round(chars / 4);
}

const rows = fixtures.map(([id, comp]) => {
  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(comp);
  const ad = new AsciidocSerializer(STRUCTURAL_ASCIIDOC_CONFIG).serialize(comp);
  return {
    fixture: id,
    markdownChars: md.length,
    markdownO200k: o200k(md.length),
    asciidocChars: ad.length,
    asciidocO200k: o200k(ad.length),
  };
});

console.log(JSON.stringify(rows, null, 2));
