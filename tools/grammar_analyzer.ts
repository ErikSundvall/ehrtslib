/**
 * Grammar Analysis Tool
 * 
 * Analyzes ANTLR grammar files to extract parser rules and guide implementation.
 * This tool helps understand the grammar structure without needing full ANTLR runtime.
 */

interface GrammarRule {
  name: string;
  definition: string;
  alternatives?: string[];
  tokens?: string[];
}

/**
 * Simple ANTLR grammar analyzer
 * Extracts rule names and their basic structure
 */
export class GrammarAnalyzer {
  private rules: Map<string, GrammarRule> = new Map();

  /**
   * Parse a grammar file and extract rules
   */
  parseGrammar(grammarText: string): Map<string, GrammarRule> {
    this.rules.clear();

    // Extract grammar rules (rule_name : definition ;)
    const rulePattern = /(\w+)\s*:\s*([^;]+);/g;
    let match;

    while ((match = rulePattern.exec(grammarText)) !== null) {
      const ruleName = match[1];
      const definition = match[2].trim();

      // Extract alternatives (separated by |)
      const alternatives = definition.split('|').map(alt => alt.trim());

      // Extract tokens (UPPERCASE_WORDS)
      const tokens = definition.match(/[A-Z_]+[A-Z0-9_]*/g) || [];

      this.rules.set(ruleName, {
        name: ruleName,
        definition,
        alternatives,
        tokens: [...new Set(tokens)], // unique tokens
      });
    }

    return this.rules;
  }

  /**
   * Get a specific rule
   */
  getRule(name: string): GrammarRule | undefined {
    return this.rules.get(name);
  }

  /**
   * Get all rules
   */
  getAllRules(): GrammarRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Print rule structure in human-readable format
   */
  printRule(ruleName: string): string {
    const rule = this.rules.get(ruleName);
    if (!rule) return `Rule ${ruleName} not found`;

    let output = `\n=== ${rule.name} ===\n`;
    output += `Definition: ${rule.definition}\n`;

    if (rule.alternatives && rule.alternatives.length > 1) {
      output += `\nAlternatives:\n`;
      rule.alternatives.forEach((alt, i) => {
        output += `  ${i + 1}. ${alt}\n`;
      });
    }

    if (rule.tokens && rule.tokens.length > 0) {
      output += `\nTokens used: ${rule.tokens.join(', ')}\n`;
    }

    return output;
  }

  /**
   * Generate test case skeleton from rule
   */
  generateTestSkeleton(ruleName: string): string {
    const rule = this.rules.get(ruleName);
    if (!rule) return '';

    let testCode = `\nDeno.test("Parser - ${ruleName}", () => {\n`;
    testCode += `  // Rule: ${rule.definition}\n`;

    if (rule.alternatives && rule.alternatives.length > 1) {
      rule.alternatives.forEach((alt, i) => {
        testCode += `  // Alternative ${i + 1}: ${alt}\n`;
      });
    }

    testCode += `  // TODO: Implement test case\n`;
    testCode += `});\n`;

    return testCode;
  }

  /**
   * Print all rules in grammar
   */
  printAllRules(): string {
    let output = '\n=== Grammar Rules ===\n';
    this.rules.forEach(rule => {
      output += `\n${rule.name}: ${rule.definition.substring(0, 80)}${rule.definition.length > 80 ? '...' : ''}\n`;
    });
    return output;
  }
}

// Example usage
if (import.meta.main) {
  const analyzer = new GrammarAnalyzer();

  // Load and analyze Adl.g4
  const adlGrammar = await Deno.readTextFile('./grammars/Adl.g4');
  const adlRules = analyzer.parseGrammar(adlGrammar);

  console.log('=== ADL Grammar Analysis ===');
  console.log(`Found ${adlRules.size} rules`);
  console.log(analyzer.printAllRules());

  // Print specific rules
  console.log(analyzer.printRule('archetype'));
  console.log(analyzer.printRule('definitionSection'));

  // Generate test skeleton
  console.log('\n=== Test Skeleton Example ===');
  console.log(analyzer.generateTestSkeleton('archetype'));

  // Analyze cADL grammar
  console.log('\n\n=== cADL Grammar Analysis ===');
  const cadlGrammar = await Deno.readTextFile('./grammars/cadl.g4');
  analyzer.parseGrammar(cadlGrammar);
  console.log(`Found ${analyzer.getAllRules().length} rules`);
  console.log(analyzer.printRule('c_complex_object'));
  console.log(analyzer.printRule('c_attribute'));
}
