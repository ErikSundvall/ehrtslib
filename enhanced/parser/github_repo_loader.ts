/**
 * Read-only loader for archetype/template trees from public GitHub repositories.
 */

import {
  isClinicalModelPath,
  normalizeClinicalModelPath,
} from "./clinical_model_paths.ts";

export interface GitHubRepoRef {
  owner: string;
  repo: string;
  /** Branch name or tag (default `master`). */
  ref?: string;
  /** Only include files under this prefix (e.g. `local`). */
  pathPrefix?: string;
}

export interface GitHubFileEntry {
  path: string;
  content: string;
}

export interface GitHubTreeLoadResult {
  entries: GitHubFileEntry[];
  warnings: string[];
  ref: string;
  fetched: number;
  skipped: number;
}

/** Parse `owner/repo@branch` or `owner/repo` (optional `:pathPrefix`). */
export function parseGitHubRepoSpec(spec: string): GitHubRepoRef {
  const trimmed = spec.trim();
  const urlMatch = trimmed.match(
    /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/?#]+))?/i,
  );
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2].replace(/\.git$/, ""),
      ref: urlMatch[3] ?? "master",
    };
  }

  let rest = trimmed;
  let pathPrefix: string | undefined;
  const colon = rest.indexOf(":");
  if (colon > 0 && !rest.includes("://")) {
    pathPrefix = rest.slice(colon + 1).replace(/^\/+/, "");
    rest = rest.slice(0, colon);
  }

  const at = rest.lastIndexOf("@");
  let ref: string | undefined;
  if (at > 0) {
    ref = rest.slice(at + 1);
    rest = rest.slice(0, at);
  }
  const [owner, repo] = rest.split("/");
  if (!owner || !repo) {
    throw new Error(
      `Invalid GitHub spec "${spec}". Use owner/repo@branch or a github.com URL.`,
    );
  }
  return { owner, repo: repo.replace(/\.git$/, ""), ref, pathPrefix };
}

/**
 * Fetch matching files from a GitHub repo branch (read-only).
 * Uses the GitHub git trees API + raw.githubusercontent.com for content.
 */
function githubApiHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ehrtslib-clinical-model-loader",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function loadGitHubRepoTree(
  ref: GitHubRepoRef,
  options?: { fetch?: typeof fetch; maxFiles?: number; githubToken?: string },
): Promise<GitHubTreeLoadResult> {
  const fetchFn = options?.fetch ?? globalThis.fetch;
  const token = options?.githubToken ??
    (typeof Deno !== "undefined" ? Deno.env.get("GITHUB_TOKEN") : undefined);
  const headers = githubApiHeaders(token);
  const branch = ref.ref ?? "master";
  const warnings: string[] = [];
  const prefix = ref.pathPrefix?.replace(/^\/+/, "").replace(/\/$/, "");

  const branchRes = await fetchFn(
    `https://api.github.com/repos/${ref.owner}/${ref.repo}/branches/${encodeURIComponent(branch)}`,
    { headers },
  );
  if (!branchRes.ok) {
    throw new Error(
      `GitHub branch ${ref.owner}/${ref.repo}@${branch}: ${branchRes.status} ${branchRes.statusText}`,
    );
  }
  const branchJson = await branchRes.json() as { commit?: { sha?: string } };
  const treeSha = branchJson.commit?.sha;
  if (!treeSha) throw new Error("Could not resolve branch commit SHA");

  const treeRes = await fetchFn(
    `https://api.github.com/repos/${ref.owner}/${ref.repo}/git/trees/${treeSha}?recursive=1`,
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
    if (item.type !== "blob" || !item.path) continue;
    if (!isClinicalModelPath(item.path)) continue;
    if (prefix && !item.path.startsWith(prefix + "/") && item.path !== prefix) {
      continue;
    }
    paths.push(item.path);
  }
  paths.sort();

  const maxFiles = options?.maxFiles ?? 500;
  if (paths.length > maxFiles) {
    warnings.push(`Truncating to ${maxFiles} of ${paths.length} matching files`);
    paths.length = maxFiles;
  }

  const entries: GitHubFileEntry[] = [];
  let skipped = 0;
  for (const path of paths) {
    const url =
      `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${branch}/${path}`;
    try {
      const res = await fetchFn(url);
      if (!res.ok) {
        warnings.push(`Failed ${path}: HTTP ${res.status}`);
        skipped++;
        continue;
      }
      entries.push({
        path: normalizeClinicalModelPath(path),
        content: await res.text(),
      });
    } catch (e) {
      warnings.push(`Failed ${path}: ${(e as Error).message}`);
      skipped++;
    }
  }

  return {
    entries,
    warnings,
    ref: branch,
    fetched: entries.length,
    skipped,
  };
}
