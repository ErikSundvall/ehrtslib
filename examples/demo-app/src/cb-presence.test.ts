import { assertEquals, assertFalse } from "@std/assert";
import {
  applyWireMessage,
  DEFAULT_PRESENCE_CONFIG,
  formatRelative,
  PresenceView,
  type PresenceWireMessage,
  summarizeChange,
  userInitials,
} from "./cb-presence.ts";

const FIELDS = ["heading", "narrative", "systolic"] as const;
const t0 = 1_700_000_000_000;

function peer(id: string, name: string) {
  return { userId: id, displayName: name };
}

function msg(m: PresenceWireMessage): PresenceWireMessage {
  return m;
}

Deno.test("presence: join shows focused badge on default field", () => {
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
  const onHeading = view.badgesForField("heading", t0 + 100);
  assertEquals(onHeading.badges.length, 1);
  assertEquals(onHeading.badges[0]!.initials, "NA");
  assertEquals(onHeading.badges[0]!.kind, "focused");
  assertEquals(view.badgesForField("systolic", t0).badges.length, 0);
});

Deno.test("presence: focus moves badge between fields", () => {
  const view = new PresenceView("self");
  const p = peer("u2", "dr.berg");
  view.heartbeat(p, "systolic", "focused", t0);
  assertEquals(
    view.badgesForField("systolic", t0 + 50).badges[0]!.kind,
    "focused",
  );
  view.heartbeat(p, "diastolic", "focused", t0 + 200);
  assertEquals(view.badgesForField("systolic", t0 + 250).badges.length, 0);
  assertEquals(view.badgesForField("diastolic", t0 + 250).badges.length, 1);
});

Deno.test("presence: editing and recent-edit with change summary", () => {
  const view = new PresenceView("self");
  applyWireMessage(
    view,
    msg({
      t: "edit",
      userId: "u3",
      name: "midwife.chen",
      field: "heading",
      from: "Old dx",
      to: "New dx",
      atMs: t0,
    }),
  );
  const live = view.badgesForField("heading", t0 + 100).badges[0]!;
  assertEquals(live.kind, "editing");
  assertEquals(live.changeSummary, summarizeChange("Old dx", "New dx"));
  view.heartbeat(peer("u3", "midwife.chen"), null, "focused", t0 + 500);
  const recent = view.badgesForField("heading", t0 + 600).badges[0]!;
  assertEquals(recent.kind, "recent-edit");
});

Deno.test("presence: live presence expires after stale timeout", () => {
  const cfg = { ...DEFAULT_PRESENCE_CONFIG, staleMs: 1000 };
  const view = new PresenceView("self", cfg);
  view.heartbeat(peer("u4", "gp.dalton"), "pulse", "editing", t0);
  assertEquals(view.badgesForField("pulse", t0 + 500).badges.length, 1);
  assertEquals(view.badgesForField("pulse", t0 + 1500).badges.length, 0);
});

Deno.test("presence: recent-edit fades toward grey floor but remains", () => {
  const cfg = {
    ...DEFAULT_PRESENCE_CONFIG,
    staleMs: 500,
    recentEditFadeMs: 10_000,
    recentEditMinOpacity: 0.12,
  };
  const view = new PresenceView("self", cfg);
  view.recordEdit(peer("u5", "physio.ek"), "spo2", "90", "95", t0);
  view.heartbeat(peer("u5", "physio.ek"), null, "focused", t0 + 1);
  const mid = view.badgesForField("spo2", t0 + 2_000).badges[0]!;
  assertEquals(mid.kind, "recent-edit");
  assertEquals(mid.opacity, 1);
  const late = view.badgesForField("spo2", t0 + 9_500).badges[0]!;
  assertEquals(late.opacity < 1, true);
  assertEquals(late.opacity >= cfg.recentEditMinOpacity, true);
  assertEquals(view.badgesForField("spo2", t0 + 11_000).badges.length, 1);
  assertEquals(
    view.badgesForField("spo2", t0 + 200_000).badges[0]!.heavilyFaded,
    true,
  );
});

Deno.test("presence: never shows the local user", () => {
  const view = new PresenceView("local");
  view.heartbeat(peer("local", "me"), "heading", "editing", t0);
  view.recordEdit(peer("local", "me"), "heading", "a", "b", t0);
  assertEquals(view.badgesForField("heading", t0).badges.length, 0);
});

Deno.test("presence: helpers", () => {
  assertEquals(userInitials("consultant.green"), "CG");
  assertEquals(formatRelative(t0, t0 + 4_000), "just now");
  assertEquals(formatRelative(t0, t0 + 90_000), "2 min ago");
  const long = FIELDS;
  assertFalse(long.length < 1);
});
