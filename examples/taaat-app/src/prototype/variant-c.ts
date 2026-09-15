/**
 * Variant C — template map + L10n review queue.
 * Nested tiles show the whole tree spatially; the rail is a generate/diff workbench.
 */

import {
  countArchetypeRefs,
  isRepeated,
  l10nCoverage,
  type ProtoNode,
} from "./sample-model.ts";
import type { ProtoSession } from "./session.ts";
import { escapeHtml, selectedNode } from "./session.ts";
import {
  renderAnnotationEditor,
  renderGeneratePanel,
  rmClass,
} from "./widgets.ts";

export const VARIANT_C = { key: "C", name: "Map + review queue" };

function tile(
  node: ProtoNode,
  session: ProtoSession,
  rerender: () => void,
  counts: Map<string, number>,
): HTMLElement {
  const el = document.createElement("div");
  el.className = `tile ${rmClass(node.rmType)}`;
  if (node.path === session.selectedPath) el.classList.add("is-selected");
  if (isRepeated(node, counts)) el.classList.add("is-repeated");
  const cov = l10nCoverage(session.documentation, node, session.languages);
  if (isRepeated(node, counts) && cov.missing.length) {
    el.classList.add("needs-l10n");
  }
  const head = document.createElement("button");
  head.type = "button";
  head.className = "tile-head";
  head.innerHTML = `
    <span class="tile-name">${escapeHtml(node.name)}</span>
    <span class="rm-chip">${escapeHtml(node.rmType)}</span>
    ${
    isRepeated(node, counts)
      ? `<span class="badge badge-repeat">repeated</span>`
      : ""
  }
    <span class="tile-langs">${
    session.languages.map((l) => {
      const on = !cov.missing.includes(l);
      return `<abbr class="${on ? "on" : "off"}" title="L10n.${l}">${l}</abbr>`;
    }).join("")
  }</span>
  `;
  head.addEventListener("click", (e) => {
    e.stopPropagation();
    session.selectedPath = node.path;
    rerender();
  });
  el.appendChild(head);
  if (node.children.length) {
    const kids = document.createElement("div");
    kids.className = "tile-children";
    for (const child of node.children) {
      kids.appendChild(tile(child, session, rerender, counts));
    }
    el.appendChild(kids);
  }
  return el;
}

export function renderVariantC(
  host: HTMLElement,
  session: ProtoSession,
  rerender: () => void,
): void {
  host.className = "variant variant-c";
  host.innerHTML = "";

  const map = document.createElement("div");
  map.className = "template-map";
  const counts = countArchetypeRefs(session.tree);
  map.appendChild(tile(session.tree, session, rerender, counts));

  const rail = document.createElement("div");
  rail.className = "review-rail";
  const node = selectedNode(session);
  const queue = document.createElement("section");
  queue.className = "review-queue";
  const repeated: ProtoNode[] = [];
  const walk = (n: ProtoNode) => {
    if (isRepeated(n, counts)) repeated.push(n);
    n.children.forEach(walk);
  };
  walk(session.tree);
  queue.innerHTML = `
    <h3>L10n review queue</h3>
    <p class="muted">Repeated occurrences that OPT ontology cannot translate independently.</p>
    <ul>
      ${
    repeated.map((n) => {
      const cov = l10nCoverage(session.documentation, n, session.languages);
      const active = n.path === session.selectedPath ? " class=\"is-active\"" : "";
      return `<li${active}><button type="button" data-path="${
        escapeHtml(n.path)
      }">${escapeHtml(n.name)}</button>
        <span>${
        cov.missing.length
          ? `missing ${escapeHtml(cov.missing.join(", "))}`
          : "covered"
      }</span></li>`;
    }).join("")
  }
    </ul>
  `;
  queue.querySelectorAll<HTMLButtonElement>("button[data-path]").forEach((btn) => {
    btn.addEventListener("click", () => {
      session.selectedPath = btn.dataset.path ?? session.selectedPath;
      rerender();
    });
  });

  const selected = document.createElement("header");
  selected.className = "review-selected";
  selected.innerHTML = node
    ? `<h2>${escapeHtml(node.name)}</h2><p class="path-display">${
      escapeHtml(node.path)
    }</p>`
    : `<h2>Pick a tile</h2>`;

  rail.append(
    selected,
    queue,
    renderAnnotationEditor(session, rerender),
    renderGeneratePanel(session, rerender, { compact: true }),
  );

  host.append(map, rail);
}
