/**
 * Demo-only token counting (gpt-tokenizer / o200k_base). Not part of ehrtslib core.
 */

export const DEMO_TOKEN_ENCODING = "o200k_base" as const;
export const DEMO_TOKEN_ENCODING_LABEL =
  `BPE tokens (${DEMO_TOKEN_ENCODING}, raw text; not billing/chat wrappers)`;

type EncodeOptions = { allowedSpecial?: "all" };

let counter: ((text: string, options?: EncodeOptions) => number) | null = null;

export async function countDemoTokens(text: string): Promise<number> {
  if (!text) return 0;
  if (!counter) {
    const mod = await import("gpt-tokenizer/encoding/o200k_base");
    counter = mod.countTokens as typeof counter;
  }
  // Count literal clinical text including strings that look like chat control tokens.
  return counter(text, { allowedSpecial: "all" });
}
