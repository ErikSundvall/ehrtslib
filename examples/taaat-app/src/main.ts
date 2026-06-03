/**
 * TAAAT — Template and Archetype Annotation Tool
 */

import { ClinicalModelWorkspace } from "../../../enhanced/parser/clinical_model_workspace.ts";
import {
  buildDefinitionTree,
  getPathAnnotations,
  getResourceDocumentation,
  removePathAnnotation,
  resolveAnnotatedResource,
  serializeAnnotatedResource,
  setPathAnnotation,
  type AnnotatedResource,
  type DefinitionTreeNode,
} from "../../../enhanced/parser/clinical_model_annotations.ts";
import {
  createPaletteEntry,
  exportPaletteJson,
  loadPalette,
  parsePaletteJson,
  savePalette,
  type PaletteEntry,
} from "./palette.ts";
import { DefinitionTreeView } from "./tree-view.ts";

export type LoadMode = "template" | "archetype";

const workspace = new ClinicalModelWorkspace();
let activeFilePath: string | undefined;
let activeResource: AnnotatedResource | undefined;
let selectedNode: DefinitionTreeNode | undefined;
let palette: PaletteEntry[] = loadPalette();
let language = "en";
let treeView: DefinitionTreeView | undefined;

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T | null;

function getLoadMode(): LoadMode {
  const checked = document.querySelector<HTMLInputElement>(
    'input[name="load-mode"]:checked',
  );
  return checked?.value === "archetype" ? "archetype" : "template";
}

function setStatus(msg: string, isError = false): void {
  const el = $("status-bar");
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("is-error", isError);
}

function listEditableFiles(): { path: string; kind: string }[] {
  return workspace.listFiles()
    .filter((f) => {
      const k = f.loadResult?.kind;
      return k === "archetype" || k === "template" || k === "template_json";
    })
    .map((f) => ({
      path: f.path,
      kind: f.loadResult?.kind ?? "?",
    }));
}

function refreshFileSelect(): void {
  const select = $("file-select") as HTMLSelectElement | null;
  if (!select) return;
  const files = listEditableFiles();
  select.innerHTML = "";
  for (const f of files) {
    const opt = document.createElement("option");
    opt.value = f.path;
    opt.textContent = `${f.path} (${f.kind})`;
    select.appendChild(opt);
  }
  if (activeFilePath && files.some((f) => f.path === activeFilePath)) {
    select.value = activeFilePath;
  } else if (files.length) {
    activeFilePath = files[0].path;
    select.value = activeFilePath;
  }
}

function loadActiveResource(): void {
  activeFilePath = workspace.getActivePath() ?? activeFilePath;
  if (!activeFilePath) {
    activeResource = undefined;
    return;
  }
  const file = workspace.getFile(activeFilePath);
  activeResource = resolveAnnotatedResource(
    workspace.repository,
    file?.loadResult,
  );
}

function persistResourceToWorkspace(): void {
  if (!activeResource || !activeFilePath) return;
  const path = activeFilePath.toLowerCase();
  if (/\.(adl|adls)$/i.test(path)) {
    const adl = serializeAnnotatedResource(activeResource);
    workspace.updateFileContent(activeFilePath, adl);
  }
}

function refreshTree(): void {
  const container = $("tree-container");
  if (!container) return;
  container.innerHTML = "";
  if (!activeResource) {
    container.innerHTML = "<p class=\"tree-empty\">Load a model to see the tree.</p>";
    return;
  }
  const tree = buildDefinitionTree(activeResource);
  treeView = new DefinitionTreeView({
    container,
    selectedPath: selectedNode?.path,
    onSelect: (node) => {
      selectedNode = node;
      treeView?.setSelectedPath(node.path);
      refreshAnnotationEditor();
      updatePathLabel();
    },
  });
  treeView.setData(tree);
  window.requestAnimationFrame(() => treeView?.resize());
}

function updatePathLabel(): void {
  const el = $("selected-path");
  if (!el) return;
  if (!selectedNode) {
    el.textContent = "Select a node in the tree";
    return;
  }
  const pathDisplay = selectedNode.path || "(definition root)";
  el.textContent = pathDisplay;
}

function refreshAnnotationEditor(): void {
  const tbody = $("annotation-rows");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!activeResource || !selectedNode) return;

  const doc = getResourceDocumentation(activeResource);
  const path = selectedNode.path;
  const anns = getPathAnnotations(doc, path, language);

  for (const [key, value] of Object.entries(anns)) {
    tbody.appendChild(createAnnotationRow(key, value));
  }
}

function createAnnotationRow(key: string, value: string): HTMLTableRowElement {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="ann-key" value="${escapeAttr(key)}" /></td>
    <td><input type="text" class="ann-value" value="${escapeAttr(value)}" /></td>
    <td><button type="button" class="btn btn-sm btn-danger ann-remove" title="Remove">×</button></td>
  `;
  tr.querySelector(".ann-remove")?.addEventListener("click", () => {
    if (!activeResource || !selectedNode) return;
    const k = tr.querySelector<HTMLInputElement>(".ann-key")?.value.trim();
    if (k) {
      removePathAnnotation(activeResource, selectedNode.path, k, language);
      persistResourceToWorkspace();
      refreshTree();
      refreshAnnotationEditor();
    }
  });
  const onChange = () => {
    if (!activeResource || !selectedNode) return;
    const k = tr.querySelector<HTMLInputElement>(".ann-key")?.value.trim();
    const v = tr.querySelector<HTMLInputElement>(".ann-value")?.value ?? "";
    if (!k) return;
    setPathAnnotation(activeResource, selectedNode.path, k, v, language);
    persistResourceToWorkspace();
    refreshTree();
  };
  tr.querySelectorAll("input").forEach((inp) => {
    inp.addEventListener("change", onChange);
  });
  return tr;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function addAnnotationRow(key = "", value = ""): void {
  const tbody = $("annotation-rows");
  if (!tbody || !activeResource || !selectedNode) return;
  if (key) {
    setPathAnnotation(activeResource, selectedNode.path, key, value, language);
    persistResourceToWorkspace();
  }
  tbody.appendChild(createAnnotationRow(key, value));
  refreshTree();
}

function refreshPaletteUi(): void {
  const list = $("palette-list");
  if (!list) return;
  list.innerHTML = "";
  for (const entry of palette) {
    const li = document.createElement("li");
    const label = entry.value ? `${entry.key} = ${entry.value}` : entry.key;
    li.innerHTML = `
      <button type="button" class="palette-apply" title="Apply to selected node">${escapeAttr(label)}</button>
      <button type="button" class="palette-remove" title="Remove from favourites">×</button>
    `;
    li.querySelector(".palette-apply")?.addEventListener("click", () => {
      if (!activeResource || !selectedNode) {
        alert("Select a tree node first.");
        return;
      }
      setPathAnnotation(
        activeResource,
        selectedNode.path,
        entry.key,
        entry.value ?? "",
        language,
      );
      persistResourceToWorkspace();
      refreshTree();
      refreshAnnotationEditor();
    });
    li.querySelector(".palette-remove")?.addEventListener("click", () => {
      palette = palette.filter((p) => p.id !== entry.id);
      savePalette(palette);
      refreshPaletteUi();
    });
    list.appendChild(li);
  }
}

function setupLoadBar(): void {
  const loadBtn = $("load-github-btn");
  const urlInput = $("github-url") as HTMLInputElement | null;
  if (!loadBtn || !urlInput) return;

  const templateDefault =
    "https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek/blob/MultiDiciplinery_Tumor_meetings/local/Diagnostic_MDT_Lung_cancer.t.json";
  const archetypeDefault =
    "https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek/blob/main/local/archetypes/composition/openEHR-EHR-COMPOSITION.review.v0.adl";

  const updatePlaceholder = () => {
    const mode = getLoadMode();
    urlInput.placeholder = mode === "template"
      ? "GitHub URL to a .t.json template…"
      : "GitHub URL to an .adl / .adls archetype…";
    if (!urlInput.value.trim()) {
      urlInput.value = mode === "template" ? templateDefault : archetypeDefault;
    }
  };

  document.querySelectorAll('input[name="load-mode"]').forEach((el) => {
    el.addEventListener("change", updatePlaceholder);
  });
  updatePlaceholder();

  loadBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) {
      alert("Paste a GitHub blob or raw URL.");
      return;
    }
    loadBtn.setAttribute("disabled", "true");
    setStatus("Loading…");
    try {
      workspace.clear();
      const result = await workspace.loadFromGitHubClinicalModelUrl(url, {
        maxFiles: 200,
        onProgress: (e) => setStatus(e.message),
      });
      const mode = getLoadMode();
      const files = listEditableFiles();
      if (mode === "template") {
        activeFilePath = result.rootPath;
      } else {
        const arch = files.find((f) => f.kind === "archetype");
        activeFilePath = arch?.path ?? result.rootPath;
      }
      refreshFileSelect();
      if (activeFilePath) {
        const sel = $("file-select") as HTMLSelectElement | null;
        if (sel) sel.value = activeFilePath;
      }
      loadActiveResource();
      selectedNode = undefined;
      refreshTree();
      refreshAnnotationEditor();
      updatePathLabel();
      const warn = result.warnings.length
        ? ` (${result.warnings.length} warnings)`
        : "";
      setStatus(`Loaded ${result.fetched} files${warn}`);
    } catch (e) {
      setStatus((e as Error).message, true);
      alert(`Load failed: ${(e as Error).message}`);
    } finally {
      loadBtn.removeAttribute("disabled");
    }
  });
}

function setupFileSelect(): void {
  $("file-select")?.addEventListener("change", (e) => {
    activeFilePath = (e.target as HTMLSelectElement).value;
    loadActiveResource();
    selectedNode = undefined;
    refreshTree();
    refreshAnnotationEditor();
    updatePathLabel();
    setStatus(`Editing ${activeFilePath}`);
  });
}

function setupAnnotationActions(): void {
  $("add-annotation-btn")?.addEventListener("click", () => addAnnotationRow());
  $("language-select")?.addEventListener("change", (e) => {
    language = (e.target as HTMLSelectElement).value;
    refreshAnnotationEditor();
  });
  $("download-adl-btn")?.addEventListener("click", () => {
    if (!activeResource || !activeFilePath) return;
    const text = serializeAnnotatedResource(activeResource);
    downloadText(text, activeFilePath.replace(/\.[^.]+$/, "") + ".adl");
  });
}

function setupPaletteActions(): void {
  $("palette-add-btn")?.addEventListener("click", () => {
    const key = ($("palette-key") as HTMLInputElement | null)?.value.trim();
    const value = ($("palette-value") as HTMLInputElement | null)?.value.trim();
    if (!key) {
      alert("Enter an annotation key.");
      return;
    }
    palette.push(createPaletteEntry(key, value || undefined));
    savePalette(palette);
    refreshPaletteUi();
    const keyInp = $("palette-key") as HTMLInputElement | null;
    const valInp = $("palette-value") as HTMLInputElement | null;
    if (keyInp) keyInp.value = "";
    if (valInp) valInp.value = "";
  });

  $("palette-download-btn")?.addEventListener("click", () => {
    downloadText(exportPaletteJson(palette), "taaat-palette.json");
  });

  $("palette-upload-input")?.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      palette = parsePaletteJson(await file.text());
      savePalette(palette);
      refreshPaletteUi();
      setStatus("Palette imported");
    } catch (err) {
      alert(`Invalid palette file: ${(err as Error).message}`);
    }
    (e.target as HTMLInputElement).value = "";
  });
}

function downloadText(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function setupResize(): void {
  window.addEventListener("resize", () => treeView?.resize());
}

export function reloadUi(): void {
  loadActiveResource();
  refreshFileSelect();
  refreshTree();
  refreshAnnotationEditor();
  updatePathLabel();
}

function setupLocalFiles(): void {
  const input = $("local-files") as HTMLInputElement | null;
  if (!input) return;
  input.addEventListener("change", async () => {
    const files = input.files;
    if (!files?.length) return;
    workspace.clear();
    for (const file of files) {
      workspace.addFile(file.name, await file.text());
    }
    const editable = listEditableFiles();
    activeFilePath = editable[0]?.path;
    refreshFileSelect();
    reloadUi();
    setStatus(`Loaded ${files.length} local file(s)`);
    input.value = "";
  });
}

export function initApp(): void {
  setupLoadBar();
  setupFileSelect();
  setupAnnotationActions();
  setupPaletteActions();
  setupLocalFiles();
  setupResize();
  refreshPaletteUi();
  updatePathLabel();
  setStatus("Paste a GitHub URL or choose local .adl / .t.json files.");
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
  (globalThis as unknown as { __TAAAT__?: unknown }).__TAAAT__ = {
    workspace,
    reloadUi,
    getActiveResource: () => activeResource,
    getSelectedNode: () => selectedNode,
  };
}
