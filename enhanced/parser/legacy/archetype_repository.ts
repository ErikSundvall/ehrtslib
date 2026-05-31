/**
 * File-based archetype lookup for OET compilation and template resolution.
 */

import { parseAdl, type ParseAdlResult } from "../parse_adl.ts";
import * as openehr_am from "../../openehr_am.ts";

export interface ArchetypeRepositoryOptions {
  /** Directory containing `.adl` / `.adls` files (searched recursively). */
  rootDir: string;
}

export class ArchetypeRepository {
  private byId = new Map<string, openehr_am.ARCHETYPE>();
  private warnings: string[] = [];

  static async fromDirectory(rootDir: string): Promise<ArchetypeRepository> {
    const repo = new ArchetypeRepository();
    await repo.loadDirectory(rootDir);
    return repo;
  }

  getWarnings(): string[] {
    return [...this.warnings];
  }

  async loadDirectory(rootDir: string): Promise<void> {
    for await (const entry of Deno.readDir(rootDir)) {
      const path = `${rootDir}/${entry.name}`;
      if (entry.isDirectory) {
        await this.loadDirectory(path);
        continue;
      }
      if (!/\.adls?$/i.test(entry.name)) continue;
      try {
        const text = await Deno.readTextFile(path);
        const parsed = parseAdl(text);
        const archetype = parsed.archetype ??
          (parsed.kind === "archetype" ? parsed.archetype : undefined);
        if (!archetype?.archetype_id?.value) {
          this.warnings.push(`Skipped ${path}: no archetype_id`);
          continue;
        }
        this.byId.set(archetype.archetype_id.value, archetype);
        const base = archetype.archetype_id.value.replace(/\.v[\d.]+$/, "");
        if (!this.byId.has(base)) this.byId.set(base, archetype);
      } catch (e) {
        this.warnings.push(`Failed ${path}: ${(e as Error).message}`);
      }
    }
  }

  add(archetype: openehr_am.ARCHETYPE): void {
    const id = archetype.archetype_id?.value;
    if (id) this.byId.set(id, archetype);
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
}

export function parseArchetypeFile(text: string): ParseAdlResult {
  return parseAdl(text, { convertAdl14: true });
}
