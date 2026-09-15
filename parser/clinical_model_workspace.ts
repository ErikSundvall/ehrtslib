/**
 * Clinical model file-set workspace: editable in-memory files + template resolution.
 * Supports ADL, OET/OPT XML, Better `.t.json`, ZIP batches, and read-only GitHub trees.
 */

import type { LoadFileResult } from "./legacy/archetype_repository.ts";
import {
  TemplateWorkspace,
  type TemplateWorkspaceFile,
  type ResolveOperationalOptions,
  type ResolveOperationalResult,
} from "./template_workspace.ts";
import {
  loadGitHubRepoTree,
  parseGitHubRepoSpec,
  type GitHubRepoRef,
  type GitHubTreeLoadResult,
} from "./github_repo_loader.ts";
import {
  loadGitHubClinicalModelClosure,
  loadGitHubTemplateClosure,
  type GitHubFileRef,
  type GitHubTemplateClosureResult,
  type GitHubTemplateClosureOptions,
} from "./github_template_closure.ts";
import { isClinicalModelPath, normalizeClinicalModelPath } from "./clinical_model_paths.ts";
import {
  getResourceDocumentation,
  serializeAnnotatedResource,
  type AnnotatedResource,
} from "./clinical_model_annotations.ts";
import {
  listTemplateJsonArchetypeIds,
  patchTemplateJsonAnnotations,
} from "./template_json_annotations.ts";

export type { TemplateWorkspaceFile, ResolveOperationalOptions, ResolveOperationalResult };
export { canBeGenerationRoot } from "./template_workspace.ts";

export interface ClinicalModelFile extends TemplateWorkspaceFile {
  /** True when `content` was edited in-memory and not yet re-exported to external storage. */
  dirty?: boolean;
}

export interface ClinicalModelExportEntry {
  path: string;
  content: string;
}

/** Origin of the last GitHub clinical-model load (optional commit-back target). */
export interface ClinicalModelGitHubSource {
  url: string;
  ref: GitHubFileRef;
  /** Contents-API blob SHA for `ref.path`, when known. */
  blobSha?: string;
}

/**
 * File-set workspace for clinical models. Wraps {@link TemplateWorkspace} and adds
 * export/update helpers for future annotation editors and download flows.
 */
export class ClinicalModelWorkspace {
  private readonly workspace = new TemplateWorkspace();
  private dirtyPaths = new Set<string>();
  private githubSource: ClinicalModelGitHubSource | undefined;

  get repository() {
    return this.workspace.repository;
  }

  getWarnings(): string[] {
    return this.workspace.getWarnings();
  }

  listFiles(): ClinicalModelFile[] {
    return this.workspace.listFiles().map((f) => ({
      ...f,
      dirty: this.dirtyPaths.has(f.path),
    }));
  }

  getFile(path: string): ClinicalModelFile | undefined {
    const f = this.workspace.getFile(path);
    if (!f) return undefined;
    return { ...f, dirty: this.dirtyPaths.has(f.path) };
  }

  getActivePath(): string | undefined {
    return this.workspace.getActivePath();
  }

  setActivePath(path: string | undefined): void {
    this.workspace.setActivePath(path);
  }

  getGenerationRootPath(): string | undefined {
    return this.workspace.getGenerationRootPath();
  }

  setGenerationRootPath(path: string | undefined): void {
    this.workspace.setGenerationRootPath(path);
  }

  /** Underlying workspace (e.g. for demo converter integration). */
  get templateWorkspace(): TemplateWorkspace {
    return this.workspace;
  }

  addFile(path: string, content: string): LoadFileResult {
    const result = this.workspace.addFile(path, content);
    this.dirtyPaths.delete(normalizeClinicalModelPath(path));
    return result;
  }

  addFiles(entries: Array<{ path: string; content: string }>): LoadFileResult[] {
    const results = entries.map((e) => this.addFile(e.path, e.content));
    return results;
  }

  /**
   * Update editor content and re-parse into the repository.
   * Marks the file dirty until replaced by `addFile` from external source.
   */
  updateFileContent(path: string, content: string): LoadFileResult {
    const normalized = normalizeClinicalModelPath(path);
    this.dirtyPaths.add(normalized);
    return this.workspace.addFile(normalized, content);
  }

  /** Current text for download / save (edited content if dirty). */
  exportFile(path: string): string | undefined {
    return this.workspace.getFile(path)?.content;
  }

  exportEntries(): ClinicalModelExportEntry[] {
    return this.workspace.listFiles().map((f) => ({
      path: f.path,
      content: f.content,
    }));
  }

  /** Build a ZIP-friendly map path → content. */
  exportAsMap(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const { path, content } of this.exportEntries()) {
      out[path] = content;
    }
    return out;
  }

  clear(): void {
    this.workspace.clear();
    this.dirtyPaths.clear();
    this.githubSource = undefined;
  }

  static suggestGenerationRoot(files: ClinicalModelFile[]): string | undefined {
    return TemplateWorkspace.suggestGenerationRoot(files);
  }

  resolveOperational(
    options?: ResolveOperationalOptions,
  ): ResolveOperationalResult {
    return this.workspace.resolveOperational(options);
  }

  /**
   * Load a filtered file tree from a public GitHub repo branch (read-only).
   */
  async loadFromGitHub(
    spec: string | GitHubRepoRef,
    options?: { fetch?: typeof fetch; maxFiles?: number; githubToken?: string },
  ): Promise<GitHubTreeLoadResult & { loadResults: LoadFileResult[] }> {
    const ref = typeof spec === "string" ? parseGitHubRepoSpec(spec) : spec;
    const tree = await loadGitHubRepoTree(ref, options);
    const loadResults = this.addFiles(tree.entries);
    if (!this.getGenerationRootPath()) {
      const suggested = ClinicalModelWorkspace.suggestGenerationRoot(
        this.listFiles(),
      );
      if (suggested) this.setGenerationRootPath(suggested);
    }
    return { ...tree, loadResults };
  }

  /**
   * Load a single `.t.json` from a GitHub blob/raw URL and recursively fetch
   * nested templates, archetypes, and parent archetype chains from the same branch.
   */
  async loadFromGitHubTemplateUrl(
    templateUrl: string,
    options?: GitHubTemplateClosureOptions,
  ): Promise<GitHubTemplateClosureResult & { loadResults: LoadFileResult[] }> {
    return this.loadFromGitHubClinicalModelUrl(templateUrl, options);
  }

  /**
   * Load a clinical model file (`.t.json`, `.adl`, `.adls`) from GitHub and
   * recursively fetch dependencies from the same branch.
   */
  async loadFromGitHubClinicalModelUrl(
    fileUrl: string,
    options?: GitHubTemplateClosureOptions,
  ): Promise<GitHubTemplateClosureResult & { loadResults: LoadFileResult[] }> {
    const closure = await loadGitHubClinicalModelClosure(fileUrl, options);
    const loadResults = this.addFiles(closure.entries);
    this.setGenerationRootPath(closure.rootPath);
    this.setActivePath(closure.rootPath);
    this.githubSource = { url: fileUrl, ref: closure.source };
    return { ...closure, loadResults };
  }


  getGitHubSource(): ClinicalModelGitHubSource | undefined {
    return this.githubSource ? { ...this.githubSource, ref: { ...this.githubSource.ref } } : undefined;
  }

  setGitHubBlobSha(sha: string | undefined): void {
    if (!this.githubSource) return;
    this.githubSource = { ...this.githubSource, blobSha: sha };
  }

  isDirty(path?: string): boolean {
    if (path) return this.dirtyPaths.has(normalizeClinicalModelPath(path));
    return this.dirtyPaths.size > 0;
  }

  /**
   * Serialize the active annotations back into file text.
   * ADL/ADLS → ADL2 text; `.t.json` → annotation-only patch of the stored JSON.
   */
  exportAnnotatedFile(path: string): string | undefined {
    const file = this.getFile(path);
    if (!file) return undefined;
    const lower = path.toLowerCase();
    if (lower.endsWith(".t.json")) {
      const docs = new Map<string, ReturnType<typeof getResourceDocumentation>>();
      for (const id of listTemplateJsonArchetypeIds(file.content)) {
        const res = (
          this.repository.get(id) ??
          this.repository.getTemplate(id)
        ) as AnnotatedResource | undefined;
        docs.set(id, res ? getResourceDocumentation(res) : undefined);
      }
      return patchTemplateJsonAnnotations(file.content, docs);
    }
    if (/\.(adl|adls)$/i.test(path)) {
      const id = file.loadResult?.archetypeId;
      if (!id) return file.content;
      const res = (
        this.repository.get(id) ??
        this.repository.getTemplate(id)
      ) as AnnotatedResource | undefined;
      if (!res) return file.content;
      return serializeAnnotatedResource(res);
    }
    return file.content;
  }

  /** Persist annotated content for `path` back into the workspace (marks dirty). */
  persistAnnotatedFile(path: string): LoadFileResult | undefined {
    const text = this.exportAnnotatedFile(path);
    if (text === undefined) return undefined;
    return this.updateFileContent(path, text);
  }

  /** Load entries extracted from a ZIP (same filter as GitHub loader). */
  loadFromZipEntries(
    entries: Array<{ path: string; content: string }>,
  ): LoadFileResult[] {
    const batch = entries.filter((e) => isClinicalModelPath(e.path)).map((e) => ({
      path: normalizeClinicalModelPath(e.path),
      content: e.content,
    }));
    return this.addFiles(batch);
  }
}
