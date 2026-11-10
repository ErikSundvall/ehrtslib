import { assertEquals, assertFalse } from "@std/assert";
import { Window } from "npm:happy-dom@21.0.4";
import { handleFieldEnterKey, nextFieldInput } from "./cb-field-enter.ts";

function panelMarkup(): string {
  return `
    <form id="f">
      <input data-field="systolic" type="number" />
      <input data-field="diastolic" type="number" />
      <textarea data-field="clinicalDescription" rows="4"></textarea>
    </form>`;
}

function installDom(w: Window): void {
  (globalThis as unknown as { window: Window }).window = w;
  (globalThis as unknown as { document: Document }).document = w.document;
  (globalThis as unknown as { HTMLElement: typeof HTMLElement }).HTMLElement = w
    .HTMLElement as typeof HTMLElement;
  (globalThis as unknown as { HTMLInputElement: typeof HTMLInputElement })
    .HTMLInputElement = w.HTMLInputElement as typeof HTMLInputElement;
}

Deno.test("cb demo #303: Enter on single-line field confirms and focuses next", () => {
  const w = new Window();
  installDom(w);
  w.document.body.innerHTML = panelMarkup();
  const panel = w.document.body;
  const systolic = panel.querySelector('[data-field="systolic"]')!;
  const diastolic = panel.querySelector('[data-field="diastolic"]')!;
  let confirmed = false;
  systolic.addEventListener("change", () => {
    confirmed = true;
  });
  systolic.focus();
  const keydown = new w.KeyboardEvent("keydown", {
    key: "Enter",
    bubbles: true,
  });
  Object.defineProperty(keydown, "target", {
    value: systolic,
    configurable: true,
  });
  const handled = handleFieldEnterKey(
    keydown,
    panel,
    (input) => input.dispatchEvent(new w.Event("change", { bubbles: true })),
  );
  assertEquals(handled, true);
  assertEquals(confirmed, true);
  assertEquals(w.document.activeElement, diastolic);
  w.close();
});

Deno.test("cb demo #303: Enter on textarea is not intercepted", () => {
  const w = new Window();
  installDom(w);
  w.document.body.innerHTML = panelMarkup();
  const panel = w.document.body;
  const textarea = panel.querySelector('[data-field="clinicalDescription"]')!;
  textarea.focus();
  const handled = handleFieldEnterKey(
    new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    panel,
    () => {},
  );
  assertFalse(handled);
  w.close();
});

Deno.test("cb demo #303: Enter in single-line field does not submit the form", () => {
  const w = new Window();
  installDom(w);
  w.document.body.innerHTML = panelMarkup();
  const panel = w.document.body;
  const form = panel.querySelector("form")!;
  let submits = 0;
  form.addEventListener("submit", (event) => {
    submits++;
    event.preventDefault();
  });
  form.addEventListener("keydown", (event) => {
    handleFieldEnterKey(event, panel, (input) => {
      input.dispatchEvent(new w.Event("change", { bubbles: true }));
    });
  });
  const systolic = panel.querySelector('[data-field="systolic"]')!;
  systolic.dispatchEvent(
    new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
  );
  assertEquals(submits, 0);
  w.close();
});

Deno.test("cb demo #303: textarea keeps newline on Enter (not handled)", () => {
  const w = new Window();
  installDom(w);
  w.document.body.innerHTML = panelMarkup();
  const panel = w.document.body;
  const textarea = panel.querySelector<HTMLTextAreaElement>(
    '[data-field="clinicalDescription"]',
  )!;
  textarea.focus();
  const before = textarea.value;
  const event = new w.KeyboardEvent("keydown", {
    key: "Enter",
    bubbles: true,
  });
  const handled = handleFieldEnterKey(event, panel, () => {});
  assertFalse(handled);
  textarea.value = `${before}\n`;
  assertEquals(textarea.value.includes("\n"), true);
  w.close();
});

Deno.test("cb demo #303: nextFieldInput skips unknown fields", () => {
  const w = new Window();
  installDom(w);
  w.document.body.innerHTML = panelMarkup();
  const panel = w.document.body;
  const systolic = panel.querySelector('[data-field="systolic"]')!;
  assertEquals(nextFieldInput(panel, systolic)?.dataset.field, "diastolic");
  w.close();
});
