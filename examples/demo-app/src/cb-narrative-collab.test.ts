import { assertEquals } from "@std/assert";
import { NarrativeCollabView } from "./cb-narrative-collab.ts";

Deno.test("narrative collab: ignores stale caret wire after newer position", () => {
  const view = new NarrativeCollabView("self");
  view.apply({
    t: "caret",
    userId: "peer",
    name: "nurse.a",
    field: "temperatureComment",
    offset: 55,
    beforeCaret: "only..sdsd",
    atMs: 200,
  });
  view.apply({
    t: "caret",
    userId: "peer",
    name: "nurse.a",
    field: "temperatureComment",
    offset: 29,
    beforeCaret: "room was",
    atMs: 100,
  });
  const [caret] = view.carets(500);
  assertEquals(caret!.offset, 55);
  assertEquals(caret!.beforeCaret, "only..sdsd");
});
