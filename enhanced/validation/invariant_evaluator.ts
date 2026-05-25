/**
 * Evaluate archetype `rules` / `ARCHETYPE.invariants` against RM instances.
 */

import * as openehr_am from "../openehr_am.ts";
import type { ValidationMessage } from "./template_validator.ts";
import { ArchetypePathResolver } from "./archetype_path_resolver.ts";

export interface InvariantEvalOptions {
  definition?: openehr_am.C_COMPLEX_OBJECT;
}

type EvalValue = boolean | number | string | null | undefined | unknown;

export class InvariantEvaluator {
  private pathResolver: ArchetypePathResolver;

  constructor(options?: InvariantEvalOptions) {
    this.pathResolver = new ArchetypePathResolver({
      definition: options?.definition,
    });
  }

  /**
   * Evaluate all assertions in order (variable declarations accumulate).
   */
  validateInvariants(
    rmInstance: unknown,
    invariants: openehr_am.ASSERTION[],
    definition?: openehr_am.C_COMPLEX_OBJECT,
  ): ValidationMessage[] {
    if (definition) {
      this.pathResolver = new ArchetypePathResolver({ definition });
    }

    const messages: ValidationMessage[] = [];
    const env = new Map<string, EvalValue>();

    for (const assertion of invariants) {
      this.applyVariableDeclarations(rmInstance, assertion, env);

      const expr = assertion.string_expression?.trim();
      if (!expr) continue;

      if (this.isVariableOnlyDeclaration(expr)) continue;

      const tag = assertion.tag;
      const isTaggedRule = Boolean(tag);

      try {
        const ok = assertion.expression
          ? this.evaluateExprTree(rmInstance, assertion.expression, env)
          : this.evaluateString(rmInstance, expr, env);

        if (!ok) {
          messages.push({
            path: "/",
            archetypePath: tag ? `rules:${tag}` : "rules",
            message: tag
              ? `Invariant '${tag}' failed: ${expr}`
              : `Invariant failed: ${expr}`,
            severity: "error",
            constraintType: "invariant",
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        messages.push({
          path: "/",
          archetypePath: tag ? `rules:${tag}` : "rules",
          message: isTaggedRule
            ? `Invariant '${tag}' could not be evaluated: ${msg}`
            : `Invariant could not be evaluated: ${msg}`,
          severity: "warning",
          constraintType: "invariant",
        });
      }
    }

    return messages;
  }

  private isVariableOnlyDeclaration(expr: string): boolean {
    return /^\$[A-Za-z_]\w*\s*:\s*[A-Za-z_][\w.]*\s*:=\s*.+$/is.test(expr) ||
      /^\$[A-Za-z_]\w*\s*:=\s*.+$/is.test(expr);
  }

  private applyVariableDeclarations(
    root: unknown,
    assertion: openehr_am.ASSERTION,
    env: Map<string, EvalValue>,
  ): void {
    const text = assertion.string_expression?.trim();
    if (!text) return;

    const typedDecl =
      /^\$([A-Za-z_]\w*)\s*:\s*[A-Za-z_][\w.]*\s*:=\s*(.+)$/i.exec(text);
    if (typedDecl) {
      env.set(
        `$${typedDecl[1]}`,
        this.evalValue(root, typedDecl[2].trim(), env),
      );
      return;
    }

    const assign = /^\$([A-Za-z_]\w*)\s*:=\s*(.+)$/is.exec(text);
    if (assign) {
      env.set(`$${assign[1]}`, this.evalValue(root, assign[2].trim(), env));
      return;
    }

    for (const v of assertion.variables ?? []) {
      if (!v.name || !v.definition) continue;
      const def = v.definition.trim();
      const inner = def.includes(":=") ? def.split(":=").slice(1).join(":=").trim() : def;
      env.set(v.name, this.evalValue(root, inner, env));
    }
  }

  evaluateString(root: unknown, expr: string, env: Map<string, EvalValue>): boolean {
    return this.toBoolean(this.evalValue(root, expr, env));
  }

  private evalValue(
    root: unknown,
    expr: string,
    env: Map<string, EvalValue>,
  ): EvalValue {
    return this.evalExpression(root, expr.trim(), env);
  }

  private evaluateExprTree(
    root: unknown,
    node: openehr_am.EXPR_ITEM,
    env: Map<string, EvalValue>,
  ): boolean {
    return this.toBoolean(this.evalTreeNode(root, node, env));
  }

  private evalTreeNode(
    root: unknown,
    node: openehr_am.EXPR_ITEM,
    env: Map<string, EvalValue>,
  ): EvalValue {
    if (node instanceof openehr_am.EXPR_ARCHETYPE_REF) {
      const path = node.path ?? (typeof node.item === "string" ? node.item : undefined);
      if (!path) return undefined;
      if (path.toLowerCase().startsWith("exists ")) {
        return this.pathResolver.exists(root, path.replace(/^exists\s+/i, "").trim());
      }
      return this.pathResolver.resolve(root, path);
    }

    if (node instanceof openehr_am.EXPR_BINARY_OPERATOR) {
      const op = this.operatorCode(node);
      const left = node.left_operand
        ? this.evalTreeNode(root, node.left_operand, env)
        : undefined;
      const right = node.right_operand
        ? this.evalTreeNode(root, node.right_operand, env)
        : undefined;
      return this.applyBinary(op, left, right);
    }

    if (node instanceof openehr_am.EXPR_UNARY_OPERATOR) {
      const op = this.operatorCode(node);
      const operand = node.operand
        ? this.evalTreeNode(root, node.operand, env)
        : undefined;
      if (op === "not") return !this.toBoolean(operand);
      if (op === "exists") {
        const path = typeof operand === "string" ? operand : String(operand ?? "");
        return this.pathResolver.exists(root, path);
      }
    }

    return undefined;
  }

  private operatorCode(node: openehr_am.EXPR_OPERATOR): string {
    const raw = node.operator?.value ?? node.operator;
    if (typeof raw === "string") return raw.toLowerCase();
    return "";
  }

  private evalExpression(
    root: unknown,
    expr: string,
    env: Map<string, EvalValue>,
  ): EvalValue {
    expr = this.stripOuterParens(expr);

    if (/^exists\s+/i.test(expr)) {
      const path = expr.replace(/^exists\s+/i, "").trim();
      return this.pathResolver.exists(root, path);
    }

    const forAll = /^for_all\s+(.+?)\s+implies\s+(.+)$/is.exec(expr);
    if (forAll) {
      const collectionPath = forAll[1].trim();
      const condition = forAll[2].trim();
      const collection = this.pathResolver.resolve(root, collectionPath);
      const items = Array.isArray(collection)
        ? collection
        : collection != null
        ? [collection]
        : [];
      if (items.length === 0) return true;
      for (const item of items) {
        if (!this.evaluateString(item, condition, env)) return false;
      }
      return true;
    }

    const thereExists = /^there_exists\s+(.+?)\s+implies\s+(.+)$/is.exec(expr);
    if (thereExists) {
      const collectionPath = thereExists[1].trim();
      const condition = thereExists[2].trim();
      const collection = this.pathResolver.resolve(root, collectionPath);
      const items = Array.isArray(collection)
        ? collection
        : collection != null
        ? [collection]
        : [];
      for (const item of items) {
        if (this.evaluateString(item, condition, env)) return true;
      }
      return false;
    }

    const impliesParts = this.splitAtOperator(expr, "implies");
    if (impliesParts) {
      const left = this.evalExpression(root, impliesParts[0], env);
      if (!this.toBoolean(left)) return true;
      return this.evalExpression(root, impliesParts[1], env);
    }

    for (const op of [" xor ", " or ", " and "] as const) {
      const parts = this.splitAtOperator(expr, op.trim());
      if (parts && parts.length >= 2) {
        const values = [
          this.evalExpression(root, parts[0], env),
          ...parts.slice(1).map((p) => this.evalExpression(root, p, env)),
        ];
        if (op.trim() === "or") return values.some((v) => this.toBoolean(v));
        if (op.trim() === "xor") {
          return values.filter((v) => this.toBoolean(v)).length === 1;
        }
        return values.every((v) => this.toBoolean(v));
      }
    }

    const cmp = this.splitComparison(expr);
    if (cmp) {
      const left = this.evalExpression(root, cmp.left, env);
      const right = this.evalExpression(root, cmp.right, env);
      return this.applyBinary(cmp.op, left, right);
    }

    if (/^not\s+/i.test(expr)) {
      return !this.evaluateString(root, expr.replace(/^not\s+/i, "").trim(), env);
    }

    const memberOf = /^(.+?)\s+member_of\s+(.+)$/is.exec(expr);
    if (memberOf) {
      const left = this.evalExpression(root, memberOf[1].trim(), env);
      const right = this.evalExpression(root, memberOf[2].trim(), env);
      if (Array.isArray(right)) {
        return right.includes(left);
      }
      if (typeof right === "string" && typeof left === "string") {
        return right.split(",").map((s) => s.trim()).includes(left);
      }
      return false;
    }

    if (expr.startsWith("$")) {
      const name = expr.match(/^\$[A-Za-z_]\w*/)?.[0];
      if (name && env.has(name)) return env.get(name);
    }

    if (expr.startsWith("/") || expr.includes("/data[")) {
      return this.pathResolver.resolve(root, expr);
    }

    if (/^(true|false)$/i.test(expr)) return expr.toLowerCase() === "true";

    const num = Number(expr);
    if (!Number.isNaN(num) && expr.match(/^-?\d+(\.\d+)?$/)) return num;

    if ((expr.startsWith('"') && expr.endsWith('"')) ||
      (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }

    throw new Error(`Unsupported expression: ${expr}`);
  }

  private stripOuterParens(expr: string): string {
    let e = expr.trim();
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

  private splitAtOperator(expr: string, op: string): string[] | undefined {
    const lower = expr.toLowerCase();
    const needle = op.toLowerCase();
    let depth = 0;
    for (let i = 0; i <= expr.length - needle.length; i++) {
      const c = expr[i];
      if (c === "(") depth++;
      else if (c === ")") depth--;
      else if (
        depth === 0 &&
        lower.slice(i, i + needle.length) === needle &&
        (i === 0 || /\s/.test(expr[i - 1])) &&
        (i + needle.length >= expr.length || /\s/.test(expr[i + needle.length]))
      ) {
        return [
          expr.slice(0, i).trim(),
          expr.slice(i + needle.length).trim(),
        ];
      }
    }
    return undefined;
  }

  private splitComparison(
    expr: string,
  ): { op: string; left: string; right: string } | undefined {
    for (const op of ["!=", "/=", ">=", "<=", "=", ">", "<"]) {
      const idx = this.findOperator(expr, op);
      if (idx > 0) {
        return {
          op,
          left: expr.slice(0, idx).trim(),
          right: expr.slice(idx + op.length).trim(),
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
        if (op === "=" && i > 0 && text[i - 1] === ":") continue;
        if (op === ">" && i + 1 < text.length && text[i + 1] === "=") continue;
        if (op === "<" && i + 1 < text.length && text[i + 1] === "=") continue;
        return i;
      }
    }
    return -1;
  }

  private applyBinary(op: string, left: EvalValue, right: EvalValue): boolean {
    const ln = this.toNumber(left);
    const rn = this.toNumber(right);
    const bothNumeric = ln !== null && rn !== null;

    switch (op) {
      case "=":
        if (bothNumeric) return ln === rn;
        return left === right;
      case "!=":
      case "/=":
        if (bothNumeric) return ln !== rn;
        return left !== right;
      case ">=":
        return bothNumeric && ln! >= rn!;
      case "<=":
        return bothNumeric && ln! <= rn!;
      case ">":
        return bothNumeric && ln! > rn!;
      case "<":
        return bothNumeric && ln! < rn!;
      case "and":
        return this.toBoolean(left) && this.toBoolean(right);
      case "or":
        return this.toBoolean(left) || this.toBoolean(right);
      case "xor":
        return this.toBoolean(left) !== this.toBoolean(right);
      case "implies":
        return !this.toBoolean(left) || this.toBoolean(right);
      case "member_of":
        if (Array.isArray(right)) return right.includes(left);
        return false;
      default:
        throw new Error(`Unknown operator: ${op}`);
    }
  }

  private toNumber(v: EvalValue): number | null {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "object" && v !== null && "magnitude" in v) {
      const m = (v as { magnitude?: unknown }).magnitude;
      if (typeof m === "number") return m;
    }
    if (typeof v === "string" && v.match(/^-?\d+(\.\d+)?$/)) return Number(v);
    return null;
  }

  private toBoolean(v: EvalValue): boolean {
    if (typeof v === "boolean") return v;
    if (v === null || v === undefined) return false;
    if (typeof v === "number") return v !== 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return true;
    if (typeof v === "string") {
      if (/^(true|false)$/i.test(v)) return v.toLowerCase() === "true";
      return v.length > 0;
    }
    return Boolean(v);
  }
}
