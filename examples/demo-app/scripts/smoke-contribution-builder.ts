// Synthetic DOM smoke for the built browser bundle. Deno has no document, so
// this script uses happy-dom (MIT) as a headless Window. It is test-only and
// is not part of either app bundle. Pinned like TAAAT's Playwright smoke.
import { Window } from "npm:happy-dom@21.0.4";
import assert from "node:assert/strict";
const root = new URL("../../../", import.meta.url);
const w = new Window({
  url: "http://demo.test/contribution-builder.html",
  // v21 disables CSS/iframe network loads by default (SSRF). Keep script-src
  // loading off too: the bundle is imported via Deno, not happy-dom.
  settings: { disableJavaScriptFileLoading: true },
});
w.document.write(
  await Deno.readTextFile(
    new URL("examples/demo-app/public/contribution-builder.html", root),
  ),
);
for (
  const name of [
    "document",
    "HTMLElement",
    "HTMLInputElement",
    "HTMLTextAreaElement",
    "HTMLSelectElement",
    "HTMLTemplateElement",
  ]
) {
  Object.defineProperty(globalThis, name, {
    value: Reflect.get(w, name),
    configurable: true,
  });
}
const popups: Window[] = [];
const openPopup = () => {
  const popup = new Window({ url: "about:blank" });
  Object.defineProperty(popup, "opener", { value: null, writable: true });
  popups.push(popup);
  return popup;
};
globalThis.open = openPopup;
globalThis.confirm = () => true;
globalThis.getComputedStyle = w.getComputedStyle.bind(w);
const lifecycle = new EventTarget();
globalThis.addEventListener = lifecycle.addEventListener.bind(lifecycle);
globalThis.fetch = async (url) => {
  assert(
    String(url).startsWith("contribution-builder/"),
    "Unexpected network: " + url,
  );
  return new Response(
    await Deno.readTextFile(new URL("examples/demo-app/public/" + url, root)),
  );
};
const waitFor = async (fn: () => boolean) => {
  const start = Date.now();
  while (!fn()) {
    if (Date.now() - start > 15000) {
      throw new Error(
        "Timed out: " + w.document.querySelector("#status").textContent,
      );
    }
    await new Promise((r) => setTimeout(r, 20));
  }
};
await import(new URL("docs/demo/contribution-builder.js", root).href);
await waitFor(() => w.document.querySelectorAll(".clone").length === 2);
assert.match(w.document.querySelector("#status").textContent, /Ready/);
const panels = [...w.document.querySelectorAll(".clone")];
const first = panels[0].querySelector('[data-field="clinicalDescription"]'),
  second = panels[1].querySelector('[data-field="clinicalDescription"]');
const original = first.value;
first.value = "Start 👩‍⚕️ " + original;
first.dispatchEvent(new w.Event("input"));
second.value = original + " End 🫀";
second.dispatchEvent(new w.Event("input"));
w.document.querySelector("#sync-now").click();
assert.equal(first.value, "Start 👩‍⚕️ " + original + " End 🫀");
assert.equal(first.value, second.value);
w.document.querySelector("#add-clone").click();
assert.equal(w.document.querySelectorAll(".clone").length, 3);
w.document.querySelector("#sync-now").click();
for (let i = 0; i < 2; i++) {
  panels[0].querySelector("form").dispatchEvent(
    new w.Event("submit", { cancelable: true }),
  );
  await waitFor(() =>
    popups[i]?.document.querySelector("pre")?.textContent.includes("Start 👩‍⚕️")
  );
}
assert.notEqual(popups[0], popups[1]);
assert.match(popups[0].document.querySelector("p").textContent, /Preview only/);
const body = JSON.parse(popups[0].document.querySelector("pre").textContent);
assert.equal(body.versions.length, 1);
// Delayed traffic uses real MessagePorts, independent from the synthetic DOM.
for (const select of w.document.querySelectorAll(".profile")) {
  select.value = "office";
  select.dispatchEvent(new w.Event("change"));
}
const pulse = panels[0].querySelector('[data-field="pulse"]');
pulse.value = "88";
pulse.dispatchEvent(new w.Event("change"));
await waitFor(() =>
  panels[1].querySelector('[data-field="pulse"]').value === "88"
);
// A blocked popup must not start output/network work.
globalThis.open = () => null;
panels[0].querySelector("form").dispatchEvent(
  new w.Event("submit", { cancelable: true }),
);
assert.match(panels[0].querySelector(".feedback").textContent, /Popup blocked/);
// Optional CDR flow is mocked: no real server is contacted.
globalThis.open = openPopup;
w.document.querySelector("#sync-now").click();
w.document.querySelector("#destination").value = "cdr";
w.document.querySelector("#cdr-url").value =
  "https://cdr.invalid/rest/openehr/v1";
w.document.querySelector("#ehr-id").value = "synthetic-ehr";
w.document.querySelector("#system-id").value = "mock-cdr";
const posted: string[] = [];
let succeed = false;
globalThis.fetch = (_url, init) => {
  assert.equal(
    String(_url),
    "https://cdr.invalid/rest/openehr/v1/ehr/synthetic-ehr/contribution",
  );
  assert.equal(init?.method, "POST");
  posted.push(String(init?.body));
  return Promise.resolve(
    new Response(
      succeed ? '{"uid":{"value":"test-contribution"}}' : "test rejection",
      { status: succeed ? 201 : 400 },
    ),
  );
};
panels[0].querySelector("form").dispatchEvent(
  new w.Event("submit", { cancelable: true }),
);
await waitFor(() =>
  popups[2]?.document.querySelector("p")?.textContent.includes(
    "No successful commit recorded",
  )
);
assert.equal(panels[0].querySelector("button.commit").disabled, false);
assert.deepEqual(
  JSON.parse(posted[0]),
  JSON.parse(popups[2].document.querySelector("pre").textContent),
);
succeed = true;
panels[0].querySelector("form").dispatchEvent(
  new w.Event("submit", { cancelable: true }),
);
await waitFor(() =>
  popups[3]?.document.querySelector("p")?.textContent.includes("POST succeeded")
);
assert.equal(panels[0].querySelector("button.commit").disabled, true);
assert.deepEqual(
  JSON.parse(posted[1]),
  JSON.parse(popups[3].document.querySelector("pre").textContent),
);
console.log(
  "PASS: built browser bundle initializes in synthetic DOM; 2→3 panes, native concurrent Unicode edits, manual and delayed sync, two unique popup bodies, popup-block handling, mocked CDR failure/retry/success; no external requests",
);
lifecycle.dispatchEvent(new Event("pagehide"));
await w.happyDOM.close();
for (const popup of popups) await popup.happyDOM.close();
