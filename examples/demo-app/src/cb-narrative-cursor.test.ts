import { assert, assertEquals } from "@std/assert";
import * as Automerge from "@automerge/automerge";
import {
  AutomergeOperationLogAdapter,
  textFieldKey,
} from "../../../addons/cb_automerge/mod.ts";
import { caretLineIndex } from "./cb-narrative-layout.ts";
import {
  encodeNarrativeCaret,
  narrativeTextKey,
  resolveNarrativeCaret,
} from "./cb-narrative-cursor.ts";

const TEXT =
  "Oral measurement. The room was warm.\nSynthetic example only.";
const sessionStub = {
  draftId: "draft-demo",
  fields: {
    temperatureComment: { target: "temp-obs", path: "data/value" },
  },
} as const;

function seedAdapter(value = TEXT): AutomergeOperationLogAdapter {
  const adapter = new AutomergeOperationLogAdapter();
  adapter.seedText(
    sessionStub.draftId,
    sessionStub.fields.temperatureComment.target,
    sessionStub.fields.temperatureComment.path,
    value,
  );
  return adapter;
}

Deno.test("narrative cursor: survives concurrent insert before caret", () => {
  const key = narrativeTextKey(sessionStub, "temperatureComment");
  const sender = seedAdapter();
  const wire = encodeNarrativeCaret(
    sender,
    sessionStub,
    "temperatureComment",
    TEXT.length,
  );
  assert(wire);

  const left = Automerge.load<{ text: Record<string, string> }>(sender.save());
  const right = Automerge.change(Automerge.clone(left), (d) => {
    Automerge.splice(d, ["text", key], 5, 0, "X");
  });
  const merged = Automerge.merge(Automerge.clone(left), right);
  const receiver = AutomergeOperationLogAdapter.load(Automerge.save(merged));
  const resolved = resolveNarrativeCaret(
    receiver,
    sessionStub,
    "temperatureComment",
    wire,
  );
  assertEquals(resolved, TEXT.length + 1);
});

Deno.test("narrative cursor: multiline tail maps to line 2", () => {
  const text = `${TEXT}..sdsd`;
  const sender = seedAdapter(text);
  const at = text.length;
  const wire = encodeNarrativeCaret(
    sender,
    sessionStub,
    "temperatureComment",
    at,
  );
  assert(wire);
  const resolved = resolveNarrativeCaret(
    sender,
    sessionStub,
    "temperatureComment",
    wire,
  );
  assertEquals(resolved, at);
  assertEquals(caretLineIndex(text, resolved!), 1);
});

Deno.test("narrative cursor: mid-text after Oral", () => {
  const mid = TEXT.indexOf("Oral") + "Oral".length;
  const sender = seedAdapter();
  const peer = seedAdapter();
  sender.merge(peer);
  const wire = encodeNarrativeCaret(
    sender,
    sessionStub,
    "temperatureComment",
    mid,
  );
  assert(wire);
  assertEquals(
    resolveNarrativeCaret(peer, sessionStub, "temperatureComment", wire),
    mid,
  );
  assertEquals(caretLineIndex(TEXT, mid), 0);
});

Deno.test("narrative cursor: unmerged peer hides until text exists", () => {
  const sender = seedAdapter();
  const wire = encodeNarrativeCaret(
    sender,
    sessionStub,
    "temperatureComment",
    TEXT.length,
  );
  const empty = new AutomergeOperationLogAdapter();
  const key = textFieldKey(
    sessionStub.draftId,
    sessionStub.fields.temperatureComment.target,
    sessionStub.fields.temperatureComment.path,
  );
  assert(!empty.nativeText(
    sessionStub.draftId,
    sessionStub.fields.temperatureComment.target,
    sessionStub.fields.temperatureComment.path,
  ));
  assertEquals(
    resolveNarrativeCaret(empty, sessionStub, "temperatureComment", wire!),
    null,
  );
  assertEquals(empty.resolveTextCursorAt(key, wire!), null);
});
