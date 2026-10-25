// deno-lint-ignore-file no-explicit-any
/**
 * CB commit against real CDRs over the REST ITS (#166). Opt-in: set
 * `EHRTSLIB_CDR_TARGETS` to a JSON array of targets, for example
 *
 *   [{"name": "cdr-a", "baseUrl": "http://127.0.0.1:8080/x/rest/openehr/v1",
 *     "auditSystemId": "ehr"},
 *    {"name": "cdr-b", "baseUrl": "http://127.0.0.1:8090/y/rest/openehr/v1",
 *     "basicAuth": "user:password"}]
 *
 * `auditSystemId: "ehr"` sets `UPDATE_AUDIT.system_id` to the EHR's
 * system id (for servers that require it); any other string is used as is.
 * Each run uploads the OPT 1.4 (an existing copy is fine) and creates a new
 * EHR. Run with `deno test -A`. Skipped when the variable is not set.
 */

import { assert, assertEquals, assertMatch } from "@std/assert";
import {
  bindTemplate,
  builderProvenance,
  type CommitConfig,
  ContributionBuild,
  DraftValidator,
  ItsRestContributionAdapter,
  ItsRestError,
} from "../../../contribution_builder/mod.ts";
import { EHRTSLIB_VERSION } from "../../../version.ts";

interface Target {
  name: string;
  baseUrl: string;
  basicAuth?: string;
  auditSystemId?: string;
}

function targets(): Target[] {
  try {
    if (Deno.permissions.querySync({ name: "env" }).state !== "granted") {
      return [];
    }
    const raw = Deno.env.get("EHRTSLIB_CDR_TARGETS");
    return raw ? JSON.parse(raw) as Target[] : [];
  } catch {
    return [];
  }
}

const OPT = new URL(
  "../../opt14/ehrbase_blood_pressure_simple.de.v0.opt",
  import.meta.url,
);
const COMMITTER = { _type: "PARTY_IDENTIFIED", name: "CB integration test" };
const ORIGINATING = {
  _type: "FEEDER_AUDIT_DETAILS",
  system_id: "org.example.cb-integration-form",
};

async function prepareTarget(target: Target) {
  const headers: Record<string, string> = target.basicAuth
    ? { Authorization: `Basic ${btoa(target.basicAuth)}` }
    : {};
  const xml = await Deno.readTextFile(OPT);
  const up = await fetch(`${target.baseUrl}/definition/template/adl1.4`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/xml" },
    body: xml,
  });
  await up.body?.cancel();
  // 409 (or 400 on some servers): the template is already there.
  assert(
    up.ok || up.status === 409 || up.status === 400,
    `upload ${up.status}`,
  );
  const res = await fetch(`${target.baseUrl}/ehr`, {
    method: "POST",
    headers: {
      ...headers,
      Accept: "application/json",
      Prefer: "return=representation",
    },
  });
  assertEquals(res.status, 201, "create EHR");
  const ehr = await res.json();
  const adapter = new ItsRestContributionAdapter({
    baseUrl: target.baseUrl,
    headers,
  });
  const ehrId = ehr.ehr_id.value as string;
  const ehrSystemId = ehr.system_id.value as string;
  const config: CommitConfig = {
    systemId: "org.example.cb-integration",
    auditSystemId: target.auditSystemId === "ehr"
      ? ehrSystemId
      : target.auditSystemId,
  };
  return { adapter, ehrId, headers, config, template: await bindTemplate(xml) };
}

for (const target of targets()) {
  Deno.test(`CDR ${target.name}: complete build commits and reads back`, async () => {
    const { adapter, ehrId, config, template } = await prepareTarget(target);
    const build = ContributionBuild.create({ author: { id: "user-1" } });
    const draft = build.newComposition(template, {
      language: "en",
      territory: "SE",
    });
    build.setComposer(draft, { _type: "PARTY_IDENTIFIED", name: "Dr Test" });
    build.addInstance(draft, build.findNodeKey(draft, "id4")!, "items", {
      _type: "ELEMENT",
      archetype_node_id: "id5",
      name: { _type: "DV_TEXT", value: "Systolic" },
      value: { _type: "DV_QUANTITY", magnitude: 120, units: "mm[Hg]" },
    });
    const validator = await DraftValidator.create();
    const result = await adapter.commit(build, validator, config, ehrId, {
      drafts: [{ draftId: draft, template }],
      committer: COMMITTER,
      originatingSystemAudit: ORIGINATING,
      logUri: "https://logs.example/cb-integration",
    });
    assertEquals(result.status, 201);
    console.log(
      `  ${target.name}: ${
        result.versionUids[0]
      } (server-assigned uuid: ${result.serverAssignedUids})`,
    );

    const c = await adapter.getComposition(ehrId, result.versionUids[0]) as any;
    assertEquals(c.uid.value, result.versionUids[0]);
    assertEquals(builderProvenance(c)?.["builder version"], EHRTSLIB_VERSION);
    assertEquals(
      c.feeder_audit.originating_system_audit.system_id,
      ORIGINATING.system_id,
    );
    assertEquals(c.feeder_audit.feeder_system_audit.system_id, config.systemId);
    // ADL 1.4 codes in the stored data.
    assertEquals(c.content[0].data.archetype_node_id, "at0001");
    assertEquals(
      c.content[0].data.events[0].data.items[0].value.magnitude,
      120,
    );
    // Inner node uids survive the round trip.
    assertMatch(c.content[0].uid.value, /::a\.\d+$/);

    if (result.contributionUid) {
      const contribution = await adapter.getContribution(
        ehrId,
        result.contributionUid,
      ) as any;
      assertEquals(
        contribution.audit.description.value,
        `oplog sha256:${result.prepared.logSha256}`,
      );
    }
  });

  Deno.test(`CDR ${target.name}: incomplete build with missing mandatory content`, async () => {
    const { adapter, ehrId, headers, config, template } = await prepareTarget(
      target,
    );
    const build = ContributionBuild.create({ author: { id: "user-1" } });
    const draft = build.newComposition(template, {
      language: "en",
      territory: "SE",
    });
    build.setComposer(draft, { _type: "PARTY_SELF" });
    build.removeInstance(draft, build.findNodeKey(draft, "id12")!);
    const validator = await DraftValidator.create();
    try {
      const result = await adapter.commit(
        build,
        validator,
        {
          ...config,
          silenceMissingOriginatingAudit: true,
        },
        ehrId,
        {
          mode: "incomplete",
          drafts: [{ draftId: draft, template }],
          committer: COMMITTER,
        },
      );
      const uid = result.versionUids[0];
      const res = await fetch(
        `${target.baseUrl}/ehr/${ehrId}/versioned_composition/${
          uid.split("::")[0]
        }/version/${uid}`,
        { headers: { ...headers, Accept: "application/json" } },
      );
      const version = await res.json();
      const sent = (result.prepared.body as any).versions[0].lifecycle_state;
      assertEquals(sent.defining_code.code_string, "553");
      // What the server stored is its behaviour, not the builder's: report it.
      const stored = version.lifecycle_state?.defining_code?.code_string;
      console.log(
        `  ${target.name}: accepted the incomplete version ${uid}; stored lifecycle_state ${stored}${
          stored === "553" ? "" : " (sent 553)"
        }`,
      );
    } catch (e) {
      // Some CDRs reject an incomplete version that misses mandatory content.
      if (!(e instanceof ItsRestError) || e.status < 400 || e.status >= 500) {
        throw e;
      }
      console.log(
        `  ${target.name}: rejected incomplete version (${e.status})`,
      );
    }
  });
}

Deno.test({
  name: "CDR integration tests are opt-in (EHRTSLIB_CDR_TARGETS)",
  ignore: targets().length > 0,
  fn: () => {},
});
