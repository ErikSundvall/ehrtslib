/// <reference lib="dom" />

import * as d3 from "d3";
import { ADL2Serializer } from "../../../enhanced/generation/adl2_serializer.ts";
import {
  type AomTreeNode,
  buildAomTree,
  ClinicalModelWorkspace,
  getAnnotationsForPath,
  listAnnotations,
  parseAdl,
  parseTemplateJson,
  removeAnnotation,
  setAnnotation,
} from "../../../enhanced/parser/mod.ts";
import {
  DEFAULT_PALETTE,
  downloadableFilename,
  type PaletteItem,
  parsePaletteJson,
  serializePalette,
  updateTemplateJsonAnnotationSource,
  upsertPaletteItem,
} from "./state.ts";

declare const __BUILD_INFO__: {
  timestamp: string;
  buildId: string;
};

const PALETTE_KEY = "ehrtslib-taaat-palette-v1";

const workspace = new ClinicalModelWorkspace();
let selectedPath: string | undefined;
let selectedNodePath = "/";
let palette: PaletteItem[] = loadPalette();

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id) as T | null;
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

function setStatus(message: string, kind: "idle" | "ok" | "error" = "idle") {
  const status = byId<HTMLDivElement>("status");
  status.textContent = message;
  status.dataset.kind = kind;
}

function appendProgress(message: string) {
  const log = byId<HTMLOListElement>("progress-log");
  const li = document.createElement("li");
  li.textContent = message;
  log.appendChild(li);
  log.scrollTop = log.scrollHeight;
}

function loadPalette(): PaletteItem[] {
  try {
    const stored = localStorage.getItem(PALETTE_KEY);
    return stored ? parsePaletteJson(stored) : [...DEFAULT_PALETTE];
  } catch {
    return [...DEFAULT_PALETTE];
  }
}

function savePalette() {
  localStorage.setItem(PALETTE_KEY, serializePalette(palette));
}

function currentFile() {
  if (!selectedPath) return undefined;
  return workspace.getFile(selectedPath);
}

function parseSelectedArtefact() {
  const file = currentFile();
  if (!file) throw new Error("No template or archetype file selected");
  const trimmed = file.content.trim();

  if (trimmed.startsWith("{")) {
    const parsed = parseTemplateJson(trimmed);
    return { archetype: parsed.template, format: "json" as const };
  }

  if (
    /\.(adl|adls)$/i.test(file.path) ||
    /^(archetype|template|operational_template)\b/i.test(trimmed)
  ) {
    const parsed = parseAdl(file.content, { convertAdl14: true });
    const archetype = parsed.archetype ?? parsed.template ??
      parsed.operationalTemplate;
    if (!archetype) throw new Error(`Unsupported ADL kind: ${parsed.kind}`);
    return { archetype, format: "adl" as const };
  }

  throw new Error(
    "TAAAT can currently edit ADL/ADLS archetypes/templates and Better .t.json templates.",
  );
}

function render() {
  renderFileList();
  renderPalette();
  try {
    const { archetype } = parseSelectedArtefact();
    const tree = buildAomTree(archetype);
    if (!findTreeNode(tree, selectedNodePath)) selectedNodePath = tree.path;
    renderTree(tree);
    renderSelectedNode(tree);
    renderAnnotationSummary();
    setStatus(`Loaded ${workspace.listFiles().length} files.`, "ok");
  } catch (error) {
    renderEmptyTree((error as Error).message);
    byId("selected-node-title").textContent = "No editable node selected";
    byId("annotation-list").innerHTML = "";
    byId("all-annotations").innerHTML = "";
    setStatus((error as Error).message, "error");
  }
}

function renderFileList() {
  const list = byId<HTMLDivElement>("file-list");
  const files = workspace.listFiles();
  list.innerHTML = "";
  if (!files.length) {
    list.textContent = "No files loaded yet.";
    return;
  }

  for (const file of files) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `file-pill${
      file.path === selectedPath ? " active" : ""
    }`;
    button.textContent = file.path.split("/").pop() ?? file.path;
    button.title = file.path;
    button.addEventListener("click", () => {
      selectedPath = file.path;
      selectedNodePath = "/";
      workspace.setActivePath(file.path);
      render();
    });
    const badge = document.createElement("span");
    badge.className = "file-kind";
    badge.textContent = file.loadResult?.kind ?? "?";
    button.appendChild(badge);
    list.appendChild(button);
  }
}

function findTreeNode(
  node: AomTreeNode,
  path: string,
): AomTreeNode | undefined {
  if (node.path === path) return node;
  for (const child of node.children) {
    const found = findTreeNode(child, path);
    if (found) return found;
  }
  return undefined;
}

function renderEmptyTree(message: string) {
  const svg = d3.select("#model-tree");
  svg.selectAll("*").remove();
  svg.attr("viewBox", "0 0 640 180");
  svg.append("text")
    .attr("x", 24)
    .attr("y", 42)
    .attr("class", "tree-empty")
    .text(message);
}

function renderTree(tree: AomTreeNode) {
  const svg = d3.select<SVGSVGElement, unknown>("#model-tree");
  svg.selectAll("*").remove();
  const root = d3.hierarchy<AomTreeNode>(tree);
  const layout = d3.tree<AomTreeNode>()
    .nodeSize([30, 180])
    .separation((a, b) => a.parent === b.parent ? 0.9 : 1.2);
  layout(root);

  const nodes = root.descendants();
  const minX = Math.min(...nodes.map((node) => node.x));
  const maxX = Math.max(...nodes.map((node) => node.x));
  const maxY = Math.max(...nodes.map((node) => node.y));
  svg.attr("viewBox", `${-80} ${minX - 40} ${maxY + 360} ${maxX - minX + 90}`);

  const link = d3.linkHorizontal<
    d3.HierarchyPointLink<AomTreeNode>,
    d3.HierarchyPointNode<AomTreeNode>
  >()
    .x((node) => node.y)
    .y((node) => node.x);

  svg.append("g")
    .attr("class", "tree-links")
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr("d", link)
    .attr("fill", "none");

  const node = svg.append("g")
    .attr("class", "tree-nodes")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr(
      "class",
      (d) =>
        `tree-node${d.data.path === selectedNodePath ? " selected" : ""}${
          d.data.hasAnnotations ? " annotated" : ""
        }`,
    )
    .attr("transform", (d) => `translate(${d.y},${d.x})`)
    .on("click", (_event, d) => {
      selectedNodePath = d.data.path;
      render();
    });

  node.append("circle")
    .attr("r", 5);
  node.append("circle")
    .attr("class", "annotation-dot")
    .attr("cx", 10)
    .attr("cy", -7)
    .attr("r", (d) => d.data.hasAnnotations ? 4 : 0);
  node.append("text")
    .attr("x", 14)
    .attr("dy", "0.32em")
    .text((d) => d.data.label);
  node.append("title")
    .text((d) =>
      `${d.data.path}${
        d.data.annotationCount ? ` (${d.data.annotationCount} annotations)` : ""
      }`
    );
}

function renderSelectedNode(tree: AomTreeNode) {
  const artefact = parseSelectedArtefact().archetype;
  const node = findTreeNode(tree, selectedNodePath) ?? tree;
  byId("selected-node-title").textContent = node.label;
  byId<HTMLInputElement>("annotation-path").value = node.path;
  const annotations = getAnnotationsForPath(artefact, node.path, getLanguage());
  const list = byId<HTMLDivElement>("annotation-list");
  list.innerHTML = "";

  if (!Object.keys(annotations).length) {
    list.textContent = "No annotations for this node/language.";
  } else {
    for (const [key, value] of Object.entries(annotations)) {
      const row = document.createElement("div");
      row.className = "annotation-row";
      row.innerHTML = `<strong></strong><span></span>`;
      row.querySelector("strong")!.textContent = key;
      row.querySelector("span")!.textContent = value;
      row.addEventListener("click", () => {
        byId<HTMLInputElement>("annotation-key").value = key;
        byId<HTMLTextAreaElement>("annotation-value").value = value;
      });
      list.appendChild(row);
    }
  }
}

function renderAnnotationSummary() {
  const artefact = parseSelectedArtefact().archetype;
  const summary = byId<HTMLDivElement>("all-annotations");
  const entries = listAnnotations(artefact);
  summary.innerHTML = "";
  if (!entries.length) {
    summary.textContent = "No annotations in selected artefact.";
    return;
  }
  for (const entry of entries) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "summary-row";
    row.textContent =
      `${entry.language} ${entry.path} :: ${entry.key} = ${entry.value}`;
    row.addEventListener("click", () => {
      selectedNodePath = entry.path;
      byId<HTMLInputElement>("annotation-language").value = entry.language;
      byId<HTMLInputElement>("annotation-key").value = entry.key;
      byId<HTMLTextAreaElement>("annotation-value").value = entry.value;
      render();
    });
    summary.appendChild(row);
  }
}

function renderPalette() {
  const wrap = byId<HTMLDivElement>("palette-list");
  wrap.innerHTML = "";
  for (const item of palette) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "palette-chip";
    button.textContent = item.value
      ? `${item.label}: ${item.value}`
      : item.label;
    button.title = item.key;
    button.addEventListener("click", () => {
      byId<HTMLInputElement>("annotation-key").value = item.key;
      byId<HTMLTextAreaElement>("annotation-value").value = item.value ?? "";
    });
    wrap.appendChild(button);
  }
}

function getLanguage(): string {
  return byId<HTMLInputElement>("annotation-language").value.trim() || "en";
}

function updateSelectedSource(remove = false) {
  if (!selectedPath) throw new Error("No file selected");
  const file = currentFile();
  if (!file) throw new Error("No file selected");
  const patch = {
    language: getLanguage(),
    path: byId<HTMLInputElement>("annotation-path").value.trim(),
    key: byId<HTMLInputElement>("annotation-key").value.trim(),
    value: byId<HTMLTextAreaElement>("annotation-value").value,
  };

  let nextContent: string;
  if (file.content.trim().startsWith("{")) {
    nextContent = updateTemplateJsonAnnotationSource(file.content, {
      ...patch,
      remove,
    });
  } else {
    const parsed = parseAdl(file.content, { convertAdl14: true });
    const archetype = parsed.archetype ?? parsed.template ??
      parsed.operationalTemplate;
    if (!archetype) throw new Error(`Unsupported ADL kind: ${parsed.kind}`);
    if (remove) {
      removeAnnotation(archetype, patch);
    } else {
      setAnnotation(archetype, patch);
    }
    nextContent = new ADL2Serializer().serialize(archetype);
  }

  workspace.updateFileContent(selectedPath, nextContent);
  render();
}

async function loadFromGitHub() {
  const url = byId<HTMLInputElement>("github-url").value.trim();
  if (!url) throw new Error("Paste a GitHub blob or raw URL first");
  byId<HTMLOListElement>("progress-log").innerHTML = "";
  appendProgress("Starting GitHub load...");
  const result = await workspace.loadFromGitHubClinicalModelUrl(url, {
    maxFiles: 200,
    onProgress: (event) => appendProgress(event.message),
  });
  for (const warning of result.warnings) appendProgress(`Warning: ${warning}`);
  selectedPath = result.rootPath;
  selectedNodePath = "/";
  render();
}

async function uploadFiles(files: FileList | null) {
  if (!files?.length) return;
  for (const file of Array.from(files)) {
    workspace.addFile(file.name, await file.text());
  }
  selectedPath = workspace.getActivePath();
  selectedNodePath = "/";
  render();
}

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function setupEvents() {
  byId("load-github").addEventListener("click", async () => {
    try {
      await loadFromGitHub();
    } catch (error) {
      setStatus((error as Error).message, "error");
    }
  });
  byId<HTMLInputElement>("file-input").addEventListener("change", (event) => {
    void uploadFiles((event.target as HTMLInputElement).files);
  });
  byId("save-annotation").addEventListener("click", () => {
    try {
      updateSelectedSource(false);
    } catch (error) {
      setStatus((error as Error).message, "error");
    }
  });
  byId("remove-annotation").addEventListener("click", () => {
    try {
      updateSelectedSource(true);
    } catch (error) {
      setStatus((error as Error).message, "error");
    }
  });
  byId("add-palette").addEventListener("click", () => {
    const key = byId<HTMLInputElement>("annotation-key").value.trim();
    if (!key) return;
    palette = upsertPaletteItem(palette, {
      label: key,
      key,
      value: byId<HTMLTextAreaElement>("annotation-value").value || undefined,
    });
    savePalette();
    renderPalette();
  });
  byId("download-palette").addEventListener("click", () => {
    downloadText("taaat-annotation-palette.json", serializePalette(palette));
  });
  byId<HTMLInputElement>("palette-upload").addEventListener(
    "change",
    async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      palette = parsePaletteJson(await file.text());
      savePalette();
      renderPalette();
    },
  );
  byId("download-current").addEventListener("click", () => {
    const file = currentFile();
    if (!file) return;
    downloadText(
      downloadableFilename(file.path, "clinical-model.adl"),
      file.content,
    );
  });
  byId("clear-workspace").addEventListener("click", () => {
    workspace.clear();
    selectedPath = undefined;
    selectedNodePath = "/";
    render();
  });
  byId<HTMLInputElement>("annotation-language").addEventListener(
    "input",
    render,
  );
}

function init() {
  setupEvents();
  const build = byId<HTMLSpanElement>("build-info");
  if (typeof __BUILD_INFO__ !== "undefined") {
    build.textContent = `Build ${__BUILD_INFO__.buildId}`;
  }
  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
