import { assert, assertEquals } from "@std/assert";
import { dirname, fromFileUrl, join } from "@std/path";

const indexHtml = await Deno.readTextFile(
  join(dirname(fromFileUrl(import.meta.url)), "../public/index.html"),
);

Deno.test("output tab buttons exist for ZipEHR and OPT HTML5", () => {
  assert(indexHtml.includes('data-tab="zipehr"'));
  assert(indexHtml.includes('data-tab="opt-html5"'));
  assert(indexHtml.includes('id="output-zipehr"'));
  assert(indexHtml.includes('id="output-opt-html5"'));
});

Deno.test("optional output tabs start hidden until checkbox enables them", () => {
  const optMatch = indexHtml.match(
    /<button[^>]*data-tab="opt-html5"[^>]*>/,
  );
  assert(optMatch);
  assertEquals(optMatch![0].includes("hidden"), true);
});
