/**
 * #318: Ferro workbench compositions — canonical RM validation and FLAT diff
 * (ferroehr profile, ehrtslib-built Web Template vs ferro-flat-0N.json).
 *
 * Canonical JSON files from penpad-clinergy-workbench were not available in this
 * environment; compositions are recovered by deserializing Ferro FLAT with
 * Ferro's exported Web Template (same clinical content Ferro accepted).
 */
import { assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/mod.ts";
import {
  JsonCanonicalDeserializer,
  JsonCanonicalSerializer,
} from "../../../../serialization/json/mod.ts";
import {
  buildWebTemplate,
  deserializeFromFlatWithIssues,
  serializeToFlat,
  validateFlatPayload,
  type FlatPayload,
} from "../../../../serialization/simplified/mod.ts";
import { RMSpecificationValidator } from "../../../../validation/rm_specification_validator.ts";
import { TemplateValidator } from "../../../../validation/template_validator.ts";

const OPT = new URL(
  "../../../fixtures/ferroehr/thumb-pain-encounter.v2-coded.opt",
  import.meta.url,
);
const FERRO_WT_URL = new URL(
  "../../../fixtures/ferroehr/ferro-flat/wt.json",
  import.meta.url,
);
const FERRO_BUILD = { cdrProfile: "ferroehr" as const };
const FLAT_SERIALIZE = { cdrProfile: "ferroehr" as const };

const opt = parseOptXml(Deno.readTextFileSync(OPT)).operationalTemplate!;
const ehrtslibWt = buildWebTemplate(opt, FERRO_BUILD);
const ferroWt = JSON.parse(Deno.readTextFileSync(FERRO_WT_URL));

type FlatDiff = {
  n: number;
  onlyFerro: string[];
  onlyEhrtslib: string[];
  valueMismatch: { key: string; ferro: unknown; ehrtslib: unknown }[];
  templateErrors: string[];
  rmErrors: string[];
  rmSpecErrors: string[];
  templateErrorsAfterCanonical: string[];
};

function diffFlat(ferro: FlatPayload, ours: FlatPayload): Omit<FlatDiff, "n" | "templateErrors" | "rmErrors"> {
  const keys = new Set([...Object.keys(ferro), ...Object.keys(ours)]);
  const onlyFerro: string[] = [];
  const onlyEhrtslib: string[] = [];
  const valueMismatch: FlatDiff["valueMismatch"] = [];
  for (const key of [...keys].sort()) {
    const a = ferro[key];
    const b = ours[key];
    if (b === undefined) onlyFerro.push(key);
    else if (a === undefined) onlyEhrtslib.push(key);
    else if (a !== b) valueMismatch.push({ key, ferro: a, ehrtslib: b });
  }
  return { onlyFerro, onlyEhrtslib, valueMismatch };
}

function analyzeFlat(n: number): FlatDiff {
  const flatUrl = new URL(
    `../../../fixtures/ferroehr/ferro-flat/ferro-flat-${String(n).padStart(2, "0")}.json`,
    import.meta.url,
  );
  const ferroFlat = JSON.parse(Deno.readTextFileSync(flatUrl)) as FlatPayload;
  const { composition: comp, issues } = deserializeFromFlatWithIssues(
    ferroFlat,
    ferroWt,
    {
      contextDefaults: "apply",
      clock: () => ferroFlat["ctx/time"] as string,
      unknownKeys: "warning",
    },
  );
  const deserializeErrors = issues.filter((i) => i.kind === "unknown-key" && i.severity === "error");
  if (deserializeErrors.length) {
    throw new Error(deserializeErrors.map((i) => i.message).join("; "));
  }
  const validator = new TemplateValidator({ validateUnits: false });
  const v = validator.validate(comp as never, opt as never);
  const templateErrorsBefore = v.errors.map((e) => `${e.path}: ${e.message}`);

  const canonical = new JsonCanonicalSerializer().serialize(comp);
  const round = new JsonCanonicalDeserializer().deserialize(canonical);
  const v2 = validator.validate(round as never, opt as never);
  const templateErrorsAfterCanonical = v2.errors.map((e) => `${e.path}: ${e.message}`);
  const rmSpec = new RMSpecificationValidator(false);
  const rmSpecErrors = rmSpec.validateInstance(round).map(
    (e) => `${e.path}: ${e.message}`,
  );

  const ours = serializeToFlat(round, ehrtslibWt, FLAT_SERIALIZE);
  const { onlyFerro, onlyEhrtslib, valueMismatch } = diffFlat(ferroFlat, ours);
  const val = validateFlatPayload(ours, ehrtslibWt, FERRO_BUILD);
  const templateErrors = val.errors.map((e) => `${e.path ?? ""}: ${e.message}`);

  return {
    n,
    onlyFerro,
    onlyEhrtslib,
    valueMismatch,
    templateErrors,
    rmErrors: templateErrorsBefore,
    rmSpecErrors,
    templateErrorsAfterCanonical,
  };
}

const REPORT: FlatDiff[] = [];
for (let i = 1; i <= 7; i++) REPORT.push(analyzeFlat(i));

Deno.test("#318 Ferro compositions: RM spec valid after canonical round-trip", () => {
  for (const r of REPORT) {
    assertEquals(
      r.rmSpecErrors,
      [],
      `composition ${r.n}: RM spec errors: ${r.rmSpecErrors.join("; ")}`,
    );
  }
});

Deno.test("#318 write Ferro FLAT diff report artifact", () => {
  const lines: string[] = [
    "# Ferro workbench FLAT vs ehrtslib (ferroehr profile)",
    "",
    "Compositions sourced from Ferro FLAT fixtures (workbench canonical JSON not in repo).",
    "Pipeline: Ferro WT deserialize → JsonCanonical round-trip → TemplateValidator →",
    "serializeToFlat with ehrtslib WT + `cdrProfile: ferroehr`.",
    "",
  ];
  let totalOnlyFerro = 0;
  let totalOnlyEhrtslib = 0;
  let totalMismatch = 0;
  for (const r of REPORT) {
    totalOnlyFerro += r.onlyFerro.length;
    totalOnlyEhrtslib += r.onlyEhrtslib.length;
    totalMismatch += r.valueMismatch.length;
    lines.push(`## Composition ${r.n}`);
    lines.push(`- keys only in Ferro FLAT: ${r.onlyFerro.length}`);
    lines.push(`- keys only in ehrtslib FLAT: ${r.onlyEhrtslib.length}`);
    lines.push(`- value mismatches: ${r.valueMismatch.length}`);
    lines.push(`- validateFlatPayload errors (ehrtslib WT): ${r.templateErrors.length}`);
    lines.push(`- template validator after canonical: ${r.templateErrorsAfterCanonical.length}`);
    lines.push(`- RM spec after canonical: ${r.rmSpecErrors.length}`);
    if (r.onlyFerro.length) {
      lines.push("", "Only Ferro:", ...r.onlyFerro.map((k) => `- ${k}`));
    }
    if (r.onlyEhrtslib.length) {
      lines.push("", "Only ehrtslib:", ...r.onlyEhrtslib.map((k) => `- ${k}`));
    }
    if (r.valueMismatch.length) {
      lines.push("", "Value mismatches (first 20):");
      for (const m of r.valueMismatch.slice(0, 20)) {
        lines.push(`- ${m.key}: Ferro=${JSON.stringify(m.ferro)} ehrtslib=${JSON.stringify(m.ehrtslib)}`);
      }
    }
    if (r.templateErrors.length) {
      lines.push("", "Validator errors:", ...r.templateErrors.map((e) => `- ${e}`));
    }
    lines.push("");
  }
  lines.push("## Totals", `- only Ferro: ${totalOnlyFerro}`, `- only ehrtslib: ${totalOnlyEhrtslib}`, `- mismatches: ${totalMismatch}`);
  const out = "/opt/cursor/artifacts/ferro-flat-diff-report.md";
  try {
    Deno.mkdirSync("/opt/cursor/artifacts", { recursive: true });
    Deno.writeTextFileSync(out, lines.join("\n"));
  } catch (e) {
    console.warn("Could not write artifact:", e);
  }
});