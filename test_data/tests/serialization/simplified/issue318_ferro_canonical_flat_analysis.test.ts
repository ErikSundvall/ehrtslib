/**
 * #318: Ferro workbench — canonical RM check and FLAT diff vs ferro-flat-0N.json
 * for both FLAT flavours with `cdrProfile: "ferroehr"`.
 *
 * Workbench canonical JSON was not in-repo; compositions come from Ferro FLAT exports.
 * No live FerroEHR POST was performed for either flavour.
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
  type SimplifiedFlavor,
} from "../../../../serialization/simplified/mod.ts";
import { RMSpecificationValidator } from "../../../../validation/rm_specification_validator.ts";

const OPT = new URL(
  "../../../fixtures/ferroehr/thumb-pain-encounter.v2-coded.opt",
  import.meta.url,
);
const FERRO_WT_URL = new URL(
  "../../../fixtures/ferroehr/ferro-flat/wt.json",
  import.meta.url,
);
const FERRO_BUILD = { cdrProfile: "ferroehr" as const };

const opt = parseOptXml(Deno.readTextFileSync(OPT)).operationalTemplate!;
const ehrtslibWt = buildWebTemplate(opt, FERRO_BUILD);
const ferroWt = JSON.parse(Deno.readTextFileSync(FERRO_WT_URL));

type FlavorTotals = {
  onlyFerro: number;
  onlyEhrtslib: number;
  mismatch: number;
};

type DiffRow = FlavorTotals & { n: number; flavor: SimplifiedFlavor };

function diffFlat(ferro: FlatPayload, ours: FlatPayload): FlavorTotals {
  const keys = new Set([...Object.keys(ferro), ...Object.keys(ours)]);
  let onlyFerro = 0;
  let onlyEhrtslib = 0;
  let mismatch = 0;
  for (const key of keys) {
    const a = ferro[key];
    const b = ours[key];
    if (b === undefined) onlyFerro++;
    else if (a === undefined) onlyEhrtslib++;
    else if (a !== b) mismatch++;
  }
  return { onlyFerro, onlyEhrtslib, mismatch };
}

function compositionFromFerroFlat(ferroFlat: FlatPayload): unknown {
  const { composition, issues } = deserializeFromFlatWithIssues(
    ferroFlat,
    ferroWt,
    {
      contextDefaults: "apply",
      clock: () => ferroFlat["ctx/time"] as string,
      unknownKeys: "warning",
    },
  );
  const deserializeErrors = issues.filter((i) =>
    i.kind === "unknown-key" && i.severity === "error"
  );
  if (deserializeErrors.length) {
    throw new Error(deserializeErrors.map((i) => i.message).join("; "));
  }
  return new JsonCanonicalDeserializer().deserialize(
    new JsonCanonicalSerializer().serialize(composition),
  );
}

function analyze(n: number, flavor: SimplifiedFlavor): DiffRow {
  const flatUrl = new URL(
    `../../../fixtures/ferroehr/ferro-flat/ferro-flat-${String(n).padStart(2, "0")}.json`,
    import.meta.url,
  );
  const ferroFlat = JSON.parse(Deno.readTextFileSync(flatUrl)) as FlatPayload;
  const round = compositionFromFerroFlat(ferroFlat);
  const ours = serializeToFlat(round, ehrtslibWt, {
    cdrProfile: "ferroehr",
    flavor,
  });
  const d = diffFlat(ferroFlat, ours);
  const val = validateFlatPayload(ours, ehrtslibWt, FERRO_BUILD);
  assertEquals(val.errors, [], `comp ${n} ${flavor}: validateFlatPayload`);
  return { n, flavor, ...d };
}

const INPUT_ROWS: DiffRow[] = [];
const OUTPUT_ROWS: DiffRow[] = [];
for (let i = 1; i <= 7; i++) {
  INPUT_ROWS.push(analyze(i, "input"));
  OUTPUT_ROWS.push(analyze(i, "output"));
}

function sum(rows: DiffRow[]): FlavorTotals {
  return rows.reduce(
    (acc, r) => ({
      onlyFerro: acc.onlyFerro + r.onlyFerro,
      onlyEhrtslib: acc.onlyEhrtslib + r.onlyEhrtslib,
      mismatch: acc.mismatch + r.mismatch,
    }),
    { onlyFerro: 0, onlyEhrtslib: 0, mismatch: 0 },
  );
}

export const FERRO_FLAT_DIFF = {
  input: sum(INPUT_ROWS),
  output: sum(OUTPUT_ROWS),
  inputByComp: INPUT_ROWS,
  outputByComp: OUTPUT_ROWS,
};

Deno.test("#318 Ferro compositions: RM spec valid after canonical round-trip", () => {
  const rmSpec = new RMSpecificationValidator(false);
  for (let i = 1; i <= 7; i++) {
    const flatUrl = new URL(
      `../../../fixtures/ferroehr/ferro-flat/ferro-flat-${String(i).padStart(2, "0")}.json`,
      import.meta.url,
    );
    const ferroFlat = JSON.parse(Deno.readTextFileSync(flatUrl)) as FlatPayload;
    const round = compositionFromFerroFlat(ferroFlat);
    const rmSpecErrors = rmSpec.validateInstance(round).map(
      (e) => `${e.path}: ${e.message}`,
    );
    assertEquals(rmSpecErrors, [], `composition ${i}: ${rmSpecErrors.join("; ")}`);
  }
});

Deno.test("#318 report Ferro FLAT diff totals (input vs output)", () => {
  console.log("FERRO_FLAT_DIFF", JSON.stringify(FERRO_FLAT_DIFF, null, 2));
  try {
    const lines = [
      "# Ferro FLAT diff (ehrtslib WT, cdrProfile: ferroehr)",
      "",
      "Ferro export fixtures are input-shaped; no live Ferro POST verified.",
      "",
      "## Totals (7 compositions)",
      "",
      "| Flavour | Only Ferro keys | Only ehrtslib keys | Value mismatches |",
      "|---------|----------------:|-------------------:|-----------------:|",
      `| input | ${FERRO_FLAT_DIFF.input.onlyFerro} | ${FERRO_FLAT_DIFF.input.onlyEhrtslib} | ${FERRO_FLAT_DIFF.input.mismatch} |`,
      `| output | ${FERRO_FLAT_DIFF.output.onlyFerro} | ${FERRO_FLAT_DIFF.output.onlyEhrtslib} | ${FERRO_FLAT_DIFF.output.mismatch} |`,
      "",
    ];
    for (const flavor of ["input", "output"] as const) {
      lines.push(`### Per composition (${flavor})`);
      for (const row of FERRO_FLAT_DIFF[`${flavor}ByComp`]) {
        lines.push(
          `- ${row.n}: only Ferro ${row.onlyFerro}, only ehrtslib ${row.onlyEhrtslib}, mismatches ${row.mismatch}`,
        );
      }
      lines.push("");
    }
    Deno.mkdirSync("/opt/cursor/artifacts", { recursive: true });
    Deno.writeTextFileSync(
      "/opt/cursor/artifacts/ferro-flat-diff-report.md",
      lines.join("\n"),
    );
  } catch {
    // artifact dir optional in CI
  }
});