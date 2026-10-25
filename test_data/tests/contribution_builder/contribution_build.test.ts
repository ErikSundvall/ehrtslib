// deno-lint-ignore-file no-explicit-any
/**
 * CB phase 1: core COMPOSITION build, uids and operation log (#164).
 */

import {
  assert,
  assertEquals,
  assertNotEquals,
  assertThrows,
} from "@std/assert";
import {
  bindTemplate,
  type BoundTemplate,
  type BuildContext,
  CbOperationError,
  ContributionBuild,
  OPERATION_LOG_FORMAT,
  OPERATION_LOG_FORMAT_VERSION,
  OperationLogFormatError,
  ROOT_TARGET,
  SHORT_KEY_RE,
} from "../../../contribution_builder/mod.ts";
import { RMInstanceGenerator } from "../../../generation/rm_instance_generator.ts";
import { JsonCanonicalSerializer } from "../../../serialization/json/mod.ts";
import * as openehr_rm from "../../../openehr_rm.ts";

const OPT14 = new URL("../../opt14/", import.meta.url);
const BP = "ehrbase_blood_pressure_simple.de.v0.opt";

let templateCache: BoundTemplate | undefined;
async function bpTemplate(): Promise<BoundTemplate> {
  templateCache ??= await bindTemplate(
    await Deno.readTextFile(new URL(BP, OPT14)),
  );
  return templateCache;
}

/** Deterministic clock and uuid source. */
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

const serialize = (c: openehr_rm.COMPOSITION) =>
  new JsonCanonicalSerializer().serialize(c, { prettyPrint: false });

/** The OBSERVATION from an example instance of the template, as add-instance input. */
async function exampleObservation() {
  const ex = new RMInstanceGenerator({ mode: "example" }).generate(
    (await bpTemplate()).operationalTemplate,
  );
  return ex.content[0];
}

const DR = {
  _type: "PARTY_IDENTIFIED",
  name: "Dr Example",
  external_ref: {
    _type: "PARTY_REF",
    id: { _type: "GENERIC_ID", value: "SE123", scheme: "HSA" },
    namespace: "demographic",
    type: "PERSON",
  },
};

/** Build used by several tests: skeleton, an observation, edits on nested nodes. */
async function sampleBuild(c = ctx()) {
  const build = ContributionBuild.create(c);
  const draft = build.newComposition(await bpTemplate(), {
    language: "en",
    territory: "SE",
  });
  const obs = build.addInstance(
    draft,
    ROOT_TARGET,
    "content",
    await exampleObservation(),
  );
  return { build, draft, obs };
}

function findNode(
  tree: unknown,
  key: string,
): Record<string, unknown> | undefined {
  let found: Record<string, unknown> | undefined;
  const walk = (v: unknown) => {
    if (found || !v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(walk);
    const rec = v as Record<string, unknown>;
    const uid = (rec.uid as { value?: string } | undefined)?.value;
    if (uid?.endsWith(`::${key}`)) {
      found = rec;
      return;
    }
    Object.values(rec).forEach(walk);
  };
  walk(tree);
  return found;
}

Deno.test("new COMPOSITION build from a bound template", async () => {
  const template = await bpTemplate();
  const build = ContributionBuild.create(ctx());
  const draft = build.newComposition(template, {
    language: "sv",
    territory: "SE",
  });
  const info = build.getDraft(draft);
  assertEquals(info.rmType, "COMPOSITION");
  assertEquals(info.kind, "create");
  assertEquals(info.templateBinding.hash.value, template.binding.hash.value);

  const comp = build.toComposition(draft);
  assert(comp instanceof openehr_rm.COMPOSITION);
  const json = build.toCanonicalJson(draft) as Record<string, any>;
  // Root uid is the version's OBJECT_VERSION_ID, set at commit, never a short-key uid.
  assertEquals(json.uid, undefined);
  // Composer is explicit (ADR 0006), not taken from the generator.
  assertEquals(json.composer, undefined);
  assertEquals(json.language.code_string, "sv");
  assertEquals(json.territory.code_string, "SE");
  assertEquals(
    json.archetype_details.template_id.value,
    template.binding.templateId,
  );
  // Inner LOCATABLEs get <provisional uuid>::<short key>.
  for (const key of build.listNodeKeys(draft)) {
    assert(SHORT_KEY_RE.test(key), key);
    assert(!key.includes("::"));
    assertEquals(
      build.nodeUid(draft, key),
      `${info.provisionalObjectUuid}::${key}`,
    );
  }
});

Deno.test("set, add and remove on nested nodes, addressed by uid", async () => {
  const { build, draft, obs } = await sampleBuild();
  const keysAfterAdd = build.listNodeKeys(draft);
  assert(keysAfterAdd.includes(obs));

  // A nested ELEMENT inside the added OBSERVATION.
  const obsJson = findNode(build.toCanonicalJson(draft), obs)!;
  const elementKey = build.listNodeKeys(draft).find((k) =>
    findNode(obsJson, k)?._type === "ELEMENT"
  )!;
  assert(elementKey, "nested ELEMENT");
  const elementUid = build.nodeUid(draft, elementKey);

  build.setValue(draft, elementUid, "value", {
    _type: "DV_QUANTITY",
    magnitude: 120,
    units: "mm[Hg]",
  });
  build.setValue(draft, elementKey, "value/magnitude", 121);
  assertEquals(
    (findNode(build.toCanonicalJson(draft), elementKey)!.value as any)
      .magnitude,
    121,
  );
  assertEquals(
    (findNode(build.toCanonicalJson(draft), elementKey)!.value as any)._type,
    "DV_QUANTITY",
  );

  build.setValue(draft, elementKey, "value", null);
  assertEquals(
    findNode(build.toCanonicalJson(draft), elementKey)!.value,
    undefined,
  );

  // Second instance at index 0, then remove the first one.
  const countBefore = (build.toCanonicalJson(draft) as any).content.length;
  const first =
    (build.toCanonicalJson(draft) as any).content[0].uid.value.split("::")[1];
  const second = build.addInstance(
    draft,
    ROOT_TARGET,
    "content",
    await exampleObservation(),
    { before: first },
  );
  const third = build.addInstance(
    draft,
    ROOT_TARGET,
    "content",
    await exampleObservation(),
    { after: second },
  );
  const content = (build.toCanonicalJson(draft) as any).content;
  assertEquals(content.length, countBefore + 2);
  assert(content[0].uid.value.endsWith(`::${second}`));
  assert(content[1].uid.value.endsWith(`::${third}`));
  const fresh = await exampleObservation();
  const err = assertThrows(
    () =>
      build.addInstance(draft, ROOT_TARGET, "content", fresh, {
        after: elementKey,
      }),
    CbOperationError,
  );
  assert(err.message.includes("Anchor"), err.message);
  build.removeInstance(draft, third);
  build.removeInstance(draft, obs);
  assertEquals(
    (build.toCanonicalJson(draft) as any).content.length,
    countBefore,
  );
  assertEquals(findNode(build.toCanonicalJson(draft), elementKey), undefined);
  assert(!build.listNodeKeys(draft).includes(obs));

  build.setComposer(draft, DR);
  const comp = build.toComposition(draft);
  assert(comp instanceof openehr_rm.COMPOSITION);
  assertEquals(
    (build.toCanonicalJson(draft) as any).composer.name,
    "Dr Example",
  );
});

Deno.test("invalid operations throw and leave state and log unchanged", async () => {
  const { build, draft, obs } = await sampleBuild();
  const before = JSON.stringify(build.toCanonicalJson(draft));
  const ops = build.exportLog().operations.length;
  assertThrows(
    () => build.setValue(draft, "a.999", "value", 1),
    CbOperationError,
  );
  assertThrows(
    () => build.setValue(draft, ROOT_TARGET, "composer", DR),
    CbOperationError,
  );
  assertThrows(() => build.setValue(draft, obs, "uid", null), CbOperationError);
  assertThrows(
    () => build.setValue(draft, ROOT_TARGET, "content", null),
    CbOperationError,
  );
  assertThrows(
    () => build.setValue(draft, obs, "data/nonexistent/value", 1),
    CbOperationError,
  );
  assertThrows(
    () => build.removeInstance(draft, ROOT_TARGET),
    CbOperationError,
  );
  assertThrows(
    () => build.setComposer(draft, { _type: "DV_TEXT", value: "x" }),
    CbOperationError,
  );
  assertThrows(
    () =>
      build.addInstance(draft, ROOT_TARGET, "content", {
        _type: "DV_TEXT",
        value: "x",
      }),
    CbOperationError,
  );
  assertThrows(
    () => build.setValue(draft, obs, "name", { value: "untyped" }),
    CbOperationError,
  );
  assertEquals(JSON.stringify(build.toCanonicalJson(draft)), before);
  assertEquals(build.exportLog().operations.length, ops);
});

Deno.test("each operation carries author, replica, seq and timestamp from the caller context", async () => {
  const { build, draft, obs } = await sampleBuild();
  build.setValue(draft, obs, "name/value", "Renamed", {
    author: { id: "user-2", role: "nurse" },
  });
  const ops = build.exportLog().operations;
  assertEquals(ops.map((o) => o.seq), ops.map((_, i) => i + 1));
  assert(
    ops.every((o) =>
      o.replica === "a" && /^2026-10-25T18:00:\d\d\.000Z$/.test(o.timestamp)
    ),
  );
  assertEquals(
    ops.slice(0, -1).map((o) => o.author.id),
    ops.slice(0, -1).map(() => "user-1"),
  );
  assertEquals(ops[ops.length - 1].author, { id: "user-2", role: "nurse" });
});

Deno.test("replaying the same log twice gives identical RM output, including uids", async () => {
  const { build, draft, obs } = await sampleBuild();
  build.setValue(draft, obs, "name/value", "Blood pressure, sitting");
  build.setComposer(draft, DR);
  const log = build.exportLog();
  const a = ContributionBuild.fromLog(log, ctx("user-3"));
  const b = ContributionBuild.fromLog(JSON.stringify(log), ctx("user-4"));
  assertEquals(
    serialize(a.toComposition(draft)),
    serialize(build.toComposition(draft)),
  );
  assertEquals(
    serialize(b.toComposition(draft)),
    serialize(a.toComposition(draft)),
  );
  assertEquals(a.listNodeKeys(draft), build.listNodeKeys(draft));
  const uids = serialize(a.toComposition(draft)).match(/::a\.\d+/g) ?? [];
  assert(uids.length > 5);

  // Building again from scratch with the same inputs gives the same log bytes.
  const again = await sampleBuild();
  again.build.setValue(
    again.draft,
    again.obs,
    "name/value",
    "Blood pressure, sitting",
  );
  again.build.setComposer(again.draft, DR);
  assertEquals(
    (await again.build.exportLogBytes()).sha256,
    (await build.exportLogBytes()).sha256,
  );
});

Deno.test("log export and import round-trips and records its format version", async () => {
  const { build, draft } = await sampleBuild();
  const log = build.exportLog();
  assertEquals(log.format, OPERATION_LOG_FORMAT);
  assertEquals(log.formatVersion, OPERATION_LOG_FORMAT_VERSION);
  assertEquals(log.buildId, build.buildId);
  const { bytes, sha256 } = await build.exportLogBytes();
  const imported = ContributionBuild.fromLog(
    new TextDecoder().decode(bytes),
    ctx(),
  );
  assertEquals(imported.exportLog(), log);
  assertEquals((await imported.exportLogBytes()).sha256, sha256);
  assertEquals(imported.listDrafts(), build.listDrafts());
  assertEquals(
    serialize(imported.toComposition(draft)),
    serialize(build.toComposition(draft)),
  );
});

Deno.test("imported build continues the replica's sequence and keys without reuse", async () => {
  const { build, draft } = await sampleBuild();
  const before = build.listNodeKeys(draft);
  const resumed = ContributionBuild.fromLog(build.exportLog(), ctx());
  const added = resumed.addInstance(
    draft,
    ROOT_TARGET,
    "content",
    await exampleObservation(),
  );
  assert(!before.includes(added));
  const ops = resumed.exportLog().operations;
  assertEquals(ops[ops.length - 1].seq, ops.length);
  // A second replica mints its own keys.
  const other = ContributionBuild.fromLog(
    resumed.exportLog(),
    ctx("user-9", "b2"),
  );
  const key = other.addInstance(
    draft,
    ROOT_TARGET,
    "content",
    await exampleObservation(),
  );
  assert(key.startsWith("b2."), key);
  assertEquals(other.exportLog().operations.at(-1)?.seq, 1);
});

Deno.test("log reader rejects unknown formats and newer versions", async () => {
  const { build } = await sampleBuild();
  const log = build.exportLog();
  assertThrows(
    () => ContributionBuild.fromLog({ ...log, format: "x" as never }, ctx()),
    OperationLogFormatError,
  );
  assertThrows(
    () => ContributionBuild.fromLog({ ...log, formatVersion: 2 }, ctx()),
    OperationLogFormatError,
  );
  const bad = structuredClone(log);
  (bad.operations[1] as { author?: unknown }).author = undefined;
  assertThrows(
    () => ContributionBuild.fromLog(bad, ctx()),
    OperationLogFormatError,
  );
  const tampered = structuredClone(log);
  (tampered.operations[1] as { parent: string }).parent = "a.999";
  assertThrows(
    () => ContributionBuild.fromLog(tampered, ctx()),
    CbOperationError,
  );
});

Deno.test("replica prefixes and short keys never contain '::'", () => {
  assertThrows(
    () => ContributionBuild.create({ ...ctx(), replica: "a::b" }),
    CbOperationError,
  );
  assertThrows(
    () => ContributionBuild.create({ ...ctx(), replica: "A" }),
    CbOperationError,
  );
  assert(!SHORT_KEY_RE.test("a::1"));
  assert(SHORT_KEY_RE.test("a3.17"));
});

Deno.test("an RM object can be passed as a value", async () => {
  const { build, draft, obs } = await sampleBuild();
  const name = new openehr_rm.DV_TEXT();
  name.value = "From RM object";
  build.setValue(draft, obs, "name", name);
  assertEquals(findNode(build.toCanonicalJson(draft), obs)!.name as any, {
    _type: "DV_TEXT",
    value: "From RM object",
  });
  assertNotEquals(build.exportLog().operations.at(-1)?.type, undefined);
});
