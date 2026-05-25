#!/usr/bin/env -S deno run --allow-read
/**
 * Stub: generate parser/tokenizer scaffolding from grammars/*.g4 (PRD §5.3.2 hybrid).
 *
 * Full ANTLR integration is not wired in this repo yet. This script documents
 * the intended workflow and validates that grammar files are present.
 */

const GRAMMARS = ["grammars/Adl.g4", "grammars/cadl.g4", "grammars/odin.g4"];

console.log("ehrtslib ANTLR hybrid stub");
console.log("Hand-written parsers: enhanced/parser/adl2_*.ts, cadl_parser.ts, odin_parser.ts");
console.log("\nReference grammars:");

for (const path of GRAMMARS) {
  try {
    const stat = await Deno.stat(path);
    console.log(`  ✓ ${path} (${stat.size} bytes)`);
  } catch {
    console.log(`  ✗ ${path} missing`);
  }
}

console.log(`
Next steps (not automated here):
  1. Run ANTLR4 on grammars/ with TypeScript target
  2. Diff generated lexer/parser against enhanced/parser/
  3. Port missing token types and production handlers incrementally
`);
