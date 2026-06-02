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
  loadGitHubTemplateClosure,
  type GitHubTemplateClosureResult,
  type GitHubTemplateClosureOptions,
} from "./github_template_closure.ts";
import { isClinicalModelPath, normalizeClinicalModelPath } from "./clinical_model_paths.ts";

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

/**
 * File-set workspace for clinical models. Wraps {@link TemplateWorkspace} and adds
 * export/update helpers for future annotation editors and download flows.
 */
export class ClinicalModelWorkspace {
  private readonly workspace = new TemplateWorkspace();
  private dirtyPaths = new Set<string>();

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
    const closure = await loadGitHubTemplateClosure(templateUrl, options);
    const loadResults = this.addFiles(closure.entries);
    this.setGenerationRootPath(closure.rootPath);
    this.setActivePath(closure.rootPath);
    return { ...closure, loadResults };
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
