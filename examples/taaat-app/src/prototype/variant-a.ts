/**
 * Variant A — pedagogical outline explorer.
 * Every node is listed (nothing collapsed). Inspector + generate on the right.
 */

import {
  countArchetypeRefs,
  flattenNodes,
  isRepeated,
  l10nCoverage,
} from "./sample-model.ts";
import type { ProtoSession } from "./session.ts";
import { escapeHtml, selectedNode } from "./session.ts";
import {
  nodeBadgesHtml,
  renderAnnotationEditor,
  renderGeneratePanel,
  rmClass,
} from "./widgets.ts";

export const VARIANT_A = { key: "A", name: "Outline explorer" };

export function renderVariantA(
  host: HTMLElement,
  session: ProtoSession,
  rerender: () => void,
): void {
  host.className = "variant variant-a";
  host.innerHTML = "";

  const teach = document.createElement("aside");
  teach.className = "teach-rail";
  teach.innerHTML = `
    <p><strong>What you are looking at</strong> is the template <em>definition tree</em> — every constrainable node, all visible. The live TAAAT D3 view collapses children, so repeated sections disappear.</p>
    <p><strong>Amber “repeated”</strong> marks the OPT 1.4 gap: two uses of <code>SECTION.adhoc</code> with different names. Ontology can store only one translation set per archetype id.</p>
    <p><strong>Generate L10n</strong> adds <code>L10n.sv</code> / <code>L10n.fr</code> path annotations and copies them into every language bag. It will not delete the existing <code>design note</code>.</p>
  `;

  const treePane = document.createElement("div");
  treePane.className = "outline-pane";
  const filter = document.createElement("input");
  filter.className = "outline-filter";
  filter.placeholder = "Filter nodes…";
  const list = document.createElement("div");
  list.className = "outline-list";
  treePane.append(filter, list);

  const paintList = (q = "") => {
    list.innerHTML = "";
    const counts = countArchetypeRefs(session.tree);
    const query = q.trim().toLowerCase();
    for (const node of flattenNodes(session.tree)) {
      const hay = `${node.name} ${node.rmType} ${node.archetypeRef ?? ""} ${node.path}`
        .toLowerCase();
      if (query && !hay.includes(query)) continue;
      const depth = Math.max(0, node.path.split("/").filter(Boolean).length);
      const row = document.createElement("button");
      row.type = "button";
      row.className = `outline-row ${rmClass(node.rmType)}`;
      if (node.path === session.selectedPath) row.classList.add("is-selected");
      if (isRepeated(node, counts)) row.classList.add("is-repeated");
      row.style.paddingLeft = `${8 + depth * 14}px`;
      const cov = l10nCoverage(session.documentation, node, session.languages);
      row.innerHTML = `
        <span class="outline-name">${escapeHtml(node.name)}</span>
        <span class="rm-chip">${escapeHtml(node.rmType)}</span>
        <span class="occ">${escapeHtml(node.occurrences)}</span>
        ${nodeBadgesHtml(session, node.path, node.archetypeRef)}
        ${
        cov.present.length
          ? `<span class="l10n-dots">${
            cov.present.map((l) => `<abbr title="L10n.${l}">${l}</abbr>`).join(" ")
          }</span>`
          : ""
      }
      `;
      row.addEventListener("click", () => {
        session.selectedPath = node.path;
        rerender();
      });
      list.appendChild(row);
    }
  };
  paintList();
  filter.addEventListener("input", () => paintList(filter.value));

  const inspector = document.createElement("div");
  inspector.className = "inspector";
  const node = selectedNode(session);
  const head = document.createElement("header");
  head.className = "inspector-head";
  head.innerHTML = node
    ? `<h2>${escapeHtml(node.name)}</h2>
       <p>${escapeHtml(node.rmType)} · ${
      escapeHtml(node.occurrences)
    }${
      node.archetypeRef
        ? ` · <code>${escapeHtml(node.archetypeRef)}</code>`
        : ""
    }</p>`
    : `<h2>Select a node</h2>`;
  inspector.append(
    head,
    renderAnnotationEditor(session, rerender),
    renderGeneratePanel(session, rerender),
  );

  host.append(teach, treePane, inspector);
}
