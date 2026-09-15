import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  commitGitHubFile,
  decodeUtf8Base64,
  encodeUtf8Base64,
  getGitHubAuthenticatedUser,
  getGitHubFileContents,
} from "../../../parser/github_contents.ts";
import type { GitHubFileRef } from "../../../parser/github_template_closure.ts";

const ref: GitHubFileRef = {
  owner: "acme",
  repo: "models",
  ref: "main",
  path: "local/Foo.t.json",
};

Deno.test("encodeUtf8Base64 round-trips unicode", () => {
  const sample = "Näsan — 鼻";
  assertEquals(decodeUtf8Base64(encodeUtf8Base64(sample)), sample);
});

Deno.test("getGitHubFileContents decodes base64 payload", async () => {
  const body = {
    path: ref.path,
    sha: "abc123",
    encoding: "base64",
    content: encodeUtf8Base64('{"ok":true}'),
    html_url: "https://github.com/acme/models/blob/main/local/Foo.t.json",
  };
  const fetchMock: typeof fetch = async () =>
    new Response(JSON.stringify(body), { status: 200 });
  const file = await getGitHubFileContents(ref, { fetch: fetchMock });
  assertEquals(file.sha, "abc123");
  assertEquals(file.content, '{"ok":true}');
});

Deno.test("commitGitHubFile sends PUT with message and sha", async () => {
  let method = "";
  let payload: Record<string, unknown> = {};
  const fetchMock: typeof fetch = async (_url, init) => {
    method = init?.method ?? "GET";
    payload = JSON.parse(String(init?.body ?? "{}"));
    return new Response(
      JSON.stringify({
        content: { sha: "newsha", html_url: "https://example.com" },
        commit: { sha: "commitsha" },
      }),
      { status: 200 },
    );
  };
  const result = await commitGitHubFile({
    ref,
    content: '{"x":1}',
    message: "test commit",
    sha: "oldsha",
    token: "tok",
    fetch: fetchMock,
  });
  assertEquals(method, "PUT");
  assertEquals(payload.message, "test commit");
  assertEquals(payload.sha, "oldsha");
  assertEquals(payload.branch, "main");
  assertEquals(result.contentSha, "newsha");
  assertEquals(result.commitSha, "commitsha");
});

Deno.test("getGitHubAuthenticatedUser surfaces HTTP errors", async () => {
  const fetchMock: typeof fetch = async () =>
    new Response("nope", { status: 401, statusText: "Unauthorized" });
  await assertRejects(
    () => getGitHubAuthenticatedUser("bad", { fetch: fetchMock }),
    Error,
    "401",
  );
});
