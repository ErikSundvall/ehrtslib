/**
 * TAAAT — Template and Archetype Annotation Tool
 */

import { ClinicalModelWorkspace } from "../../../parser/clinical_model_workspace.ts";
import {
  type AnnotatedResource,
  buildDefinitionTree,
  type DefinitionTreeNode,
  ensureResourceAnnotations,
  getResourceDocumentation,
  resolveAnnotatedResource,
  serializeAnnotatedResource,
  setPathAnnotation,
} from "../../../parser/clinical_model_annotations.ts";
import {
  familyFillColor,
  familyLegendLabel,
  languageOutlineColor,
  listFamilies,
  listLanguageBags,
} from "../../../parser/annotation_families.ts";
import {
  exportPaletteJson,
  loadPalette,
  type PaletteEntry,
  parsePaletteJson,
  savePalette,
} from "./palette.ts";
import { renderOutline } from "./outline-tree.ts";
import {
  createInspectorState,
  currentLanguageBags,
  type InspectorState,
  renderInspector,
} from "./inspector.ts";

export type LoadMode = "template" | "archetype";

const workspace = new ClinicalModelWorkspace();
let activeFilePath: string | undefined;
let activeResource: AnnotatedResource | undefined;
let selectedNode: DefinitionTreeNode | undefined;
let palette: PaletteEntry[] = loadPalette();
let filterText = "";
const enabledLanguages = new Set<string>();
const enabledFamilies = new Set<string>();
const knownLanguages = new Set<string>();
const knownFamilies = new Set<string>();
const extraLanguageBags = new Set<string>(["en"]);
const inspectorState: InspectorState = createInspectorState();

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

function resetFacets(): void {
  enabledLanguages.clear();
  enabledFamilies.clear();
  knownLanguages.clear();
  knownFamilies.clear();
}

function syncFacets(): void {
  const doc = activeResource
    ? getResourceDocumentation(activeResource)
    : undefined;
  for (const l of listLanguageBags(doc, [...extraLanguageBags])) {
    if (!knownLanguages.has(l)) {
      knownLanguages.add(l);
      enabledLanguages.add(l);
    }
  }
  for (const f of listFamilies(doc)) {
    if (!knownFamilies.has(f)) {
      knownFamilies.add(f);
      enabledFamilies.add(f);
    }
  }
}

function renderLegend(): void {
  const doc = activeResource
    ? getResourceDocumentation(activeResource)
    : undefined;
  syncFacets();
  const langHost = $("legend-languages");
  const famHost = $("legend-families");
  if (langHost) {
    langHost.innerHTML = "";
    for (const lang of listLanguageBags(doc, [...extraLanguageBags])) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "legend-chip legend-lang";
      btn.setAttribute(
        "aria-pressed",
        enabledLanguages.has(lang) ? "true" : "false",
      );
      btn.style.borderColor = languageOutlineColor(lang);
      btn.textContent = lang;
      btn.title = `Language bag ${lang} — outline colour on pills`;
      btn.addEventListener("click", () => {
        if (enabledLanguages.has(lang) && enabledLanguages.size === 1) return;
        if (enabledLanguages.has(lang)) enabledLanguages.delete(lang);
        else enabledLanguages.add(lang);
        refreshWorkspace();
      });
      langHost.appendChild(btn);
    }
  }
  if (famHost) {
    famHost.innerHTML = "";
    for (const family of listFamilies(doc)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "legend-chip legend-family";
      btn.setAttribute(
        "aria-pressed",
        enabledFamilies.has(family) ? "true" : "false",
      );
      btn.style.background = familyFillColor(family);
      btn.textContent = familyLegendLabel(family);
      btn.title = `Family ${familyLegendLabel(family)} — fill colour on pills`;
      btn.addEventListener("click", () => {
        if (enabledFamilies.has(family) && enabledFamilies.size === 1) return;
        if (enabledFamilies.has(family)) enabledFamilies.delete(family);
        else enabledFamilies.add(family);
        refreshWorkspace();
      });
      famHost.appendChild(btn);
    }
  }
}

function flattenFind(
  node: DefinitionTreeNode,
  path: string,
): DefinitionTreeNode | undefined {
  if (node.path === path) return node;
  for (const child of node.children) {
    const hit = flattenFind(child, path);
    if (hit) return hit;
  }
  return undefined;
}

function refreshTree(): void {
  const container = $("tree-container");
  if (!container) return;
  if (!activeResource) {
    container.innerHTML =
      '<p class="tree-empty">Load a model to see the tree.</p>';
    return;
  }
  const tree = buildDefinitionTree(activeResource);
  if (!tree) {
    container.innerHTML =
      '<p class="tree-empty">No definition tree (empty or unparsed model).</p>';
    return;
  }
  if (selectedNode) {
    selectedNode = flattenFind(tree, selectedNode.path) ?? selectedNode;
  }
  renderOutline({
    container,
    tree,
    doc: getResourceDocumentation(activeResource),
    selectedPath: selectedNode?.path,
    filterText,
    enabledLanguages,
    enabledFamilies,
    onSelect: (node) => {
      selectedNode = node;
      refreshWorkspace();
    },
  });
}

function refreshInspector(): void {
  const title = $("selected-title");
  const pathEl = $("selected-path");
  const host = $("family-accordions");
  if (!host) return;
  if (!activeResource || !selectedNode) {
    if (title) title.textContent = "Annotations";
    if (pathEl) pathEl.textContent = "Select a node in the tree";
    host.innerHTML =
      '<p class="tree-empty">Select a node to edit family sections.</p>';
    return;
  }
  const tree = buildDefinitionTree(activeResource);
  if (!tree) return;
  const bag = ensureResourceAnnotations(activeResource);
  if (title) title.textContent = selectedNode.label;
  if (pathEl) pathEl.textContent = selectedNode.path || "(definition root)";
  const languages = [
    ...new Set([...currentLanguageBags(bag), ...extraLanguageBags]),
  ];
  renderInspector({
    host,
    resource: activeResource,
    tree,
    node: selectedNode,
    doc: bag,
    languages,
    enabledLanguages,
    state: inspectorState,
    onChange: () => {
      persistResourceToWorkspace();
      refreshWorkspace();
    },
  });
}

function refreshWorkspace(): void {
  renderLegend();
  refreshTree();
  refreshInspector();
}

function refreshPaletteUi(): void {
  const list = $("palette-list");
  if (!list) return;
  list.innerHTML = "";
  for (const entry of palette) {
    const li = document.createElement("li");
    const label = entry.value ? `${entry.key} = ${entry.value}` : entry.key;
    li.innerHTML = `
      <button type="button" class="palette-apply" title="Apply to selected node">${
      escapeAttr(label)
    }</button>
      <button type="button" class="palette-remove" title="Remove from favourites">×</button>
    `;
    li.querySelector(".palette-apply")?.addEventListener("click", () => {
      if (!activeResource || !selectedNode) {
        alert("Select a tree node first.");
        return;
      }
      const bags = [...enabledLanguages];
      const langs = bags.length
        ? bags
        : currentLanguageBags(ensureResourceAnnotations(activeResource));
      for (const lang of langs) {
        setPathAnnotation(
          activeResource,
          selectedNode.path,
          entry.key,
          entry.value ?? "",
          lang,
        );
      }
      persistResourceToWorkspace();
      refreshWorkspace();
    });
    li.querySelector(".palette-remove")?.addEventListener("click", () => {
      palette = palette.filter((p) => p.key !== entry.key);
      savePalette(palette);
      refreshPaletteUi();
    });
    list.appendChild(li);
  }
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
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
      resetFacets();
      loadActiveResource();
      selectedNode = undefined;
      refreshWorkspace();
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
    resetFacets();
    refreshWorkspace();
    setStatus(`Editing ${activeFilePath}`);
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
    if (!palette.some((p) => p.key === key)) {
      palette.push({ key, value: value || undefined });
      savePalette(palette);
      refreshPaletteUi();
    }
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

function setupDownload(): void {
  $("download-adl-btn")?.addEventListener("click", () => {
    if (!activeResource || !activeFilePath) return;
    const text = serializeAnnotatedResource(activeResource);
    downloadText(text, activeFilePath.replace(/\.[^.]+$/, "") + ".adl");
  });
}

function setupAddLanguage(): void {
  const inp = $("add-language") as HTMLInputElement | null;
  if (!inp) return;
  const commit = () => {
    const lang = inp.value.trim().toLowerCase();
    inp.value = "";
    if (!/^[a-z]{2,8}$/.test(lang)) return;
    extraLanguageBags.add(lang);
    knownLanguages.add(lang);
    enabledLanguages.add(lang);
    refreshWorkspace();
  };
  inp.addEventListener("change", commit);
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  });
}

function setupFilter(): void {
  $("tree-filter")?.addEventListener("input", (e) => {
    filterText = (e.target as HTMLInputElement).value;
    refreshTree();
  });
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
    resetFacets();
    refreshFileSelect();
    reloadUi();
    setStatus(`Loaded ${files.length} local file(s)`);
    input.value = "";
  });
}

export function reloadUi(): void {
  loadActiveResource();
  refreshFileSelect();
  refreshWorkspace();
}

export function initApp(): void {
  setupLoadBar();
  setupFileSelect();
  setupPaletteActions();
  setupDownload();
  setupFilter();
  setupAddLanguage();
  setupLocalFiles();
  refreshPaletteUi();
  renderLegend();
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
