import { assert, assertEquals } from "@std/assert";
import { Window } from "npm:happy-dom@21.0.4";
import { NarrativeCollabView } from "./cb-narrative-collab.ts";
import { caretLineIndex } from "./cb-narrative-layout.ts";

const TEXT =
  "Oral measurement. The room was warm.\nSynthetic example only..sdsd";

async function paintCaret(
  resolved: number,
): Promise<{
  textarea: HTMLTextAreaElement;
  marker: HTMLElement;
  verticalLineBand: typeof import("./cb-narrative-ui.ts").verticalLineBand;
}> {
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
  const { ensureNarrativeShell, paintNarrativeCollab, verticalLineBand } =
    await import("./cb-narrative-ui.ts");

  const view = new NarrativeCollabView("peer-clone");
  view.apply({
    t: "caret",
    userId: "remote",
    name: "nurse.andersson",
    field: "temperatureComment",
    cursor: "wire",
    atMs: Date.now(),
  });

  const textarea = document.createElement("textarea");
  textarea.rows = 3;
  textarea.style.width = "420px";
  textarea.style.font = "16px system-ui";
  textarea.style.padding = "6px 8px";
  textarea.style.border = "1px solid #ccc";
  textarea.value = TEXT;
  document.body.append(textarea);
  const { caretLayer } = ensureNarrativeShell(textarea);
  paintNarrativeCollab(textarea, view, Date.now(), () => resolved);

  const marker = textarea.parentElement!.querySelector(
    ".narrative-remote-caret",
  ) as HTMLElement;
  assert(marker);
  return {
    textarea,
    marker,
    verticalLineBand: (t, x, at, layer) =>
      verticalLineBand(t, x, at, layer),
    caretLayer,
  } as {
    textarea: HTMLTextAreaElement;
    marker: HTMLElement;
    verticalLineBand: typeof verticalLineBand;
    caretLayer: HTMLElement;
  };
}

Deno.test("narrative UI: line 2 caret stem within line band", async () => {
  let happyDomWindow: Window | undefined;
  const { textarea, marker, verticalLineBand, caretLayer } = await paintCaret(
    TEXT.length,
  );
  happyDomWindow = (globalThis as { window?: Window }).window;
  const resolved = TEXT.length;
  assertEquals(caretLineIndex(TEXT, resolved), 1);
  const band = verticalLineBand(textarea, TEXT, resolved, caretLayer);
  const stemTop = Number(marker.style.top.replace("px", ""));
  const stem = marker.querySelector(".narrative-remote-caret__stem")!;
  assert(stem);
  const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 19;
  assert(
    Math.abs(stemTop - band.caretTop) <= lineHeight * 0.35,
    `stem top ${stemTop}px should match caret line ${band.caretTop}px`,
  );
  assert(
    stemTop >= band.lineTop - 1,
    `stem ${stemTop}px above line band [${band.lineTop}, ${band.lineBottom}]`,
  );
  assert(
    stemTop <= band.lineBottom - 4,
    `stem ${stemTop}px below line band [${band.lineTop}, ${band.lineBottom}]`,
  );
  const line1Band = verticalLineBand(textarea, TEXT, TEXT.indexOf("was"), caretLayer);
  if (band.lineTop > line1Band.lineTop + 4) {
    assert(
      stemTop > line1Band.lineBottom - 4,
      "line 2 stem must sit below line 1 band",
    );
  }
  happyDomWindow?.close?.();
});

Deno.test("narrative UI: line 1 mid-text stem within line band", async () => {
  let happyDomWindow: Window | undefined;
  const mid = TEXT.indexOf("Oral") + "Oral".length;
  const { textarea, marker, verticalLineBand, caretLayer } = await paintCaret(
    mid,
  );
  happyDomWindow = (globalThis as { window?: Window }).window;
  assertEquals(caretLineIndex(TEXT, mid), 0);
  const band = verticalLineBand(textarea, TEXT, mid, caretLayer);
  const stemTop = Number(marker.style.top.replace("px", ""));
  const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 19;
  assert(
    Math.abs(stemTop - band.caretTop) <= lineHeight * 0.35,
    `stem top ${stemTop}px should match caret line ${band.caretTop}px`,
  );
  assert(
    stemTop >= band.lineTop - 1 && stemTop <= band.lineBottom - 4,
    `stem ${stemTop}px outside line 1 band [${band.lineTop}, ${band.lineBottom}]`,
  );
  const line2Band = verticalLineBand(
    textarea,
    TEXT,
    TEXT.indexOf("\n") + 1,
    caretLayer,
  );
  if (line2Band.lineTop > band.lineBottom + 4) {
    assert(
      stemTop < line2Band.lineTop - 2,
      "line 1 stem must sit above line 2 band",
    );
  }
  happyDomWindow?.close?.();
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
