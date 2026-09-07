/**
 * Drive ehrtslib TemplateValidator from Veredictum CNF content decision tables.
 *
 * Core DV_* cases (COUNT, BOOLEAN, CODED_TEXT, TEXT, URI, QUANTITY units) are
 * hard gates. The full CONT catalogue is reported with a minimum pass-rate
 * floor so remaining gaps stay visible without hiding regressions.
 */

import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  buildDvValue,
  cloneJson,
  generateBaseInstance,
  isDvCase,
  listContentCases,
  loadContentCase,
  loadOpt,
  loadTemplateMap,
  outcomeMatches,
  overlayCardinality,
  overlayStringPattern,
  parseDecisionRows,
  setContentCount,
  setContextMode,
  setObservationValue,
  validateAgainstOpt,
} from "./veredictum_harness.ts";

const CORE_CASE_IDS = new Set([
  "CONT-DV_COUNT-validate_range",
  "CONT-DV_COUNT-validate_list",
  "CONT-DV_COUNT-validate_open",
  "CONT-DV_BOOLEAN-only_true_allowed",
  "CONT-DV_BOOLEAN-only_false_allowed",
  "CONT-DV_BOOLEAN-anything_allowed",
  "CONT-DV_CODED_TEXT-validate_local_codes",
  "CONT-DV_TEXT-validate_list",
  "CONT-DV_TEXT-validate_pattern",
  "CONT-DV_URI-validate_pattern",
  "CONT-DV_QUANTITY-validate_property_units",
]);

Deno.test("Veredictum content — OPT parse for every referenced template", async () => {
  const map = await loadTemplateMap();
  const names = await listContentCases();
  const missing: string[] = [];
  const parseFail: string[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const c = await loadContentCase(name);
    const tid = c.constraint_context?.template;
    if (!tid || seen.has(tid)) continue;
    seen.add(tid);
    try {
      const opt = await loadOpt(tid, map);
      if (!opt.definition) parseFail.push(`${tid}: no definition`);
    } catch (e) {
      missing.push(`${tid}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  assertEquals(missing, [], `missing OPTs:\n${missing.join("\n")}`);
  assertEquals(parseFail, [], `parse failures:\n${parseFail.join("\n")}`);
  assert(seen.size >= 40, `expected many content OPTs, got ${seen.size}`);
});

Deno.test("Veredictum content — core DV decision tables", async () => {
  const map = await loadTemplateMap();
  const names = await listContentCases();
  const failures: string[] = [];
  let ran = 0;
  for (const name of names) {
    const c = await loadContentCase(name);
    if (!CORE_CASE_IDS.has(c.id)) continue;
    const rows = parseDecisionRows(c);
    const tid = c.constraint_context?.template;
    if (!tid) {
      failures.push(`${c.id}: no template`);
      continue;
    }
    const opt = await loadOpt(tid, map);
    const base = generateBaseInstance(opt);
    for (const [i, row] of rows.entries()) {
      ran++;
      overlayStringPattern(opt, row.values["C_STRING.pattern"]);
      const instance = cloneJson(base);
      setObservationValue(instance, buildDvValue(c.rm_class, c.id, row.values));
      const result = validateAgainstOpt(instance, opt);
      if (!outcomeMatches(result, row.expected)) {
        failures.push(
          `${c.id} row ${i} expected ${row.expected}, valid=${result.valid}: ${
            result.errors.map((e) => e.message).join("; ") || "(no errors)"
          }`,
        );
      }
    }
  }
  assert(ran >= 20, `expected to run core rows, ran ${ran}`);
  assertEquals(failures, [], failures.join("\n"));
});

Deno.test("Veredictum content — catalogue pass-rate floor", async () => {
  const map = await loadTemplateMap();
  const names = await listContentCases();
  let total = 0;
  let passed = 0;
  const sampleFails: string[] = [];
  for (const name of names) {
    const c = await loadContentCase(name);
    if (c.status === "retired") continue;
    const rows = parseDecisionRows(c);
    const tid = c.constraint_context?.template;
    if (!tid || !rows.length) continue;
    let opt;
    try {
      opt = await loadOpt(tid, map);
    } catch {
      continue;
    }
    const base = generateBaseInstance(opt);
    for (const [i, row] of rows.entries()) {
      total++;
      overlayCardinality(opt, "content", row.values.cardinality);
      overlayStringPattern(opt, row.values["C_STRING.pattern"]);
      const instance = cloneJson(base);
      if (isDvCase(c.rm_class, c.id)) {
        setObservationValue(
          instance,
          buildDvValue(c.rm_class, c.id, row.values),
        );
      } else {
        if (row.values.content_count !== undefined) {
          setContentCount(instance, Number(row.values.content_count));
        }
        if (row.values.context_committed !== undefined) {
          setContextMode(instance, row.values.context_committed);
        }
      }
      const result = validateAgainstOpt(instance, opt);
      if (outcomeMatches(result, row.expected)) {
        passed++;
      } else if (sampleFails.length < 25) {
        sampleFails.push(
          `${c.id}[${i}] want ${row.expected} valid=${result.valid} ${
            result.errors.map((e) => e.constraintType).join(",")
          }`,
        );
      }
    }
  }
  const rate = total ? (passed / total) * 100 : 0;
  console.log(
    `Veredictum content catalogue: ${passed}/${total} (${rate.toFixed(1)}%)`,
  );
  if (sampleFails.length) {
    console.log("Sample mismatches:\n" + sampleFails.join("\n"));
  }
  assert(total >= 200, `expected hundreds of rows, got ${total}`);
  assert(
    rate >= 55,
    `content pass rate ${rate.toFixed(1)}% below 55% floor. Samples:\n${
      sampleFails.join("\n")
    }`,
  );
});
