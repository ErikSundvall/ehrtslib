/**
 * ZipEHR html5 short — quiet structure preview (shared with workbench).
 * Inline composed CSS in srcdoc; enhance markup with anchor tooltips at load.
 */

export const ZIP_QUIET_STRUCTURE_CSS = "zipehr-html5-quiet-structure.css";

/** RM containers whose leading text label is structural (not clinical). */
export const ZIP_QUIET_STRUCTURE_TAGS = [
  "o-co",
  "o-se",
  "o-ob",
  "o-hi",
  "o-pe",
  "o-ie",
  "o-tr",
  "o-cl",
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
  const structureTags = ${JSON.stringify(ZIP_QUIET_STRUCTURE_TAGS)};
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

  for (const el of document.querySelectorAll("[data-zs-quiet-heading]")) {
    const span = el.querySelector(":scope > .zs-structural-label");
    const label = (span?.textContent || el.getAttribute("title") || "").trim();
    if (span) span.remove();
    attachAnchor(el, label);
  }

  for (const tag of structureTags) {
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

  for (const tag of techTags) {
    for (const el of document.querySelectorAll(tag)) {
      const text = (el.textContent || "").trim();
      if (!text && !el.querySelector("*")) continue;
      el.classList.add("zipehr-tech-quiet");
      el.setAttribute("aria-hidden", "true");
    }
  }
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