import { assert, assertEquals, assertRejects, assertThrows } from "@std/assert";
import { CbOperationError } from "../../../contribution_builder/mod.ts";
import {
  addClone,
  createDemoSession,
  delayFor,
  DEMO_FILLED_DIAGNOSIS_NAME,
  DEMO_INITIAL_EMPTY_MANDATORY_FIELD,
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
  assertEquals(readField(s, a, DEMO_INITIAL_EMPTY_MANDATORY_FIELD), "");
  assert(s.validator.validate(a.caller.build, s.draftId, s.template).errors
    .length > 0);
  assertEquals(
    a.caller.build.toCanonicalJson(s.draftId),
    b.caller.build.toCanonicalJson(s.draftId),
  );
  const c = addClone(s);
  assertEquals(s.clones.length, 3);
  assertEquals(a.username, USERNAMES[0]);
  assertEquals(b.username, USERNAMES[1]);
  assertEquals(c.username, USERNAMES[2]);
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
  writeField(s, a, "diagnosisName", "Peer diagnosis");
  receive(s, b, a.caller.adapter.save());
  const error = assertThrows(
    () => writeField(s, b, "diagnosisName", "Stale diagnosis", seen),
    CbOperationError,
  );
  assertEquals(error.code, "changed-by-someone-else");
  assertEquals(readField(s, b, "diagnosisName"), "Peer diagnosis");
});

Deno.test("Contribution Builder demo: native Unicode text converges on N clones and remains committable", async () => {
  const s = await started();
  const [a, b] = s.clones;
  const original = String(readField(s, a, "clinicalDescription"));
  writeField(s, a, "clinicalDescription", `Å👩‍⚕️ ${original}`);
  writeField(s, b, "clinicalDescription", `${original}\nReviewed 🫀`);
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
    assertEquals(readField(s, clone, "clinicalDescription"), expected);
  }
  writeField(s, c, "diagnosisName", DEMO_FILLED_DIAGNOSIS_NAME);
  const p = await preparePreview(s, c);
  assertEquals(p.validation[0].valid, true);
  assert(JSON.stringify(p.body).includes("Reviewed 🫀"));
});

Deno.test("Contribution Builder demo: repeated preview never compacts or locks the live Automerge log", async () => {
  const s = await started();
  const a = s.clones[0];
  writeField(s, a, "diagnosisName", DEMO_FILLED_DIAGNOSIS_NAME);
  writeField(s, a, "clinicalDescription", "Revised clinical description.");
  // Its base rev names text which compaction will remove.
  writeField(s, a, "pulse", 75);
  const bytes = a.caller.adapter.save();
  const log = a.caller.build.exportLog();
  writeField(s, a, "diagnosisName", DEMO_FILLED_DIAGNOSIS_NAME);
  const first = await preparePreview(s, a);
  const second = await preparePreview(s, a);
  assertEquals(Object.keys(first.body).sort(), ["audit", "versions"]);
  assertEquals(
    (first.body.versions as Array<{ data: unknown }>)[0].data,
    (second.body.versions as Array<{ data: unknown }>)[0].data,
  );
  assert(JSON.stringify(first.body).includes("Revised clinical description."));
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
  writeField(s, s.clones[0], "diagnosisName", DEMO_FILLED_DIAGNOSIS_NAME);
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

Deno.test("Contribution Builder demo: long text stays off the diagnosis name (#286)", async () => {
  const s = await started();
  const a = s.clones[0];
  assertEquals(readField(s, a, "diagnosisName"), "");
  assertEquals(s.fields.diagnosisName.path, "value/value");
  assertEquals(s.fields.clinicalDescription.path, "value/value");
  assertEquals(s.fields.comment.path, "value/value");
  assert(s.fields.diagnosisName.target !== s.fields.clinicalDescription.target);
  assert(s.fields.clinicalDescription.target !== s.fields.comment.target);
  const description = String(readField(s, a, "clinicalDescription"));
  const comment = String(readField(s, a, "comment"));
  assert(description.includes("\n\n"));
  assert(comment.includes("not the diagnosis name"));
  assert(!String(readField(s, a, "diagnosisName")).includes("\n"));
  assertEquals(readField(s, a, "respirationRate"), 16);
  assertEquals(readField(s, a, "temperature"), 36.8);
  assert(String(readField(s, a, "temperatureComment")).includes("Oral measurement"));
  const canonical = JSON.stringify(a.caller.build.toCanonicalJson(s.draftId));
  assert(canonical.includes("Follow-up is planned in two days"));
  assert(canonical.includes("Household contacts"));
  assert(!canonical.includes(DEMO_FILLED_DIAGNOSIS_NAME));
  writeField(s, a, "diagnosisName", DEMO_FILLED_DIAGNOSIS_NAME);
  const prepared = await preparePreview(s, a);
  assertEquals(prepared.validation[0].valid, true);
  const body = JSON.stringify(prepared.body);
  assert(body.includes("Follow-up is planned in two days"));
  assert(body.includes("Suspected viral upper respiratory infection"));
  writeField(s, a, "comment", `${comment}\nSecond paragraph, still not the name.`);
  receive(s, s.clones[1], a.caller.adapter.save());
  assertEquals(
    readField(s, s.clones[1], "comment"),
    `${comment}\nSecond paragraph, still not the name.`,
  );
  assertEquals(
    readField(s, s.clones[1], "diagnosisName"),
    DEMO_FILLED_DIAGNOSIS_NAME,
  );
  writeField(s, a, "clinicalDescription", "");
  assertEquals(readField(s, a, "clinicalDescription"), "");
  assertEquals(readField(s, a, "diagnosisName"), DEMO_FILLED_DIAGNOSIS_NAME);
});

Deno.test("Contribution Builder demo: edits record the editable username, with stable caller identity", async () => {
  const s = await started();
  const a = s.clones[0];
  a.username = "dr.changed";
  a.author.name = a.username;
  writeField(s, a, "diagnosisName", "Changed name");
  const op = a.caller.adapter.operations().at(-1)!;
  assertEquals(op.author, { id: a.id, name: "dr.changed" });
});
