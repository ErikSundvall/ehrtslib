/**
 * Automerge 3 multi-caller adapter and the concurrent apply policy (#170).
 */

import { assert, assertEquals } from "@std/assert";
import {
  bindTemplate,
  type BuildContext,
  CbOperationError,
  ROOT_TARGET,
} from "../../../contribution_builder/mod.ts";
import {
  AUTOMERGE_ANNOUNCEMENT,
  AutomergeOperationLogAdapter,
  createMultiCaller,
  mergeCaller,
  recordNativeText,
} from "../../../addons/cb_automerge/mod.ts";

const OPT = new URL(
  "../../opt14/ehrbase_blood_pressure_simple.de.v0.opt",
  import.meta.url,
);

function ctx(id: string, replica: string, start: number): BuildContext {
  let n = start;
  let t = start;
  return {
    author: { id, name: id },
    replica,
    now: () => new Date(Date.UTC(2026, 0, 2, 0, 0, t++)).toISOString(),
    uuid: () => `00000000-0000-4000-8000-${(n++).toString().padStart(12, "0")}`,
  };
}

async function started() {
  const template = await bindTemplate(await Deno.readTextFile(OPT));
  const a = createMultiCaller(ctx("ann", "a", 1));
  const draft = a.build.newComposition(template, {
    language: "en",
    territory: "SE",
  });
  const obs = a.build.listNodeKeys(draft)[0];
  a.build.setValue(draft, obs, "name/value", "base", { rev: a.build.logRev() });
  return { template, a, draft, obs };
}

Deno.test("multi-caller requires rev and announces automerge-3 (#170, #243)", async () => {
  const { a, draft, obs } = await started();
  assertEquals(a.announcement, AUTOMERGE_ANNOUNCEMENT);
  assertEquals(a.announcement.requireRev, true);
  let code = "";
  try {
    a.build.setValue(draft, obs, "name/value", "no-rev");
  } catch (e) {
    code = e instanceof CbOperationError ? e.code : "";
  }
  assertEquals(code, "rev-required");
});

Deno.test("a stale concurrent set-value is skipped, not last-writer-wins (#170)", async () => {
  const { a, draft, obs } = await started();
  const base = a.build.logRev();
  const bytes = a.adapter.save();
  const b = createMultiCaller(ctx("bob", "b", 50), {
    bytes,
    buildId: a.build.buildId,
  });
  a.build.setValue(draft, obs, "name/value", "alpha", { rev: base });
  b.build.setValue(draft, obs, "name/value", "beta", { rev: base });
  const skips = mergeCaller(a, b.adapter);
  const name = (a.build.toCanonicalJson(draft) as {
    content: Array<{ name: { value: string } }>;
  }).content[0].name.value;
  assertEquals(name, "alpha");
  assertEquals(skips.some((s) => s.reason === "changed-by-someone-else"), true);
  const other = createMultiCaller(ctx("bob", "b", 50), {
    bytes: b.adapter.save(),
    buildId: a.build.buildId,
  });
  mergeCaller(other, AutomergeOperationLogAdapter.load(a.adapter.save()));
  assertEquals(
    (other.build.toCanonicalJson(draft) as {
      content: Array<{ name: { value: string } }>;
    }).content[0].name.value,
    "alpha",
  );
});

Deno.test("remove wins over a later edit; a missing anchor appends (#170)", async () => {
  const { a, draft, obs } = await started();
  const copy = structuredClone(
    (a.build.toCanonicalJson(draft) as { content: unknown[] }).content[0],
  );
  stripUids(copy);
  const second = a.build.addInstance(draft, ROOT_TARGET, "content", copy);
  const bytes = a.adapter.save();
  const b = createMultiCaller(ctx("bob", "b", 80), {
    bytes,
    buildId: a.build.buildId,
  });
  a.build.removeInstance(draft, obs);
  b.build.addInstance(draft, ROOT_TARGET, "content", copy, { before: obs });
  const skips = mergeCaller(b, a.adapter);
  assertEquals(
    skips.some((s) => s.reason === "anchor-missing-appended"),
    true,
  );
  const content =
    (b.build.toCanonicalJson(draft) as { content: unknown[] }).content;
  assertEquals(content.length, 2);
  assertEquals(
    (content as Array<{ uid: { value: string } }>).some((n) =>
      n.uid.value.endsWith(`::${second}`)
    ),
    true,
  );

  const edit = createMultiCaller(ctx("cy", "c", 300), {
    bytes,
    buildId: a.build.buildId,
  });
  const lone = createMultiCaller(ctx("ann", "a", 200), {
    bytes,
    buildId: a.build.buildId,
  });
  lone.build.removeInstance(draft, obs);
  edit.build.setValue(draft, obs, "name/value", "too late", {
    rev: edit.build.logRev(),
  });
  const skippedEdit = mergeCaller(edit, lone.adapter);
  assertEquals(
    skippedEdit.some((s) => s.reason === "target-removed"),
    true,
  );
  assertEquals(
    JSON.stringify(edit.build.toCanonicalJson(draft)).includes("too late"),
    false,
  );
});

Deno.test("operations after record-commit are skipped (#170)", async () => {
  const { a, draft, obs } = await started();
  const bytes = a.adapter.save();
  const b = createMultiCaller(ctx("bob", "b", 40), {
    bytes,
    buildId: a.build.buildId,
  });
  a.build.recordCommit(draft, {
    versionUid: "obj::cdr::1",
    changeType: "249",
    lifecycleState: "532",
    logSha256: "abc",
  });
  b.build.setValue(draft, obs, "name/value", "after", {
    rev: b.build.logRev(),
  });
  const skips = mergeCaller(a, b.adapter);
  assertEquals(skips.some((s) => s.reason === "already-committed"), true);
  assertEquals(a.build.getDraft(draft).committed?.versionUid, "obj::cdr::1");
});

Deno.test("native automerge text merges concurrent inserts (#170)", async () => {
  const { a, draft, obs } = await started();
  a.adapter.seedText(draft, obs, "name/value", "ab");
  const bytes = a.adapter.save();
  const b = createMultiCaller(ctx("bob", "b", 30), {
    bytes,
    buildId: a.build.buildId,
  });
  a.build.editText(
    draft,
    obs,
    "name/value",
    { at: 0, delete: 0, insert: "X" },
    {
      rev: a.build.logRev(),
    },
  );
  b.build.editText(
    draft,
    obs,
    "name/value",
    { at: 2, delete: 0, insert: "Y" },
    {
      rev: b.build.logRev(),
    },
  );
  mergeCaller(a, b.adapter);
  mergeCaller(b, AutomergeOperationLogAdapter.load(a.adapter.save()));
  const mergedA = a.adapter.nativeText(draft, obs, "name/value")!;
  const mergedB = b.adapter.nativeText(draft, obs, "name/value")!;
  assertEquals(mergedA, mergedB);
  assert(
    mergedA.includes("X") && mergedA.includes("Y") && mergedA.includes("ab") ||
      (mergedA.includes("X") && mergedA.includes("Y") &&
        mergedA.includes("a") && mergedA.includes("b")),
  );
  assertEquals(recordNativeText(a, draft, obs, "name/value"), true);
  const name = (a.build.toCanonicalJson(draft) as {
    content: Array<{ name: { value: string } }>;
  }).content[0].name.value;
  assertEquals(name, mergedA);
  const replay = createMultiCaller(ctx("zz", "z", 1), {
    bytes: a.adapter.save(),
    buildId: a.build.buildId,
  });
  assertEquals(
    (replay.build.toCanonicalJson(draft) as {
      content: Array<{ name: { value: string } }>;
    }).content[0].name.value,
    mergedA,
  );
  assertEquals(replay.adapter.nativeText(draft, obs, "name/value"), mergedA);
});

function stripUids(value: unknown) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach(stripUids);
    return;
  }
  const rec = value as Record<string, unknown>;
  delete rec.uid;
  Object.values(rec).forEach(stripUids);
}
