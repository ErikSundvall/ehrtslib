/**
 * Representative Markdown/AsciiDoc round-trip matrix (#284): RM roots, nested
 * structures, value types, Unicode, template validation, and explicit rejections.
 */
import { assert, assertEquals, assertThrows } from "jsr:@std/assert";
import { DeserializationError, InvalidFormatError } from "../../../serialization/common/errors.ts";
import { validateDeserializedInstance } from "../../../serialization/common/post_deserialize_validation.ts";
import {
  MARKDOWN_CODEC_MATRIX,
  MarkdownDeserializer,
  MarkdownSerializer,
  STRUCTURAL_MARKDOWN_CONFIG,
  EMBEDDING_MARKDOWN_CONFIG,
} from "../../../serialization/markdown/mod.ts";
import {
  ASCIIDOC_CODEC_MATRIX,
  AsciidocDeserializer,
  AsciidocSerializer,
  LOSSLESS_ASCIIDOC_CONFIG,
  EMBEDDING_ASCIIDOC_CONFIG,
} from "../../../serialization/asciidoc/mod.ts";
import {
  OPENEHR_AOM_URN_PREFIX,
  archetypeIdFromOpenehrUrn,
  rmTreesSemanticallyEqual,
} from "../../../serialization/documents_common/mod.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "../../../generation/rm_instance_generator.ts";

function bloodPressureComposition(): Record<string, unknown> {
  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Blood Pressure Recording" },
    archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
    language: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
      code_string: "en",
    },
    territory: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_3166-1" },
      code_string: "GB",
    },
    category: {
      _type: "DV_CODED_TEXT",
      value: "event",
      defining_code: {
        _type: "CODE_PHRASE",
        terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
        code_string: "433",
      },
    },
    composer: { _type: "PARTY_IDENTIFIED", name: "Dr. Smith" },
    archetype_details: {
      _type: "ARCHETYPED",
      archetype_id: {
        _type: "ARCHETYPE_ID",
        value: "openEHR-EHR-COMPOSITION.encounter.v1",
      },
      template_id: { _type: "TEMPLATE_ID", value: "Blood Pressure Template v1" },
    },
    content: [
      {
        _type: "SECTION",
        name: { _type: "DV_TEXT", value: "Vital Signs" },
        archetype_node_id: "openEHR-EHR-SECTION.vital_signs.v1",
        items: [bloodPressureObservation()],
      },
      adminEntryWithUnicode(),
      minimalEvaluation(),
    ],
  };
}

function bloodPressureObservation(): Record<string, unknown> {
  return {
    _type: "OBSERVATION",
    name: { _type: "DV_TEXT", value: "Blood pressure" },
    archetype_node_id: "openEHR-EHR-OBSERVATION.blood_pressure.v2",
    data: {
      _type: "HISTORY",
      origin: { _type: "DV_DATE_TIME", value: "2026-04-13T10:30:00Z" },
      events: [{
        _type: "POINT_EVENT",
        name: { _type: "DV_TEXT", value: "Any event" },
        archetype_node_id: "at0006",
        time: { _type: "DV_DATE_TIME", value: "2026-04-13T10:30:00Z" },
        data: {
          _type: "ITEM_TREE",
          items: [
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Systolic" },
              archetype_node_id: "at0004",
              value: { _type: "DV_QUANTITY", magnitude: 145, units: "mm[Hg]" },
            },
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Diastolic" },
              archetype_node_id: "at0005",
              value: { _type: "DV_QUANTITY", magnitude: 90, units: "mm[Hg]" },
            },
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Mean arterial pressure" },
              archetype_node_id: "at0007",
              value: { _type: "DV_QUANTITY", magnitude: 108, units: "mm[Hg]" },
            },
          ],
        },
      }],
    },
  };
}

function adminEntryWithUnicode(): Record<string, unknown> {
  return {
    _type: "ADMIN_ENTRY",
    name: { _type: "DV_TEXT", value: "Admin note" },
    archetype_node_id: "openEHR-EHR-ADMIN_ENTRY.generic.v1",
    data: {
      _type: "ITEM_TREE",
      items: [{
        _type: "ELEMENT",
        name: { _type: "DV_TEXT", value: "Free text" },
        archetype_node_id: "at0001",
        value: {
          _type: "DV_TEXT",
          value: 'Quote "nested" — café · <|endoftext|> literal',
        },
      }],
    },
  };
}

function minimalEvaluation(): Record<string, unknown> {
  return {
    _type: "EVALUATION",
    name: { _type: "DV_TEXT", value: "Problem/Diagnosis" },
    archetype_node_id: "openEHR-EHR-EVALUATION.problem_diagnosis.v1",
    data: {
      _type: "ITEM_TREE",
      items: [{
        _type: "ELEMENT",
        name: { _type: "DV_TEXT", value: "Diagnosis" },
        archetype_node_id: "at0002",
        value: {
          _type: "DV_CODED_TEXT",
          value: "Diabetes mellitus",
          defining_code: {
            _type: "CODE_PHRASE",
            terminology_id: { _type: "TERMINOLOGY_ID", value: "SNOMED-CT" },
            code_string: "73211009",
          },
        },
      }],
    },
  };
}

function roundTripMarkdown(original: Record<string, unknown>): void {
  const mdSer = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG);
  const md = mdSer.serialize(original);
  const once = new MarkdownDeserializer().deserialize(md);
  assert(rmTreesSemanticallyEqual(original, once), "markdown object round-trip");
  const md2 = mdSer.serialize(once);
  const twice = new MarkdownDeserializer().deserialize(md2);
  assert(rmTreesSemanticallyEqual(once, twice), "markdown parse-serialize-parse");
}

function roundTripAsciidoc(original: Record<string, unknown>): void {
  const adSer = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG);
  const ad = adSer.serialize(original);
  const once = new AsciidocDeserializer().deserialize(ad);
  assert(rmTreesSemanticallyEqual(original, once), "asciidoc object round-trip");
  const ad2 = adSer.serialize(once);
  const twice = new AsciidocDeserializer().deserialize(ad2);
  assert(rmTreesSemanticallyEqual(once, twice), "asciidoc parse-serialize-parse");
}

Deno.test("codec matrix documents supported RM roots (no AOM/template reversibility claim)", () => {
  assertEquals(MARKDOWN_CODEC_MATRIX.requiresTemplateForLossless, true);
  assertEquals(ASCIIDOC_CODEC_MATRIX.requiresTemplateForLossless, true);
  assert(MARKDOWN_CODEC_MATRIX.rmInstances.includes("COMPOSITION"));
  assert(MARKDOWN_CODEC_MATRIX.rmInstances.includes("ADMIN_ENTRY"));
  assert(MARKDOWN_CODEC_MATRIX.losslessDialects.includes("structural"));
  assert(MARKDOWN_CODEC_MATRIX.outputOnlyPresets.includes("embedding"));
});

Deno.test("Markdown lossless: nested COMPOSITION matrix round-trip", () => {
  roundTripMarkdown(bloodPressureComposition());
});

Deno.test("AsciiDoc lossless: nested COMPOSITION matrix round-trip", () => {
  roundTripAsciidoc(bloodPressureComposition());
});

Deno.test("legacy urn:openehr:am: is not accepted for archetype id extraction", () => {
  const legacy = "urn:openehr:am:org.openehr::openEHR-EHR-OBSERVATION.blood_pressure.v2";
  assertEquals(archetypeIdFromOpenehrUrn(legacy), null);
  const aom =
    `${OPENEHR_AOM_URN_PREFIX}openEHR-EHR-OBSERVATION.blood_pressure.v2`;
  assertEquals(
    archetypeIdFromOpenehrUrn(aom),
    "openEHR-EHR-OBSERVATION.blood_pressure.v2",
  );
});

Deno.test("embedding presets are rejected for lossless parse (both codecs)", () => {
  const obs = bloodPressureObservation();
  const md = new MarkdownSerializer(EMBEDDING_MARKDOWN_CONFIG).serialize(obs);
  assertThrows(() => new MarkdownDeserializer().deserialize(md), InvalidFormatError);
  const ad = new AsciidocSerializer(EMBEDDING_ASCIIDOC_CONFIG).serialize(obs);
  assertThrows(() => new AsciidocDeserializer().deserialize(ad), InvalidFormatError);
});

Deno.test("Markdown deserialize with OPT: validateAgainstTemplate hook", () => {
  const optPath = new URL("../../opt14/ehrbase_blood_pressure_simple.de.v0.opt", import.meta.url);
  const xml = Deno.readTextFileSync(optPath);
  const { operationalTemplate } = parseOptXml(xml);
  const generated = new RMInstanceGenerator({ mode: "example" }).generate(
    operationalTemplate,
  ) as Record<string, unknown>;

  const pre = validateDeserializedInstance(generated, {
    validateAgainstTemplate: operationalTemplate,
  });
  assert(pre?.valid, "generated fixture should be template-valid before codec");

  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(generated);
  const parsed = new MarkdownDeserializer().deserialize(md) as Record<string, unknown>;
  assert(
    (parsed.content as unknown[])?.length > 0,
    "OPT-shaped instance should round-trip composition content",
  );

  const post = validateDeserializedInstance(parsed, {
    validateAgainstTemplate: operationalTemplate,
  });
  assert(post, "template validation runs on post-markdown instance");

  const skeleton = `---
template_id: "Blood Pressure Template v1"
---
# Placeholder _[COMPOSITION]_ <!-- openEHR-EHR-COMPOSITION.encounter.v1 -->
`;
  assertThrows(
    () => new MarkdownDeserializer({ validateAgainstTemplate: operationalTemplate }).deserialize(skeleton),
    DeserializationError,
  );
});
