/**
 * GitHub Contents API helpers for reading and committing a single file.
 * Designed for browser use (api.github.com supports CORS).
 */

import type { GitHubFileRef } from "./github_template_closure.ts";

export interface GitHubContentsFile {
  path: string;
  sha: string;
  content: string;
  encoding: "base64" | "utf-8";
  htmlUrl?: string;
}

export interface GitHubCommitFileInput {
  ref: GitHubFileRef;
  content: string;
  message: string;
  /** Blob SHA of the file being replaced (required for updates). */
  sha: string;
  token: string;
  fetch?: typeof fetch;
}

export interface GitHubCommitFileResult {
  contentSha: string;
  commitSha: string;
  htmlUrl?: string;
}

function apiHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ehrtslib-taaat",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** UTF-8-safe Base64 for the Contents API. */
export function encodeUtf8Base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function decodeUtf8Base64(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function contentsUrl(ref: GitHubFileRef): string {
  const path = ref.path.split("/").map(encodeURIComponent).join("/");
  const q = new URLSearchParams({ ref: ref.ref });
  return `https://api.github.com/repos/${ref.owner}/${ref.repo}/contents/${path}?${q}`;
}

/** GET file metadata + decoded content from the Contents API. */
export async function getGitHubFileContents(
  ref: GitHubFileRef,
  options?: { token?: string; fetch?: typeof fetch },
): Promise<GitHubContentsFile> {
  const fetchFn = options?.fetch ?? globalThis.fetch;
  const res = await fetchFn(contentsUrl(ref), {
    headers: apiHeaders(options?.token),
  });
  if (!res.ok) {
    throw new Error(
      `GitHub contents ${ref.owner}/${ref.repo}/${ref.path}@${ref.ref}: ${res.status} ${res.statusText}`,
    );
  }
  const json = await res.json() as {
    path?: string;
    sha?: string;
    content?: string;
    encoding?: string;
    html_url?: string;
  };
  if (!json.sha || json.content == null) {
    throw new Error("GitHub contents response missing sha/content");
  }
  const encoding = json.encoding === "base64" ? "base64" : "utf-8";
  const content = encoding === "base64"
    ? decodeUtf8Base64(json.content)
    : json.content;
  return {
    path: json.path ?? ref.path,
    sha: json.sha,
    content,
    encoding,
    htmlUrl: json.html_url,
  };
}

/** Create or update a file (single-file commit) via the Contents API. */
export async function commitGitHubFile(
  input: GitHubCommitFileInput,
): Promise<GitHubCommitFileResult> {
  const fetchFn = input.fetch ?? globalThis.fetch;
  const path = input.ref.path.split("/").map(encodeURIComponent).join("/");
  const url =
    `https://api.github.com/repos/${input.ref.owner}/${input.ref.repo}/contents/${path}`;
  const res = await fetchFn(url, {
    method: "PUT",
    headers: {
      ...apiHeaders(input.token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: input.message,
      content: encodeUtf8Base64(input.content),
      sha: input.sha,
      branch: input.ref.ref,
    }),
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json() as { message?: string };
      if (err.message) detail = `${detail}: ${err.message}`;
    } catch {
      // ignore
    }
    throw new Error(`GitHub commit failed: ${detail}`);
  }
  const json = await res.json() as {
    content?: { sha?: string; html_url?: string };
    commit?: { sha?: string };
  };
  return {
    contentSha: json.content?.sha ?? "",
    commitSha: json.commit?.sha ?? "",
    htmlUrl: json.content?.html_url,
  };
}

/** Validate a token and return the login name. */
export async function getGitHubAuthenticatedUser(
  token: string,
  options?: { fetch?: typeof fetch },
): Promise<{ login: string }> {
  const fetchFn = options?.fetch ?? globalThis.fetch;
  const res = await fetchFn("https://api.github.com/user", {
    headers: apiHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`GitHub auth failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json() as { login?: string };
  if (!json.login) throw new Error("GitHub /user response missing login");
  return { login: json.login };
}
