/**
 * ADL2 rules section parser.
 *
 * Parses the top-level `rules` block into `ASSERTION` instances (tag, variables,
 * string_expression). Evaluation: `enhanced/validation/invariant_evaluator.ts`.
 */

import { Token, TokenType } from "./adl2_tokenizer.ts";
import * as openehr_am from "../openehr_am.ts";
import * as openehr_base from "../openehr_base.ts";

const RULE_TYPE_NAMES = new Set([
  "Integer",
  "Real",
  "Boolean",
  "String",
  "Object_ref",
  "Date",
  "Time",
  "Date_time",
  "Duration",
]);

export interface RulesParseResult {
  assertions: openehr_am.ASSERTION[];
  warnings: string[];
}

export class RulesParser {
  private tokens: Token[];
  private position = 0;
  private warnings: string[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens.filter((t) =>
      t.type !== TokenType.COMMENT && t.type !== TokenType.WHITESPACE
    );
  }

  parse(): RulesParseResult {
    const source = this.tokensToSource();
    const lines = this.splitStatements(source);
    const assertions: openehr_am.ASSERTION[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("--")) continue;
      try {
        assertions.push(this.parseStatement(trimmed));
      } catch (e) {
        this.warnings.push(
          `Rules statement parse error: ${
            e instanceof Error ? e.message : String(e)
          } — stored as raw text`,
        );
        const fallback = new openehr_am.ASSERTION();
        fallback.string_expression = trimmed;
        assertions.push(fallback);
      }
    }

    return { assertions, warnings: this.warnings };
  }

  /** Reconstruct source with newlines at token line boundaries. */
  private tokensToSource(): string {
    const byLine = new Map<number, Token[]>();
    for (const t of this.tokens) {
      if (t.type === TokenType.EOF) break;
      const line = byLine.get(t.line) ?? [];
      line.push(t);
      byLine.set(t.line, line);
    }
    const lines: string[] = [];
    for (const lineNo of [...byLine.keys()].sort((a, b) => a - b)) {
      lines.push(this.joinLineTokens(byLine.get(lineNo)!));
    }
    return lines.join("\n");
  }

  private joinLineTokens(tokens: Token[]): string {
    let out = "";
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (i > 0 && this.needsSpaceBetween(tokens[i - 1], t)) {
        out += " ";
      }
      out += this.tokenText(t);
    }
    return out;
  }

  private needsSpaceBetween(a: Token, b: Token): boolean {
    const keywordAfterPath = new Set([
      TokenType.IMPLIES,
      TokenType.FOR_ALL,
      TokenType.THERE_EXISTS,
      TokenType.EXISTS,
      TokenType.AND,
      TokenType.OR,
      TokenType.XOR,
      TokenType.NOT,
    ]);
    if (keywordAfterPath.has(b.type)) return true;

    const pathGlue = new Set([
      TokenType.LBRACKET,
      TokenType.RBRACKET,
      TokenType.SLASH,
      TokenType.DOT,
    ]);
    if (pathGlue.has(b.type)) return false;
    if (a.type === TokenType.VARIABLE && b.type === TokenType.COLON) return false;
    if (a.type === TokenType.COLON && b.type === TokenType.ASSIGN) return false;
    if (a.type === TokenType.IDENTIFIER && b.type === TokenType.LBRACKET) {
      return false;
    }
    if (
      a.type === TokenType.LBRACKET &&
      (b.type === TokenType.IDENTIFIER || b.type === TokenType.INTEGER)
    ) {
      return false;
    }
    if (a.type === TokenType.IDENTIFIER && b.type === TokenType.RBRACKET) {
      return false;
    }
    if (a.type === TokenType.RBRACKET && b.type === TokenType.SLASH) return false;
    if (
      a.type === TokenType.SLASH &&
      (b.type === TokenType.IDENTIFIER || b.type === TokenType.VARIABLE)
    ) {
      return false;
    }
    if (pathGlue.has(a.type) && b.type !== TokenType.COLON) return false;
    return true;
  }

  private tokenText(t: Token): string {
    switch (t.type) {
      case TokenType.STRING:
        return `"${t.value}"`;
      case TokenType.AT_CODE:
        return `[${t.value}]`;
      case TokenType.ASSIGN:
        return ":=";
      case TokenType.NOT_EQUALS:
        return t.value;
      default:
        return t.value;
    }
  }

  /** Group physical lines into logical statements (handles indented continuations). */
  private splitStatements(source: string): string[] {
    const physical = source.split(/\r?\n/);
    const statements: string[] = [];
    let current = "";

    for (const raw of physical) {
      const line = raw.trim();
      if (!line || line.startsWith("--")) continue;

      if (this.isStatementStart(line) && current) {
        statements.push(current.trim());
        current = line;
      } else if (!current) {
        current = line;
      } else {
        current += " " + line;
      }
    }
    if (current.trim()) statements.push(current.trim());
    return statements;
  }

  private isStatementStart(line: string): boolean {
    if (/^\$[A-Za-z_]\w*/.test(line)) return true;
    if (/^for_all\b/i.test(line)) return true;
    if (/^there_exists\b/i.test(line)) return true;
    const tagged = /^([A-Za-z_][\w]*)\s*:/.exec(line);
    if (!tagged) return false;
    const after = line.slice(tagged[0].length).trim();
    const typeMatch = /^([A-Za-z_][\w]*)\s*:=/.exec(after);
    if (typeMatch && RULE_TYPE_NAMES.has(typeMatch[1])) return true;
    return true;
  }

  private parseStatement(text: string): openehr_am.ASSERTION {
    const assertion = new openehr_am.ASSERTION();

    const varDecl =
      /^\$([A-Za-z_]\w*)\s*:\s*([A-Za-z_][\w.]*)\s*:=\s*(.+)$/i.exec(text);
    if (varDecl) {
      const v = new openehr_am.ASSERTION_VARIABLE();
      v.name = `$${varDecl[1]}`;
      v.definition = `${varDecl[2]} := ${varDecl[3].trim()}`;
      assertion.variables = [v];
      assertion.string_expression = text;
      return assertion;
    }

    const varAssign = /^\$([A-Za-z_]\w*)\s*:=\s*(.+)$/is.exec(text);
    if (varAssign) {
      assertion.string_expression = text;
      return assertion;
    }

    const quantified =
      /^(for_all|there_exists)\s*(.+?)\s+implies\s*(.+)$/is.exec(text.trim());
    if (quantified) {
      assertion.string_expression = text;
      assertion.expression = this.quantified(
        quantified[1].toLowerCase() as "for_all" | "there_exists",
        quantified[2],
        quantified[3],
      );
      return assertion;
    }

    const tagged = /^([A-Za-z_][\w]*)\s*:\s*(.+)$/is.exec(text);
    if (tagged && !RULE_TYPE_NAMES.has(tagged[1])) {
      assertion.tag = tagged[1];
      assertion.string_expression = tagged[2].trim();
      assertion.expression = this.parseExpression(assertion.string_expression);
      return assertion;
    }

    assertion.string_expression = text;
    assertion.expression = this.parseExpression(text);
    return assertion;
  }

  private pathOrExprLeaf(path: string): openehr_am.EXPR_ARCHETYPE_REF {
    const ref = new openehr_am.EXPR_ARCHETYPE_REF();
    ref.reference_type = "attribute";
    ref.path = path;
    ref.item = path;
    return ref;
  }

  /**
   * Build a shallow expression tree for common operators; falls back to undefined.
   */
  private parseExpression(text: string): openehr_am.EXPR_ITEM | undefined {
    const trimmed = text.trim();

    const forAll = /^for_all\s*(.+?)\s+implies\s*(.+)$/is.exec(trimmed);
    if (forAll) {
      return this.quantified("for_all", forAll[1], forAll[2]);
    }
    const thereExists = /^there_exists\s*(.+?)\s+implies\s*(.+)$/is.exec(trimmed);
    if (thereExists) {
      return this.quantified("there_exists", thereExists[1], thereExists[2]);
    }

    if (trimmed.startsWith("(")) {
      const inner = this.stripOuterParens(trimmed);
      if (inner !== trimmed) {
        return this.parseExpression(inner);
      }
    }

    const impliesParts = this.splitOutsideParens(trimmed, "implies");
    if (impliesParts && impliesParts.length === 2) {
      return this.binary("implies", impliesParts[0], impliesParts[1]);
    }
    for (const op of [" or ", " xor ", " and "] as const) {
      const parts = this.splitOutsideParens(trimmed, op.trim());
      if (parts && parts.length >= 2) {
        return this.binary(op.trim(), parts[0], parts.slice(1).join(op));
      }
    }
    const eq = this.splitComparison(trimmed);
    if (eq) {
      return this.binary(eq.op, eq.left, eq.right);
    }
    if (/^exists\s+/i.test(trimmed)) {
      const path = trimmed.replace(/^exists\s+/i, "").trim();
      const leaf = this.pathOrExprLeaf(path);
      leaf.reference_type = "attribute";
      return leaf;
    }
    if (/^not\s+/i.test(trimmed)) {
      const inner = trimmed.replace(/^not\s+/i, "").trim();
      const unary = new openehr_am.EXPR_UNARY_OPERATOR();
      unary.operator = openehr_am.OPERATOR_KIND.from("not");
      unary.operand = this.parseExpression(inner) ?? this.pathOrExprLeaf(inner);
      return unary;
    }
    const memberOf = /^(.+?)\s+member_of\s+(.+)$/is.exec(trimmed);
    if (memberOf) {
      return this.binary("member_of", memberOf[1], memberOf[2]);
    }
    if (trimmed.startsWith("/") || trimmed.includes("/data[")) {
      return this.pathOrExprLeaf(trimmed);
    }
    if (/^\$[A-Za-z_]\w*$/.test(trimmed)) {
      return this.pathOrExprLeaf(trimmed);
    }
    return undefined;
  }

  private stripOuterParens(text: string): string {
    let e = text.trim();
    while (e.startsWith("(") && e.endsWith(")")) {
      let depth = 0;
      let wrapped = true;
      for (let i = 0; i < e.length; i++) {
        if (e[i] === "(") depth++;
        else if (e[i] === ")") depth--;
        if (depth === 0 && i < e.length - 1) {
          wrapped = false;
          break;
        }
      }
      if (!wrapped) break;
      e = e.slice(1, -1).trim();
    }
    return e;
  }

  private quantified(
    op: "for_all" | "there_exists",
    collectionPath: string,
    condition: string,
  ): openehr_am.EXPR_BINARY_OPERATOR {
    const bin = new openehr_am.EXPR_BINARY_OPERATOR();
    bin.operator = openehr_am.OPERATOR_KIND.from(op);
    bin.left_operand = this.pathOrExprLeaf(collectionPath.trim());
    bin.right_operand = this.parseExpression(condition.trim()) ??
      this.pathOrExprLeaf(condition.trim());
    return bin;
  }

  private splitComparison(
    text: string,
  ): { op: string; left: string; right: string } | undefined {
    for (const op of ["=", "/=", "!=", ">=", "<=", ">", "<"]) {
      const idx = this.findOperator(text, op);
      if (idx > 0) {
        return {
          op,
          left: text.slice(0, idx).trim(),
          right: text.slice(idx + op.length).trim(),
        };
      }
    }
    return undefined;
  }

  private findOperator(text: string, op: string): number {
    let depth = 0;
    for (let i = 0; i <= text.length - op.length; i++) {
      const c = text[i];
      if (c === "(") depth++;
      else if (c === ")") depth--;
      else if (depth === 0 && text.slice(i, i + op.length) === op) {
        if (op === "=") {
          if (i > 0 && (text[i - 1] === ">" || text[i - 1] === "<" || text[i - 1] === "!")) {
            continue;
          }
          if (i + 1 < text.length && text[i + 1] === "=") continue;
        }
        return i;
      }
    }
    return -1;
  }

  private splitOutsideParens(
    text: string,
    sep: string,
  ): string[] | undefined {
    const lower = text.toLowerCase();
    const needle = sep.toLowerCase();
    let depth = 0;
    for (let i = 0; i <= text.length - needle.length; i++) {
      const c = text[i];
      if (c === "(") depth++;
      else if (c === ")") depth--;
      else if (
        depth === 0 &&
        lower.slice(i, i + needle.length) === needle &&
        (i === 0 || /\s/.test(text[i - 1])) &&
        (i + needle.length >= text.length || /\s/.test(text[i + needle.length]))
      ) {
        return [
          text.slice(0, i).trim(),
          text.slice(i + needle.length).trim(),
        ];
      }
    }
    return undefined;
  }

  private binary(
    op: string,
    leftText: string,
    rightText: string,
  ): openehr_am.EXPR_BINARY_OPERATOR {
    const bin = new openehr_am.EXPR_BINARY_OPERATOR();
    bin.operator = openehr_am.OPERATOR_KIND.from(op);
    bin.left_operand = this.parseExpression(leftText) ??
      this.pathOrExprLeaf(leftText);
    bin.right_operand = this.parseExpression(rightText) ??
      this.pathOrExprLeaf(rightText);
    return bin;
  }

}
