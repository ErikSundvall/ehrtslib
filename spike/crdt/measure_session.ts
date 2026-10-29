#!/usr/bin/env -S deno run -A
/**
 * Compare canonical oplog JSON size vs CRDT snapshot for a synthetic session.
 */
import { ContributionBuild } from "../../contribution_builder/mod.ts";
import {
  type CbOperation,
  operationLogBytes,
} from "../../contribution_builder/operation_log.ts";
import { appendOp, initAutomergeDoc, opsFromDoc, saveBytes } from "./automerge_oplog.ts";
import { appendOpLoro, newLoroLog, saveBytesLoro } from "./loro_oplog.ts";
import { bpTemplate, spikeCtx } from "./shared.ts";

const ctx = spikeCtx("bench", "a");
const build = ContributionBuild.create(ctx);
const template = await bpTemplate();
const draftId = build.newComposition(template, {
  language: "en",
  territory: "SE",
});
const create = build.exportLog().operations[0] as Extract<
  CbOperation,
  { type: "create-draft" }
>;
const target = create.keys[0]!;
for (let i = 0; i < 40; i++) {
  build.setValue(draftId, target, "name/value", `edit ${i}`);
}

const doc = build.exportLog();
const { bytes: jcsBytes } = await operationLogBytes(doc);
let am = initAutomergeDoc();
for (const op of doc.operations) {
  am = appendOp(am, op);
}
const loro = newLoroLog();
for (const op of doc.operations) {
  appendOpLoro(loro, op);
}

console.log("operations:", doc.operations.length);
console.log("ehrtslib-cb-oplog JCS UTF-8:", jcsBytes.byteLength, "bytes");
console.log("Automerge snapshot:", saveBytes(am).byteLength, "bytes");
console.log("Loro snapshot:", saveBytesLoro(loro).byteLength, "bytes");
console.log("Automerge ops recovered:", opsFromDoc(am).length);
