/**
 * Template file-set workspace: load archetypes + templates (ADL2 / legacy) and resolve operational templates.
 * Phase 6a.2 — library API for example generation (not demo-only).
 */

import * as openehr_am from "../openehr_am.ts";
import { flattenToOperationalTemplate } from "../am/flattening/template_flattener.ts";
import { ArchetypeRepository, type LoadFileResult } from "./legacy/archetype_repository.ts";
import {
  parseTemplateInput,
  type ParseTemplateInputOptions,
  type ParseTemplateInputResult,
} from "./legacy/parse_template_input.ts";
import { parseOptXml } from "./legacy/opt_xml_parser.ts";
import { parseOetXml } from "./legacy/oet_xml_parser.ts";
import { compileOetToOperational } from "./legacy/oet_compiler.ts";

export interface TemplateWorkspaceFile {
  path: string;
  content: string;
  loadResult?: LoadFileResult;
}

export interface ResolveOperationalOptions {
  /** Template / OPT / operational id, or workspace file path. */
  templateId?: string;
  /** Override workspace generation-root file path. */
  generationRootPath?: string;
}

/** File kinds that can drive instance / stub generation (not standalone archetypes). */
export function canBeGenerationRoot(
  path: string,
  loadResult?: LoadFileResult,
): boolean {
  if (/\.(opt|oet)$/i.test(path)) return true;
  const kind = loadResult?.kind;
  return kind === "template" || kind === "operational_template";
}

export interface ResolveOperationalResult {
  operationalTemplate: openehr_am.OPERATIONAL_TEMPLATE;
  sourcePath?: string;
  sourceKind: "operational_template" | "opt_xml" | "adl2_template" | "adl14_operational" | "oet_compiled";
  warnings: string[];
}

/**
 * In-memory file set for template authoring (ADL2 differential templates + archetypes).
 */
export class TemplateWorkspace {
  readonly repository = new ArchetypeRepository();
  private files = new Map<string, TemplateWorkspaceFile>();
  /** File open in the editor (tab selection). */
  private activePath?: string;
  /** File used as template/OPT root for generation (radio selection). */
  private generationRootPath?: string;
  private warnings: string[] = [];

  getWarnings(): string[] {
    return [...this.warnings, ...this.repository.getWarnings()];
  }

  listFiles(): TemplateWorkspaceFile[] {
    return [...this.files.values()].sort((a, b) => a.path.localeCompare(b.path));
  }

  getFile(path: string): TemplateWorkspaceFile | undefined {
    return this.files.get(path);
  }

  getActivePath(): string | undefined {
    return this.activePath;
  }

  setActivePath(path: string | undefined): void {
    this.activePath = path;
  }

  getGenerationRootPath(): string | undefined {
    return this.generationRootPath;
  }

  setGenerationRootPath(path: string | undefined): void {
    this.generationRootPath = path;
  }

  /** Add or replace a file in the workspace (path is display key, e.g. filename). */
  addFile(path: string, content: string): LoadFileResult {
    const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
    const loadResult = this.repository.loadFile(normalized, content);
    this.files.set(normalized, { path: normalized, content, loadResult });
    if (!this.activePath) this.activePath = normalized;
    if (!this.generationRootPath && canBeGenerationRoot(normalized, loadResult)) {
      this.generationRootPath = normalized;
    }
    return loadResult;
  }

  /** Load many files (e.g. from ZIP extraction). */
  addFiles(entries: Array<{ path: string; content: string }>): LoadFileResult[] {
    const results = entries.map((e) => this.addFile(e.path, e.content));
    if (!this.generationRootPath) {
      const suggested = TemplateWorkspace.suggestGenerationRoot(this.listFiles());
      if (suggested) this.generationRootPath = suggested;
    }
    return results;
  }

  /** Pick a sensible default generation root from loaded files. */
  static suggestGenerationRoot(files: TemplateWorkspaceFile[]): string | undefined {
    for (const f of files) {
      if (f.loadResult?.kind === "template" || f.loadResult?.kind === "operational_template") {
        return f.path;
      }
    }
    for (const f of files) {
      if (/\.opt$/i.test(f.path) || /\.oet$/i.test(f.path)) return f.path;
    }
    return files[0]?.path;
  }

  clear(): void {
    this.files.clear();
    this.activePath = undefined;
    this.generationRootPath = undefined;
    this.warnings = [];
    this.repository.clear();
  }

  /**
   * Resolve an operational template from the workspace.
   * Prefers: explicit id → active file → sole template/OPT in set.
   */
  resolveOperational(options: ResolveOperationalOptions = {}): ResolveOperationalResult {
    const warnings: string[] = [];

    if (options.templateId) {
      const byId = this.resolveByTemplateId(options.templateId, warnings);
      if (byId) return byId;
    }

    const rootPath = options.generationRootPath ??
      this.generationRootPath ??
      this.activePath;
    if (rootPath) {
      const fromRoot = this.resolveFile(rootPath, warnings);
      if (fromRoot) {
        return { ...fromRoot, sourcePath: fromRoot.sourcePath ?? rootPath };
      }
    }

    const ops = this.repository.listOperationalIds();
    if (ops.length === 1) {
      const opt = this.repository.getOperationalTemplate(ops[0])!;
      return {
        operationalTemplate: opt,
        sourceKind: "operational_template",
        warnings,
      };
    }

    const templates = this.repository.listTemplateIds();
    if (templates.length === 1) {
      return {
        operationalTemplate: this.repository.flattenTemplate(
          this.repository.getTemplate(templates[0])!,
        ),
        sourceKind: "adl2_template",
        warnings,
      };
    }

    throw new Error(
      `Cannot resolve operational template: ${ops.length} operational, ${templates.length} source templates. ` +
        "Select a generation root file (radio) or pass templateId.",
    );
  }

  private resolveByTemplateId(
    id: string,
    warnings: string[],
  ): ResolveOperationalResult | undefined {
    const opt = this.repository.getOperationalTemplate(id);
    if (opt) {
      return { operationalTemplate: opt, sourceKind: "operational_template", warnings };
    }
    const tmpl = this.repository.getTemplate(id);
    if (tmpl) {
      return {
        operationalTemplate: this.repository.flattenTemplate(tmpl),
        sourceKind: "adl2_template",
        warnings,
      };
    }
    return undefined;
  }

  private resolveFile(
    path: string,
    warnings: string[],
  ): ResolveOperationalResult | undefined {
    const file = this.files.get(path);
    if (!file) return undefined;

    const trimmed = file.content.trim();
    if (!trimmed) return undefined;

    if (isOptXmlContent(trimmed)) {
      const { operationalTemplate, warnings: w } = parseOptXml(trimmed);
      warnings.push(...w);
      return {
        operationalTemplate,
        sourcePath: path,
        sourceKind: "opt_xml",
        warnings,
      };
    }

    if (isOetXmlContent(trimmed)) {
      const oet = parseOetXml(trimmed);
      const compiled = compileOetToOperational(oet, { repository: this.repository });
      warnings.push(...compiled.warnings, ...oet.warnings);
      return {
        operationalTemplate: compiled.operationalTemplate,
        sourcePath: path,
        sourceKind: "oet_compiled",
        warnings,
      };
    }

    const parsed = parseTemplateInput(trimmed, {
      archetypeRepository: this.repository,
    });
    warnings.push(...parsed.warnings);

    if (parsed.operationalTemplate) {
      return {
        operationalTemplate: parsed.operationalTemplate,
        sourcePath: path,
        sourceKind: parsed.format === "adl14" ? "adl14_operational" : "operational_template",
        warnings,
      };
    }

    if (parsed.kind === "template" && parsed.template) {
      return {
        operationalTemplate: flattenToOperationalTemplate(
          parsed.template,
          this.repository,
        ),
        sourcePath: path,
        sourceKind: "adl2_template",
        warnings,
      };
    }

    if (parsed.kind === "oet_document") {
      throw new Error(
        `OET at ${path} requires archetypes in the workspace. ` +
          `Base: ${parsed.oet?.document.definitionArchetypeId ?? "unknown"}`,
      );
    }

    return undefined;
  }
}

function isOptXmlContent(text: string): boolean {
  return /<template[\s>]/i.test(text) &&
    text.includes("schemas.openehr.org/v1") &&
    !text.includes("openEHR/v1/Template");
}

function isOetXmlContent(text: string): boolean {
  return /openEHR\/v1\/Template/i.test(text);
}

/**
 * Resolve a single text blob to operational template using optional workspace for references.
 */
export function resolveToOperationalTemplate(
  source: string,
  options?: ParseTemplateInputOptions & { workspace?: TemplateWorkspace },
): ResolveOperationalResult {
  const workspace = options?.workspace ?? new TemplateWorkspace();
  if (!options?.workspace) {
    workspace.addFile("input", source);
    workspace.setActivePath("input");
  }
  const parsed = parseTemplateInput(source, {
    archetypeRepository: workspace.repository,
  });

  if (parsed.operationalTemplate) {
    return {
      operationalTemplate: parsed.operationalTemplate,
      sourceKind: parsed.format === "adl14" ? "adl14_operational" : "operational_template",
      warnings: parsed.warnings,
    };
  }

  if (parsed.kind === "template" && parsed.template) {
    return {
      operationalTemplate: flattenToOperationalTemplate(
        parsed.template,
        workspace.repository,
      ),
      sourceKind: "adl2_template",
      warnings: parsed.warnings,
    };
  }

  return workspace.resolveOperational();
}

export function getOperationalTemplateFromWorkspace(
  workspace: TemplateWorkspace,
  options?: ResolveOperationalOptions,
): openehr_am.OPERATIONAL_TEMPLATE {
  return workspace.resolveOperational(options).operationalTemplate;
}
