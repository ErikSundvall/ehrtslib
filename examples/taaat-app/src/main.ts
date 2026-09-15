/**
 * TAAAT — Template and Archetype Annotation Tool
 */

import { ClinicalModelWorkspace } from "../../../parser/clinical_model_workspace.ts";
import {
  type AnnotatedResource,
  type AnnotationDocumentation,
  annotationPathOf,
  buildDefinitionTree,
  type DefinitionTreeNode,
  ensureResourceAnnotations,
  getResourceDocumentation,
  resolveAnnotatedResource,
  setPathAnnotation,
} from "../../../parser/clinical_model_annotations.ts";
import {
  annotationFamily,
  familyFillColor,
  familyLegendLabel,
  flattenDefinitionTree,
  isLanguageIndependentFamily,
  languageOutlineColor,
  listFamilies,
  listLanguageBags,
  listResourceLanguages,
  mergeDocumentation,
  orderLanguagesWithOriginal,
  originalLanguageOf,
} from "../../../parser/annotation_families.ts";
import {
  type AnnotationCopyItem,
  applyCopyItems,
  listCopyItemsFromDocumentation,
} from "../../../parser/copy_original_annotations.ts";
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
import {
  type SlAlert,
  type SlButton,
  slEl,
  type SlInput,
  type SlSelect,
  slValue,
} from "./sl.ts";
import { mountCopyOriginalDialog } from "./copy-dialog.ts";

import {
  commitGitHubFile,
  getGitHubAuthenticatedUser,
  getGitHubFileContents,
} from "../../../parser/github_contents.ts";

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
const inspectorState: InspectorState = createInspectorState();

const GITHUB_TOKEN_KEY = "taaat-github-token";
let githubToken: string | undefined =
  sessionStorage.getItem(GITHUB_TOKEN_KEY) ?? undefined;
let githubLogin: string | undefined;

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T | null;

function getLoadMode(): LoadMode {
  const group = $("load-mode") as HTMLElement & { value?: string } | null;
  return group?.value === "archetype" ? "archetype" : "template";
}

function setStatus(msg: string, isError = false): void {
  const el = $("status-bar") as SlAlert | null;
  if (!el) return;
  el.textContent = msg;
  el.variant = isError ? "danger" : "primary";
  el.open = true;
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
  const select = $("file-select") as SlSelect | null;
  if (!select) return;
  const files = listEditableFiles();
  select.innerHTML = "";
  files.forEach((f, i) => {
    const opt = document.createElement("sl-option") as HTMLElement & {
      value: string;
    };
    opt.textContent = `${f.path} (${f.kind})`;
    select.appendChild(opt);
    // Index values avoid Shoelace's space-separated value parsing.
    opt.value = String(i);
  });
  const idx = files.findIndex((f) => f.path === activeFilePath);
  const nextIdx = idx >= 0 ? idx : files.length ? 0 : -1;
  if (nextIdx >= 0) {
    activeFilePath = files[nextIdx].path;
    select.value = String(nextIdx);
  } else {
    select.value = "";
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
  if (!activeFilePath) return;
  workspace.persistAnnotatedFile(activeFilePath);
  updateGitHubActionState();
}

function resourcesForCopy(): { id: string; resource: AnnotatedResource }[] {
  const out: { id: string; resource: AnnotatedResource }[] = [];
  const seen = new Set<AnnotatedResource>();
  const add = (res: AnnotatedResource | undefined, id: string) => {
    if (!res || seen.has(res)) return;
    seen.add(res);
    out.push({ id, resource: res });
  };
  add(activeResource, activeFilePath ?? "active");
  const tree = currentTree();
  if (tree) {
    for (const node of flattenDefinitionTree(tree)) {
      add(
        ownerForNode(node),
        node.overlayId ?? activeFilePath ?? "active",
      );
    }
  }
  return out;
}

function collectCopyItems(targetLanguage: string): AnnotationCopyItem[] {
  const source = currentOriginalLanguage();
  if (!source) return [];
  const items: AnnotationCopyItem[] = [];
  for (const { id, resource } of resourcesForCopy()) {
    items.push(
      ...listCopyItemsFromDocumentation(
        getResourceDocumentation(resource),
        source,
        targetLanguage,
        id,
      ),
    );
  }
  return items;
}

function applyCopySelection(
  targetLanguage: string,
  items: AnnotationCopyItem[],
): void {
  const byOwner = new Map<string, AnnotationCopyItem[]>();
  for (const item of items) {
    const id = item.ownerId ?? "";
    const list = byOwner.get(id) ?? [];
    list.push(item);
    byOwner.set(id, list);
  }
  for (const { id, resource } of resourcesForCopy()) {
    const group = byOwner.get(id) ?? [];
    if (group.length) applyCopyItems(resource, group, targetLanguage);
  }
  const persistPaths = new Set<string>();
  if (activeFilePath) persistPaths.add(activeFilePath);
  for (const file of listEditableFiles()) {
    const loaded = workspace.getFile(file.path);
    const res = resolveAnnotatedResource(
      workspace.repository,
      loaded?.loadResult,
    );
    if (res && resourcesForCopy().some((r) => r.resource === res)) {
      persistPaths.add(file.path);
    }
  }
  for (const path of persistPaths) workspace.persistAnnotatedFile(path);
  updateGitHubActionState();
  refreshWorkspace();
  setStatus(
    `Copied ${items.length} annotation${items.length === 1 ? "" : "s"} from ${
      currentOriginalLanguage() ?? "?"
    } to ${targetLanguage}`,
  );
}

function setupCopyOriginal(): void {
  const mounted = mountCopyOriginalDialog({
    sourceLanguage: () => currentOriginalLanguage(),
    targetLanguages: () =>
      workspaceLanguages().filter((l) => l !== currentOriginalLanguage()),
    collectItems: collectCopyItems,
    applyItems: applyCopySelection,
  });
  $("copy-original-btn")?.addEventListener("click", () => {
    if (!currentOriginalLanguage()) {
      setStatus("Load a model with an original language first.", true);
      return;
    }
    mounted.open();
  });
}

function resetFacets(): void {
  enabledLanguages.clear();
  enabledFamilies.clear();
  knownLanguages.clear();
  knownFamilies.clear();
}

function modelLanguages(): string[] {
  const set = new Set<string>();
  const addFrom = (res: unknown) => {
    for (const lang of listResourceLanguages(res)) set.add(lang);
  };
  if (activeResource) addFrom(activeResource);
  for (const id of workspace.repository.listIds()) {
    const arch = workspace.repository.get(id);
    if (arch) addFrom(arch);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function currentOriginalLanguage(): string | undefined {
  return originalLanguageOf(activeResource);
}

function workspaceLanguages(): string[] {
  return orderLanguagesWithOriginal(
    listLanguageBags(workspaceDocumentation(), modelLanguages()),
    currentOriginalLanguage(),
  );
}

function syncFacets(): void {
  for (const l of workspaceLanguages()) {
    if (!knownLanguages.has(l)) {
      knownLanguages.add(l);
      enabledLanguages.add(l);
    }
  }
  for (const f of listFamilies(workspaceDocumentation())) {
    if (!knownFamilies.has(f)) {
      knownFamilies.add(f);
      enabledFamilies.add(f);
    }
  }
}

function currentTree(): DefinitionTreeNode | undefined {
  if (!activeResource) return undefined;
  return buildDefinitionTree(activeResource, {
    resolveArchetype: (id) => workspace.repository.get(id),
  });
}

function ownerForNode(node: DefinitionTreeNode): AnnotatedResource | undefined {
  if (node.overlayId) {
    const overlay = workspace.repository.get(node.overlayId);
    if (overlay) return overlay;
  }
  return activeResource;
}

function documentationForNode(
  node: DefinitionTreeNode,
): AnnotationDocumentation | undefined {
  const owner = ownerForNode(node);
  return owner ? getResourceDocumentation(owner) : undefined;
}

function workspaceDocumentation(): AnnotationDocumentation {
  const docs: Array<AnnotationDocumentation | undefined> = [];
  if (activeResource) docs.push(getResourceDocumentation(activeResource));
  const seen = new Set<string>();
  for (const id of workspace.repository.listIds()) {
    const arch = workspace.repository.get(id);
    const key = arch?.archetype_id?.value ?? id;
    if (!arch || seen.has(key) || arch === activeResource) continue;
    seen.add(key);
    docs.push(getResourceDocumentation(arch));
  }
  return mergeDocumentation(docs);
}

function renderLegend(): void {
  syncFacets();
  const original = currentOriginalLanguage();
  const langHost = $("legend-languages");
  const famHost = $("legend-families");
  if (langHost) {
    langHost.innerHTML = "";
    for (const lang of workspaceLanguages()) {
      const isOriginal = Boolean(original && lang === original);
      const btn = slEl<SlButton>("sl-button", {
        size: "small",
        pill: true,
        className: `legend-chip legend-lang${isOriginal ? " is-original" : ""}`,
        text: lang,
      });
      btn.setAttribute(
        "aria-pressed",
        enabledLanguages.has(lang) ? "true" : "false",
      );
      btn.style.setProperty("--lang-outline", languageOutlineColor(lang));
      btn.title = isOriginal
        ? `Original language ${lang} — thicker outline; logic/UI keys are maintained here`
        : `Language bag ${lang} — from the model's supported languages`;
      btn.addEventListener("click", () => {
        if (enabledLanguages.has(lang) && enabledLanguages.size === 1) return;
        if (enabledLanguages.has(lang)) enabledLanguages.delete(lang);
        else enabledLanguages.add(lang);
        refreshWorkspace();
      });
      langHost.appendChild(btn);
    }
  }
  const copyBtn = $("copy-original-btn") as SlButton | null;
  if (copyBtn) {
    const targets = workspaceLanguages().filter((l) => l !== original);
    copyBtn.disabled = !original || targets.length === 0;
    copyBtn.title = original
      ? `Copy annotations from original language ${original} into another bag`
      : "Load a model with an original language and at least one translation";
  }
  if (famHost) {
    famHost.innerHTML = "";
    for (const family of listFamilies(workspaceDocumentation())) {
      const btn = slEl<SlButton>("sl-button", {
        size: "small",
        pill: true,
        className: "legend-chip legend-family",
        text: familyLegendLabel(family),
      });
      btn.setAttribute(
        "aria-pressed",
        enabledFamilies.has(family) ? "true" : "false",
      );
      btn.style.setProperty("--family-fill", familyFillColor(family));
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
  const tree = currentTree();
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
    documentationForNode,
    selectedPath: selectedNode?.path,
    filterText,
    enabledLanguages,
    enabledFamilies,
    originalLanguage: currentOriginalLanguage(),
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
  const tree = currentTree();
  if (!tree) return;
  const owner = ownerForNode(selectedNode) ?? activeResource;
  const bag = ensureResourceAnnotations(owner);
  if (title) title.textContent = selectedNode.label;
  if (pathEl) pathEl.textContent = selectedNode.path || "(definition root)";
  renderInspector({
    host,
    resource: owner,
    tree,
    node: selectedNode,
    doc: bag,
    languages: workspaceLanguages(),
    enabledLanguages,
    originalLanguage: currentOriginalLanguage(),
    state: inspectorState,
    resourceForNode: (node) => ownerForNode(node) ?? owner,
    documentationForNode,
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
    const apply = slEl<SlButton>("sl-button", {
      size: "small",
      variant: "default",
      className: "palette-apply",
      text: label,
    });
    apply.title = "Apply to selected node";
    const remove = slEl<SlButton>("sl-button", {
      size: "small",
      variant: "text",
      className: "palette-remove",
      text: "×",
    });
    remove.title = "Remove from favourites";
    apply.addEventListener("click", () => {
      if (!activeResource || !selectedNode) {
        setStatus("Select a tree node first.", true);
        return;
      }
      const owner = ownerForNode(selectedNode) ?? activeResource;
      const original = currentOriginalLanguage();
      const independent = isLanguageIndependentFamily(
        annotationFamily(entry.key),
      );
      let langs: string[];
      if (independent && original) {
        langs = [original];
      } else {
        const bags = [...enabledLanguages];
        langs = bags.length ? bags : currentLanguageBags(
          ensureResourceAnnotations(owner),
          modelLanguages(),
        );
      }
      for (const lang of langs) {
        setPathAnnotation(
          owner,
          annotationPathOf(selectedNode),
          entry.key,
          entry.value ?? "",
          lang,
        );
      }
      persistResourceToWorkspace();
      refreshWorkspace();
    });
    remove.addEventListener("click", () => {
      palette = palette.filter((p) => p.key !== entry.key);
      savePalette(palette);
      refreshPaletteUi();
    });
    li.append(apply, remove);
    list.appendChild(li);
  }
}

function setupLoadBar(): void {
  const loadBtn = $("load-github-btn") as SlButton | null;
  const urlInput = $("github-url") as SlInput | null;
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
    if (!slValue(urlInput).trim()) {
      urlInput.value = mode === "template" ? templateDefault : archetypeDefault;
    }
  };

  $("load-mode")?.addEventListener("sl-change", updatePlaceholder);
  updatePlaceholder();

  loadBtn.addEventListener("click", async () => {
    const url = slValue(urlInput).trim();
    if (!url) {
      setStatus("Paste a GitHub blob or raw URL.", true);
      return;
    }
    loadBtn.loading = true;
    setStatus("Loading…");
    try {
      workspace.clear();
      const result = await workspace.loadFromGitHubClinicalModelUrl(url, {
        maxFiles: 200,
        githubToken,
        onProgress: (e) => setStatus(e.message),
      });
      // Prefer Contents API SHA when signed in (needed for commit-back).
      try {
        if (githubToken && result.source) {
          const meta = await getGitHubFileContents(result.source, {
            token: githubToken,
          });
          workspace.setGitHubBlobSha(meta.sha);
        }
      } catch {
        // Public raw load still works; commit will fetch SHA later.
      }
      updateGitHubActionState();
      const mode = getLoadMode();
      const files = listEditableFiles();
      if (mode === "template") {
        activeFilePath = result.rootPath;
      } else {
        const arch = files.find((f) => f.kind === "archetype");
        activeFilePath = arch?.path ?? result.rootPath;
      }
      refreshFileSelect();
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
    } finally {
      loadBtn.loading = false;
    }
  });
}

function setupFileSelect(): void {
  $("file-select")?.addEventListener("sl-change", (e) => {
    const idx = Number(slValue(e.target as Element));
    const files = listEditableFiles();
    activeFilePath = Number.isFinite(idx) ? files[idx]?.path : undefined;
    loadActiveResource();
    selectedNode = undefined;
    resetFacets();
    refreshWorkspace();
    setStatus(
      activeFilePath ? `Editing ${activeFilePath}` : "No file selected",
    );
  });
}

function setupPaletteActions(): void {
  $("palette-add-btn")?.addEventListener("click", () => {
    const key = slValue($("palette-key")).trim();
    const value = slValue($("palette-value")).trim();
    if (!key) {
      setStatus("Enter an annotation key.", true);
      return;
    }
    if (!palette.some((p) => p.key === key)) {
      palette.push({ key, value: value || undefined });
      savePalette(palette);
      refreshPaletteUi();
    }
    const keyInp = $("palette-key") as SlInput | null;
    const valInp = $("palette-value") as SlInput | null;
    if (keyInp) keyInp.value = "";
    if (valInp) valInp.value = "";
  });

  $("palette-download-btn")?.addEventListener("click", () => {
    downloadText(exportPaletteJson(palette), "taaat-palette.json");
  });

  $("palette-upload-btn")?.addEventListener("click", () => {
    $("palette-upload-input")?.click();
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
      setStatus(`Invalid palette file: ${(err as Error).message}`, true);
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

function downloadFileName(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base;
}

function setupDownload(): void {
  $("download-file-btn")?.addEventListener("click", () => {
    if (!activeFilePath) return;
    const text = workspace.exportAnnotatedFile(activeFilePath);
    if (text == null) {
      setStatus("Nothing to download.", true);
      return;
    }
    downloadText(text, downloadFileName(activeFilePath));
    setStatus(`Downloaded ${downloadFileName(activeFilePath)}`);
  });
}

function updateGitHubActionState(): void {
  const commitBtn = $("github-commit-btn") as SlButton | null;
  const userEl = $("github-user");
  const source = workspace.getGitHubSource();
  const canCommit = Boolean(
    githubToken && source && activeFilePath &&
      (activeFilePath === source.ref.path ||
        activeFilePath.endsWith("/" + source.ref.path) ||
        source.ref.path.endsWith(activeFilePath)),
  );
  if (commitBtn) commitBtn.disabled = !canCommit;
  if (userEl) {
    if (githubLogin) {
      userEl.hidden = false;
      userEl.textContent = `Signed in as ${githubLogin}`;
    } else {
      userEl.hidden = true;
      userEl.textContent = "";
    }
  }
}

function setupGitHubAuth(): void {
  const tokenInput = $("github-token") as SlInput | null;
  if (tokenInput && githubToken) tokenInput.value = githubToken;

  $("github-login-btn")?.addEventListener("click", async () => {
    const token = (tokenInput ? slValue(tokenInput) : "").trim() || githubToken;
    if (!token) {
      setStatus(
        "Paste a GitHub personal access token with contents:write.",
        true,
      );
      return;
    }
    try {
      const user = await getGitHubAuthenticatedUser(token);
      githubToken = token;
      githubLogin = user.login;
      sessionStorage.setItem(GITHUB_TOKEN_KEY, token);
      setStatus(`GitHub: signed in as ${user.login}`);
      updateGitHubActionState();
    } catch (e) {
      githubLogin = undefined;
      setStatus((e as Error).message, true);
      updateGitHubActionState();
    }
  });

  $("github-commit-btn")?.addEventListener("click", async () => {
    const source = workspace.getGitHubSource();
    if (!githubToken || !source || !activeFilePath) {
      setStatus("Load from GitHub and sign in before committing.", true);
      return;
    }
    const content = workspace.exportAnnotatedFile(activeFilePath);
    if (content == null) {
      setStatus("Nothing to commit.", true);
      return;
    }
    const commitBtn = $("github-commit-btn") as SlButton | null;
    if (commitBtn) commitBtn.loading = true;
    try {
      let sha = source.blobSha;
      if (!sha) {
        const current = await getGitHubFileContents(source.ref, {
          token: githubToken,
        });
        sha = current.sha;
      }
      const message = `Annotate ${
        source.ref.path.split("/").pop() ?? source.ref.path
      } via TAAAT`;
      const result = await commitGitHubFile({
        ref: source.ref,
        content,
        message,
        sha,
        token: githubToken,
      });
      workspace.setGitHubBlobSha(result.contentSha || undefined);
      // Keep workspace content aligned with what we pushed.
      workspace.updateFileContent(activeFilePath, content);
      // updateFileContent marks dirty; clear dirty by re-add equivalent:
      workspace.addFile(activeFilePath, content);
      setStatus(
        `Committed to ${source.ref.owner}/${source.ref.repo}@${source.ref.ref}` +
          (result.commitSha ? ` (${result.commitSha.slice(0, 7)})` : ""),
      );
      updateGitHubActionState();
    } catch (e) {
      setStatus((e as Error).message, true);
    } finally {
      if (commitBtn) commitBtn.loading = false;
    }
  });

  updateGitHubActionState();
}

function setupFilter(): void {
  $("tree-filter")?.addEventListener("sl-input", (e) => {
    filterText = slValue(e.target as Element);
    refreshTree();
  });
}

function setupLocalFiles(): void {
  const input = $("local-files") as HTMLInputElement | null;
  const btn = $("local-files-btn");
  if (!input) return;
  btn?.addEventListener("click", () => input.click());
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
  setupGitHubAuth();
  setupFilter();
  setupLocalFiles();
  setupCopyOriginal();
  refreshPaletteUi();
  renderLegend();
  updateGitHubActionState();
  setStatus("Paste a GitHub URL or choose local .adl / .t.json files.");
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
  (globalThis as unknown as { __TAAAT__?: unknown }).__TAAAT__ = {
    workspace,
    reloadUi,
    getActiveResource: () => activeResource,
    getSelectedNode: () => selectedNode,
    exportAnnotatedFile: (path?: string) =>
      workspace.exportAnnotatedFile(path ?? activeFilePath ?? ""),
    getGitHubSource: () => workspace.getGitHubSource(),
    originalLanguage: () => currentOriginalLanguage(),
  };
}
