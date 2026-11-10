import { assert, assertEquals, assertFalse } from "@std/assert";
import {
  applyWireMessage,
  DEFAULT_PRESENCE_CONFIG,
  PresenceView,
  type PresenceWireMessage,
} from "../../../examples/demo-app/src/cb-presence.ts";
import {
  DEFAULT_NARRATIVE_COLLAB_CONFIG,
  diffRange,
  highlightOpacity,
  NarrativeCollabView,
} from "../../../examples/demo-app/src/cb-narrative-collab.ts";
import {
  enterScrubbing,
  initialTimeTravelState,
  isCloneReadOnly,
  leaveScrubbing,
  setScrubStep,
} from "../../../examples/demo-app/src/cb-time-travel.ts";
import {
  historyStepCount,
  materializeAtStep,
} from "../../../addons/cb_automerge/mod.ts";
import * as Automerge from "@automerge/automerge";

const t0 = 1_700_000_000_000;

function peer(id: string, name: string) {
  return { userId: id, displayName: name };
}

function msg(m: PresenceWireMessage): PresenceWireMessage {
  return m;
}

Deno.test("cb demo #293: presence badges sort by most recent activity", () => {
  const view = new PresenceView("self");
  view.heartbeat(peer("u1", "alpha"), "diagnosisName", "focused", t0);
  view.recordEdit(peer("u2", "beta"), "diagnosisName", "a", "b", t0 + 5_000);
  view.heartbeat(peer("u3", "gamma"), "diagnosisName", "editing", t0 + 10_000);
  const badges = view.badgesForField("diagnosisName", t0 + 11_000).badges;
  assertEquals(badges.map((b) => b.userId), ["u3", "u2", "u1"]);
});

Deno.test("cb demo #293: edit badges fade but never disappear", () => {
  const cfg = {
    ...DEFAULT_PRESENCE_CONFIG,
    staleMs: 500,
    recentEditFadeMs: 10_000,
    recentEditMinOpacity: 0.12,
  };
  const view = new PresenceView("self", cfg);
  view.recordEdit(peer("u5", "physio.ek"), "spo2", "90", "95", t0);
  view.heartbeat(peer("u5", "physio.ek"), null, "focused", t0 + 1);
  const ancient = view.badgesForField("spo2", t0 + 500_000).badges[0]!;
  assertEquals(ancient.kind, "recent-edit");
  assertEquals(ancient.heavilyFaded, true);
  assert(ancient.opacity <= cfg.recentEditMinOpacity + 0.02);
  assertEquals(view.badgesForField("spo2", t0 + 500_000).badges.length, 1);
});

Deno.test("cb demo #293: focus-only badges drop when focus leaves", () => {
  const view = new PresenceView("self");
  view.heartbeat(peer("u4", "gp.dalton"), "pulse", "focused", t0);
  assertEquals(view.badgesForField("pulse", t0 + 50).badges.length, 1);
  view.heartbeat(peer("u4", "gp.dalton"), null, "focused", t0 + 60);
  assertEquals(view.badgesForField("pulse", t0 + 70).badges.length, 0);
});

Deno.test("cb demo #293: narrative highlight opacity expires", () => {
  const ttl = DEFAULT_NARRATIVE_COLLAB_CONFIG.highlightTtlMs;
  assertEquals(highlightOpacity(0, ttl), 1);
  assert(highlightOpacity(ttl - 1, ttl) >= 0);
  assertEquals(highlightOpacity(ttl + 1, ttl), 0);
  const view = new NarrativeCollabView("self");
  view.apply({
    t: "text-hl",
    userId: "remote",
    name: "remote.user",
    field: "clinicalDescription",
    start: 0,
    end: 3,
    atMs: t0,
  });
  assertEquals(view.highlights(t0 + ttl + 1).length, 0);
});

Deno.test("cb demo #293: diffRange finds edited span", () => {
  const range = diffRange("hello world", "hello brave world");
  assertEquals(range, { start: 6, end: 12 });
});

Deno.test("cb demo #293: time-travel read-only while scrubbing", () => {
  let state = initialTimeTravelState(8);
  assertFalse(isCloneReadOnly(state));
  state = enterScrubbing(state);
  assertFalse(isCloneReadOnly(state));
  state = setScrubStep(state, 3);
  assertEquals(isCloneReadOnly(state), true);
  state = leaveScrubbing(state);
  assertFalse(isCloneReadOnly(state));
});

Deno.test("cb demo #293: automerge materializeAtStep rewinds", () => {
  let doc = Automerge.from({ n: 0 });
  for (let i = 1; i <= 4; i++) {
    doc = Automerge.change(doc, (d) => {
      d.n = i;
    });
  }
  const bytes = Automerge.save(doc);
  assertEquals(historyStepCount(bytes), 5);
  const early = Automerge.load(materializeAtStep(bytes, 1));
  assertEquals(early.n, 1);
});

Deno.test("cb demo #293: wire join still shows focused badge", () => {
  const view = new PresenceView("self");
  applyWireMessage(
    view,
    msg({
      t: "join",
      userId: "u1",
      name: "nurse.andersson",
      atMs: t0,
    }),
  );
  const onHeading = view.badgesForField("diagnosisName", t0 + 100);
  assertEquals(onHeading.badges.length, 1);
  assertEquals(onHeading.badges[0]!.kind, "focused");
});
