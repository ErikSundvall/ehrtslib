import { assert, assertEquals, assertRejects } from "@std/assert";
import { Window } from "npm:happy-dom@21.0.4";
import {
  dataFieldInputsLackNativeRequired,
  mayApplyFieldEdit,
} from "../../../examples/demo-app/src/cb-field-edit-guard.ts";
import {
  COLORBREWER_SET3,
  rosterColorIndex,
  userAccentColor,
} from "../../../examples/demo-app/src/cb-user-colors.ts";
import { NarrativeCollabView } from "../../../examples/demo-app/src/cb-narrative-collab.ts";
import {
  ensureNarrativeShell,
  paintNarrativeCollab,
} from "../../../examples/demo-app/src/cb-narrative-ui.ts";
import {
  createDemoSession,
  readField,
  writeField,
} from "../../../examples/demo-app/src/contribution-demo.ts";
import { preparePreview } from "../../../examples/demo-app/src/contribution-demo.ts";

const assets = new URL(
  "../../../examples/demo-app/public/contribution-builder/",
  import.meta.url,
);
const htmlPath = new URL(
  "../../../examples/demo-app/public/contribution-builder.html",
  import.meta.url,
);

async function started() {
  return await createDemoSession(
    await Deno.readTextFile(new URL("simple-diagnose-and-vitals.opt", assets)),
    await Deno.readTextFile(
      new URL("simple-diagnose-and-vitals.wt.json", assets),
    ),
  );
}

Deno.test("cb demo #306 item 4: data-field inputs use no native HTML required", async () => {
  const html = await Deno.readTextFile(htmlPath);
  assert(dataFieldInputsLackNativeRequired(html));
});

Deno.test("cb demo #306 item 4: may apply edit when mandatory name is cleared", () => {
  const w = new Window();
  (globalThis as unknown as { window: Window }).window = w;
  (globalThis as unknown as { document: Document }).document = w.document;
  (globalThis as unknown as { HTMLInputElement: typeof HTMLInputElement })
    .HTMLInputElement = w.HTMLInputElement as typeof HTMLInputElement;
  w.document.body.innerHTML = `<input data-field="diagnosisName" value="had value" />`;
  const input = w.document.querySelector("input")!;
  input.value = "";
  assert(mayApplyFieldEdit(input));
  w.close();
});

Deno.test("cb demo #306 item 4: empty mandatory name syncs while editing", async () => {
  const session = await started();
  const clone = session.clones[0];
  writeField(session, clone, "diagnosisName", "Temporary label");
  assertEquals(readField(session, clone, "diagnosisName"), "Temporary label");
  writeField(session, clone, "diagnosisName", "");
  assertEquals(readField(session, clone, "diagnosisName"), "");
});

Deno.test("cb demo #306 item 4: commit preparation rejects empty mandatory field", async () => {
  const session = await started();
  await assertRejects(
    () => preparePreview(session, session.clones[0]),
    Error,
    "fails",
  );
});

Deno.test("cb demo #306 item 1: roster users get distinct Set3 chip colours", () => {
  const na = userAccentColor("nurse.andersson");
  const db = userAccentColor("dr.berg");
  assertEquals(na, COLORBREWER_SET3[rosterColorIndex("nurse.andersson")]);
  assertEquals(db, COLORBREWER_SET3[rosterColorIndex("dr.berg")]);
  assert(na !== db);
  const uniq = new Set(COLORBREWER_SET3);
  assertEquals(uniq.size, 12);
});

Deno.test("cb demo #306 item 5: short diagnosis name shows remote highlight layer", async () => {
  const w = new Window();
  (globalThis as unknown as { window: Window }).window = w;
  (globalThis as unknown as { document: Document }).document = w.document;
  (globalThis as unknown as { HTMLInputElement: typeof HTMLInputElement })
    .HTMLInputElement = w.HTMLInputElement as typeof HTMLInputElement;
  globalThis.getComputedStyle = w.getComputedStyle.bind(w);
  const css = await Deno.readTextFile(
    new URL("../../../examples/demo-app/public/contribution-builder.css", import.meta.url),
  );
  const style = w.document.createElement("style");
  style.textContent = css;
  w.document.head.append(style);

  const view = new NarrativeCollabView("self");
  view.apply({
    t: "text-hl",
    userId: "peer",
    name: "dr.berg",
    field: "diagnosisName",
    start: 0,
    end: 3,
    snippet: "New",
    atMs: Date.now(),
  });

  const input = w.document.createElement("input");
  input.value = "New diagnosis";
  input.style.width = "280px";
  w.document.body.append(input);
  ensureNarrativeShell(input);
  paintNarrativeCollab(input, view, Date.now(), () => 3);

  const hl = input.parentElement!.querySelector(".narrative-hl");
  assert(hl);
  assertEquals(hl!.textContent, "New");
  w.close();
});
