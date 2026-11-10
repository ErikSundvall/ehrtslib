import { assertEquals } from "@std/assert";
import { Window } from "npm:happy-dom@21.0.4";
import { caretOffsetToCoords, resolveCaretOffset } from "./cb-narrative-layout.ts";
import { NarrativeCollabView } from "./cb-narrative-collab.ts";

Deno.test("narrative UI: paints remote caret at resolved offset", async () => {
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

  const text =
    "Oral measurement. The room was warm.\nSynthetic example only.sdsd";
  const view = new NarrativeCollabView("peer-clone");
  view.apply({
    t: "caret",
    userId: "remote",
    name: "nurse.andersson",
    field: "temperatureComment",
    offset: text.indexOf("was") + 2,
    beforeCaret: "only.sdsd",
    atMs: Date.now(),
  });

  const textarea = document.createElement("textarea");
  textarea.rows = 3;
  textarea.style.width = "420px";
  textarea.style.font = "16px system-ui";
  textarea.style.padding = "6px 8px";
  textarea.value = text;
  document.body.append(textarea);
  ensureNarrativeShell(textarea);
  paintNarrativeCollab(textarea, view, Date.now());

  const stale = text.indexOf("was") + 2;
  const resolved = resolveCaretOffset(text, stale, "only.sdsd");
  assertEquals(resolved, text.length);
  assertEquals(
    caretOffsetToCoords(textarea, text, resolved).top >
      caretOffsetToCoords(textarea, text, stale).top,
    true,
  );

  const markers = textarea.parentElement!.querySelectorAll(
    ".narrative-remote-caret",
  );
  assertEquals(markers.length, 1);
  assertEquals((markers[0] as HTMLElement).dataset.resolvedCaret, String(resolved));
  assertEquals(Number((markers[0] as HTMLElement).dataset.resolvedCaret), text.length);
  happyDomWindow.close();
});
