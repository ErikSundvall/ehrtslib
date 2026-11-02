/**
 * Remaining Contribution Builder operations (#171) and optional base rev (#243).
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import {
  bindTemplate,
  type BoundTemplate,
  type BuildContext,
  CbOperationError,
  type CommitConfig,
  CommitError,
  ContributionBuild,
  DraftValidator,
  prepareContribution,
  ROOT_TARGET,
} from "../../../contribution_builder/mod.ts";

const OPT14 = new URL("../../opt14/", import.meta.url);
const BP = "ehrbase_blood_pressure_simple.de.v0.opt";

let templateCache: BoundTemplate | undefined;
async function bpTemplate(): Promise<BoundTemplate> {
  templateCache ??= await bindTemplate(
    await Deno.readTextFile(new URL(BP, OPT14)),
  );
  return templateCache;
}

function ctx(author = "user-1", replica = "a"): BuildContext {
  let n = 0;
  let t = 0;
  return {
    author: { id: author, name: `User ${author}` },
    replica,
    now: () => new Date(Date.UTC(2026, 9, 25, 18, 0, t++)).toISOString(),
    uuid: () => `00000000-0000-4000-8000-${(++n).toString().padStart(12, "0")}`,
  };
}

async function sample() {
  const template = await bpTemplate();
  const build = ContributionBuild.create(ctx());
  const draft = build.newComposition(template, {
    language: "en",
    territory: "SE",
  });
  return { template, build, draft };
}

function walk(tree: unknown, fn: (node: Record<string, unknown>) => void) {
  if (!tree || typeof tree !== "object") return;
  if (Array.isArray(tree)) {
    tree.forEach((x) => walk(x, fn));
    return;
  }
  fn(tree as Record<string, unknown>);
  for (const v of Object.values(tree as Record<string, unknown>)) walk(v, fn);
}

Deno.test("set-value without rev applies; a stale rev is refused (#243)", async () => {
  const { build, draft } = await sample();
  const obs = build.listNodeKeys(draft)[0];
  build.setValue(draft, obs, "name/value", "one");
  const seen = build.logRev();
  build.setValue(draft, obs, "name/value", "two");
  const err = assertThrows(
    () => build.setValue(draft, obs, "name/value", "three", { rev: seen }),
    CbOperationError,
  );
  assertEquals(err.code, "changed-by-someone-else");
  assertEquals(err.currentValue, "two");
  assertEquals(
    (build.toCanonicalJson(draft) as {
      content: Array<{ name: { value: string } }>;
    })
      .content[0].name.value,
    "two",
  );
  // No rev: the single caller writes straight through.
  build.setValue(draft, obs, "name/value", "four");
  const again = ContributionBuild.fromLog(build.exportLog(), ctx("user-2"));
  assertEquals(
    again.toCanonicalJson(draft),
    build.toCanonicalJson(draft),
  );
});

Deno.test("a build that requires rev rejects a text write without one (#243)", async () => {
  const { build, draft } = await sample();
  const obs = build.listNodeKeys(draft)[0];
  build.setRequireTextRev(true);
  const missing = assertThrows(
    () => build.setValue(draft, obs, "name/value", "x"),
    CbOperationError,
  );
  assertEquals(missing.code, "rev-required");
  build.setValue(draft, obs, "name/value", "x", { rev: build.logRev() });
  assertEquals(
    (build.toCanonicalJson(draft) as {
      content: Array<{ name: { value: string } }>;
    })
      .content[0].name.value,
    "x",
  );
});

Deno.test("edit-text splices by Unicode code point and replays (#171)", async () => {
  const { build, draft } = await sample();
  const obs = build.listNodeKeys(draft)[0];
  build.setValue(draft, obs, "name/value", "a😀b");
  build.editText(draft, obs, "name/value", { at: 1, delete: 1, insert: "cd" });
  const json = build.toCanonicalJson(draft) as {
    content: Array<{ name: { value: string } }>;
  };
  assertEquals(json.content[0].name.value, "acdb");
  const replay = ContributionBuild.fromLog(build.exportLog(), ctx());
  assertEquals(replay.toCanonicalJson(draft), build.toCanonicalJson(draft));
  const bad = assertThrows(
    () =>
      build.editText(draft, obs, "name/value", {
        at: 0,
        delete: 50,
        insert: "",
      }),
    CbOperationError,
  );
  assert(bad.message.includes("outside"));
});

Deno.test("move-instance reorders by sibling anchor (#171)", async () => {
  const { build, draft } = await sample();
  const first = build.listNodeKeys(draft)[0];
  const copy = structuredClone(
    (build.toCanonicalJson(draft) as { content: unknown[] }).content[0],
  );
  walk(copy, (node) => {
    if ("uid" in node) delete node.uid;
  });
  const second = build.addInstance(draft, ROOT_TARGET, "content", copy);
  build.moveInstance(draft, second, ROOT_TARGET, "content", { before: first });
  const content = (build.toCanonicalJson(draft) as {
    content: Array<{ uid: { value: string } }>;
  }).content;
  assert(content[0].uid.value.endsWith(`::${second}`));
  assert(content[1].uid.value.endsWith(`::${first}`));
  const replay = ContributionBuild.fromLog(build.exportLog(), ctx());
  assertEquals(replay.toCanonicalJson(draft), build.toCanonicalJson(draft));
});

Deno.test("import can defer uids and assign-uid gives a short key (#171)", async () => {
  const { build, draft } = await sample();
  const doc = structuredClone(build.toCanonicalJson(draft)) as Record<
    string,
    unknown
  >;
  walk(doc, (node) => {
    if ("archetype_node_id" in node) delete node.uid;
  });
  build.importDocument(draft, doc, { format: "canonical", deferUids: true });
  assertEquals(build.listNodeKeys(draft), []);
  const key = build.assignUid(draft, "/content[0]");
  assertEquals(build.nodeUid(draft, key).split("::")[1], key);
  const replay = ContributionBuild.fromLog(build.exportLog(), ctx());
  assertEquals(replay.listNodeKeys(draft), build.listNodeKeys(draft));
  assertEquals(replay.nodeUid(draft, key), build.nodeUid(draft, key));
});

Deno.test("set-lifecycle is what commit records when commit omits mode (#171)", async () => {
  const { template, build, draft } = await sample();
  build.setComposer(draft, { _type: "PARTY_IDENTIFIED", name: "Dr A" });
  build.setLifecycle(draft, "incomplete");
  const validator = await DraftValidator.create();
  const prepared = await prepareContribution(
    build,
    validator,
    { systemId: "org.example" } satisfies CommitConfig,
    {
      drafts: [{ draftId: draft, template }],
      committer: { _type: "PARTY_IDENTIFIED", name: "Committer" },
      creatingSystemId: "cdr.example",
      silenceMissingOriginatingAudit: true,
    },
  );
  assertEquals(prepared.versions[0].lifecycleState, "553");
  assertEquals(build.getDraft(draft).lifecycle, "incomplete");
});

Deno.test("discard keeps the log and commit refuses the draft (#171)", async () => {
  const { template, build, draft } = await sample();
  build.setComposer(draft, { _type: "PARTY_IDENTIFIED", name: "Dr A" });
  const before = build.exportLog().operations.length;
  build.discard(draft);
  assertEquals(build.getDraft(draft).discarded, true);
  assert(build.exportLog().operations.length > before);
  const err = assertThrows(
    () => build.setValue(draft, ROOT_TARGET, "name/value", "nope"),
    CbOperationError,
  );
  assertEquals(err.code, "discarded");
  const validator = await DraftValidator.create();
  const commitErr = await assertRejectsCommit(
    build,
    validator,
    template,
    draft,
  );
  assertEquals(commitErr.code, "discarded");
  const replay = ContributionBuild.fromLog(build.exportLog(), ctx());
  assertEquals(replay.getDraft(draft).discarded, true);
});

Deno.test("migrate-template records a new binding and replays (#171)", async () => {
  const { template, build, draft } = await sample();
  const other = await bindTemplate(
    await Deno.readTextFile(new URL(BP, OPT14)),
    { adl2CodingSystem: "id-coded" },
  );
  build.migrateTemplate(draft, other);
  assertEquals(
    build.getDraft(draft).templateBinding.adl2CodingSystem,
    "id-coded",
  );
  assert(
    build.exportLog().operations.some((op) => op.type === "migrate-template"),
  );
  const replay = ContributionBuild.fromLog(build.exportLog(), ctx());
  assertEquals(
    replay.getDraft(draft).templateBinding.hash.value,
    other.binding.hash.value,
  );
  // The original template object is unused after the migration; keep the binding.
  assertEquals(template.binding.adl2CodingSystem, "at-coded");
});

Deno.test("members: a viewer cannot edit and only a committer commits (#171)", async () => {
  const { template, build, draft } = await sample();
  build.setComposer(draft, { _type: "PARTY_IDENTIFIED", name: "Dr A" });
  build.joinBuild("user-1", "committer", "a", { name: "User user-1" });
  build.joinBuild("nurse", "viewer", "b", {
    name: "Nurse",
    author: { id: "user-1" },
  });
  const obs = build.listNodeKeys(draft)[0];
  const denied = assertThrows(
    () =>
      build.setValue(draft, obs, "name/value", "no", {
        author: { id: "nurse" },
      }),
    CbOperationError,
  );
  assertEquals(denied.code, "viewer");
  build.setRole("nurse", "editor");
  build.setValue(draft, obs, "name/value", "yes", { author: { id: "nurse" } });
  const validator = await DraftValidator.create();
  const blocked = await assertRejectsCommit(build, validator, template, draft);
  assertEquals(blocked.code, "not-committer");
  await prepareContribution(
    build,
    validator,
    { systemId: "org.example", silenceMissingOriginatingAudit: true },
    {
      drafts: [{ draftId: draft, template }],
      committer: { _type: "PARTY_IDENTIFIED", name: "Committer" },
      creatingSystemId: "cdr.example",
      memberId: "user-1",
    },
  );
});

Deno.test("data-entry participations are added once per author and entry (#171)", async () => {
  const { build, draft } = await sample();
  const obs = build.listNodeKeys(draft)[0];
  build.setValue(draft, obs, "name/value", "sitting", {
    author: { id: "nurse", name: "Nurse" },
  });
  build.ensureDataEntryParticipations();
  build.ensureDataEntryParticipations();
  const entry = (build.toCanonicalJson(draft) as {
    content: Array<{
      other_participations?: Array<{
        function: { value: string };
        performer: { external_ref: { id: { value: string } } };
      }>;
    }>;
  }).content[0];
  assertEquals(entry.other_participations?.length, 1);
  assertEquals(entry.other_participations?.[0].function.value, "data entry");
  assertEquals(
    entry.other_participations?.[0].performer.external_ref.id.value,
    "nurse",
  );
});

Deno.test("text edits compact to one set-value per author and field (#171)", async () => {
  const { build, draft } = await sample();
  const obs = build.listNodeKeys(draft)[0];
  build.setValue(draft, obs, "name/value", "a");
  build.editText(draft, obs, "name/value", { at: 1, delete: 0, insert: "b" });
  build.setValue(draft, obs, "name/value", "abc", {
    author: { id: "user-2", name: "User user-2" },
  });
  const before = build.toCanonicalJson(draft);
  assertEquals(build.compactTextEdits(), true);
  assertEquals(build.toCanonicalJson(draft), before);
  const textOps = build.exportLog().operations.filter((op) =>
    op.type === "set-value" && op.target === obs && op.path === "name/value"
  );
  assertEquals(textOps.map((op) => op.author.id), ["user-1", "user-2"]);
  assertEquals(
    textOps.map((op) => (op.type === "set-value" ? op.value : null)),
    ["ab", "abc"],
  );
  assert(
    !build.exportLog().operations.some((op) => op.type === "edit-text"),
  );
  const replay = ContributionBuild.fromLog(build.exportLog(), ctx());
  assertEquals(replay.toCanonicalJson(draft), before);
  assertEquals(build.compactTextEdits(), false);
});

async function assertRejectsCommit(
  build: ContributionBuild,
  validator: DraftValidator,
  template: BoundTemplate,
  draft: string,
): Promise<CommitError> {
  try {
    await prepareContribution(
      build,
      validator,
      { systemId: "org.example", silenceMissingOriginatingAudit: true },
      {
        drafts: [{ draftId: draft, template }],
        committer: { _type: "PARTY_IDENTIFIED", name: "Committer" },
        creatingSystemId: "cdr.example",
      },
    );
  } catch (e) {
    if (e instanceof CommitError) return e;
    throw e;
  }
  throw new Error("prepareContribution should have failed");
}
