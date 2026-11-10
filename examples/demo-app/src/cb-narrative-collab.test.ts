import { assertEquals } from "@std/assert";
import { NarrativeCollabView } from "./cb-narrative-collab.ts";

Deno.test("narrative collab: ignores stale caret wire after newer position", () => {
  const view = new NarrativeCollabView("self");
  view.apply({
    t: "caret",
    userId: "peer",
    name: "nurse.a",
    field: "temperatureComment",
    cursor: "cursor-new",
    atMs: 200,
  });
  view.apply({
    t: "caret",
    userId: "peer",
    name: "nurse.a",
    field: "temperatureComment",
    cursor: "cursor-old",
    atMs: 100,
  });
  const [caret] = view.carets(500);
  assertEquals(caret!.cursor, "cursor-new");
});
