/**
 * RM init coercion works when ehrtslib is imported over http(s) (jsDelivr,
 * deno.land), not only from local files: no `createRequire` at module load.
 */
import { assertEquals } from "@std/assert";

const root = new URL("../../", import.meta.url);

/** Serve the repo's .ts files the way a CDN does. */
async function serveRepoFile(req: Request): Promise<Response> {
  const path = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, "");
  if (path.includes("..")) return new Response("bad path", { status: 400 });
  try {
    const body = await Deno.readTextFile(new URL(path, root));
    return new Response(body, { headers: { "content-type": "application/typescript; charset=utf-8" } });
  } catch {
    return new Response("not found", { status: 404 });
  }
}

Deno.test("openehr_rm.ts imported over http: init objects and terse strings coerce", async () => {
  const server = Deno.serve(
    { port: 0, hostname: "127.0.0.1", onListen() {} },
    serveRepoFile,
  );
  const base = `http://127.0.0.1:${server.addr.port}`;
  const script = `
    const rm = await import("${base}/openehr_rm.ts");
    const text = new rm.DV_CODED_TEXT({ value: "Sitting", defining_code: "local::at1001" });
    const entry = Object.assign(new rm.OBSERVATION(), { language: "ISO_639-1::en" });
    const element = new rm.ELEMENT();
    element.value = { _type: "DV_TEXT", value: "x" };
    console.log(JSON.stringify([
      text.defining_code?.code_string,
      text.defining_code?.terminology_id?.value,
      entry.language?.constructor?.name,
      entry.language?.code_string,
      element.value?.constructor?.name,
    ]));
  `;
  try {
    const out = await new Deno.Command(Deno.execPath(), {
      args: ["run", "--no-check", "--quiet", `--allow-import=127.0.0.1:${server.addr.port}`, "-"],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    }).spawn();
    const writer = out.stdin.getWriter();
    await writer.write(new TextEncoder().encode(script));
    await writer.close();
    const { code, stdout, stderr } = await out.output();
    const err = new TextDecoder().decode(stderr);
    assertEquals(code, 0, err);
    assertEquals(JSON.parse(new TextDecoder().decode(stdout).trim()), [
      "at1001",
      "local",
      "CODE_PHRASE",
      "en",
      "DV_TEXT",
    ]);
  } finally {
    await server.shutdown();
  }
});
