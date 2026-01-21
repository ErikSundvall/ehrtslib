/**
 * ODIN (Object Data Instance Notation) Parser
 * 
 * Parses ODIN syntax used in ADL2 files for structured data representation.
 * ODIN is used in language, description, terminology sections.
 */

import { Token, TokenType } from "./adl2_tokenizer.ts";

/**
 * ODIN value types
 */
export type OdinValue =
  | OdinPrimitive
  | OdinObject
  | OdinList
  | OdinInterval;

export type OdinPrimitive = string | number | boolean | null;

export interface OdinObject {
  [key: string]: OdinValue;
}

export type OdinList = OdinValue[];

export interface OdinInterval {
  _type: "interval";
  lower?: number | string;
  upper?: number | string;
  lowerIncluded?: boolean;
  upperIncluded?: boolean;
  lowerUnbounded?: boolean;
  upperUnbounded?: boolean;
}

/**
 * ODIN Parser
 */
export class OdinParser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /**
   * Parse ODIN text from tokens
   */
  parse(): OdinValue {
    return this.parseValue();
  }

  private parseValue(): OdinValue {
    this.skipWhitespace();

    // Check for angle brackets (object block)
    if (this.check(TokenType.LANGLE)) {
      return this.parseObjectBlock();
    }

    // Check for primitive value
    return this.parsePrimitive();
  }

  private parseObjectBlock(): OdinValue {
    this.consume(TokenType.LANGLE, "Expected '<' to start object block");

    // Check for empty object
    if (this.check(TokenType.RANGLE)) {
      this.advance();
      return {};
    }

    // Check if it's a list of keyed objects
    if (this.checkAhead(TokenType.LBRACKET)) {
      return this.parseKeyedList();
    }

    // Check for attribute-value pairs (token followed by =)
    if (this.isIdentifierLike() && this.checkAhead(TokenType.EQUALS, 1)) {
      return this.parseAttributeValuePairs();
    }

    // Check for primitive list
    if (this.isPrimitive()) {
      return this.parsePrimitiveList();
    }

    // Check for interval
    if (this.check(TokenType.PIPE)) {
      return this.parseInterval();
    }

    this.consume(TokenType.RANGLE, "Expected '>' to close object block");
    return {};
  }

  private parseAttributeValuePairs(): OdinObject {
    const obj: OdinObject = {};

    while (!this.check(TokenType.RANGLE) && !this.isAtEnd()) {
      this.skipWhitespace();

      if (this.check(TokenType.RANGLE)) break;
      
      // In ODIN context, keywords can be used as identifiers
      // So we need to accept both IDENTIFIER and keyword tokens
      const token = this.peek();
      const isValidAttributeName = 
        token.type === TokenType.IDENTIFIER ||
        token.type === TokenType.DESCRIPTION ||
        token.type === TokenType.LANGUAGE ||
        token.type === TokenType.DEFINITION ||
        token.type === TokenType.TERMINOLOGY ||
        token.type === TokenType.ARCHETYPE ||
        token.type === TokenType.RULES ||
        token.type === TokenType.ANNOTATIONS;
      
      if (!isValidAttributeName) {
        break;
      }

      // Look ahead to see if this is an attribute (followed by =)
      const isAttribute = this.checkAhead(TokenType.EQUALS, 1);
      if (!isAttribute) {
        break;
      }

      // Parse attribute name (accept any token as identifier in ODIN context)
      const attr = this.advance();
      this.skipWhitespace();
      this.consume(TokenType.EQUALS, "Expected '=' after attribute name");
      this.skipWhitespace();

      // Parse value
      const value = this.parseValue();
      obj[attr.value] = value;

      this.skipWhitespace();
    }

    this.consume(TokenType.RANGLE, "Expected '>' to close object block");
    return obj;
  }

  private parseKeyedList(): OdinList {
    const list: OdinList = [];

    while (!this.check(TokenType.RANGLE) && !this.isAtEnd()) {
      this.skipWhitespace();

      if (this.check(TokenType.RANGLE)) break;

      // Parse key [key]
      this.consume(TokenType.LBRACKET, "Expected '[' for keyed object");
      const key = this.parsePrimitive();
      this.consume(TokenType.RBRACKET, "Expected ']' after key");
      this.skipWhitespace();
      this.consume(TokenType.EQUALS, "Expected '=' after key");
      this.skipWhitespace();

      // Parse value
      const value = this.parseValue();
      
      // For now, we'll store keyed values in array
      // In a more complete implementation, we might want to preserve keys
      list.push(value);

      this.skipWhitespace();
    }

    this.consume(TokenType.RANGLE, "Expected '>' to close keyed list");
    return list;
  }

  private parsePrimitiveList(): OdinValue {
    const list: OdinList = [];

    while (!this.check(TokenType.RANGLE) && !this.isAtEnd()) {
      this.skipWhitespace();

      if (this.check(TokenType.RANGLE)) break;

      list.push(this.parsePrimitive());
      this.skipWhitespace();

      // Optional comma
      if (this.check(TokenType.COMMA)) {
        this.advance();
        this.skipWhitespace();
      }
    }

    this.consume(TokenType.RANGLE, "Expected '>' to close primitive list");
    
    // Return single value if list has only one item
    return list.length === 1 ? list[0] : list;
  }

  private parseInterval(): OdinInterval {
    this.consume(TokenType.PIPE, "Expected '|' to start interval");

    const interval: OdinInterval = {
      _type: "interval",
    };

    // Parse lower bound
    if (this.check(TokenType.LANGLE)) {
      // <value means exclusive lower bound
      this.advance();
      interval.lowerIncluded = false;
      if (!this.check(TokenType.EQUALS)) {
        interval.lower = this.parsePrimitiveValue();
      }
    } else if (this.check(TokenType.IDENTIFIER) && this.peek().value === "undefined") {
      // undefined lower bound
      this.advance();
      interval.lowerUnbounded = true;
    } else {
      // inclusive lower bound
      interval.lowerIncluded = true;
      interval.lower = this.parsePrimitiveValue();
    }

    // Check for range separator
    if (this.check(TokenType.ELLIPSIS)) {
      this.advance();

      // Parse upper bound
      if (this.check(TokenType.RANGLE) && this.checkAhead(TokenType.PIPE)) {
        // >value means exclusive upper bound
        this.advance();
        interval.upperIncluded = false;
        interval.upper = this.parsePrimitiveValue();
      } else if (this.check(TokenType.IDENTIFIER) && this.peek().value === "undefined") {
        // undefined upper bound
        this.advance();
        interval.upperUnbounded = true;
      } else {
        // inclusive upper bound
        interval.upperIncluded = true;
        interval.upper = this.parsePrimitiveValue();
      }
    }

    this.consume(TokenType.PIPE, "Expected '|' to close interval");

    return interval;
  }

  private parsePrimitive(): OdinPrimitive {
    return this.parsePrimitiveValue();
  }

  private parsePrimitiveValue(): OdinPrimitive {
    this.skipWhitespace();

    if (this.check(TokenType.STRING)) {
      return this.advance().value;
    }

    if (this.check(TokenType.INTEGER)) {
      return parseInt(this.advance().value);
    }

    if (this.check(TokenType.REAL)) {
      return parseFloat(this.advance().value);
    }

    if (this.check(TokenType.IDENTIFIER)) {
      const value = this.advance().value.toLowerCase();
      if (value === "true") return true;
      if (value === "false") return false;
      if (value === "null" || value === "undefined") return null;
      
      // Return as string if not recognized boolean/null
      return value;
    }

    throw this.error("Expected primitive value");
  }

  private isPrimitive(): boolean {
    return (
      this.check(TokenType.STRING) ||
      this.check(TokenType.INTEGER) ||
      this.check(TokenType.REAL) ||
      (this.check(TokenType.IDENTIFIER) &&
        ["true", "false", "null", "undefined"].includes(
          this.peek().value.toLowerCase()
        ))
    );
  }

  private isIdentifierLike(): boolean {
    const token = this.peek();
    return (
      token.type === TokenType.IDENTIFIER ||
      token.type === TokenType.DESCRIPTION ||
      token.type === TokenType.LANGUAGE ||
      token.type === TokenType.DEFINITION ||
      token.type === TokenType.TERMINOLOGY ||
      token.type === TokenType.ARCHETYPE ||
      token.type === TokenType.RULES ||
      token.type === TokenType.ANNOTATIONS
    );
  }

  // Token navigation helpers

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkAhead(type: TokenType, offset: number = 0): boolean {
    const pos = this.position + offset;
    if (pos >= this.tokens.length) return false;
    return this.tokens[pos].type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.position++;
    return this.previous();
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(message);
  }

  private peek(): Token {
    return this.tokens[this.position];
  }

  private previous(): Token {
    return this.tokens[this.position - 1];
  }

  private isAtEnd(): boolean {
    return this.position >= this.tokens.length || this.peek().type === TokenType.EOF;
  }

  private skipWhitespace(): void {
    // Whitespace is already handled by tokenizer
    // This is a no-op but kept for clarity
  }

  private error(message: string): Error {
    const token = this.peek();
    return new Error(
      `Parse error at line ${token.line}, column ${token.column}: ${message}`
    );
  }
}
