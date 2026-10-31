/**
 * Hover/focus/click balloons for (i) info buttons.
 *
 * Markup (same as intehrgrator `src/ui/info_tip.ts`):
 *
 * ```html
 * <span class="info-tip">
 *   <button type="button" class="info-tip-btn" aria-expanded="false"
 *     aria-describedby="tip-x" aria-label="About X">i</button>
 *   <span id="tip-x" class="info-tip-balloon" role="tooltip" hidden>…</span>
 * </span>
 * ```
 *
 * Balloons move to a fixed layer on `document.body` while shown, so panels with
 * `overflow: hidden` cannot clip them, and are placed inside the viewport.
 */

const LAYER_ID = "info-tip-layer";
const MARGIN = 8;
const OFFSET = 6;

const balloons = new WeakMap<HTMLElement, HTMLElement>();
const attached = new WeakSet<HTMLElement>();
let globalsInstalled = false;

function balloonFor(tip: HTMLElement): HTMLElement | null {
  return balloons.get(tip) ??
    tip.querySelector<HTMLElement>(".info-tip-balloon");
}

function ensureLayer(): HTMLElement {
  let layer = document.getElementById(LAYER_ID);
  if (!layer) {
    layer = document.createElement("div");
    layer.id = LAYER_ID;
    document.body.appendChild(layer);
  }
  return layer;
}

function setOpen(tip: HTMLElement, open: boolean): void {
  tip.classList.toggle("is-open", open);
  tip.querySelector(".info-tip-btn")?.setAttribute(
    "aria-expanded",
    String(open),
  );
}

function isShown(tip: HTMLElement): boolean {
  return tip.classList.contains("is-open") ||
    tip.classList.contains("is-hover");
}

/** Below the button when it fits, else above; always inside the viewport. */
function position(btn: HTMLElement, balloon: HTMLElement): void {
  const vw = document.documentElement.clientWidth || globalThis.innerWidth;
  const vh = document.documentElement.clientHeight || globalThis.innerHeight;
  balloon.style.maxWidth = `${Math.min(320, vw - 2 * MARGIN)}px`;
  balloon.style.maxHeight = `${Math.max(80, vh - 2 * MARGIN)}px`;
  const b = btn.getBoundingClientRect();
  const r = balloon.getBoundingClientRect();
  let left = b.left;
  if (left + r.width > vw - MARGIN) left = vw - MARGIN - r.width;
  left = Math.max(MARGIN, left);
  let top = b.bottom + OFFSET;
  if (top + r.height > vh - MARGIN && b.top - OFFSET - r.height >= MARGIN) {
    top = b.top - OFFSET - r.height;
  }
  top = Math.max(MARGIN, Math.min(top, vh - MARGIN - r.height));
  balloon.style.left = `${Math.round(left)}px`;
  balloon.style.top = `${Math.round(top)}px`;
}

function place(tip: HTMLElement): void {
  const btn = tip.querySelector<HTMLElement>(".info-tip-btn");
  const balloon = balloonFor(tip);
  if (!btn || !balloon) return;
  balloons.set(tip, balloon);
  const layer = ensureLayer();
  if (balloon.parentElement !== layer) layer.appendChild(balloon);
  balloon.hidden = false;
  position(btn, balloon);
}

function restore(tip: HTMLElement): void {
  const balloon = balloonFor(tip);
  if (!balloon) return;
  balloon.hidden = true;
  balloon.style.left = "";
  balloon.style.top = "";
  if (balloon.parentElement !== tip) tip.appendChild(balloon);
}

function sync(tip: HTMLElement): void {
  if (isShown(tip)) place(tip);
  else restore(tip);
}

function closeAll(except?: HTMLElement): void {
  document.querySelectorAll<HTMLElement>(".info-tip").forEach((tip) => {
    if (tip === except || !isShown(tip)) return;
    setOpen(tip, false);
    tip.classList.remove("is-hover");
    sync(tip);
  });
}

function repositionOpen(): void {
  document.querySelectorAll<HTMLElement>(".info-tip").forEach((tip) => {
    if (isShown(tip)) place(tip);
  });
}

function ensureGlobals(): void {
  if (globalsInstalled) return;
  globalsInstalled = true;
  document.addEventListener("click", () => closeAll());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAll();
  });
  globalThis.addEventListener("resize", repositionOpen);
  globalThis.addEventListener("scroll", repositionOpen, true);
}

/** Bind one (i) marker. Safe to call more than once. */
export function attachInfoTip(tip: HTMLElement): void {
  if (attached.has(tip)) return;
  const btn = tip.querySelector<HTMLButtonElement>(".info-tip-btn");
  if (!btn) return;
  attached.add(tip);
  ensureGlobals();
  const balloon = balloonFor(tip);
  if (balloon) balloon.hidden = true;

  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  const cancelHide = () => {
    if (hideTimer !== undefined) clearTimeout(hideTimer);
    hideTimer = undefined;
  };
  const scheduleHide = () => {
    if (tip.classList.contains("is-open")) return;
    cancelHide();
    hideTimer = setTimeout(() => {
      tip.classList.remove("is-hover");
      sync(tip);
    }, 120);
  };
  const show = () => {
    cancelHide();
    tip.classList.add("is-hover");
    sync(tip);
  };

  btn.addEventListener("click", (event) => {
    // Inside a <label>, a click would also toggle the checkbox.
    event.preventDefault();
    event.stopPropagation();
    const next = !tip.classList.contains("is-open");
    closeAll(tip);
    setOpen(tip, next);
    tip.classList.toggle("is-hover", next);
    sync(tip);
  });
  tip.addEventListener("mouseenter", show);
  tip.addEventListener("mouseleave", scheduleHide);
  btn.addEventListener("focus", show);
  btn.addEventListener("blur", (event) => {
    const next = event.relatedTarget as Node | null;
    if (next && balloonFor(tip)?.contains(next)) return;
    scheduleHide();
  });
  balloon?.addEventListener("mouseenter", show);
  balloon?.addEventListener("mouseleave", scheduleHide);
  balloon?.addEventListener("click", (event) => event.stopPropagation());
}

/** Bind every `.info-tip` under `root`. */
export function installInfoTips(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(".info-tip").forEach(attachInfoTip);
}
