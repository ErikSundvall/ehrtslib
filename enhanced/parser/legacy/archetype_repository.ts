/**
 * Archetype / template lookup for OET compilation and ADL2 template flattening.
 */

import { parseAdl, type ParseAdlResult } from "../parse_adl.ts";
import { flattenToOperationalTemplate, type ArchetypeResolver } from "../../am/flattening/template_flattener.ts";
import * as openehr_am from "../../openehr_am.ts";

export interface ArchetypeRepositoryOptions {
  /** Directory containing `.adl` / `.adls` files (searched recursively). */
  rootDir: string;
}

export type RepositoryFileKind =
  | "archetype"
  | "template"
  | "operational_template"
  | "skipped"
  | "error";

export interface LoadFileResult {
  path: string;
  kind: RepositoryFileKind;
  archetypeId?: string;
  message?: string;
}

export class ArchetypeRepository implements ArchetypeResolver {
  private byId = new Map<string, openehr_am.ARCHETYPE>();
  private templates = new Map<string, openehr_am.TEMPLATE>();
  private operational = new Map<string, openehr_am.OPERATIONAL_TEMPLATE>();
  private warnings: string[] = [];
  private loadedPaths: string[] = [];

  static async fromDirectory(rootDir: string): Promise<ArchetypeRepository> {
    const repo = new ArchetypeRepository();
    await repo.loadDirectory(rootDir);
    return repo;
  }

  static fromEntries(
    entries: Array<{ path: string; content: string }>,
  ): ArchetypeRepository {
    const repo = new ArchetypeRepository();
    for (const { path, content } of entries) {
      repo.loadFile(path, content);
    }
    return repo;
  }

  getWarnings(): string[] {
    return [...this.warnings];
  }

  listLoadedPaths(): string[] {
    return [...this.loadedPaths];
  }

  listTemplateIds(): string[] {
    return [...this.templates.keys()].sort();
  }

  listOperationalIds(): string[] {
    return [...this.operational.keys()].sort();
  }

  getTemplate(templateId: string): openehr_am.TEMPLATE | undefined {
    return this.templates.get(templateId) ??
      this.templates.get(templateId.replace(/\.v[\d.]+$/, ""));
  }

  getOperationalTemplate(id: string): openehr_am.OPERATIONAL_TEMPLATE | undefined {
    return this.operational.get(id) ??
      this.operational.get(id.replace(/\.v[\d.]+$/, ""));
  }

  /** Flatten an ADL2 source template using archetypes in this repository. */
  flattenTemplate(template: openehr_am.TEMPLATE): openehr_am.OPERATIONAL_TEMPLATE {
    return flattenToOperationalTemplate(template, this);
  }

  resolve(archetypeId: string): openehr_am.ARCHETYPE | undefined {
    return this.get(archetypeId);
  }

  async loadDirectory(rootDir: string): Promise<void> {
    for await (const entry of Deno.readDir(rootDir)) {
      const path = `${rootDir}/${entry.name}`;
      if (entry.isDirectory) {
        await this.loadDirectory(path);
        continue;
      }
      if (!/\.(adl|adls|opt|oet|xml)$/i.test(entry.name)) continue;
      try {
        const text = await Deno.readTextFile(path);
        this.loadFile(path, text);
      } catch (e) {
        this.warnings.push(`Failed ${path}: ${(e as Error).message}`);
      }
    }
  }

  loadFile(path: string, text: string): LoadFileResult {
    this.loadedPaths.push(path);
    try {
      const trimmed = text.trim();
      if (!trimmed) {
        return { path, kind: "skipped", message: "empty file" };
      }

      if (trimmed.startsWith("<?xml") || trimmed.startsWith("<")) {
        if (/<template[\s>]/i.test(trimmed) && /openEHR\/v1\/Template/i.test(trimmed)) {
          return { path, kind: "skipped", message: "OET XML: use compileOetToOperational" };
        }
        return { path, kind: "skipped", message: "XML: use parseOptXml separately" };
      }

      const parsed = parseAdl(text, { convertAdl14: true });
      return this.ingestParseResult(path, parsed);
    } catch (e) {
      const message = (e as Error).message;
      this.warnings.push(`Failed ${path}: ${message}`);
      return { path, kind: "error", message };
    }
  }

  private ingestParseResult(path: string, parsed: ParseAdlResult): LoadFileResult {
    if (parsed.kind === "archetype" && parsed.archetype) {
      this.add(parsed.archetype);
      const id = parsed.archetype.archetype_id?.value ?? path;
      return { path, kind: "archetype", archetypeId: id };
    }
    if (parsed.kind === "template" && parsed.template) {
      const id = parsed.template.archetype_id?.value ?? path;
      this.templates.set(id, parsed.template);
      const base = id.replace(/\.v[\d.]+$/, "");
      if (!this.templates.has(base)) this.templates.set(base, parsed.template);
      return { path, kind: "template", archetypeId: id };
    }
    if (parsed.kind === "operational_template" && parsed.operationalTemplate) {
      const id = parsed.operationalTemplate.archetype_id?.value ?? path;
      this.operational.set(id, parsed.operationalTemplate);
      const base = id.replace(/\.v[\d.]+$/, "");
      if (!this.operational.has(base)) this.operational.set(base, parsed.operationalTemplate);
      return { path, kind: "operational_template", archetypeId: id };
    }
    return { path, kind: "skipped", message: `unsupported kind: ${parsed.kind}` };
  }

  add(archetype: openehr_am.ARCHETYPE): void {
    const id = archetype.archetype_id?.value;
    if (id) this.byId.set(id, archetype);
    const base = id?.replace(/\.v[\d.]+$/, "");
    if (base && !this.byId.has(base)) this.byId.set(base, archetype);
  }

  get(archetypeId: string): openehr_am.ARCHETYPE | undefined {
    return this.byId.get(archetypeId) ??
      this.byId.get(archetypeId.replace(/\.v[\d.]+$/, ""));
  }

  has(archetypeId: string): boolean {
    return this.get(archetypeId) !== undefined;
  }

  listIds(): string[] {
    return [...this.byId.keys()].sort();
  }

  clear(): void {
    this.byId.clear();
    this.templates.clear();
    this.operational.clear();
    this.warnings = [];
    this.loadedPaths = [];
  }
}

export function parseArchetypeFile(text: string): ParseAdlResult {
  return parseAdl(text, { convertAdl14: true });
}
