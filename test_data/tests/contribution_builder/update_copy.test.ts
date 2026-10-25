// deno-lint-ignore-file no-explicit-any
/**
 * CB phase 1: update-version, copy-version and conflict data (#167, ADR 0009).
 * Network-free: "stored" versions are commit bodies, as a CDR would return them.
 */

import {
  assert,
  assertEquals,
  assertMatch,
  assertNotEquals,
  assertRejects,
  assertThrows,
} from "@std/assert";
import {
  bindTemplate,
  type BoundTemplate,
  CbOperationError,
  type CommitConfig,
  CommitConflictError,
  CommitError,
  ContributionBuild,
  detectConflicts,
  DraftValidator,
  ItsRestContributionAdapter,
  ItsRestError,
  nextVersionUid,
  prepareContribution,
  upConvertFromAdl14,
  usesAdl14Codes,
} from "../../../contribution_builder/mod.ts";

const OPT14 = new URL("../../opt14/", import.meta.url);
let tpl: BoundTemplate | undefined;
let val: DraftValidator | undefined;
const CONFIG: CommitConfig = {
  systemId: "org.example.deployment",
  silenceMissingOriginatingAudit: true,
};
const COMMITTER = { _type: "PARTY_IDENTIFIED", name: "Committer" };
const SYSTOLIC = (magnitude: number) => ({
  _type: "ELEMENT",
  archetype_node_id: "id5",
  name: { _type: "DV_TEXT", value: "Systolic" },
  value: { _type: "DV_QUANTITY", magnitude, units: "mm[Hg]" },
});

async function base() {
  tpl ??= await bindTemplate(
    await Deno.readTextFile(
      new URL("ehrbase_blood_pressure_simple.de.v0.opt", OPT14),
    ),
  );
  val ??= await DraftValidator.create();
  return { t: tpl, v: val };
}

/** A committed version as the CDR returns it (ADL 1.4 codes, root uid set). */
async function storedV1(): Promise<any> {
  const { t, v } = await base();
  const b = ContributionBuild.create({ author: { id: "author-1" } });
  const d = b.newComposition(t, { language: "en", territory: "SE" });
  b.setComposer(d, { _type: "PARTY_IDENTIFIED", name: "Dr A" });
  b.addInstance(d, b.findNodeKey(d, "id4")!, "items", SYSTOLIC(120));
  const p = await prepareContribution(b, v, CONFIG, {
    drafts: [{ draftId: d, template: t }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  return (p.body as any).versions[0].data;
}

const systolicOf = (json: any) => json.content[0].data.events[0].data.items[0];

Deno.test("nextVersionUid increments the trunk version", () => {
  assertEquals(nextVersionUid("u::a::1", "b"), "u::b::2");
  assertEquals(nextVersionUid("u::a::7.1.2", "a"), "u::a::8");
  assertThrows(() => nextVersionUid("u", "a"), CommitError);
});

Deno.test("ADL 1.4 data is detected and up-converted", async () => {
  const stored = await storedV1();
  assert(usesAdl14Codes(stored));
  const up = upConvertFromAdl14(stored) as any;
  assertEquals(up.content[0].data.archetype_node_id, "id2");
  assertEquals(
    up.content[0].data.events[0].state.items[0].value.defining_code
      .code_string,
    "at1001",
  );
  assert(!usesAdl14Codes(up));
});

Deno.test("update-version keeps uids, keys nodes without one, commits as 251 with preceding_version_uid", async () => {
  const { t, v } = await base();
  const stored = await storedV1();
  // A node another client added without a uid.
  stored.content[0].data.events[0].data.items.push({
    _type: "ELEMENT",
    archetype_node_id: "at0005",
    name: { _type: "DV_TEXT", value: "Diastolic" },
    value: { _type: "DV_QUANTITY", magnitude: 80, units: "mm[Hg]" },
  });
  const sysUid = systolicOf(stored).uid.value;
  const build = ContributionBuild.create({ author: { id: "author-2" } });
  const d = build.openVersion(t, stored);
  const info = build.getDraft(d);
  assertEquals(info.kind, "modify");
  assertEquals(info.baseVersionUid, stored.uid.value);
  assertEquals(info.provisionalObjectUuid, stored.uid.value.split("::")[0]);
  const json = build.toCanonicalJson(d) as any;
  assertEquals(json.uid, undefined);
  assertEquals(json.feeder_audit, undefined);
  assertEquals(systolicOf(json).uid.value, sysUid); // kept
  assertEquals(systolicOf(json).archetype_node_id, "id5"); // ADL2 codes
  const dia = json.content[0].data.events[0].data.items[1];
  // Fresh key, above every key this replica already used in the version.
  const used = build.listNodeKeys(d).filter((k) => k !== keyOf(dia.uid.value));
  const maxUsed = Math.max(...used.map((k) => Number(k.split(".")[1])));
  assertEquals(keyOf(dia.uid.value), `a.${maxUsed + 1}`);
  assertMatch(dia.uid.value, new RegExp(`^${info.provisionalObjectUuid}::`));

  build.setValue(d, keyOf(sysUid), "value/magnitude", 130);
  const p = await prepareContribution(build, v, CONFIG, {
    drafts: [{ draftId: d, template: t }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  const ver = (p.body as any).versions[0];
  assertEquals(ver.commit_audit.change_type.defining_code.code_string, "251");
  assertEquals(ver.preceding_version_uid.value, stored.uid.value);
  assertEquals(
    ver.data.uid.value,
    nextVersionUid(stored.uid.value, "cdr.example"),
  );
  assertEquals(systolicOf(ver.data).uid.value, sysUid);
  assertEquals(systolicOf(ver.data).value.magnitude, 130);
  assertEquals(p.versions[0].changeType, "251");

  // Replay gives the same draft.
  const replayed = ContributionBuild.fromLog(build.exportLog(), {
    author: { id: "x" },
  });
  assertEquals(replayed.toCanonicalJson(d), build.toCanonicalJson(d));
  assertEquals(replayed.getDraft(d), build.getDraft(d));
});

Deno.test("update-version keeps uids from another versioned-object uuid (server-assigned, #176)", async () => {
  const { t } = await base();
  const stored = await storedV1();
  const oldPrefix = systolicOf(stored).uid.value.split("::")[0];
  stored.uid.value = "11111111-2222-4333-8444-555555555555::cdr.example::1";
  const build = ContributionBuild.create({ author: { id: "u" } });
  const d = build.openVersion(t, stored);
  const sys = systolicOf(build.toCanonicalJson(d));
  assertEquals(sys.uid.value.split("::")[0], oldPrefix);
  build.setValue(d, keyOf(sys.uid.value), "value/magnitude", 99);
  build.setValue(d, sys.uid.value, "value/magnitude", 98); // full uid works too
});

Deno.test("update-version refuses data without a version uid or from another template", async () => {
  const { t } = await base();
  const stored = await storedV1();
  const build = ContributionBuild.create({ author: { id: "u" } });
  const noUid = structuredClone(stored);
  delete noUid.uid;
  assertThrows(
    () => build.openVersion(t, noUid),
    CbOperationError,
    "version uid",
  );
  const other = structuredClone(stored);
  other.archetype_details.template_id.value = "other.template";
  assertThrows(() => build.openVersion(t, other), CbOperationError, "template");
});

Deno.test("copy-version gets fresh uids and commits as 249", async () => {
  const { t, v } = await base();
  const stored = await storedV1();
  const build = ContributionBuild.create({ author: { id: "u" }, replica: "c" });
  const d = build.copyVersion(t, stored);
  const info = build.getDraft(d);
  assertEquals(info.kind, "create");
  assertEquals(info.copiedFrom, stored.uid.value);
  const json = build.toCanonicalJson(d) as any;
  assertEquals(json.uid, undefined);
  const sys = systolicOf(json);
  assertEquals(sys.value.magnitude, 120);
  assertNotEquals(sys.uid.value, systolicOf(stored).uid.value);
  assertMatch(
    sys.uid.value,
    new RegExp(`^${info.provisionalObjectUuid}::c\\.\\d+$`),
  );
  const p = await prepareContribution(build, v, CONFIG, {
    drafts: [{ draftId: d, template: t }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  const ver = (p.body as any).versions[0];
  assertEquals(ver.commit_audit.change_type.defining_code.code_string, "249");
  assertEquals(ver.preceding_version_uid, undefined);
  assertNotEquals(
    ver.data.uid.value.split("::")[0],
    stored.uid.value.split("::")[0],
  );
});

Deno.test("conflict data: changed by them, clean, removed, parent removed, composer", async () => {
  const stored = await storedV1();
  const { t } = await base();
  const build = ContributionBuild.create({ author: { id: "u" } });
  const d = build.openVersion(t, stored);
  const json = build.toCanonicalJson(d) as any;
  const sysKey = keyOf(systolicOf(json).uid.value);
  const posKey = keyOf(json.content[0].data.events[0].state.items[0].uid.value);
  const listKey = keyOf(json.content[0].data.events[0].data.uid.value);
  build.setValue(d, sysKey, "value/magnitude", 140); // they changed it too
  build.setValue(d, posKey, "value/value", "Lying"); // they did not
  build.addInstance(d, listKey, "items", SYSTOLIC(1)); // parent kept
  build.setComposer(d, { _type: "PARTY_IDENTIFIED", name: "Dr C" });

  // Latest: same object, version 2, systolic changed and composer changed.
  const latest = structuredClone(stored);
  latest.uid.value = nextVersionUid(stored.uid.value, "cdr.example");
  systolicOf(latest).value.magnitude = 130;
  latest.composer = { _type: "PARTY_IDENTIFIED", name: "Dr B" };
  const r = detectConflicts(build, d, latest, { statusHint: 409 })!;
  assertEquals(r.statusHint, 409);
  assertEquals(r.baseVersionUid, stored.uid.value);
  assertEquals(r.latestVersionUid, latest.uid.value);
  assertEquals(r.conflicts.length, 2);
  const sys = r.conflicts.find((c) => c.target === sysKey)!;
  assertEquals([sys.reason, sys.match, sys.base, sys.theirs, sys.ours], [
    "changed-by-them",
    "uid",
    120,
    130,
    140,
  ]);
  const comp = r.conflicts.find((c) => c.operation.type === "set-composer")!;
  assertEquals((comp.theirs as any).name, "Dr B");
  assertEquals((comp.base as any).name, "Dr A");
  assertEquals(r.clean.map((c) => c.operation.type), [
    "set-value",
    "add-instance",
  ]);

  // Latest is the base: no conflict.
  assertEquals(detectConflicts(build, d, stored), undefined);

  // They removed the systolic node and the list it sits in.
  const removed = structuredClone(latest);
  delete removed.content[0].data.events[0].data.items;
  const r2 = detectConflicts(build, d, removed)!;
  assertEquals(
    r2.conflicts.find((c) => c.target === sysKey)?.reason,
    "target-removed",
  );
  const gone = structuredClone(latest);
  delete gone.content[0].data.events[0].data;
  const r3 = detectConflicts(build, d, gone)!;
  assertEquals(
    r3.conflicts.find((c) => c.operation.type === "add-instance")?.reason,
    "parent-removed",
  );
});

Deno.test("conflict matching falls back to archetype path when uids are dropped", async () => {
  const stored = await storedV1();
  const { t } = await base();
  const build = ContributionBuild.create({ author: { id: "u" } });
  const d = build.openVersion(t, stored);
  const sysKey = keyOf(systolicOf(build.toCanonicalJson(d)).uid.value);
  build.setValue(d, sysKey, "value/magnitude", 140);
  const latest = structuredClone(stored);
  latest.uid.value = nextVersionUid(stored.uid.value, "cdr.example");
  const dropUids = (v: any) => {
    if (Array.isArray(v)) return v.forEach(dropUids);
    if (!v || typeof v !== "object") return;
    if (v !== latest) delete v.uid;
    Object.values(v).forEach(dropUids);
  };
  dropUids(latest);
  systolicOf(latest).value.magnitude = 125;
  const r = detectConflicts(build, d, latest)!;
  assertEquals(r.conflicts[0].match, "path");
  assertEquals(r.conflicts[0].theirs, 125);
});

Deno.test("record-commit blocks further operations and a second commit; it replays", async () => {
  const { t, v } = await base();
  const build = ContributionBuild.create({ author: { id: "u" } });
  const d = build.newComposition(t, { language: "en", territory: "SE" });
  build.setComposer(d, { _type: "PARTY_SELF" });
  const calls: string[] = [];
  const adapter = new ItsRestContributionAdapter({
    baseUrl: "https://cdr.example/v1",
    fetch: ((url: string, init: RequestInit = {}) => {
      calls.push(`${init.method ?? "GET"} ${url}`);
      return Promise.resolve(Response.json({
        uid: { value: "contrib-1" },
        versions: [{ id: { value: "srv::cdr.example::1" } }],
      }, { status: 201 }));
    }) as typeof fetch,
  });
  const r = await adapter.commit(build, v, CONFIG, "ehr-1", {
    drafts: [{ draftId: d, template: t }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  const committed = build.getDraft(d).committed!;
  assertEquals(committed.versionUid, "srv::cdr.example::1");
  assertEquals(committed.contributionUid, "contrib-1");
  assertEquals(committed.changeType, "249");
  assertEquals(committed.lifecycleState, "532");
  assertEquals(committed.logSha256, r.prepared.logSha256);
  assertEquals(build.exportLog().operations.at(-1)!.type, "record-commit");
  assertThrows(
    () => build.setComposer(d, { _type: "PARTY_SELF" }),
    CbOperationError,
    "committed",
  );
  const e = await assertRejects(
    () =>
      adapter.commit(build, v, CONFIG, "ehr-1", {
        drafts: [{ draftId: d, template: t }],
        committer: COMMITTER,
        creatingSystemId: "cdr.example",
      }),
    CommitError,
  );
  assertEquals(e.code, "already-committed");
  assertEquals(calls.length, 1);
  const replayed = ContributionBuild.fromLog(build.exportLog(), {
    author: { id: "u" },
  });
  assertEquals(replayed.getDraft(d).committed, committed);
});

Deno.test("adapter: any failed commit re-reads the latest version; conflict whatever the status", async () => {
  const { t, v } = await base();
  const stored = await storedV1();
  const latest = structuredClone(stored);
  latest.uid.value = nextVersionUid(stored.uid.value, "cdr.example");
  systolicOf(latest).value.magnitude = 130;
  for (const status of [400, 409, 412, 422]) {
    const build = ContributionBuild.create({ author: { id: "u" } });
    const d = build.openVersion(t, stored);
    build.setValue(
      d,
      keyOf(systolicOf(build.toCanonicalJson(d)).uid.value),
      "value/magnitude",
      140,
    );
    const calls: string[] = [];
    const adapter = new ItsRestContributionAdapter({
      baseUrl: "https://cdr.example/v1",
      fetch: ((url: string, init: RequestInit = {}) => {
        calls.push(`${init.method ?? "GET"} ${url}`);
        if (init.method === "POST") {
          return Promise.resolve(new Response("nope", { status }));
        }
        return Promise.resolve(Response.json(latest));
      }) as typeof fetch,
    });
    const e = await assertRejects(
      () =>
        adapter.commit(build, v, CONFIG, "ehr-1", {
          drafts: [{ draftId: d, template: t }],
          committer: COMMITTER,
          creatingSystemId: "cdr.example",
        }),
      CommitConflictError,
    );
    assertEquals(e.reports[0].statusHint, status);
    assertEquals(e.reports[0].conflicts[0].theirs, 130);
    assertEquals(e.cause.status, status);
    assertEquals(
      calls[1],
      `GET https://cdr.example/v1/ehr/ehr-1/composition/${
        stored.uid.value.split("::")[0]
      }`,
    );
    assertEquals(build.getDraft(d).committed, undefined);
  }
  // Failure without a newer version: the original error.
  const build = ContributionBuild.create({ author: { id: "u" } });
  const d = build.openVersion(t, stored);
  const adapter = new ItsRestContributionAdapter({
    baseUrl: "https://cdr.example/v1",
    fetch: ((_url: string, init: RequestInit = {}) =>
      Promise.resolve(
        init.method === "POST"
          ? new Response("bad", { status: 400 })
          : Response.json(stored),
      )) as typeof fetch,
  });
  await assertRejects(
    () =>
      adapter.commit(build, v, CONFIG, "ehr-1", {
        drafts: [{ draftId: d, template: t }],
        committer: COMMITTER,
        creatingSystemId: "cdr.example",
      }),
    ItsRestError,
  );
});

function keyOf(uid: string): string {
  return uid.slice(uid.indexOf("::") + 2);
}
