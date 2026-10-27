// deno-lint-ignore-file no-explicit-any
/**
 * CB phase 1: commit envelope, FEEDER_AUDIT and REST adapter (#166, ADR 0010).
 * Network-free: the adapter gets an injected fetch.
 */

import { assert, assertEquals, assertMatch, assertRejects } from "@std/assert";
import {
  bindTemplate,
  type BoundTemplate,
  BUILDER_NAME,
  builderProvenance,
  type CommitConfig,
  CommitError,
  ContributionBuild,
  downConvertToAdl14,
  DraftValidator,
  ItsRestContributionAdapter,
  ItsRestError,
  OPERATION_LOG_FORMAT,
  prepareContribution,
  ROOT_TARGET,
} from "../../../contribution_builder/mod.ts";
import { EHRTSLIB_VERSION } from "../../../version.ts";

const OPT14 = new URL("../../opt14/", import.meta.url);
const BP = "ehrbase_blood_pressure_simple.de.v0.opt";
let tpl: BoundTemplate | undefined;
let val: DraftValidator | undefined;
async function setup(withComposer = true) {
  tpl ??= await bindTemplate(await Deno.readTextFile(new URL(BP, OPT14)));
  val ??= await DraftValidator.create();
  const build = ContributionBuild.create({ author: { id: "user-1" } });
  const draft = build.newComposition(tpl, { language: "en", territory: "SE" });
  if (withComposer) {
    build.setComposer(draft, { _type: "PARTY_IDENTIFIED", name: "Dr A" });
  }
  return { t: tpl, v: val, build, draft };
}
const CONFIG: CommitConfig = { systemId: "org.example.deployment" };
const COMMITTER = { _type: "PARTY_IDENTIFIED", name: "Committer" };

/** Fake REST ITS server: records requests, answers from `handler`. */
function fakeFetch(
  handler: (url: string, init: RequestInit) => Response = () =>
    new Response("{}", { status: 201 }),
) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fn = ((input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    return Promise.resolve(handler(url, init));
  }) as typeof fetch;
  return { fn, calls };
}

Deno.test("version.ts matches deno.json", async () => {
  const denoJson = JSON.parse(
    await Deno.readTextFile(new URL("../../../deno.json", import.meta.url)),
  );
  assertEquals(EHRTSLIB_VERSION, denoJson.version);
});

Deno.test("prepareContribution builds the REST ITS NewContribution body", async () => {
  const { t, v, build, draft } = await setup();
  const p = await prepareContribution(build, v, CONFIG, {
    drafts: [{ draftId: draft, template: t }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
    logUri: "https://logs.example/b1",
  });
  const body = p.body as any;
  assertEquals(Object.keys(body).sort(), ["audit", "versions"]);
  // Contribution audit: log hash and link; no system_id unless configured.
  assertEquals(body.audit.change_type.defining_code.code_string, "249");
  assertEquals(body.audit.committer, COMMITTER);
  assertEquals(body.audit.system_id, undefined);
  assertEquals(body.audit.description.value, `oplog sha256:${p.logSha256}`);
  assertEquals(
    body.audit.description.hyperlink.value,
    "https://logs.example/b1",
  );
  assertEquals(p.logSha256, (await build.exportLogBytes()).sha256);
  // One UPDATE_VERSION with its own commit_audit.change_type.
  assertEquals(body.versions.length, 1);
  const ver = body.versions[0];
  assertEquals(ver._type, undefined);
  assertEquals(ver.lifecycle_state.defining_code.code_string, "532");
  assertEquals(ver.commit_audit.change_type.defining_code.code_string, "249");
  assertEquals(ver.commit_audit.system_id, undefined);
  assertEquals(ver.preceding_version_uid, undefined);
  // Root uid is the OBJECT_VERSION_ID; inner uids share its object uuid.
  const info = build.getDraft(draft);
  assertEquals(
    ver.data.uid,
    {
      _type: "OBJECT_VERSION_ID",
      value: `${info.provisionalObjectUuid}::cdr.example::1`,
    },
  );
  assertEquals(p.versions[0].versionUid, ver.data.uid.value);
  assertMatch(
    ver.data.content[0].uid.value,
    new RegExp(`^${info.provisionalObjectUuid}::`),
  );
  // The draft is unchanged.
  assertEquals((build.toCanonicalJson(draft) as any).uid, undefined);
});

Deno.test("FEEDER_AUDIT: builder provenance, placeholder originating audit, no original_content", async () => {
  const { t, v, build, draft } = await setup();
  const p = await prepareContribution(build, v, {
    ...CONFIG,
    crdtLibrary: { name: "examplecrdt", version: "1.2.3" },
  }, {
    drafts: [{ draftId: draft, template: t }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  const fa = (p.body as any).versions[0].data.feeder_audit;
  assertEquals(fa._type, "FEEDER_AUDIT");
  assertEquals(fa.original_content, undefined);
  assertEquals(fa.originating_system_audit, {
    _type: "FEEDER_AUDIT_DETAILS",
    system_id: "org.example.deployment",
  });
  assertEquals(fa.feeder_system_audit.system_id, "org.example.deployment");
  const od = fa.feeder_system_audit.other_details;
  assertEquals(od._type, "ITEM_TREE");
  assert(od.archetype_node_id, "other_details needs archetype_node_id");
  assert(od.name?.value, "other_details needs name");
  for (const it of od.items) {
    assert(it.archetype_node_id && it.name?.value);
  }
  assertEquals(builderProvenance((p.body as any).versions[0].data), {
    "builder name": BUILDER_NAME,
    "builder version": EHRTSLIB_VERSION,
    "log format": OPERATION_LOG_FORMAT,
    "log format version": "1",
    "CRDT library": "examplecrdt 1.2.3",
  });
  assert(p.warnings.some((w) => /originatingSystemAudit/.test(w)));
});

Deno.test("originating audit from the caller; missing-audit warning can be silenced", async () => {
  const { t, v, build, draft } = await setup();
  const originating = {
    _type: "FEEDER_AUDIT_DETAILS",
    system_id: "org.example.forms",
    version_id: "final",
  };
  const given = await prepareContribution(build, v, CONFIG, {
    drafts: [{ draftId: draft, template: t }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
    originatingSystemAudit: originating,
  });
  assertEquals(
    (given.body as any).versions[0].data.feeder_audit.originating_system_audit,
    originating,
  );
  assertEquals(given.warnings.filter((w) => /originating/.test(w)), []);
  const silenced = await prepareContribution(build, v, {
    ...CONFIG,
    silenceMissingOriginatingAudit: true,
  }, {
    drafts: [{ draftId: draft, template: t }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  assertEquals(silenced.warnings.filter((w) => /originating/.test(w)), []);
  assertEquals(
    (silenced.body as any).versions[0].data.feeder_audit
      .originating_system_audit.system_id,
    "org.example.deployment",
  );
});

Deno.test("UPDATE_AUDIT.system_id only when configured", async () => {
  const { t, v, build, draft } = await setup();
  const p = await prepareContribution(build, v, {
    ...CONFIG,
    auditSystemId: "cdr.example",
  }, {
    drafts: [{ draftId: draft, template: t }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  const body = p.body as any;
  assertEquals(body.audit.system_id, "cdr.example");
  assertEquals(body.versions[0].commit_audit.system_id, "cdr.example");
});

Deno.test("ADL 1.4 down-conversion: node ids, local value codes, template_id", async () => {
  const { t, v, build, draft } = await setup();
  const p = await prepareContribution(build, v, CONFIG, {
    drafts: [{ draftId: draft, template: t }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  const data = (p.body as any).versions[0].data;
  const adl2 = build.toCanonicalJson(draft) as any;
  const obs = data.content[0];
  assertEquals(
    obs.archetype_node_id,
    "openEHR-EHR-OBSERVATION.sample_blood_pressure.v1",
  );
  assertEquals(adl2.content[0].data.archetype_node_id, "at0001");
  assertEquals(obs.data.archetype_node_id, "at0001");
  assertEquals(obs.data.events[0].archetype_node_id, "at0002");
  const pos = obs.data.events[0].state.items[0].value.defining_code;
  const pos2 =
    adl2.content[0].data.events[0].state.items[0].value.defining_code;
  assertEquals(pos2.code_string, "at1001");
  assertEquals(pos.code_string, "at1000");
  assertEquals(pos.terminology_id.value, "local");
  assertEquals(data.category.defining_code.code_string, "433"); // openehr: unchanged
  assertEquals(
    data.archetype_details.template_id.value,
    "ehrbase_blood_pressure_simple.de.v0",
  );
  // Commit-time fixes: inner archetype root details, no EVENT.offset.
  assertEquals(obs.archetype_details.archetype_id.value, obs.archetype_node_id);
  assertEquals("offset" in obs.data.events[0], false);
  // Feeder audit other_details use at-codes in ADL 1.4 output.
  assertEquals(
    data.feeder_audit.feeder_system_audit.other_details.archetype_node_id,
    "at0000",
  );
  // ADL2 output keeps id-codes.
  const p2 = await prepareContribution(build, v, { ...CONFIG, codes: "adl2" }, {
    drafts: [{ draftId: draft, template: t }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  assertEquals(
    (p2.body as any).versions[0].data.content[0].data.archetype_node_id,
    "at0001",
  );
});

Deno.test("downConvertToAdl14 warns for ADL2-native templates without a code map", () => {
  const data = {
    _type: "COMPOSITION",
    archetype_node_id: "openEHR-EHR-COMPOSITION.x.v1",
    archetype_details: {
      _type: "ARCHETYPED",
      archetype_id: {
        _type: "ARCHETYPE_ID",
        value: "openEHR-EHR-COMPOSITION.x.v1",
      },
      template_id: { _type: "TEMPLATE_ID", value: "t" },
      rm_version: "1.0.4",
    },
    content: [{
      _type: "OBSERVATION",
      archetype_node_id: "openEHR-EHR-OBSERVATION.y.v1",
      data: { _type: "HISTORY", archetype_node_id: "id2" },
    }],
  };
  const binding = {
    templateId: "t.adl2",
    sourceFormat: "adl2-opt",
    adl2CodingSystem: "id-coded",
  } as any;
  const r = downConvertToAdl14(data as any, binding, {
    codeMap: (a, c) =>
      a === "openEHR-EHR-OBSERVATION.y.v1" && c === "id2"
        ? "at9000"
        : undefined,
  });
  assertEquals((r.data as any).content[0].data.archetype_node_id, "at9000");
  assertEquals((r.data as any).archetype_details.template_id.value, "t.adl2");
  assertEquals(r.warnings.length, 1);
  assertEquals(downConvertToAdl14(data as any, binding).warnings.length, 1);
  assertEquals(data.content[0].data.archetype_node_id, "id2"); // input untouched
});

Deno.test("prepareContribution warns when ADL2-native binding lacks OPT 1.4 export metadata", async () => {
  const { t, v, build } = await setup();
  const adl2Native: BoundTemplate = {
    ...t,
    binding: { ...t.binding, sourceFormat: "adl2-opt", opt14Export: undefined },
  };
  const draft = build.newComposition(adl2Native, { language: "en", territory: "SE" });
  build.setComposer(draft, { _type: "PARTY_IDENTIFIED", name: "Dr A" });
  const p = await prepareContribution(build, v, CONFIG, {
    drafts: [{ draftId: draft, template: adl2Native }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  const mappingWarnings = p.warnings.filter((w) => w.includes("default code shift"));
  assertEquals(mappingWarnings.length, 1);
  assertMatch(mappingWarnings[0], /opt14Export/);
});

Deno.test("prepareContribution: no ADL 1.4 mapping warning with opt14Export or explicit adl14", async () => {
  const { t, v, build } = await setup();
  const adl2Native: BoundTemplate = {
    ...t,
    binding: {
      ...t.binding,
      sourceFormat: "adl2-opt",
      opt14Export: {
        templateId: "cdr-template-id",
        componentCodeMaps: {
          "openEHR-EHR-OBSERVATION.blood_pressure.v1": { id2: "at0001" },
        },
      },
    },
  };
  const draft = build.newComposition(adl2Native, { language: "en", territory: "SE" });
  build.setComposer(draft, { _type: "PARTY_IDENTIFIED", name: "Dr A" });
  const withExport = await prepareContribution(build, v, CONFIG, {
    drafts: [{ draftId: draft, template: adl2Native }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  assertEquals(
    withExport.warnings.filter((w) => w.includes("default code shift")).length,
    0,
  );

  const adl2Bare: BoundTemplate = {
    ...t,
    binding: { ...t.binding, sourceFormat: "adl2-opt", opt14Export: undefined },
  };
  const draft2 = build.newComposition(adl2Bare, { language: "en", territory: "SE" });
  build.setComposer(draft2, { _type: "PARTY_IDENTIFIED", name: "Dr A" });
  const withExplicit = await prepareContribution(build, v, CONFIG, {
    drafts: [{
      draftId: draft2,
      template: adl2Bare,
      adl14: {
        templateId: "cdr-template-id",
        codeMap: () => "at0001",
      },
    }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  assertEquals(
    withExplicit.warnings.filter((w) => w.includes("default code shift")).length,
    0,
  );
});

Deno.test("commit refuses missing committer, missing composer and invalid builds without calling the server", async () => {
  const { fn, calls } = fakeFetch();
  const adapter = new ItsRestContributionAdapter({
    baseUrl: "https://cdr.example/v1",
    fetch: fn,
  });

  const a = await setup();
  await assertRejects(
    () =>
      adapter.commit(a.build, a.v, CONFIG, "ehr-1", {
        drafts: [{ draftId: a.draft, template: a.t }],
        committer: undefined,
      }),
    CommitError,
    "committer",
  );

  const b = await setup(false);
  const e = await assertRejects(
    () =>
      adapter.commit(b.build, b.v, CONFIG, "ehr-1", {
        drafts: [{ draftId: b.draft, template: b.t }],
        committer: COMMITTER,
      }),
    CommitError,
  );
  assertEquals(e.code, "missing-composer");

  const c = await setup();
  c.build.setValue(c.draft, ROOT_TARGET, "language/code_string", "qq");
  const inv = await assertRejects(
    () =>
      adapter.commit(c.build, c.v, CONFIG, "ehr-1", {
        drafts: [{ draftId: c.draft, template: c.t }],
        committer: COMMITTER,
      }),
    CommitError,
  );
  assertEquals(inv.code, "invalid-draft");
  assertEquals(inv.validation?.valid, false);

  // Missing mandatory content: fails complete, passes incomplete.
  const d = await setup();
  d.build.removeInstance(d.draft, d.build.findNodeKey(d.draft, "at0011")!);
  const inc = await assertRejects(
    () =>
      adapter.commit(d.build, d.v, CONFIG, "ehr-1", {
        drafts: [{ draftId: d.draft, template: d.t }],
        committer: COMMITTER,
      }),
    CommitError,
  );
  assertEquals(inc.code, "invalid-draft");
  assertEquals(calls.length, 0);
});

Deno.test("REST adapter posts to /ehr/{ehr_id}/contribution and reports server-assigned uids", async () => {
  const { t, v, build, draft } = await setup();
  const { fn, calls } = fakeFetch((url, init) => {
    if (url.endsWith("/ehr/ehr-1") && !init.method) {
      return Response.json({ system_id: { value: "cdr.example" } });
    }
    return Response.json({
      uid: { value: "contrib-1" },
      versions: [{ id: { value: "server-uuid::cdr.example::1" } }],
    }, { status: 201 });
  });
  const adapter = new ItsRestContributionAdapter({
    baseUrl: "https://cdr.example/v1/",
    fetch: fn,
    headers: { Authorization: "Bearer x" },
  });
  const r = await adapter.commit(build, v, CONFIG, "ehr-1", {
    drafts: [{ draftId: draft, template: t }],
    committer: COMMITTER,
    mode: "incomplete",
  });
  assertEquals(calls.map((c) => [c.init.method ?? "GET", c.url]), [
    ["GET", "https://cdr.example/v1/ehr/ehr-1"],
    ["POST", "https://cdr.example/v1/ehr/ehr-1/contribution"],
  ]);
  const post = calls[1].init;
  const headers = post.headers as Record<string, string>;
  assertEquals(headers["Content-Type"], "application/json");
  assertEquals(headers.Authorization, "Bearer x");
  const sent = JSON.parse(post.body as string);
  assertEquals(
    sent.versions[0].lifecycle_state.defining_code.code_string,
    "553",
  );
  assertMatch(sent.versions[0].data.uid.value, /::cdr\.example::1$/);
  assertEquals(r.contributionUid, "contrib-1");
  assertEquals(r.versionUids, ["server-uuid::cdr.example::1"]);
  assertEquals(r.serverAssignedUids, true);
  assert(r.warnings.some((w) => /provisional uuid/.test(w)));
});

Deno.test("REST adapter surfaces server errors", async () => {
  const { t, v, build, draft } = await setup();
  const { fn } = fakeFetch(() => new Response("bad", { status: 400 }));
  const adapter = new ItsRestContributionAdapter({
    baseUrl: "https://cdr.example/v1",
    fetch: fn,
  });
  const e = await assertRejects(
    () =>
      adapter.commit(build, v, CONFIG, "ehr-1", {
        drafts: [{ draftId: draft, template: t }],
        committer: COMMITTER,
        creatingSystemId: "cdr.example",
      }),
    ItsRestError,
  );
  assertEquals(e.status, 400);
});
