// deno-lint-ignore-file no-explicit-any
/**
 * CB phase 1: complete and incomplete validation per node (#165, ADR 0008).
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import {
  bindTemplate,
  type BoundTemplate,
  ContributionBuild,
  type DraftProblem,
  DraftValidator,
  LIFECYCLE_STATE_COMPLETE,
  LIFECYCLE_STATE_INCOMPLETE,
  lifecycleStateFor,
  parseInstancePath,
  problemsForNode,
  ROOT_TARGET,
  TemplateBindingMismatchError,
  validateDraft,
} from "../../../contribution_builder/mod.ts";

const OPT14 = new URL("../../opt14/", import.meta.url);
const cache = new Map<string, BoundTemplate>();
async function template(file: string): Promise<BoundTemplate> {
  if (!cache.has(file)) {
    cache.set(
      file,
      await bindTemplate(await Deno.readTextFile(new URL(file, OPT14))),
    );
  }
  return cache.get(file)!;
}
const BP = "ehrbase_blood_pressure_simple.de.v0.opt";

let validatorCache: DraftValidator | undefined;
async function validator(): Promise<DraftValidator> {
  validatorCache ??= await DraftValidator.create();
  return validatorCache;
}

async function bpDraft(withComposer = true) {
  const t = await template(BP);
  const build = ContributionBuild.create({ author: { id: "user-1" } });
  const draft = build.newComposition(t, { language: "en", territory: "SE" });
  if (withComposer) build.setComposer(draft, { _type: "PARTY_SELF" });
  const key = (nodeId: string) => {
    const k = build.findNodeKey(draft, nodeId);
    assert(k, `no node ${nodeId}`);
    return k;
  };
  return { t, build, draft, key };
}

const systolic = (magnitude: number, units = "mm[Hg]") => ({
  _type: "ELEMENT",
  archetype_node_id: "id5",
  name: { _type: "DV_TEXT", value: "Systolic" },
  value: { _type: "DV_QUANTITY", magnitude, units },
});

function assertCarriesNode(
  p: DraftProblem,
  build: ContributionBuild,
  draft: string,
) {
  assert(p.path.startsWith("/"), p.path);
  assert(p.archetypePath.startsWith("/"), p.archetypePath);
  if (p.node === ROOT_TARGET) {
    assertEquals(p.uid, undefined);
  } else {
    assertEquals(p.uid, build.nodeUid(draft, p.node));
    assert(p.uid!.endsWith(`::${p.node}`));
  }
}

Deno.test("lifecycle states: complete is 532, incomplete is 553", () => {
  assertEquals(LIFECYCLE_STATE_COMPLETE.code, "532");
  assertEquals(LIFECYCLE_STATE_INCOMPLETE.code, "553");
  const dv = lifecycleStateFor("incomplete") as any;
  assertEquals(dv.defining_code.code_string, "553");
  assertEquals(dv.defining_code.terminology_id.value, "openehr");
  assertEquals((lifecycleStateFor("complete") as any).value, "complete");
});

Deno.test("fresh draft from a template skeleton is valid in both modes", async () => {
  const v = await validator();
  for (
    const f of [
      BP,
      "minimal_evaluation.opt",
      "ehrbase_multi_occurrence.de.opt",
      "Test_all_types.opt",
    ]
  ) {
    const t = await template(f);
    const build = ContributionBuild.create({ author: { id: "u" } });
    const d = build.newComposition(t, { language: "en", territory: "SE" });
    build.setComposer(d, { _type: "PARTY_SELF" });
    for (const mode of ["complete", "incomplete"] as const) {
      const r = v.validate(build, d, t, { mode });
      assertEquals(r.errors, [], `${f} ${mode}`);
      assert(r.valid);
      assertEquals(r.mode, mode);
    }
  }
});

Deno.test("unfinished draft passes incomplete validation and lists the missing nodes", async () => {
  const { t, build, draft, key } = await bpDraft();
  const protocol = key("id12");
  const context = key("id1035");
  const obs = key("openEHR-EHR-OBSERVATION.sample_blood_pressure.v1");
  build.removeInstance(draft, protocol);
  build.removeInstance(draft, context);
  const v = await validator();

  const inc = v.validate(build, draft, t, { mode: "incomplete" });
  assert(inc.valid, JSON.stringify(inc.errors));
  assertEquals(inc.lifecycleState, { code: "553", value: "incomplete" });
  const missingIds = inc.missing.map((m) => m.constraintNodeId).filter(
    Boolean,
  );
  assert(missingIds.includes("id12"), JSON.stringify(inc.missing));
  assert(missingIds.includes("id1035"));
  const prot = inc.missing.find((m) => m.constraintNodeId === "id12")!;
  assertEquals(prot.node, obs);
  assertEquals(prot.path, "/content[0]/protocol");
  assertEquals(
    prot.archetypePath,
    "/content[openEHR-EHR-OBSERVATION.sample_blood_pressure.v1]/protocol",
  );
  assertEquals(prot.relativePath, "protocol");
  assertEquals(prot.kind, "missing");
  const ctxMissing = inc.missing.find((m) => m.constraintNodeId === "id1035")!;
  assertEquals(ctxMissing.node, ROOT_TARGET);
  for (const p of inc.missing) assertCarriesNode(p, build, draft);

  const comp = v.validate(build, draft, t, { mode: "complete" });
  assertEquals(comp.valid, false);
  assertEquals(comp.lifecycleState, { code: "532", value: "complete" });
  assertEquals(comp.missing, inc.missing);
  assert(comp.errors.some((e) => e.constraintNodeId === "id12"));
  assert(comp.errors.every((e) => e.kind === "missing"));
});

Deno.test("removing the last member drops the list; HISTORY without events is reported missing", async () => {
  const { t, build, draft, key } = await bpDraft();
  const history = key("id2");
  build.removeInstance(draft, key("id3"));
  const json = build.toCanonicalJson(draft) as any;
  assertEquals("events" in json.content[0].data, false);
  const r = (await validator()).validate(build, draft, t, {
    mode: "incomplete",
  });
  // The RM requires events (or summary): missing, and RM-level, so it fails.
  const ev = r.errors.find((e) => e.constraintType === "rm_invariant")!;
  assertEquals(ev.kind, "missing");
  assertEquals(ev.source, "rm");
  assertEquals(ev.node, history);
  assert(r.missing.some((m) => m.path === "/content[0]/data/events"));
});

Deno.test("incomplete data may be missing but not wrong: wrong values fail both modes", async () => {
  const v = await validator();
  const cases: Array<
    [string, (x: Awaited<ReturnType<typeof bpDraft>>) => string, string]
  > = [
    ["code outside the value set", ({ build, draft, key }) => {
      build.setValue(
        draft,
        key("id9"),
        "value/defining_code/code_string",
        "at9999",
      );
      return key("id9");
    }, "code_list"],
    ["wrong data type", ({ build, draft, key }) => {
      build.setValue(draft, key("id9"), "value", {
        _type: "DV_TEXT",
        value: "sitting",
      });
      return key("id9");
    }, "type"],
    [
      "magnitude outside the range",
      ({ build, draft, key }) =>
        build.addInstance(draft, key("id4"), "items", systolic(5000)),
      "quantity_magnitude",
    ],
    [
      "units not allowed",
      ({ build, draft, key }) =>
        build.addInstance(draft, key("id4"), "items", systolic(120, "kg")),
      "quantity_units",
    ],
  ];
  for (const [label, act, constraintType] of cases) {
    const x = await bpDraft();
    const node = act(x);
    for (const mode of ["complete", "incomplete"] as const) {
      const r = v.validate(x.build, x.draft, x.t, { mode });
      assertEquals(r.valid, false, `${label} ${mode}`);
      const hit = r.errors.find((e) => e.constraintType === constraintType);
      assert(hit, `${label} ${mode}: ${JSON.stringify(r.errors)}`);
      assertEquals(hit.kind, "invalid");
      assertEquals(hit.node, node);
      assertCarriesNode(hit, x.build, x.draft);
      assert(hit.path.endsWith("/value") || hit.path.includes("/value/"));
      assert(problemsForNode(r, node).includes(hit));
      assert(problemsForNode(r, hit.uid!).includes(hit));
    }
  }
  // A valid value in the same place passes.
  const ok = await bpDraft();
  ok.build.addInstance(ok.draft, ok.key("id4"), "items", systolic(120));
  assert(ok.build && v.validate(ok.build, ok.draft, ok.t).valid);
});

Deno.test("RM-level checks: language, territory, category, composer, subject", async () => {
  const v = await validator();
  const run = async (
    act: (x: Awaited<ReturnType<typeof bpDraft>>) => void,
    withComposer = true,
  ) => {
    const x = await bpDraft(withComposer);
    act(x);
    return v.validate(x.build, x.draft, x.t, { mode: "incomplete" });
  };
  const only = (r: Awaited<ReturnType<typeof run>>, path: string) =>
    r.errors.filter((e) => e.path === path && e.source === "rm");

  const lang = await run(({ build, draft }) =>
    build.setValue(draft, ROOT_TARGET, "language/code_string", "qq")
  );
  assertEquals(only(lang, "/language")[0].kind, "invalid");
  assertEquals(only(lang, "/language")[0].node, ROOT_TARGET);

  const terr = await run(({ build, draft }) =>
    build.setValue(draft, ROOT_TARGET, "territory/code_string", "QQ")
  );
  assertEquals(only(terr, "/territory")[0].kind, "invalid");

  const cat = await run(({ build, draft }) =>
    build.setValue(
      draft,
      ROOT_TARGET,
      "category/defining_code/code_string",
      "999",
    )
  );
  assertEquals(only(cat, "/category")[0].kind, "invalid");

  // The RM requires a composer: missing, and still an error when incomplete.
  const noComposer = await run(() => {}, false);
  assertEquals(noComposer.valid, false);
  assertEquals(only(noComposer, "/composer")[0].kind, "missing");
  assert(noComposer.missing.some((m) => m.path === "/composer"));

  const badComposer = await run(({ build, draft }) =>
    build.setComposer(draft, { _type: "PARTY_IDENTIFIED", name: "" })
  );
  assertEquals(only(badComposer, "/composer")[0].kind, "invalid");

  let obs = "";
  const noSubject = await run(({ build, draft, key }) => {
    obs = key("openEHR-EHR-OBSERVATION.sample_blood_pressure.v1");
    build.setValue(draft, obs, "subject", null);
  });
  const subj = only(noSubject, "/content[0]/subject")[0];
  assertEquals(subj.kind, "missing");
  assertEquals(subj.node, obs);
  assertEquals(subj.relativePath, "subject");
});

Deno.test("validation needs the bound template", async () => {
  const { build, draft } = await bpDraft();
  const other = await template("minimal_evaluation.opt");
  assertThrows(
    () => validatorCache!.validate(build, draft, other),
    TemplateBindingMismatchError,
  );
});

Deno.test("validateDraft one-off and replayed builds give the same result", async () => {
  const { t, build, draft, key } = await bpDraft();
  build.removeInstance(draft, key("id12"));
  const a = await validateDraft(build, draft, t, { mode: "incomplete" });
  const replayed = ContributionBuild.fromLog(build.exportLog(), {
    author: { id: "user-2" },
  });
  const b = (await validator()).validate(replayed, draft, t, {
    mode: "incomplete",
  });
  assertEquals(a, b);
});

Deno.test("parseInstancePath reads the validators' path styles", () => {
  const want = [
    { attr: "content", index: 0 },
    { attr: "data" },
    { attr: "items", index: 2 },
    { attr: "value" },
  ];
  assertEquals(parseInstancePath("/content/[0]/data/items/[2]/value/"), want);
  assertEquals(parseInstancePath("/content/0/data/items/2/value/"), want);
  assertEquals(parseInstancePath("/content[0]/data/items[2]/value"), want);
  assertEquals(parseInstancePath("/"), []);
});
