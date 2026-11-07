import { assert, assertEquals, assertRejects, assertThrows } from "@std/assert";
import { CbOperationError } from "../../../contribution_builder/mod.ts";
import {
  addClone,
  createDemoSession,
  delayFor,
  preparePreview,
  readField,
  receive,
  setProfile,
  USERNAMES,
  writeField,
} from "./contribution-demo.ts";

const assets = new URL("../public/contribution-builder/", import.meta.url);
async function started() {
  return await createDemoSession(
    await Deno.readTextFile(new URL("simple-diagnose-and-vitals.opt", assets)),
    await Deno.readTextFile(
      new URL("simple-diagnose-and-vitals.wt.json", assets),
    ),
  );
}

Deno.test("Contribution Builder demo: two independent clones bind the real OPT/WT and validate", async () => {
  const s = await started();
  const [a, b] = s.clones;
  assertEquals(s.clones.length, 2);
  assert(a.caller.build !== b.caller.build);
  assertEquals(a.caller.build.buildId, b.caller.build.buildId);
  assertEquals(s.template.binding.templateId, "simple-diagnose-and-vitals");
  assertEquals(readField(s, a, "systolic"), 120);
  assertEquals(readField(s, a, "diastolic"), 80);
  assertEquals(readField(s, a, "pulse"), 72);
  assertEquals(readField(s, a, "spo2"), 98);
  assertEquals(
    s.validator.validate(a.caller.build, s.draftId, s.template).errors,
    [],
  );
  assertEquals(
    a.caller.build.toCanonicalJson(s.draftId),
    b.caller.build.toCanonicalJson(s.draftId),
  );
  const c = addClone(s);
  assertEquals(s.clones.length, 3);
  assert(USERNAMES.some((name) => name === c.username));
  assert(c.id !== a.id);
  setProfile(c, "rural");
  for (let i = 0; i < 50; i++) {
    const ms = delayFor(c);
    assert(ms >= c.minDelay && ms <= c.maxDelay);
  }
});

Deno.test("Contribution Builder demo: a focused stale whole-value edit cannot replace a peer", async () => {
  const s = await started();
  const [a, b] = s.clones;
  const seen = b.caller.build.logRev();
  writeField(s, a, "heading", "Peer diagnosis");
  receive(s, b, a.caller.adapter.save());
  const error = assertThrows(
    () => writeField(s, b, "heading", "Stale diagnosis", seen),
    CbOperationError,
  );
  assertEquals(error.code, "changed-by-someone-else");
  assertEquals(readField(s, b, "heading"), "Peer diagnosis");
});

Deno.test("Contribution Builder demo: native Unicode text converges on N clones and remains committable", async () => {
  const s = await started();
  const [a, b] = s.clones;
  const original = String(readField(s, a, "narrative"));
  writeField(s, a, "narrative", `Å👩‍⚕️ ${original}`);
  writeField(s, b, "narrative", `${original}\nReviewed 🫀`);
  const c = addClone(s);
  for (let pass = 0; pass < 2; pass++) {
    for (const source of s.clones) {
      for (const peer of s.clones) {
        if (source !== peer) receive(s, peer, source.caller.adapter.save());
      }
    }
  }
  const expected = `Å👩‍⚕️ ${original}\nReviewed 🫀`;
  for (const clone of [a, b, c]) {
    assertEquals(readField(s, clone, "narrative"), expected);
  }
  const p = await preparePreview(s, c);
  assertEquals(p.validation[0].valid, true);
  assert(JSON.stringify(p.body).includes("Reviewed 🫀"));
});

Deno.test("Contribution Builder demo: repeated preview never compacts or locks the live Automerge log", async () => {
  const s = await started();
  const a = s.clones[0];
  writeField(s, a, "narrative", "Revised diagnosis narrative.");
  // Its base rev names text which compaction will remove.
  writeField(s, a, "pulse", 75);
  const bytes = a.caller.adapter.save();
  const log = a.caller.build.exportLog();
  const first = await preparePreview(s, a);
  const second = await preparePreview(s, a);
  assertEquals(Object.keys(first.body).sort(), ["audit", "versions"]);
  assertEquals(
    (first.body.versions as Array<{ data: unknown }>)[0].data,
    (second.body.versions as Array<{ data: unknown }>)[0].data,
  );
  assert(JSON.stringify(first.body).includes("Revised diagnosis narrative."));
  assert(JSON.stringify(first.body).includes('"magnitude":75'));
  assertEquals(a.caller.adapter.save(), bytes);
  assertEquals(a.caller.build.exportLog(), log);
  assertEquals(a.caller.build.getDraft(s.draftId).committed, undefined);
  writeField(s, a, "pulse", 75);
  receive(s, s.clones[1], a.caller.adapter.save());
  assertEquals(readField(s, s.clones[1], "pulse"), 75);
});

Deno.test("Contribution Builder demo: present-but-invalid vitals block output preparation", async () => {
  const s = await started();
  writeField(s, s.clones[0], "spo2", 101);
  await assertRejects(
    () => preparePreview(s, s.clones[0]),
    Error,
    "fails complete validation",
  );
  assertEquals(
    s.clones[0].caller.build.getDraft(s.draftId).committed,
    undefined,
  );
});

Deno.test("Contribution Builder demo: edits record the editable username, with stable caller identity", async () => {
  const s = await started();
  const a = s.clones[0];
  a.username = "dr.changed";
  a.author.name = a.username;
  writeField(s, a, "heading", "Changed heading");
  const op = a.caller.adapter.operations().at(-1)!;
  assertEquals(op.author, { id: a.id, name: "dr.changed" });
});
