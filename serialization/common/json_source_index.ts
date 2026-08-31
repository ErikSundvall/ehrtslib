/**
 * Map JSON Pointer (RFC 6901) locations to line/column in the original source text.
 */

export interface JsonSourceLocation {
  /** JSON Pointer into the parsed document (empty string for the root value). */
  jsonPointer: string;
  /** 1-based line number in the original JSON source. */
  sourceLine: number;
  /** 1-based column number in the original JSON source. */
  sourceColumn: number;
}

export type JsonSourceIndex = Map<string, JsonSourceLocation>;

/** Escape a property name for use in a JSON Pointer segment. */
export function escapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

/**
 * Convert an RM validation path (`/data/events[0]/value/`) to a JSON Pointer
 * (`/data/events/0/value`). Trailing slashes are ignored.
 */
export function rmPathToJsonPointer(rmPath: string): string {
  const trimmed = rmPath.replace(/\/+$/, "");
  if (!trimmed || trimmed === "/") {
    return "";
  }

  const segments: string[] = [];
  for (const part of trimmed.split("/").filter(Boolean)) {
    const match = part.match(/^([^[]+)(?:\[(\d+)\])?$/);
    if (!match) {
      segments.push(escapeJsonPointerSegment(part));
      continue;
    }

    const [, name, index] = match;
    segments.push(escapeJsonPointerSegment(name));
    if (index !== undefined) {
      segments.push(index);
    }
  }

  return segments.length ? `/${segments.join("/")}` : "";
}

/**
 * Build a JSON Pointer → source location index by scanning `source`.
 *
 * Each indexed pointer refers to the start of the value token (object, array,
 * string, number, boolean, or null) at that location.
 */
export function buildJsonSourceIndex(source: string): JsonSourceIndex {
  const parser = new JsonSourceParser(source);
  return parser.parse();
}

function lookupSourceLocation(
  index: JsonSourceIndex,
  jsonPointer: string,
): JsonSourceLocation | undefined {
  return index.get(jsonPointer) ?? index.get(jsonPointer.replace(/\/+$/, ""));
}

/** Attach source metadata to a validation message when the index has a match. */
export function enrichValidationMessageWithSource(
  message: { path: string; jsonPointer?: string; sourceLine?: number; sourceColumn?: number },
  index: JsonSourceIndex,
): void {
  const jsonPointer = rmPathToJsonPointer(message.path);
  const location = lookupSourceLocation(index, jsonPointer);
  if (!location) {
    return;
  }

  message.jsonPointer = location.jsonPointer;
  message.sourceLine = location.sourceLine;
  message.sourceColumn = location.sourceColumn;
}

class JsonSourceParser {
  private pos = 0;
  private line = 1;
  private column = 1;
  private readonly index: JsonSourceIndex = new Map();

  constructor(private readonly source: string) {}

  parse(): JsonSourceIndex {
    this.skipWhitespace();
    if (this.pos >= this.source.length) {
      throw new SyntaxError("Unexpected end of JSON input");
    }

    this.parseValue("");
    this.skipWhitespace();
    if (this.pos < this.source.length) {
      throw new SyntaxError("Unexpected non-whitespace character after JSON value");
    }

    return this.index;
  }

  private parseValue(pointer: string): void {
    this.skipWhitespace();
    this.record(pointer);

    const ch = this.peek();
    if (ch === "{") {
      this.parseObject(pointer);
    } else if (ch === "[") {
      this.parseArray(pointer);
    } else if (ch === '"') {
      this.parseString();
    } else if (ch === "t" || ch === "f" || ch === "n" || ch === "-" ||
      (ch >= "0" && ch <= "9")) {
      this.parsePrimitive();
    } else {
      throw new SyntaxError(`Unexpected token at line ${this.line}, column ${this.column}`);
    }
  }

  private parseObject(pointer: string): void {
    this.consume("{");
    this.skipWhitespace();

    if (this.peek() === "}") {
      this.consume("}");
      return;
    }

    while (true) {
      this.skipWhitespace();
      const key = this.parseString();
      this.skipWhitespace();
      this.consume(":");
      const childPointer = pointer === ""
        ? `/${escapeJsonPointerSegment(key)}`
        : `${pointer}/${escapeJsonPointerSegment(key)}`;
      this.parseValue(childPointer);
      this.skipWhitespace();

      if (this.peek() === ",") {
        this.consume(",");
        continue;
      }
      break;
    }

    this.consume("}");
  }

  private parseArray(pointer: string): void {
    this.consume("[");
    this.skipWhitespace();

    if (this.peek() === "]") {
      this.consume("]");
      return;
    }

    let index = 0;
    while (true) {
      this.parseValue(`${pointer}/${index}`);
      index++;
      this.skipWhitespace();

      if (this.peek() === ",") {
        this.consume(",");
        this.skipWhitespace();
        continue;
      }
      break;
    }

    this.consume("]");
  }

  private parseString(): string {
    this.consume('"');
    let value = "";

    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      this.advance();

      if (ch === '"') {
        return value;
      }

      if (ch === "\\") {
        if (this.pos >= this.source.length) {
          throw new SyntaxError("Unterminated string escape");
        }
        const escaped = this.source[this.pos];
        this.advance();
        switch (escaped) {
          case '"':
          case "\\":
          case "/":
            value += escaped;
            break;
          case "b":
            value += "\b";
            break;
          case "f":
            value += "\f";
            break;
          case "n":
            value += "\n";
            break;
          case "r":
            value += "\r";
            break;
          case "t":
            value += "\t";
            break;
          case "u": {
            const hex = this.source.slice(this.pos, this.pos + 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
              throw new SyntaxError("Invalid Unicode escape");
            }
            this.pos += 4;
            this.column += 4;
            value += String.fromCharCode(parseInt(hex, 16));
            break;
          }
          default:
            throw new SyntaxError(`Invalid escape sequence: \\${escaped}`);
        }
        continue;
      }

      value += ch;
    }

    throw new SyntaxError("Unterminated string");
  }

  private parsePrimitive(): void {
    const start = this.pos;
    if (this.peek() === "t") {
      this.expectLiteral("true");
      return;
    }
    if (this.peek() === "f") {
      this.expectLiteral("false");
      return;
    }
    if (this.peek() === "n") {
      this.expectLiteral("null");
      return;
    }

    if (this.peek() === "-") {
      this.advance();
    }

    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if ((ch >= "0" && ch <= "9") || ch === "." || ch === "e" || ch === "E" ||
        ch === "+" || ch === "-") {
        this.advance();
        continue;
      }
      break;
    }

    const literal = this.source.slice(start, this.pos);
    if (!literal || literal === "-" || !isFinite(Number(literal))) {
      throw new SyntaxError(`Invalid number at line ${this.line}, column ${this.column}`);
    }
  }

  private record(pointer: string): void {
    this.index.set(pointer, {
      jsonPointer: pointer,
      sourceLine: this.line,
      sourceColumn: this.column,
    });
  }

  private expectLiteral(literal: string): void {
    if (!this.source.startsWith(literal, this.pos)) {
      throw new SyntaxError(`Expected '${literal}' at line ${this.line}, column ${this.column}`);
    }
    for (let i = 0; i < literal.length; i++) {
      this.advance();
    }
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        this.advance();
        continue;
      }
      break;
    }
  }

  private peek(): string {
    return this.source[this.pos] ?? "";
  }

  private consume(expected: string): void {
    if (this.peek() !== expected) {
      throw new SyntaxError(
        `Expected '${expected}' at line ${this.line}, column ${this.column}`,
      );
    }
    this.advance();
  }

  private advance(): void {
    const ch = this.source[this.pos];
    if (ch === undefined) {
      return;
    }

    this.pos++;
    if (ch === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
  }
}

export function lookupJsonSourceLocation(
  index: JsonSourceIndex,
  jsonPointer: string,
): JsonSourceLocation | undefined {
  return lookupSourceLocation(index, jsonPointer);
}
