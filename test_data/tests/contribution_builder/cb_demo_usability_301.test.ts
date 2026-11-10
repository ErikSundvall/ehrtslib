import { assert, assertEquals } from "@std/assert";
import * as Automerge from "@automerge/automerge";
import {
  caretLineIndex,
  reconcileCaretWithHighlights,
  resolveCaretOffset,
  resolveHighlightRange,
} from "../../../examples/demo-app/src/cb-narrative-layout.ts";
import {
  advancePlaybackStep,
  exitTimeTravel,
  initialTimeTravelState,
  isCloneReadOnly,
  refreshTimeline,
  setScrubStep,
  toggleHistoryPlayback,
  toggleTimelinePanel,
} from "../../../examples/demo-app/src/cb-time-travel.ts";
import { deriveTimeTravelChrome } from "../../../examples/demo-app/src/cb-time-travel-ui.ts";
import { historicalBadgesForField } from "../../../examples/demo-app/src/cb-history-presence.ts";
import type { FieldBinding } from "../../../examples/demo-app/src/contribution-demo.ts";
import type { CbOperation } from "../../../contribution_builder/mod.ts";

function mockOp(
  replica: string,
  name: string,
  target: string,
  path: string,
  value: string,
  ts: string,
): CbOperation {
  return {
    type: "set-value",
    replica,
    seq: 1,
    author: { id: replica, name },
    timestamp: ts,
    draft: "d",
    target,
    path,
    value,
  };
}

Deno.test("cb demo #301: historical presence shows other replica, not viewer", () => {
  const fields = {
    pulse: { target: "bp", path: "value/magnitude" },
  } as Record<string, FieldBinding>;
  const ops = [
    mockOp("viewer", "nurse.a", "bp", "value/magnitude", "72", "2026-01-01T10:00:00.000Z"),
    mockOp("peer", "nurse.b", "bp", "value/magnitude", "88", "2026-01-01T10:01:00.000Z"),
  ];
  const view = historicalBadgesForField(
    ops,
    fields as never,
    "pulse",
    "viewer",
    0,
  );
  assertEquals(view.badges.length, 1);
  assertEquals(view.badges[0]!.userId, "peer");
  assertEquals(view.badges[0]!.displayName, "nurse.b");
});

const temperatureComment =
  "Oral temp measurement. The temperature room was really warm.\nSynthetic example only.";

Deno.test("cb demo #301: caret snaps to tail highlight when wire offset is stale", () => {
  const text = `${temperatureComment}..sdsd`;
  const at = reconcileCaretWithHighlights(
    text,
    text.indexOf("was") + 2,
    "room was",
    { start: text.indexOf("..sdsd"), end: text.length },
  );
  assertEquals(at, text.length);
  assertEquals(caretLineIndex(text, at), 1);
});

Deno.test("cb demo #301: stale wire caret resolves via beforeCaret at line end", () => {
  const text = `${temperatureComment}sdsd`;
  const staleWire = temperatureComment.indexOf("was") + 2;
  const before = "only.sdsd";
  const at = resolveCaretOffset(text, staleWire, before);
  assertEquals(at, text.length);
  assertEquals(caretLineIndex(text, at), 1);
  assertEquals(text.slice(at - before.length, at), before);
});

Deno.test("cb demo #301: caret hides when sender tail not yet merged", () => {
  const base =
    "Oral measurement. The room was warm.\nSynthetic example only.";
  assertEquals(resolveCaretOffset(base, 29, "..sdsd"), -1);
});

Deno.test("cb demo #301: caret anchor after concurrent peer merge", () => {
  const base =
    "Oral measurement. The room was warm.\nSynthetic example only.";
  const peer = `${base} PEER_NOTE`;
  const staleWire = 22;
  const at = resolveCaretOffset(peer, staleWire, " PEER_NOTE");
  assertEquals(at, peer.length);
  assertEquals(peer.slice(at - " PEER_NOTE".length), " PEER_NOTE");
});

Deno.test("cb demo #301: short remote inserts anchor near wire start, not the first duplicate letter", () => {
  const merged = `${temperatureComment}sdsd`;
  const insertAt = merged.indexOf("sdsd");
  const snippet = "s";
  const range = resolveHighlightRange(merged, insertAt, snippet, insertAt + 1);
  assert(range);
  assertEquals(range!.start, insertAt);
  assertEquals(merged.slice(range!.start, range!.end), snippet);
  assertEquals(
    range!.start > merged.indexOf("s"),
    true,
    "must not pick the first s in Oral temp measurement",
  );
});

Deno.test("cb demo #301: concurrent peer text still resolves end insert", () => {
  const local =
    "Oral temp measurement. The temperature room was really warm.\nSynthetic example only.";
  const concurrent =
    `${local.slice(0, 22)} (draft note)${local.slice(22)}.sdsd`;
  const wireStart = local.length;
  const range = resolveHighlightRange(concurrent, wireStart, ".sdsd", wireStart + 5);
  assert(range);
  assertEquals(concurrent.slice(range!.start, range!.end), ".sdsd");
  assertEquals(range!.start, concurrent.length - 5);
});

Deno.test("cb demo #301: time travel stays read-only at latest scrub step", () => {
  let state = initialTimeTravelState(12);
  state = toggleTimelinePanel(state);
  state = setScrubStep(state, 12);
  assertEquals(isCloneReadOnly(state), true);
  const chrome = deriveTimeTravelChrome(state);
  assertEquals(chrome.toggleLabel, "Return to live");
  assertEquals(chrome.bannerVisible, true);
  assertEquals(chrome.returnToLiveVisible, true);
  state = exitTimeTravel(state);
  assertEquals(isCloneReadOnly(state), false);
  assertEquals(deriveTimeTravelChrome(state).toggleLabel, "Time travel");
});

Deno.test("cb demo #301: scrub refresh keeps time-travel mode at max step", () => {
  let doc = Automerge.from({ n: 0 });
  for (let i = 1; i <= 4; i++) {
    doc = Automerge.change(doc, (d) => {
      d.n = i;
    });
  }
  const bytes = Automerge.save(doc);
  let state = toggleTimelinePanel(initialTimeTravelState(4));
  state = setScrubStep(state, 4);
  const next = refreshTimeline(bytes, state);
  assertEquals(next.panelOpen, true);
  assertEquals(next.step, 4);
  assertEquals(isCloneReadOnly(next), true);
});

Deno.test("cb demo #301: playback advances until max step then pauses", () => {
  let state = setScrubStep(toggleTimelinePanel(initialTimeTravelState(3)), 0);
  state = toggleHistoryPlayback(state);
  assertEquals(state.playing, true);
  state = advancePlaybackStep(state);
  assertEquals(state.step, 1);
  state = advancePlaybackStep(state);
  assertEquals(state.step, 2);
  state = advancePlaybackStep(state);
  assertEquals(state.step, 3);
  state = advancePlaybackStep(state);
  assertEquals(state.playing, false);
  assertEquals(state.step, 3);
});
