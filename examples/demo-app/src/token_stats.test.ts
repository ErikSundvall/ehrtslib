import { assert, assertEquals } from "jsr:@std/assert";
import { countDemoTokens, DEMO_TOKEN_ENCODING } from "./token_stats.ts";

Deno.test("demo token counter uses o200k_base and counts literal special-token-like text", async () => {
  assertEquals(DEMO_TOKEN_ENCODING, "o200k_base");
  const text = "Hello <|endoftext|> clinical note — 145 mm[Hg]";
  const n = await countDemoTokens(text);
  assert(n > 0);
  assert(n < text.length);
});
