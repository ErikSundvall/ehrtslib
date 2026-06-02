/**
 * Load a clinical model file from GitHub and recursively fetch dependencies
 * (nested Better `.t.json` templates, archetypes, parent archetype chains).
 */

import { parseAdl } from "./parse_adl.ts";
import {
  isClinicalModelPath,
  normalizeClinicalModelPath,
} from "./clinical_model_paths.ts";
import {
  collectTemplateJsonExternalRefsFromText,
} from "./template_json_dependencies.ts";
import { isTemplateJson } from "./legacy/template_json_parser.ts";
import type { GitHubFileEntry } from "./github_repo_loader.ts";

export interface GitHubFileRef {
  owner: string;
  repo: string;
  ref: string;
  path: string;
}

export type GitHubTemplateLoadPhase =
  | "parse-url"
  | "index-tree"
  | "fetch"
  | "parse"
  | "resolve"
  | "complete";

export interface GitHubTemplateLoadProgress {
  phase: GitHubTemplateLoadPhase;
  message: string;
  path?: string;
  ref?: string;
}

export interface GitHubTemplateClosureResult {
  rootPath: string;
  entries: GitHubFileEntry[];
  warnings: string[];
  fetched: number;
  skipped: number;
}

export interface GitHubTemplateClosureOptions {
  fetch?: typeof fetch;
  githubToken?: string;
  maxFiles?: number;
  onProgress?: (event: GitHubTemplateLoadProgress) => void;
}

function emit(
  options: GitHubTemplateClosureOptions | undefined,
  event: GitHubTemplateLoadProgress,
): void {
  options?.onProgress?.(event);
}

function readOptionalGithubToken(): string | undefined {
  try {
    return typeof Deno !== "undefined"
      ? Deno.env.get("GITHUB_TOKEN") ?? undefined
      : undefined;
  } catch {
    return undefined;
  }
}

function githubApiHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ehrtslib-clinical-model-loader",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Parse a GitHub blob or raw URL to a repo file reference. */
export function parseGitHubTemplateFileUrl(input: string): GitHubFileRef {
  const trimmed = input.trim();
  const raw = trimmed.match(
    /raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i,
  );
  if (raw) {
    return {
      owner: raw[1],
      repo: raw[2].replace(/\.git$/, ""),
      ref: decodeURIComponent(raw[3]),
      path: normalizeClinicalModelPath(decodeURIComponent(raw[4])),
    };
  }
  const blob = trimmed.match(
    /github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+?)(?:[?#].*)?$/i,
  );
  if (blob) {
    return {
      owner: blob[1],
      repo: blob[2].replace(/\.git$/, ""),
      ref: decodeURIComponent(blob[3]),
      path: normalizeClinicalModelPath(decodeURIComponent(blob[4])),
    };
  }
  throw new Error(
    `Invalid GitHub clinical model URL. Paste a blob or raw link to a template or archetype file.`,
  );
}

export interface ClinicalModelPathIndex {
  paths: string[];
  byBasenameLower: Map<string, string>;
  byArchetypeIdLower: Map<string, string>;
}

export function buildClinicalModelPathIndex(
  paths: Iterable<string>,
): ClinicalModelPathIndex {
  const allPaths: string[] = [];
  const byBasenameLower = new Map<string, string>();
  const byArchetypeIdLower = new Map<string, string>();

  for (const raw of paths) {
    const path = normalizeClinicalModelPath(raw);
    if (!isClinicalModelPath(path)) continue;
    allPaths.push(path);
    const base = path.split("/").pop() ?? path;
    const baseLower = base.toLowerCase();
    if (!byBasenameLower.has(baseLower)) byBasenameLower.set(baseLower, path);
    const adlMatch = base.match(/^(openEHR-.+)\.adl$/i);
    if (adlMatch) {
      const idLower = adlMatch[1].toLowerCase();
      if (!byArchetypeIdLower.has(idLower)) {
        byArchetypeIdLower.set(idLower, path);
      }
    }
  }

  return { paths: allPaths, byBasenameLower, byArchetypeIdLower };
}

function isOpenEhrArchetypeId(ref: string): boolean {
  return /^openEHR-/i.test(ref);
}

function templateBasenameForRef(ref: string): string {
  if (/\.t\.json$/i.test(ref)) return ref;
  return `${ref}.t.json`;
}

/** Resolve a clinical-model reference to a repo path using the tree index. */
export function resolveClinicalModelRef(
  ref: string,
  index: ClinicalModelPathIndex,
  contextDir: string,
): string | undefined {
  const trimmed = ref.trim();
  if (!trimmed) return undefined;

  if (!isOpenEhrArchetypeId(trimmed)) {
    const base = templateBasenameForRef(trimmed);
    const hit = index.byBasenameLower.get(base.toLowerCase());
    if (hit) return hit;
    const ctxPath = normalizeClinicalModelPath(`${contextDir}/${base}`);
    if (index.paths.includes(ctxPath)) return ctxPath;
    const suffix = `/${base}`.toLowerCase();
    return index.paths.find((p) => p.toLowerCase().endsWith(suffix));
  }

  const idLower = trimmed.toLowerCase();
  const direct = index.byArchetypeIdLower.get(idLower);
  if (direct) return direct;

  const adlName = `${trimmed}.adl`;
  const baseHit = index.byBasenameLower.get(adlName.toLowerCase());
  if (baseHit) return baseHit;

  const suffix = `/${adlName}`.toLowerCase();
  return index.paths.find((p) => p.toLowerCase().endsWith(suffix));
}

async function fetchGitHubTreePaths(
  fileRef: GitHubFileRef,
  fetchFn: typeof fetch,
  headers: HeadersInit,
): Promise<string[]> {
  const branchRes = await fetchFn(
    `https://api.github.com/repos/${fileRef.owner}/${fileRef.repo}/branches/${
      encodeURIComponent(fileRef.ref)
    }`,
    { headers },
  );
  if (!branchRes.ok) {
    throw new Error(
      `GitHub branch ${fileRef.owner}/${fileRef.repo}@${fileRef.ref}: ${branchRes.status} ${branchRes.statusText}`,
    );
  }
  const branchJson = await branchRes.json() as { commit?: { sha?: string } };
  const treeSha = branchJson.commit?.sha;
  if (!treeSha) throw new Error("Could not resolve branch commit SHA");

  const treeRes = await fetchFn(
    `https://api.github.com/repos/${fileRef.owner}/${fileRef.repo}/git/trees/${treeSha}?recursive=1`,
    { headers },
  );
  if (!treeRes.ok) {
    throw new Error(
      `GitHub tree API: ${treeRes.status} ${treeRes.statusText}`,
    );
  }
  const treeJson = await treeRes.json() as {
    tree?: Array<{ path?: string; type?: string }>;
  };
  const paths: string[] = [];
  for (const item of treeJson.tree ?? []) {
    if (item.type === "blob" && item.path && isClinicalModelPath(item.path)) {
      paths.push(normalizeClinicalModelPath(item.path));
    }
  }
  return paths;
}

async function fetchRawFile(
  fileRef: GitHubFileRef,
  path: string,
  fetchFn: typeof fetch,
): Promise<string> {
  const url =
    `https://raw.githubusercontent.com/${fileRef.owner}/${fileRef.repo}/${fileRef.ref}/${path}`;
  const res = await fetchFn(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${path}`);
  }
  return await res.text();
}

function collectDependenciesFromContent(
  path: string,
  content: string,
): string[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  if (
    trimmed.startsWith("{") &&
    (isTemplateJson(trimmed) || /\.t\.json$/i.test(path))
  ) {
    return collectTemplateJsonExternalRefsFromText(trimmed);
  }

  if (/\.(adl|adls)$/i.test(path) || trimmed.includes("archetype")) {
    try {
      const parsed = parseAdl(content, { convertAdl14: true });
      const arch = parsed.archetype ?? parsed.template ??
        parsed.operationalTemplate;
      const parent = arch?.parent_archetype_id?.value;
      return parent ? [parent] : [];
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * Fetch a root clinical model file from GitHub and all reachable dependencies
 * in the same repo branch.
 */
export async function loadGitHubTemplateClosure(
  templateUrl: string,
  options?: GitHubTemplateClosureOptions,
): Promise<GitHubTemplateClosureResult> {
  const fetchFn = options?.fetch ?? globalThis.fetch;
  const token = options?.githubToken ?? readOptionalGithubToken();
  const headers = githubApiHeaders(token);
  const maxFiles = options?.maxFiles ?? 200;
  const warnings: string[] = [];

  emit(options, { phase: "parse-url", message: templateUrl });
  const fileRef = parseGitHubTemplateFileUrl(templateUrl);
  if (!isClinicalModelPath(fileRef.path)) {
    throw new Error(
      `Expected a clinical model file path, got: ${fileRef.path}`,
    );
  }

  emit(options, {
    phase: "index-tree",
    message: `Indexing ${fileRef.owner}/${fileRef.repo}@${fileRef.ref}…`,
  });
  const treePaths = await fetchGitHubTreePaths(fileRef, fetchFn, headers);
  const index = buildClinicalModelPathIndex(treePaths);
  emit(options, {
    phase: "index-tree",
    message: `Indexed ${index.paths.length} clinical model files`,
  });

  const contextDir = fileRef.path.includes("/")
    ? fileRef.path.replace(/\/[^/]+$/, "")
    : "";

  const entries = new Map<string, GitHubFileEntry>();
  const pendingRefs = new Set<string>();
  const queuedPaths = new Set<string>();
  const pathQueue: string[] = [fileRef.path];

  let skipped = 0;

  const enqueuePath = (path: string) => {
    const normalized = normalizeClinicalModelPath(path);
    if (entries.has(normalized) || queuedPaths.has(normalized)) return;
    queuedPaths.add(normalized);
    pathQueue.push(normalized);
  };

  const enqueueRef = (ref: string) => {
    const trimmed = ref.trim();
    if (!trimmed || pendingRefs.has(trimmed)) return;
    pendingRefs.add(trimmed);
    emit(options, {
      phase: "resolve",
      message: `Resolving ${trimmed}`,
      ref: trimmed,
    });
    const resolved = resolveClinicalModelRef(trimmed, index, contextDir);
    if (!resolved) {
      warnings.push(`Unresolved reference: ${trimmed}`);
      emit(options, {
        phase: "resolve",
        message: `Unresolved: ${trimmed}`,
        ref: trimmed,
      });
      return;
    }
    emit(options, {
      phase: "resolve",
      message: `${trimmed} → ${resolved}`,
      ref: trimmed,
      path: resolved,
    });
    enqueuePath(resolved);
  };

  while (pathQueue.length > 0 && entries.size < maxFiles) {
    const path = pathQueue.shift()!;
    queuedPaths.delete(path);

    emit(options, { phase: "fetch", message: `Downloading ${path}`, path });
    try {
      const content = await fetchRawFile(fileRef, path, fetchFn);
      entries.set(path, { path, content });
      emit(options, { phase: "fetch", message: `Downloaded ${path}`, path });

      emit(options, { phase: "parse", message: `Parsing ${path}`, path });
      for (const ref of collectDependenciesFromContent(path, content)) {
        enqueueRef(ref);
      }
    } catch (e) {
      skipped++;
      const msg = `Failed ${path}: ${(e as Error).message}`;
      warnings.push(msg);
      emit(options, { phase: "fetch", message: msg, path });
    }
  }

  if (entries.size >= maxFiles) {
    warnings.push(`Stopped at maxFiles limit (${maxFiles})`);
  }

  if (!entries.has(fileRef.path)) {
    throw new Error(`Could not load root template: ${fileRef.path}`);
  }

  emit(options, {
    phase: "complete",
    message: `File set complete (${entries.size} files)`,
  });

  return {
    rootPath: fileRef.path,
    entries: [...entries.values()],
    warnings,
    fetched: entries.size,
    skipped,
  };
}
