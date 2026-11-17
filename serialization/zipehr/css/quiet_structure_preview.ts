/**
 * ZipEHR html5 short — quiet structure preview (shared with workbench).
 * Inline composed CSS in srcdoc; enhance markup with anchor tooltips at load.
 */

export const ZIP_QUIET_STRUCTURE_CSS = "zipehr-html5-quiet-structure.css";

/**
 * Data-structure RM tags that may carry a leading generic label stripped only
 * when the serializer did not already mark `data-zs-quiet-heading`.
 * Archetype roots (COMPOSITION, SECTION, OBSERVATION, CLUSTER, …) stay visible.
 */
export const ZIP_QUIET_CONTAINER_TAGS = [
  "o-hi",
  "o-pe",
  "o-ie",
  "o-tr",
  "o-il",
  "o-is",
  "o-ta",
] as const;

/** Machine context leaves hidden in quiet mode. */
export const ZIP_QUIET_TECH_TAGS = ["o-cph", "o-cnt"] as const;

/**
 * DOM enhancement for iframe/srcdoc previews: anchor strip + tooltip span per
 * quiet structure node; hide encoding/territory noise.
 */
export const ZIP_QUIET_PREVIEW_SCRIPT = `(() => {
  const containerTags = ${JSON.stringify(ZIP_QUIET_CONTAINER_TAGS)};
  const techTags = ${JSON.stringify(ZIP_QUIET_TECH_TAGS)};

  function attachAnchor(el, label) {
    if (!label) return;
    el.classList.add("zipehr-struct-quiet");
    const anchor = document.createElement("button");
    anchor.type = "button";
    anchor.className = "zipehr-structure-anchor";
    anchor.setAttribute("aria-label", "Structure: " + label);
    const tip = document.createElement("span");
    tip.className = "zipehr-structure-tip";
    tip.textContent = "Structure: " + label;
    anchor.appendChild(tip);
    el.insertBefore(anchor, el.firstChild);
    const show = () => anchor.classList.add("zipehr-tip-open");
    const hide = () => anchor.classList.remove("zipehr-tip-open");
    anchor.addEventListener("mouseenter", show);
    anchor.addEventListener("mouseleave", hide);
    anchor.addEventListener("focus", show);
    anchor.addEventListener("blur", hide);
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      anchor.classList.toggle("zipehr-tip-pinned");
    });
  }

  function appendLabel(anchor, extra) {
    if (!extra) return;
    const prev = anchor.getAttribute("aria-label") || "";
    const merged = prev ? prev + " · " + extra : "Structure: " + extra;
    anchor.setAttribute("aria-label", merged);
    const tip = anchor.querySelector(".zipehr-structure-tip");
    if (tip) tip.textContent = merged;
  }

  function collapseNestedQuietAnchors() {
  for (const el of document.querySelectorAll(".zipehr-struct-quiet")) {
    const parent = el.parentElement?.closest(".zipehr-struct-quiet");
    if (!parent) continue;
    const childAnchor = el.querySelector(":scope > .zipehr-structure-anchor");
    const parentAnchor = parent.querySelector(":scope > .zipehr-structure-anchor");
    if (!childAnchor || !parentAnchor) continue;
    const childLabel = (childAnchor.getAttribute("aria-label") || "").replace("Structure: ", "");
    appendLabel(parentAnchor, childLabel);
    childAnchor.remove();
    el.classList.remove("zipehr-struct-quiet");
  }
  }

  function mergeConsecutiveAnchors() {
    let prev = null;
    for (const anchor of document.querySelectorAll(".zipehr-structure-anchor")) {
      if (prev && prev.parentElement === anchor.parentElement && prev.nextElementSibling === anchor) {
        const lbl = (anchor.getAttribute("aria-label") || "").replace("Structure: ", "");
        appendLabel(prev, lbl);
        anchor.remove();
        continue;
      }
      prev = anchor;
    }
  }

  for (const el of document.querySelectorAll("[data-zs-quiet-heading]")) {
    const span = el.querySelector(":scope > .zs-structural-label");
    const label = (span?.textContent || el.getAttribute("title") || "").trim();
    if (span) span.remove();
    attachAnchor(el, label);
  }

  for (const tag of containerTags) {
    for (const el of document.querySelectorAll(tag)) {
      if (el.hasAttribute("data-zs-quiet-heading")) continue;
      if (el.querySelector(":scope > .zipehr-structure-anchor")) continue;
      let label = "";
      for (const node of [...el.childNodes]) {
        if (node.nodeType !== Node.TEXT_NODE) continue;
        const text = (node.textContent || "").trim();
        if (!text) continue;
        label = text;
        node.remove();
        break;
      }
      attachAnchor(el, label);
    }
  }

  collapseNestedQuietAnchors();
  mergeConsecutiveAnchors();

  for (const tag of techTags) {
    for (const el of document.querySelectorAll(tag)) {
      const text = (el.textContent || "").trim();
      if (!text && !el.querySelector("*")) continue;
      el.classList.add("zipehr-tech-quiet");
      el.setAttribute("aria-hidden", "true");
    }
  }

  function hideRedundantHistoryOrigin() {
    for (const hi of document.querySelectorAll("o-hi")) {
      const originEl = hi.querySelector(':scope > o-dt[p="origin"]');
      if (!originEl) continue;
      const origin = (originEl.textContent || "").trim();
      const times = [];
      for (const t of hi.querySelectorAll('o-pe > o-dt[p="time"], o-ie > o-dt[p="time"]')) {
        const val = (t.textContent || "").trim();
        if (val) times.push(val);
      }
      let anchor = "";
      if (times.length === 1) anchor = times[0];
      else if (times.length) anchor = times.slice().sort()[0];
      if (origin && anchor && origin === anchor) {
        originEl.classList.add("zipehr-tech-quiet");
        originEl.setAttribute("aria-hidden", "true");
      }
    }
  }
  hideRedundantHistoryOrigin();
})();`;

export type ZipehrPreviewDocumentOptions = {
  quietStructureTooltips?: boolean;
};

export function buildZipehrPreviewDocument(
  markup: string,
  css: string,
  options?: ZipehrPreviewDocumentOptions,
): string {
  const body = markup.trim() || "<!-- empty ZipEHR markup -->";
  const quietScript = options?.quietStructureTooltips
    ? `<script>${ZIP_QUIET_PREVIEW_SCRIPT}</script>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ZipEHR preview</title>
<style>
${css}
</style>
</head>
<body>
${body}
${quietScript}
</body>
</html>`;
}