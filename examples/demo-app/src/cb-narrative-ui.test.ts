import { assertEquals } from "@std/assert";
import { Window } from "npm:happy-dom@21.0.4";
import { NarrativeCollabView } from "./cb-narrative-collab.ts";
import {
  caretLineIndex,
  caretOffsetToCoords,
} from "./cb-narrative-layout.ts";

const TEXT =
  "Oral measurement. The room was warm.\nSynthetic example only..sdsd";

Deno.test("narrative UI: marker position matches resolved line 2 offset", async () => {
  const happyDomWindow = new Window();
  (globalThis as unknown as { window: Window }).window = happyDomWindow;
  (globalThis as unknown as { document: Document }).document =
    happyDomWindow.document;
  globalThis.getComputedStyle = happyDomWindow.getComputedStyle.bind(
    happyDomWindow,
  );
  const cssPath = new URL("../public/contribution-builder.css", import.meta.url);
  const style = document.createElement("style");
  style.textContent = await Deno.readTextFile(cssPath);
  document.head.append(style);
  const { ensureNarrativeShell, mirrorCaretCoords, paintNarrativeCollab } =
    await import("./cb-narrative-ui.ts");

  const resolved = TEXT.length;
  const view = new NarrativeCollabView("peer-clone");
  view.apply({
    t: "caret",
    userId: "remote",
    name: "nurse.andersson",
    field: "temperatureComment",
    cursor: "wire-cursor-token",
    atMs: Date.now(),
  });

  const textarea = document.createElement("textarea");
  textarea.rows = 3;
  textarea.style.width = "420px";
  textarea.style.font = "16px system-ui";
  textarea.style.padding = "6px 8px";
  textarea.value = TEXT;
  document.body.append(textarea);
  ensureNarrativeShell(textarea);
  paintNarrativeCollab(textarea, view, Date.now(), () => resolved);

  const stale = TEXT.indexOf("was") + 2;
  assertEquals(caretLineIndex(TEXT, resolved), 1);
  assertEquals(
    caretOffsetToCoords(textarea, TEXT, resolved).top >
      caretOffsetToCoords(textarea, TEXT, stale).top,
    true,
  );

  const markers = textarea.parentElement!.querySelectorAll(
    ".narrative-remote-caret",
  );
  assertEquals(markers.length, 1);
  assertEquals((markers[0] as HTMLElement).dataset.resolvedCaret, String(resolved));
  const markerTop = Number(
    (markers[0] as HTMLElement).style.top.replace("px", ""),
  );
  const endCoords = mirrorCaretCoords(textarea, resolved);
  assertEquals(markerTop, endCoords.top);
  happyDomWindow.close();
});

Deno.test("narrative UI: marker hides when resolver returns null", async () => {
  const happyDomWindow = new Window();
  (globalThis as unknown as { window: Window }).window = happyDomWindow;
  (globalThis as unknown as { document: Document }).document =
    happyDomWindow.document;
  globalThis.getComputedStyle = happyDomWindow.getComputedStyle.bind(
    happyDomWindow,
  );
  const { ensureNarrativeShell, paintNarrativeCollab } = await import(
    "./cb-narrative-ui.ts"
  );
  const view = new NarrativeCollabView("peer");
  view.apply({
    t: "caret",
    userId: "remote",
    name: "peer",
    field: "temperatureComment",
    cursor: "pending",
    atMs: Date.now(),
  });
  const textarea = document.createElement("textarea");
  textarea.value = TEXT;
  document.body.append(textarea);
  ensureNarrativeShell(textarea);
  paintNarrativeCollab(textarea, view, Date.now(), () => null);
  assertEquals(
    textarea.parentElement!.querySelectorAll(".narrative-remote-caret").length,
    0,
  );
  happyDomWindow.close();
});
