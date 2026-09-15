/**
 * Three variants of the TAAAT workspace, switchable via `?variant=`, on `/prototype.html`.
 *
 * Question: what layout makes the whole template definition tree discoverable
 * (nothing hidden behind collapsed D3 nodes) while still supporting manual
 * path-annotation editing and safe L10n.* generation that cannot rewrite the
 * constraint tree?
 */

import { createSession, sessionSnapshot } from "./session.ts";
import {
  currentVariantKey,
  mountPrototypeSwitcher,
  setVariantInUrl,
} from "./switcher.ts";
import { renderVariantA, VARIANT_A } from "./variant-a.ts";
import { renderVariantB, VARIANT_B } from "./variant-b.ts";
import { renderVariantC, VARIANT_C } from "./variant-c.ts";
import { resetSession } from "./session.ts";

const VARIANTS = [VARIANT_A, VARIANT_B, VARIANT_C];
const KEYS = VARIANTS.map((v) => v.key);
const session = createSession();

function render(): void {
  const key = currentVariantKey(KEYS, "A");
  const mount = document.getElementById("variant-root");
  if (!mount) return;
  if (key === "B") renderVariantB(mount, session, render);
  else if (key === "C") renderVariantC(mount, session, render);
  else renderVariantA(mount, session, render);

  const pre = document.getElementById("proto-state-json");
  if (pre) {
    pre.textContent = JSON.stringify(sessionSnapshot(session), null, 2);
  }
  const label = document.querySelector(".proto-switcher-label");
  const def = VARIANTS.find((v) => v.key === key) ?? VARIANTS[0];
  if (label) label.textContent = `${def.key} — ${def.name}`;
}

function init(): void {
  let key = currentVariantKey(KEYS, "A");
  setVariantInUrl(key);

  const switcherHost = document.getElementById("proto-switcher");
  if (switcherHost) {
    mountPrototypeSwitcher(switcherHost, VARIANTS, key, (next) => {
      key = next;
      render();
    });
  }

  document.getElementById("proto-reset")?.addEventListener("click", () => {
    resetSession(session);
    render();
  });
  document.getElementById("proto-state-toggle")?.addEventListener(
    "click",
    () => {
      document.getElementById("proto-state")?.classList.toggle("is-open");
    },
  );

  render();
}

document.addEventListener("DOMContentLoaded", init);
