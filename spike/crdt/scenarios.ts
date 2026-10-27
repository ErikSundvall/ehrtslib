/**
 * Concurrent CB scenarios exercised with Automerge and Loro (#170).
 */
import {
  type CbOperation,
  ROOT_TARGET,
} from "../../contribution_builder/operation_log.ts";
import { ContributionBuild } from "../../contribution_builder/mod.ts";
import { RMInstanceGenerator } from "../../generation/rm_instance_generator.ts";
import * as Automerge from "npm:@automerge/automerge@3.0.0";
import {
  appendOp,
  initAutomergeDoc,
  mergeDocs,
  opsFromDoc,
  saveBytes,
} from "./automerge_oplog.ts";
import {
  appendOpLoro,
  mergeLoro,
  newLoroLog,
  opsFromLoro,
  saveBytesLoro,
} from "./loro_oplog.ts";
import {
  bpTemplate,
  describeMoveVsEdit,
  minimalQuantityValue,
  replayWithPolicy,
  sortOps,
  spikeCtx,
} from "./shared.ts";

export interface ScenarioResult {
  name: string;
  library: "automerge" | "loro";
  mergedOpCount: number;
  snapshotBytes: number;
  crdtOrder: string[];
  sortedOrder: string[];
  applied: number;
  skipped: Array<{ id: string; reason: string; message: string }>;
}

type CreateDraftOperation = Extract<CbOperation, { type: "create-draft" }>;

async function seed(): Promise<{
  buildId: string;
  draftId: string;
  create: CreateDraftOperation;
}> {
  const build = ContributionBuild.create(spikeCtx("seed", "a"));
  const template = await bpTemplate();
  const draftId = build.newComposition(template, {
    draftId: "draft-bp",
    provisionalObjectUuid: "00000000-0000-4000-8000-000000000001",
    language: "en",
    territory: "SE",
  });
  const create = build.exportLog().operations[0] as CreateDraftOperation;
  return { buildId: build.buildId, draftId, create };
}

function replay(
  buildId: string,
  ops: CbOperation[],
): ReturnType<typeof replayWithPolicy> {
  return replayWithPolicy(buildId, ops, spikeCtx("replay", "z"));
}

async function runScenario(
  name: string,
  buildId: string,
  ops: CbOperation[],
): Promise<ScenarioResult[]> {
  const create = ops[0]!;
  const rest = ops.slice(1);
  const results: ScenarioResult[] = [];

  let docA = appendOp(initAutomergeDoc(), create);
  for (const op of rest) {
    if (op.replica === "a" || op.replica === "c") {
      docA = appendOp(docA, op);
    }
  }
  let docB = Automerge.clone(docA);
  for (const op of rest) {
    if (op.replica !== "a" && op.replica !== "c") {
      docB = appendOp(docB, op);
    }
  }
  const mergedAm = mergeDocs(docA, docB);
  const amOps = opsFromDoc(mergedAm);
  const amReplay = replay(buildId, amOps);
  results.push({
    name,
    library: "automerge",
    mergedOpCount: amOps.length,
    snapshotBytes: saveBytes(mergedAm).byteLength,
    crdtOrder: amOps.map((o) => `${o.replica}:${o.seq}`),
    sortedOrder: sortOps(amOps).map((o) => `${o.replica}:${o.seq}`),
    applied: amReplay.applied.length,
    skipped: amReplay.skipped.map((s) => ({
      id: `${s.operation.replica}:${s.operation.seq}`,
      reason: s.reason,
      message: s.message,
    })),
  });

  const loroA = newLoroLog();
  appendOpLoro(loroA, create);
  for (const op of rest) {
    if (op.replica === "a" || op.replica === "c") appendOpLoro(loroA, op);
  }
  const loroB = mergeLoro(newLoroLog(), loroA);
  for (const op of rest) {
    if (op.replica !== "a" && op.replica !== "c") appendOpLoro(loroB, op);
  }
  const mergedLoro = mergeLoro(loroA, loroB);
  const loroOps = opsFromLoro(mergedLoro);
  const loroReplay = replay(buildId, loroOps);
  results.push({
    name,
    library: "loro",
    mergedOpCount: loroOps.length,
    snapshotBytes: saveBytesLoro(mergedLoro).byteLength,
    crdtOrder: loroOps.map((o) => `${o.replica}:${o.seq}`),
    sortedOrder: sortOps(loroOps).map((o) => `${o.replica}:${o.seq}`),
    applied: loroReplay.applied.length,
    skipped: loroReplay.skipped.map((s) => ({
      id: `${s.operation.replica}:${s.operation.seq}`,
      reason: s.reason,
      message: s.message,
    })),
  });

  return results;
}

export async function scenarioConflictingSetValue(): Promise<ScenarioResult[]> {
  const { buildId, draftId, create } = await seed();
  const target = create.keys[0]!;

  const opA: CbOperation = {
    type: "set-value",
    replica: "a",
    seq: 2,
    author: { id: "nurse" },
    timestamp: "2026-10-27T12:01:00.000Z",
    draft: draftId,
    target,
    path: "name/value",
    value: "from nurse",
  };
  const opB: CbOperation = {
    type: "set-value",
    replica: "b",
    seq: 2,
    author: { id: "doctor" },
    timestamp: "2026-10-27T12:01:00.000Z",
    draft: draftId,
    target,
    path: "name/value",
    value: "from doctor",
  };

  return runScenario("conflicting-set-value", buildId, [create, opA, opB]);
}

export async function scenarioRemoveVsEdit(): Promise<ScenarioResult[]> {
  const { buildId, draftId, create } = await seed();
  const obsKey = create.keys[create.keys.length - 1] ?? create.keys[0]!;

  const remove: CbOperation = {
    type: "remove-instance",
    replica: "a",
    seq: 2,
    author: { id: "nurse" },
    timestamp: "2026-10-27T12:02:00.000Z",
    draft: draftId,
    target: obsKey,
  };
  const edit: CbOperation = {
    type: "set-value",
    replica: "b",
    seq: 2,
    author: { id: "doctor" },
    timestamp: "2026-10-27T12:02:01.000Z",
    draft: draftId,
    target: obsKey,
    path: "name/value",
    value: "edited after remove scheduled",
  };

  return runScenario("remove-vs-edit", buildId, [create, remove, edit]);
}

export async function scenarioAnchorRace(): Promise<ScenarioResult[]> {
  const { buildId, draftId, create } = await seed();
  const template = await bpTemplate();
  const obs = new RMInstanceGenerator({ mode: "example" }).generate(
    template.operationalTemplate,
  ).content[0];
  const anchor = create.keys[0]!;

  const addA: CbOperation = {
    type: "add-instance",
    replica: "a",
    seq: 2,
    author: { id: "nurse" },
    timestamp: "2026-10-27T12:03:00.000Z",
    draft: draftId,
    parent: ROOT_TARGET,
    attribute: "content",
    after: anchor,
    instance: obs as import("../../contribution_builder/operation_log.ts").RmJson,
    keys: ["a.2"],
  };
  const addB: CbOperation = {
    type: "add-instance",
    replica: "b",
    seq: 2,
    author: { id: "doctor" },
    timestamp: "2026-10-27T12:03:00.000Z",
    draft: draftId,
    parent: ROOT_TARGET,
    attribute: "content",
    after: anchor,
    instance: {
      _type: "OBSERVATION",
      archetype_node_id: "id9999",
      name: { _type: "DV_TEXT", value: "second insert" },
      language: obs.language,
      encoding: obs.encoding,
      data: {
        _type: "HISTORY",
        archetype_node_id: "id1",
        name: { _type: "DV_TEXT", value: "history" },
        origin: { _type: "DV_DATE_TIME", value: "2026-10-27T12:00:00Z" },
        events: [],
      },
    },
    keys: ["b.2"],
  };
  const removeAnchor: CbOperation = {
    type: "remove-instance",
    replica: "c",
    seq: 2,
    author: { id: "admin" },
    timestamp: "2026-10-27T12:03:01.000Z",
    draft: draftId,
    target: anchor,
  };

  return runScenario("anchor-removed-during-insert", buildId, [
    create,
    removeAnchor,
    addA,
    addB,
  ]);
}

export async function scenarioMoveVsEditNote(): Promise<ScenarioResult[]> {
  console.log("\n[move-vs-edit] " + describeMoveVsEdit());
  const { buildId, draftId, create } = await seed();
  const node = create.keys[0]!;
  const edit: CbOperation = {
    type: "set-value",
    replica: "a",
    seq: 2,
    author: { id: "nurse" },
    timestamp: "2026-10-27T12:04:00.000Z",
    draft: draftId,
    target: node,
    path: "name/value",
    value: "during move",
  };
  const remove: CbOperation = {
    type: "remove-instance",
    replica: "b",
    seq: 2,
    author: { id: "doctor" },
    timestamp: "2026-10-27T12:04:00.000Z",
    draft: draftId,
    target: node,
  };
  return runScenario("move-vs-edit-simulated", buildId, [create, edit, remove]);
}

export async function runAllScenarios(): Promise<ScenarioResult[]> {
  const out: ScenarioResult[] = [];
  for (const fn of [
    scenarioConflictingSetValue,
    scenarioRemoveVsEdit,
    scenarioAnchorRace,
    scenarioMoveVsEditNote,
  ]) {
    out.push(...(await fn()));
  }
  return out;
}
