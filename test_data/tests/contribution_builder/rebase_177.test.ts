/**
 * Conflict resolutions and rebase onto the latest version (#177, ADR 0009).
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import {
  bindTemplate,
  type BoundTemplate,
  CbOperationError,
  type CommitConfig,
  ContributionBuild,
  DraftValidator,
  nextVersionUid,
  operationRef,
  prepareContribution,
} from "../../../contribution_builder/mod.ts";

const OPT = new URL(
  "../../opt14/ehrbase_blood_pressure_simple.de.v0.opt",
  import.meta.url,
);
const CONFIG: CommitConfig = {
  systemId: "org.example.deployment",
  silenceMissingOriginatingAudit: true,
};
const COMMITTER = { _type: "PARTY_IDENTIFIED", name: "Committer" };

function keyOf(uid: string): string {
  return uid.split("::")[1];
}

async function setup() {
  const template: BoundTemplate = await bindTemplate(
    await Deno.readTextFile(OPT),
  );
  const validator = await DraftValidator.create();
  const made = ContributionBuild.create({ author: { id: "author-1" } });
  const created = made.newComposition(template, {
    language: "en",
    territory: "SE",
  });
  made.setComposer(created, { _type: "PARTY_IDENTIFIED", name: "Dr A" });
  made.addInstance(created, made.findNodeKey(created, "at0003")!, "items", {
    _type: "ELEMENT",
    archetype_node_id: "at0004",
    name: { _type: "DV_TEXT", value: "Systolic" },
    value: { _type: "DV_QUANTITY", magnitude: 120, units: "mm[Hg]" },
  });
  const prepared = await prepareContribution(made, validator, CONFIG, {
    drafts: [{ draftId: created, template }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  const stored =
    (prepared.body as { versions: Array<{ data: Record<string, unknown> }> })
      .versions[0].data;
  const build = ContributionBuild.create({
    author: { id: "user-2", name: "User 2" },
  });
  const draft = build.openVersion(template, stored);
  const json = build.toCanonicalJson(draft) as {
    content: Array<{
      data: {
        events: Array<
          {
            data: { items: Array<{ uid: { value: string } }> };
            state: { items: Array<{ uid: { value: string } }> };
          }
        >;
      };
    }>;
    composer: { name: string };
  };
  const sysKey = keyOf(json.content[0].data.events[0].data.items[0].uid.value);
  const posKey = keyOf(json.content[0].data.events[0].state.items[0].uid.value);
  build.setValue(draft, sysKey, "value/magnitude", 140);
  build.setValue(draft, posKey, "value/value", "Lying");
  build.setComposer(draft, { _type: "PARTY_IDENTIFIED", name: "Dr C" });
  const latest = structuredClone(stored) as {
    uid: { value: string };
    composer: { name: string };
    content: Array<{
      data: {
        events: Array<
          { data: { items: Array<{ value: { magnitude: number } }> } }
        >;
      };
    }>;
  };
  latest.uid.value = nextVersionUid(
    String((stored as { uid: { value: string } }).uid.value),
    "cdr.example",
  );
  latest.content[0].data.events[0].data.items[0].value.magnitude = 130;
  latest.composer = { _type: "PARTY_IDENTIFIED", name: "Dr B" } as {
    name: string;
  };
  const sys = build.exportLog().operations.find((op) =>
    op.type === "set-value" && op.target === sysKey
  )!;
  const composer = build.exportLog().operations.find((op) =>
    op.type === "set-composer"
  )!;
  return { template, validator, build, draft, latest, sys, composer, sysKey };
}

Deno.test("rebase keeps ours, keeps theirs, and retries with the new base (#177)", async () => {
  const { template, validator, build, draft, latest, sys, composer } =
    await setup();
  const missing = assertThrows(
    () => build.rebase(template, draft, latest, []),
    CbOperationError,
  );
  assert(missing.message.includes("No resolution"));

  const next = build.rebase(template, draft, latest, [
    { conflict: operationRef(sys), action: "keep-ours" },
    { conflict: operationRef(composer), action: "keep-theirs" },
  ]);
  const json = build.toCanonicalJson(next) as {
    content: Array<{
      data: {
        events: Array<{
          data: { items: Array<{ value: { magnitude: number } }> };
          state: { items: Array<{ value: { value: string } }> };
        }>;
      };
    }>;
    composer: { name: string };
  };
  assertEquals(
    json.content[0].data.events[0].data.items[0].value.magnitude,
    140,
  );
  assertEquals(
    json.content[0].data.events[0].state.items[0].value.value,
    "Lying",
  );
  assertEquals(json.composer.name, "Dr B");
  assertEquals(
    build.getDraft(next).baseVersionUid,
    (latest as { uid: { value: string } }).uid.value,
  );
  assert(
    build.exportLog().operations.some((op) =>
      op.type === "resolve" && op.action === "keep-ours"
    ),
  );
  const replay = ContributionBuild.fromLog(build.exportLog(), {
    author: { id: "user-3" },
  });
  assertEquals(replay.toCanonicalJson(next), build.toCanonicalJson(next));

  const prepared = await prepareContribution(build, validator, CONFIG, {
    drafts: [{ draftId: next, template }],
    committer: COMMITTER,
    creatingSystemId: "cdr.example",
  });
  assertEquals(
    prepared.versions[0].precedingVersionUid,
    (latest as { uid: { value: string } }).uid.value,
  );
  assertEquals(prepared.versions[0].changeType, "251");
});

Deno.test("custom and drop resolutions are operations in the log (#177)", async () => {
  const { template, build, draft, latest, sys, composer } = await setup();
  const next = build.rebase(template, draft, latest, [
    { conflict: operationRef(sys), action: "custom", value: 135 },
    { conflict: operationRef(composer), action: "drop" },
  ]);
  const json = build.toCanonicalJson(next) as {
    content: Array<{
      data: {
        events: Array<
          { data: { items: Array<{ value: { magnitude: number } }> } }
        >;
      };
    }>;
    composer: { name: string };
  };
  assertEquals(
    json.content[0].data.events[0].data.items[0].value.magnitude,
    135,
  );
  assertEquals(json.composer.name, "Dr B");
  const actions = build.exportLog().operations.filter((op) =>
    op.type === "resolve"
  )
    .map((op) => op.type === "resolve" ? op.action : "");
  assertEquals(actions, ["custom", "drop"]);
});
