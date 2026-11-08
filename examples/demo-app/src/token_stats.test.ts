import { assert, assertEquals, assertThrows } from "jsr:@std/assert";
import {
  countDemoTokens,
  DEMO_TOKEN_COUNT_OPTIONS,
  DEMO_TOKEN_ENCODING,
} from "./token_stats.ts";
import { countTokens, EndOfText, encode } from "gpt-tokenizer/encoding/o200k_base";

Deno.test("demo token counter uses o200k_base literal BPE (not chat special tokens)", async () => {
  assertEquals(DEMO_TOKEN_ENCODING, "o200k_base");
  assertEquals(DEMO_TOKEN_COUNT_OPTIONS.disallowedSpecial.size, 0);

  const embedded = "Hello <|endoftext|> clinical note — 145 mm[Hg]";
  const expectedEmbedded = countTokens(embedded, DEMO_TOKEN_COUNT_OPTIONS);
  assertEquals(await countDemoTokens(embedded), expectedEmbedded);
  assertEquals(expectedEmbedded, encode(embedded, DEMO_TOKEN_COUNT_OPTIONS).length);

  const onlySpecial = EndOfText;
  const expectedOnly = countTokens(onlySpecial, DEMO_TOKEN_COUNT_OPTIONS);
  assertEquals(await countDemoTokens(onlySpecial), expectedOnly);
  assertEquals(expectedOnly, 7);

  assertThrows(
    () => countTokens(onlySpecial),
    Error,
    "Disallowed special token",
  );

  assertEquals(countTokens(onlySpecial, { allowedSpecial: "all" }), 1);
});
