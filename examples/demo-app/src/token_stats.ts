/**
 * Demo-only token counting (gpt-tokenizer / o200k_base). Not part of ehrtslib core.
 */

export const DEMO_TOKEN_ENCODING = "o200k_base" as const;
export const DEMO_TOKEN_ENCODING_LABEL =
  `BPE tokens (${DEMO_TOKEN_ENCODING}, raw text; not billing/chat wrappers)`;

type CountTokensFn = (
  text: string,
  options?: { disallowedSpecial?: Set<string> },
) => number;

/** Match gpt-tokenizer default: no special-token recognition; substring literals are BPE-split. */
export const DEMO_TOKEN_COUNT_OPTIONS: { disallowedSpecial: Set<string> } = {
  disallowedSpecial: new Set(),
};

let counter: CountTokensFn | null = null;

export async function countDemoTokens(text: string): Promise<number> {
  if (!text) return 0;
  if (!counter) {
    const mod = await import("gpt-tokenizer/encoding/o200k_base");
    counter = mod.countTokens as CountTokensFn;
  }
  return counter(text, DEMO_TOKEN_COUNT_OPTIONS);
}
