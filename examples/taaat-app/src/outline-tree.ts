/**
 * Fully expanded HTML outline of a definition tree, with annotation pills.
 */

import {
  type AnnotationDocumentation,
  annotationPathOf,
  type DefinitionTreeNode,
} from "../../../parser/clinical_model_annotations.ts";
import {
  type AnnotationPill,
  familyFillColor,
  flattenDefinitionTree,
  languageOutlineColor,
  pillsAtPath,
} from "../../../parser/annotation_families.ts";

export interface OutlineRenderOptions {
  container: HTMLElement;
  tree: DefinitionTreeNode;
  doc?: AnnotationDocumentation;
  /** Per-node documentation (overlay vs template). Defaults to `doc`. */
  documentationForNode?: (
    node: DefinitionTreeNode,
  ) => AnnotationDocumentation | undefined;
  selectedPath?: string;
  filterText: string;
  enabledLanguages: Set<string>;
  enabledFamilies: Set<string>;
  /** Resource original language — thicker pill outline. */
  originalLanguage?: string;
  onSelect: (node: DefinitionTreeNode) => void;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function depthOf(path: string): number {
  if (!path || path === "/") return 0;
  return path.split("/").filter(Boolean).length;
}

function visiblePills(
  pills: AnnotationPill[],
  enabledLanguages: Set<string>,
  enabledFamilies: Set<string>,
): AnnotationPill[] {
  return pills.filter((p) =>
    enabledLanguages.has(p.language) && enabledFamilies.has(p.family)
  );
}

function pillHtml(pill: AnnotationPill, originalLanguage?: string): string {
  const fill = familyFillColor(pill.family);
  const outline = languageOutlineColor(pill.language);
  const isOriginal = Boolean(
    originalLanguage && pill.language === originalLanguage,
  );
  const title = `${pill.language} / ${pill.key} = ${pill.value}${
    isOriginal ? " (original language)" : ""
  }`;
  const origClass = isOriginal ? " is-original" : "";
  return `<span class="ann-pill${origClass}" title="${
    escapeHtml(title)
  }" style="background:${fill};border-color:${outline}">
    <span class="ann-pill-lang">${escapeHtml(pill.language)}</span>
    <span class="ann-pill-key">${escapeHtml(pill.key)}</span>
    <span class="ann-pill-val">${escapeHtml(pill.value)}</span>
  </span>`;
}

export function renderOutline(options: OutlineRenderOptions): void {
  const { container, tree, doc, selectedPath, filterText, onSelect } = options;
  const scroll = container.scrollTop;
  container.innerHTML = "";
  const list = document.createElement("div");
  list.className = "outline-list";
  const q = filterText.trim().toLowerCase();
  const nodes = flattenDefinitionTree(tree);
  let shown = 0;
  for (const node of nodes) {
    const hay = `${node.label} ${node.rmType ?? ""} ${
      node.archetypeRef ?? ""
    } ${node.path}`
      .toLowerCase();
    if (q && !hay.includes(q)) continue;
    shown++;
    const row = document.createElement("button");
    row.type = "button";
    row.className = "outline-row";
    if (node.path === selectedPath) row.classList.add("is-selected");
    if (node.isArchetypeRoot) row.classList.add("is-archetype-root");
    row.style.setProperty("--depth", String(depthOf(node.path)));
    const ownerDoc = options.documentationForNode?.(node) ?? doc;
    const pills = visiblePills(
      pillsAtPath(ownerDoc, annotationPathOf(node)),
      options.enabledLanguages,
      options.enabledFamilies,
    );
    const rm = node.rmType
      ? `<span class="rm-chip">${escapeHtml(node.rmType)}</span>`
      : "";
    row.innerHTML = `
      <span class="outline-main">
        <span class="outline-name">${escapeHtml(node.label)}</span>
        ${rm}
      </span>
      <span class="outline-pills">${
      pills.map((p) => pillHtml(p, options.originalLanguage)).join("")
    }</span>
    `;
    row.addEventListener("click", () => onSelect(node));
    list.appendChild(row);
  }
  if (!shown) {
    const empty = document.createElement("p");
    empty.className = "tree-empty";
    empty.textContent = q
      ? "No nodes match the filter."
      : "Empty definition tree.";
    container.appendChild(empty);
    return;
  }
  container.appendChild(list);
  container.scrollTop = scroll;
}
