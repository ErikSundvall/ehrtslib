/**
 * Evaluate a subset of openEHR Expression Language used by BMM class invariants.
 *
 * Expressions that use an operator or call this module does not implement
 * return `undefined` (skip). They are not reported as violations.
 */

import { OpenEHRTerminologyService } from "../term/terminology_service.ts";
import { BMM_CONSTANTS } from "./bmm_invariants.generated.ts";

const UNSUPPORTED = Symbol("unsupported");

type Val = unknown;

interface NameExpr {
  t: "name";
  v: string;
}
interface CallExpr {
  t: "call";
  x: Expr;
  args: Expr[];
}
interface MemberExpr {
  t: "member";
  x: Expr;
  name: string;
}
type Expr =
  | { t: "void" }
  | { t: "bool"; v: boolean }
  | { t: "str"; v: string }
  | { t: "num"; v: number }
  | NameExpr
  | { t: "not"; x: Expr }
  | { t: "binop"; op: string; l: Expr; r: Expr }
  | MemberExpr
  | CallExpr;

const astCache = new Map<string, Expr | typeof UNSUPPORTED>();

/** `true` / `false` when the expression is decided, otherwise skip. */
export function evaluateBmmExpression(
  expression: string,
  target: unknown,
): boolean | undefined {
  const text = expression.trim();
  if (!text) return undefined;
  let ast = astCache.get(text);
  if (ast === undefined) {
    ast = parseExpression(text);
    astCache.set(text, ast);
  }
  if (ast === UNSUPPORTED) return undefined;
  const value = evalExpr(ast, target);
  if (value === UNSUPPORTED || typeof value !== "boolean") return undefined;
  return value;
}

/** Identifiers that name attributes, for overlapping hand-written constraints. */
export function attributeNamesInExpression(expression: string): string[] {
  const names: string[] = [];
  const re = /[A-Za-z_][A-Za-z0-9_]*/g;
  const skip = new Set([
    "and",
    "or",
    "xor",
    "not",
    "implies",
    "then",
    "Void",
    "void",
    "True",
    "False",
    "true",
    "false",
    "terminology",
    "code_set",
    "is_null",
    "is_empty",
    "is_equal",
    "has_code",
    "has_code_for_group_id",
  ]);
  for (const match of expression.matchAll(re)) {
    const name = match[0];
    if (skip.has(name) || name in BMM_CONSTANTS) continue;
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

function parseExpression(text: string): Expr | typeof UNSUPPORTED {
  try {
    const parser = new Parser(tokenize(text));
    const expr = parser.parseImplies();
    if (!parser.atEnd()) return UNSUPPORTED;
    return expr;
  } catch {
    return UNSUPPORTED;
  }
}

class Parser {
  private i = 0;
  constructor(private readonly tokens: Token[]) {}

  atEnd(): boolean {
    return this.peek().k === "eof";
  }

  parseImplies(): Expr {
    let left = this.parseXor();
    while (this.eatOp("implies")) {
      left = { t: "binop", op: "implies", l: left, r: this.parseXor() };
    }
    return left;
  }

  parseXor(): Expr {
    let left = this.parseOr();
    while (this.eatOp("xor")) {
      left = { t: "binop", op: "xor", l: left, r: this.parseOr() };
    }
    return left;
  }

  parseOr(): Expr {
    let left = this.parseAnd();
    while (this.eatOp("or")) {
      left = { t: "binop", op: "or", l: left, r: this.parseAnd() };
    }
    return left;
  }

  parseAnd(): Expr {
    let left = this.parseNot();
    while (this.peekOp("and") || this.peekOp("and then")) {
      const tok = this.tokens[this.i];
      if (tok.k !== "op") break;
      const op = tok.v;
      this.i++;
      left = { t: "binop", op, l: left, r: this.parseNot() };
    }
    return left;
  }

  parseNot(): Expr {
    if (this.eatOp("not")) return { t: "not", x: this.parseNot() };
    return this.parseCmp();
  }

  parseCmp(): Expr {
    let left = this.parsePostfix();
    const peeked = this.peek();
    const op = peeked.k === "op" ? peeked.v : "";
    if (["=", "/=", "<", ">", "<=", ">="].includes(op)) {
      this.i++;
      left = { t: "binop", op, l: left, r: this.parsePostfix() };
    }
    return left;
  }

  parsePostfix(): Expr {
    let expr = this.parsePrimary();
    while (true) {
      if (this.eatPunct(".")) {
        const name = this.expectId();
        if (this.eatPunct("(")) {
          expr = {
            t: "call",
            x: { t: "member", x: expr, name },
            args: this.parseArgs(),
          };
        } else {
          expr = { t: "member", x: expr, name };
        }
        continue;
      }
      if (this.eatPunct("(")) {
        expr = { t: "call", x: expr, args: this.parseArgs() };
        continue;
      }
      break;
    }
    return expr;
  }

  parsePrimary(): Expr {
    const tok = this.peek();
    if (tok.k === "num") {
      this.i++;
      return { t: "num", v: tok.v };
    }
    if (tok.k === "str") {
      this.i++;
      return { t: "str", v: tok.v };
    }
    if (tok.k === "punct" && tok.v === "(") {
      this.i++;
      const inner = this.parseImplies();
      this.expectPunct(")");
      return inner;
    }
    if (tok.k === "id") {
      this.i++;
      if (tok.v === "Void" || tok.v === "void") return { t: "void" };
      if (tok.v === "True" || tok.v === "true") return { t: "bool", v: true };
      if (tok.v === "False" || tok.v === "false") {
        return { t: "bool", v: false };
      }
      return { t: "name", v: tok.v };
    }
    throw new Error("primary");
  }

  private parseArgs(): Expr[] {
    const args: Expr[] = [];
    if (this.eatPunct(")")) return args;
    args.push(this.parseImplies());
    while (this.eatPunct(",")) args.push(this.parseImplies());
    this.expectPunct(")");
    return args;
  }

  private peek(): Token {
    return this.tokens[this.i] ?? { k: "eof" };
  }

  private peekOp(op: string): boolean {
    const tok = this.peek();
    return tok.k === "op" && tok.v === op;
  }

  private eatOp(op: string): boolean {
    if (!this.peekOp(op)) return false;
    this.i++;
    return true;
  }

  private eatPunct(v: string): boolean {
    const tok = this.peek();
    if (tok.k === "punct" && tok.v === v) {
      this.i++;
      return true;
    }
    return false;
  }

  private expectPunct(v: string): void {
    if (!this.eatPunct(v)) throw new Error(v);
  }

  private expectId(): string {
    const tok = this.peek();
    if (tok.k !== "id") throw new Error("id");
    this.i++;
    return tok.v;
  }
}

type Token =
  | { k: "id"; v: string }
  | { k: "str"; v: string }
  | { k: "num"; v: number }
  | { k: "op"; v: string }
  | { k: "punct"; v: string }
  | { k: "eof" };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const isId = (c: string) => /[A-Za-z_]/.test(c);
  const isIdCont = (c: string) => /[A-Za-z0-9_]/.test(c);
  while (i < text.length) {
    const c = text[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (
      c === '"' || c === "“" || c === "”" || c === "'" || c === "‘" || c === "’"
    ) {
      const end = c === "“" ? "”" : c === "‘" ? "’" : c;
      i++;
      let s = "";
      while (i < text.length && text[i] !== end) {
        s += text[i];
        i++;
      }
      i++;
      tokens.push({ k: "str", v: s });
      continue;
    }
    if (/[0-9]/.test(c)) {
      let s = "";
      while (i < text.length && /[0-9.]/.test(text[i])) {
        s += text[i];
        i++;
      }
      tokens.push({ k: "num", v: Number(s) });
      continue;
    }
    if (c === "/" && text[i + 1] === "=") {
      tokens.push({ k: "op", v: "/=" });
      i += 2;
      continue;
    }
    if ((c === "<" || c === ">") && text[i + 1] === "=") {
      tokens.push({ k: "op", v: c + "=" });
      i += 2;
      continue;
    }
    if ("=<>".includes(c)) {
      tokens.push({ k: "op", v: c });
      i++;
      continue;
    }
    if ("().,".includes(c)) {
      tokens.push({ k: "punct", v: c });
      i++;
      continue;
    }
    if (isId(c)) {
      let s = "";
      while (i < text.length && isIdCont(text[i])) {
        s += text[i];
        i++;
      }
      if (s === "and") {
        const rest = text.slice(i).match(/^\s+then\b/);
        if (rest) {
          tokens.push({ k: "op", v: "and then" });
          i += rest[0].length;
          continue;
        }
      }
      if (["and", "or", "xor", "not", "implies"].includes(s)) {
        tokens.push({ k: "op", v: s });
      } else {
        tokens.push({ k: "id", v: s });
      }
      continue;
    }
    throw new Error(`bad char ${c}`);
  }
  tokens.push({ k: "eof" });
  return tokens;
}

function evalExpr(expr: Expr, ctx: unknown): Val {
  switch (expr.t) {
    case "void":
      return null;
    case "bool":
      return expr.v;
    case "str":
      return expr.v;
    case "num":
      return expr.v;
    case "name":
      return evalName(expr.v, ctx);
    case "not": {
      const v = evalExpr(expr.x, ctx);
      if (v === UNSUPPORTED || typeof v !== "boolean") return UNSUPPORTED;
      return !v;
    }
    case "binop":
      return evalBinop(expr.op, expr.l, expr.r, ctx);
    case "member":
      return evalMember(evalExpr(expr.x, ctx), expr.name, undefined, ctx);
    case "call":
      return evalCall(expr, ctx);
  }
}

function evalBinop(op: string, left: Expr, right: Expr, ctx: unknown): Val {
  if (op === "implies") {
    const l = evalExpr(left, ctx);
    if (l === UNSUPPORTED || typeof l !== "boolean") return UNSUPPORTED;
    if (!l) return true;
    const r = evalExpr(right, ctx);
    return typeof r === "boolean" ? r : UNSUPPORTED;
  }
  if (op === "and" || op === "and then") {
    const l = evalExpr(left, ctx);
    if (l === UNSUPPORTED || typeof l !== "boolean") return UNSUPPORTED;
    if (!l) return false;
    const r = evalExpr(right, ctx);
    return typeof r === "boolean" ? r : UNSUPPORTED;
  }
  if (op === "or") {
    const l = evalExpr(left, ctx);
    if (l === UNSUPPORTED || typeof l !== "boolean") return UNSUPPORTED;
    if (l) return true;
    const r = evalExpr(right, ctx);
    return typeof r === "boolean" ? r : UNSUPPORTED;
  }
  const l = evalExpr(left, ctx);
  const r = evalExpr(right, ctx);
  if (l === UNSUPPORTED || r === UNSUPPORTED) return UNSUPPORTED;
  if (op === "xor") {
    if (typeof l !== "boolean" || typeof r !== "boolean") return UNSUPPORTED;
    return l !== r;
  }
  if (op === "=") return valuesEqual(l, r);
  if (op === "/=") return !valuesEqual(l, r);
  if (typeof l === "number" && typeof r === "number") {
    if (op === "<") return l < r;
    if (op === ">") return l > r;
    if (op === "<=") return l <= r;
    if (op === ">=") return l >= r;
  }
  return UNSUPPORTED;
}

function evalCall(expr: CallExpr, ctx: unknown): Val {
  if (expr.x.t === "name") {
    if (expr.x.v === "is_null" && expr.args.length === 0) {
      return isNullValue(ctx);
    }
    if (expr.x.v === "terminology" && expr.args.length === 1) {
      const id = evalExpr(expr.args[0], ctx);
      if (id === UNSUPPORTED) return UNSUPPORTED;
      return { kind: "terminology", id: String(id) };
    }
    if (expr.x.v === "code_set" && expr.args.length === 1) {
      const id = evalExpr(expr.args[0], ctx);
      if (id === UNSUPPORTED) return UNSUPPORTED;
      return { kind: "code_set", id: String(id) };
    }
    return UNSUPPORTED;
  }
  if (expr.x.t === "member") {
    const receiver = evalExpr(expr.x.x, ctx);
    const args: Val[] = [];
    for (const arg of expr.args) {
      const value = evalExpr(arg, ctx);
      if (value === UNSUPPORTED) return UNSUPPORTED;
      args.push(value);
    }
    return evalMember(receiver, expr.x.name, args, ctx);
  }
  return UNSUPPORTED;
}

function evalName(name: string, ctx: unknown): Val {
  if (name in BMM_CONSTANTS) return BMM_CONSTANTS[name];
  if (name === "is_null") return isNullValue(ctx);
  if (ctx && typeof ctx === "object" && name in (ctx as object)) {
    return (ctx as Record<string, unknown>)[name];
  }
  // An attribute that is not on the instance is Void.
  return null;
}

function evalMember(
  receiver: Val,
  name: string,
  args: Val[] | undefined,
  _ctx: unknown,
): Val {
  if (receiver === UNSUPPORTED) return UNSUPPORTED;
  if (name === "is_empty") {
    if (isVoid(receiver)) return UNSUPPORTED;
    if (typeof receiver === "string") return receiver.length === 0;
    if (Array.isArray(receiver)) return receiver.length === 0;
    return UNSUPPORTED;
  }
  if (name === "is_null" && !args?.length) return isNullValue(receiver);
  if (name === "is_equal" && args?.length === 1) {
    return valuesEqual(receiver, args[0]);
  }
  if (
    isService(receiver, "terminology") && name === "has_code_for_group_id" &&
    args?.length === 2
  ) {
    return hasGroupCode(String(args[0]), args[1]);
  }
  if (
    isService(receiver, "code_set") && name === "has_code" && args?.length === 1
  ) {
    return hasCodeSetCode(receiver.id, args[0]);
  }
  if (isVoid(receiver)) return UNSUPPORTED;
  if (typeof receiver === "object" && receiver && name in receiver) {
    const prop = (receiver as Record<string, unknown>)[name];
    if (typeof prop === "function") return UNSUPPORTED;
    if (args) return UNSUPPORTED;
    return prop;
  }
  return UNSUPPORTED;
}

function isNullValue(receiver: unknown): Val {
  if (isVoid(receiver)) return true;
  if (typeof receiver !== "object") return UNSUPPORTED;
  const rec = receiver as {
    is_null?: () => { value?: boolean } | boolean;
    value?: unknown;
  };
  if (typeof rec.is_null === "function") {
    const result = rec.is_null();
    if (typeof result === "boolean") return result;
    if (result && typeof result === "object" && "value" in result) {
      return result.value === true;
    }
  }
  // Absent value is Void, which is what ELEMENT.is_null() means.
  return isVoid(rec.value);
}

function hasGroupCode(groupName: string, codeValue: unknown): Val {
  const code = codeStringOf(codeValue);
  if (!code) return UNSUPPORTED;
  const service = OpenEHRTerminologyService.getInstance();
  const groupId = service.getGroupIdByName(groupName) ?? groupName;
  const codes = service.getCodesForGroup(groupId);
  if (codes.length === 0) return UNSUPPORTED;
  return codes.includes(code);
}

function hasCodeSetCode(codeSetId: string, codeValue: unknown): Val {
  const code = codeStringOf(codeValue);
  if (!code) return UNSUPPORTED;
  const service = OpenEHRTerminologyService.getInstance();
  const byId = service.getCodeSet(codeSetId);
  const byName = byId ?? findCodeSetByName(service, codeSetId);
  if (!byName || byName.codes.length === 0) return UNSUPPORTED;
  return byName.codes.some((entry) => entry.code === code);
}

function findCodeSetByName(
  service: OpenEHRTerminologyService,
  name: string,
) {
  const wanted = name.toLowerCase();
  for (const id of service.getCodeSetIdentifiers()) {
    const set = service.getCodeSet(id);
    if (set && (set.name.toLowerCase() === wanted || set.openehr_id === name)) {
      return set;
    }
  }
  return undefined;
}

function codeStringOf(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (!value || typeof value !== "object") return undefined;
  const rec = value as Record<string, unknown>;
  if (typeof rec.code_string === "string") return rec.code_string;
  if (typeof rec.codeString === "string") return rec.codeString;
  if (rec.defining_code) return codeStringOf(rec.defining_code);
  return undefined;
}

function valuesEqual(left: unknown, right: unknown): boolean {
  if (isVoid(left) && isVoid(right)) return true;
  if (isVoid(left) || isVoid(right)) return false;
  if (typeof left === "boolean" || typeof right === "boolean") {
    return left === right;
  }
  if (typeof left === "number" || typeof right === "number") {
    return left === right;
  }
  if (typeof left === "string" || typeof right === "string") {
    return left === right;
  }
  return false;
}

function isVoid(value: unknown): boolean {
  return value === null || value === undefined;
}

function isService(
  value: unknown,
  kind: "terminology" | "code_set",
): value is { kind: "terminology" | "code_set"; id: string } {
  return !!value && typeof value === "object" &&
    (value as { kind?: string }).kind === kind;
}
