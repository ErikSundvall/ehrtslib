/**
 * Format-aware validation source locations (Canonical JSON, FLAT JSON,
 * STRUCTURED JSON) and missing-content guidance (supporting
 * regionstockholm/intehrgrator#373).
 */

import {
  assert,
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "@std/assert";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  deserializeFromFlatWithIssues,
  deserializeFromStructuredWithIssues,
  detectJsonSourceFormat,
  enrichSimplifiedMessagesWithSource,
  validateFlatPayload,
} from "../../../serialization/simplified/mod.ts";
import { TemplateValidator } from "../../../validation/template_validator.ts";

const BP_OPT_XML = await Deno.readTextFile(
  new URL("../../opt14/ehrbase_blood_pressure_simple.de.v0.opt", import.meta.url),
);
const { operationalTemplate: BP_OPT } = parseOptXml(BP_OPT_XML);
const BP_WT = buildWebTemplate(BP_OPT);
const ROOT = "ehrbase_blood_pressure_simple.de.v0";

Deno.test("detectJsonSourceFormat - identifies canonical, FLAT, and STRUCTURED JSON", () => {
  assertEquals(
    detectJsonSourceFormat(JSON.stringify({ _type: "COMPOSITION" })),
    "canonical-json",
  );
  assertEquals(
    detectJsonSourceFormat(JSON.stringify({ "ctx/language": "en", [`${ROOT}/blood_pressure_training_sample:0/systolic|magnitude`]: 120 })),
    "flat-json",
  );
  assertEquals(
    detectJsonSourceFormat(JSON.stringify({ ctx: { language: "en" }, [ROOT]: { blood_pressure_training_sample: [] } })),
    "structured-json",
  );
});

Deno.test("FLAT JSON: exact sourceLine on failing unit across repeating occurrences (:0 vs :1)", () => {
  const flatPayload = {
    "ctx/language": "en",
    "ctx/territory": "DE",
    "ctx/composer_name": "Dr Test",
    "ctx/time": "2024-01-01T10:00:00Z",
    "ctx/setting": "228",
    [`${ROOT}/blood_pressure_training_sample:0/systolic|magnitude`]: 120,
    [`${ROOT}/blood_pressure_training_sample:0/systolic|unit`]: "mm[Hg]",
    [`${ROOT}/blood_pressure_training_sample:0/position|code`]: "at1000",
    [`${ROOT}/blood_pressure_training_sample:0/position|value`]: "Standing",
    [`${ROOT}/blood_pressure_training_sample:0/position|terminology`]: "local",
    [`${ROOT}/blood_pressure_training_sample:1/systolic|magnitude`]: 130,
    [`${ROOT}/blood_pressure_training_sample:1/systolic|unit`]: "furlong",
    [`${ROOT}/blood_pressure_training_sample:1/position|code`]: "at1000",
    [`${ROOT}/blood_pressure_training_sample:1/position|value`]: "Standing",
    [`${ROOT}/blood_pressure_training_sample:1/position|terminology`]: "local",
  };
  const flatText = JSON.stringify(flatPayload, null, 2);
  const badUnitLine = flatText.split("\n").findIndex((l) => l.includes('"furlong"')) + 1;
  assert(badUnitLine > 1);

  const { composition } = deserializeFromFlatWithIssues(flatPayload, BP_WT);
  const validator = new TemplateValidator();
  const result = validator.validate(composition, BP_OPT, {
    jsonSource: flatText,
    webTemplate: BP_WT,
  });

  const unitErr = result.errors.find((e) => e.message.includes("furlong"));
  assertExists(unitErr, "expected unit error for 'furlong'");
  assertEquals(unitErr.sourceLine, badUnitLine);
  assertEquals(
    unitErr.targetPath,
    `${ROOT}/blood_pressure_training_sample:1/systolic|unit`,
  );
  assert(!unitErr.sourceIsAncestor, "present failing key should not be flagged as ancestor");
});

Deno.test("FLAT JSON: missing required attribute points to ancestor line with FLAT targetPath and expectedExample", () => {
  // Omit RM-required `|unit` on systolic DV_QUANTITY inside blood_pressure_training_sample:1
  const flatPayload = {
    "ctx/language": "en",
    "ctx/territory": "DE",
    "ctx/composer_name": "Dr Test",
    "ctx/time": "2024-01-01T10:00:00Z",
    "ctx/setting": "228",
    [`${ROOT}/blood_pressure_training_sample:0/systolic|magnitude`]: 120,
    [`${ROOT}/blood_pressure_training_sample:0/systolic|unit`]: "mm[Hg]",
    [`${ROOT}/blood_pressure_training_sample:1/systolic|magnitude`]: 135,
  };
  const flatText = JSON.stringify(flatPayload, null, 2);
  const bp1MagnitudeLine = flatText.split("\n").findIndex((l) =>
    l.includes("blood_pressure_training_sample:1/systolic|magnitude")
  ) + 1;

  const { composition } = deserializeFromFlatWithIssues(flatPayload, BP_WT);
  const validator = new TemplateValidator();
  const result = validator.validate(composition, BP_OPT, {
    jsonSource: flatText,
    webTemplate: BP_WT,
  });

  const missingUnit = result.errors.find((e) =>
    e.message.includes("units") && e.message.includes("required")
  );
  assertExists(missingUnit, "expected missing required units error");
  assertEquals(missingUnit.sourceLine, bp1MagnitudeLine);
  assertEquals(missingUnit.sourceIsAncestor, true);
  assertEquals(
    missingUnit.targetPath,
    `${ROOT}/blood_pressure_training_sample:1/systolic|unit`,
  );
  assertStringIncludes(missingUnit.expectedExample ?? "", "systolic|unit");
});

Deno.test("FLAT JSON: validateFlatPayload and enrichSimplifiedMessagesWithSource attach line numbers and hints", () => {
  const flatPayload = {
    "ctx/territory": "DE",
    "ctx/composer_name": "Dr Test",
    "ctx/time": "2024-01-01T10:00:00Z",
    "ctx/setting": "228",
    [`${ROOT}/blood_pressure_training_sample:0/systolic|magnitude`]: 120,
    [`${ROOT}/blood_pressure_training_sample:0/systolic|unit`]: "mm[Hg]",
    [`${ROOT}/blood_pressure_training_sample:0/unknown_field`]: "oops",
  };
  const flatText = JSON.stringify(flatPayload, null, 2);
  const unknownLine = flatText.split("\n").findIndex((l) => l.includes("unknown_field")) + 1;

  const flatRes = validateFlatPayload(flatPayload, BP_WT, { jsonSource: flatText });
  const unknownErr = flatRes.errors.find((e) => e.path.includes("unknown_field"));
  assertExists(unknownErr);
  assertEquals(unknownErr.sourceLine, unknownLine);
  assert(!unknownErr.sourceIsAncestor);

  const missingLang = flatRes.warnings.find((w) => w.path === "ctx/language");
  assertExists(missingLang);
  assertExists(missingLang.sourceLine);
  assertEquals(missingLang.sourceIsAncestor, true);
  assertStringIncludes(missingLang.expectedExample ?? "", '"ctx/language"');

  const missingPos = flatRes.warnings.find((w) => w.path.endsWith("/position"));
  assertExists(missingPos);
  assertExists(missingPos.sourceLine);
  assertEquals(missingPos.sourceIsAncestor, true);
  assertStringIncludes(missingPos.expectedExample ?? "", "|code");

  // Also test enrichSimplifiedMessagesWithSource on deserializeFromFlatWithIssues issues
  const badCodePayload = {
    "ctx/language": "en",
    "ctx/territory": "DE",
    "ctx/composer_name": "Dr Test",
    "ctx/time": "2024-01-01T10:00:00Z",
    "ctx/setting": "228",
    [`${ROOT}/blood_pressure_training_sample:0/position|code`]: "at9999",
    [`${ROOT}/blood_pressure_training_sample:0/position|value`]: "Floating",
    [`${ROOT}/blood_pressure_training_sample:0/position|terminology`]: "local",
  };
  const badCodeText = JSON.stringify(badCodePayload, null, 2);
  const badCodeLine = badCodeText.split("\n").findIndex((l) => l.includes("at9999")) + 1;

  const { issues } = deserializeFromFlatWithIssues(badCodePayload, BP_WT);
  enrichSimplifiedMessagesWithSource(issues, badCodeText, { webTemplate: BP_WT });
  const mismatch = issues.find((i) => i.kind === "coded-text-mismatch");
  assertExists(mismatch, "expected coded-text-mismatch issue");
  assertEquals(mismatch.sourceLine, badCodeLine);
});

Deno.test("STRUCTURED JSON: exact sourceLine on invalid unit and missing-content guidance", () => {
  const structuredPayload = {
    ctx: {
      language: "en",
      territory: "DE",
      composer_name: "Dr Test",
      time: "2024-01-01T10:00:00Z",
      setting: "228",
    },
    [ROOT]: {
      blood_pressure_training_sample: [
        {
          systolic: [{ "|magnitude": 120, "|unit": "furlong" }],
          position: [{ "|code": "at1000", "|value": "Standing", "|terminology": "local" }],
        },
      ],
    },
  };
  const structuredText = JSON.stringify(structuredPayload, null, 2);
  const badUnitLine = structuredText.split("\n").findIndex((l) => l.includes('"furlong"')) + 1;

  const { composition } = deserializeFromStructuredWithIssues(structuredPayload, BP_WT);
  const validator = new TemplateValidator();
  const result = validator.validate(composition, BP_OPT, {
    jsonSource: structuredText,
    webTemplate: BP_WT,
  });

  const unitErr = result.errors.find((e) => e.message.includes("furlong"));
  assertExists(unitErr, "expected unit error in STRUCTURED JSON");
  assertEquals(unitErr.sourceLine, badUnitLine);
  assert(!unitErr.sourceIsAncestor);

  // Also check missing required `|unit` in STRUCTURED JSON -> ancestor line + example
  const missingUnitStructured = {
    ctx: structuredPayload.ctx,
    [ROOT]: {
      blood_pressure_training_sample: [
        {
          systolic: [{ "|magnitude": 120 }],
          position: [{ "|code": "at1000", "|value": "Standing", "|terminology": "local" }],
        },
      ],
    },
  };
  const missingUnitText = JSON.stringify(missingUnitStructured, null, 2);
  const systolicMagLine = missingUnitText.split("\n").findIndex((l) =>
    l.includes('"|magnitude": 120')
  ) + 1;
  const { composition: c2 } = deserializeFromStructuredWithIssues(
    missingUnitStructured,
    BP_WT,
  );
  const res2 = validator.validate(c2, BP_OPT, {
    jsonSource: missingUnitText,
    webTemplate: BP_WT,
  });
  const missingErr = res2.errors.find((e) =>
    e.message.includes("units") && e.message.includes("required")
  );
  assertExists(missingErr, "expected missing required units error in STRUCTURED JSON");
  assert(
    missingErr.sourceLine !== undefined && missingErr.sourceLine <= systolicMagLine,
    `expected ancestor line near systolic object (got ${missingErr.sourceLine}, mag at ${systolicMagLine})`,
  );
  assertEquals(missingErr.sourceIsAncestor, true);
  assertStringIncludes(missingErr.expectedExample ?? "", '"|unit"');
});

Deno.test("Canonical JSON: missing required attribute falls back to parent container line with expectedExample", () => {
  const canonicalObj = {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Blood pressure" },
    archetype_node_id: "openEHR-EHR-COMPOSITION.report.v1",
    language: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
      code_string: "en",
    },
    territory: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_3166-1" },
      code_string: "DE",
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
    composer: { _type: "PARTY_IDENTIFIED", name: "Dr Test" },
    context: {
      _type: "EVENT_CONTEXT",
      start_time: { _type: "DV_DATE_TIME", value: "2024-01-01T10:00:00Z" },
      // `setting` intentionally omitted!
    },
  };
  const canonicalText = JSON.stringify(canonicalObj, null, 2);
  const contextLine = canonicalText.split("\n").findIndex((l) => l.includes('"context":')) + 1;

  const validator = new TemplateValidator();
  const result = validator.validate(canonicalObj, BP_OPT, {
    jsonSource: canonicalText,
    webTemplate: BP_WT,
  });

  const settingErr = result.errors.find((e) =>
    e.path.includes("setting") || e.message.toLowerCase().includes("setting")
  );
  assertExists(settingErr, "expected missing setting error");
  assertEquals(settingErr.sourceLine, contextLine);
  assertEquals(settingErr.sourceIsAncestor, true);
  assertStringIncludes(settingErr.expectedExample ?? "", '"setting"');
  assertStringIncludes(settingErr.expectedExample ?? "", "DV_CODED_TEXT");
});
