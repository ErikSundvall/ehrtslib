/**
 * cADL (Constraint ADL) Parser
 *
 * Parses the definition section of ADL2 files.
 * Based on cadl.g4 grammar from openEHR/archie.
 */

import { Token, TokenType } from "./adl2_tokenizer.ts";
import * as openehr_am from "../openehr_am.ts";
import * as openehr_base from "../openehr_base.ts";

/**
 * cADL Parser for definition section
 */
export class CadlParser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /**
   * Parse root c_object (complex, use archetype, allow archetype).
   */
  parseComplexObject(): openehr_am.C_COMPLEX_OBJECT {
    if (this.checkKeyword("use") && this.peekAhead(1)?.value.toLowerCase() === "archetype") {
      return this.parseCArchetypeRoot();
    }
    return this.parseComplexObjectBody(new openehr_am.C_COMPLEX_OBJECT());
  }

  private parseComplexObjectBody(
    cObject: openehr_am.C_COMPLEX_OBJECT,
  ): openehr_am.C_COMPLEX_OBJECT {
    const typeId = this.consume(TokenType.IDENTIFIER, "Expected type identifier");
    cObject.rm_type_name = typeId.value;

    this.consume(TokenType.LBRACKET, "Expected '[' for node id");

    const nodeIdToken = this.peek();
    if (
      nodeIdToken.type === TokenType.ID_CODE ||
      nodeIdToken.type === TokenType.AT_CODE
    ) {
      cObject.node_id = this.advance().value;
    } else {
      throw this.error("Expected node id code (id1, at0000, etc.)");
    }

    this.consume(TokenType.RBRACKET, "Expected ']' after node id");

    if (this.check(TokenType.OCCURRENCES)) {
      this.parseOccurrences(cObject);
    }

    if (this.check(TokenType.MATCHES)) {
      this.advance();
      this.consume(TokenType.LBRACE, "Expected '{' after matches");

      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const attribute = this.parseAttribute();
        if (attribute) {
          if (!cObject.attributes) cObject.attributes = [];
          cObject.attributes.push(attribute);
        }
      }

      this.consume(TokenType.RBRACE, "Expected '}' to close matches block");
    }

    return cObject;
  }

  private parseCArchetypeRoot(): openehr_am.C_ARCHETYPE_ROOT {
    this.consumeKeyword("use");
    this.consumeKeyword("archetype");
    const root = new openehr_am.C_ARCHETYPE_ROOT();
    return this.parseArchetypeRootTail(root);
  }

  private parseArchetypeRootTail(
    root: openehr_am.C_ARCHETYPE_ROOT,
  ): openehr_am.C_ARCHETYPE_ROOT {
    const typeId = this.consume(TokenType.IDENTIFIER, "Expected type identifier");
    root.rm_type_name = typeId.value;

    this.consume(TokenType.LBRACKET, "Expected '['");
    root.node_id = this.consume(
      TokenType.ID_CODE,
      "Expected id code",
    ).value;

    if (this.check(TokenType.COMMA)) {
      this.advance();
      root.archetype_ref = this.consumeArchetypeRef();
    }

    this.consume(TokenType.RBRACKET, "Expected ']'");

    if (this.check(TokenType.OCCURRENCES)) {
      this.parseOccurrences(root);
    }

    if (this.check(TokenType.MATCHES)) {
      this.advance();
      this.consume(TokenType.LBRACE, "Expected '{'");
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const attribute = this.parseAttribute();
        if (attribute) {
          if (!root.attributes) root.attributes = [];
          root.attributes.push(attribute);
        }
      }
      this.consume(TokenType.RBRACE, "Expected '}'");
    }

    return root;
  }

  private isAllowArchetype(): boolean {
    if (this.checkIdentifier("allow_archetype")) return true;
    return this.checkKeyword("allow") &&
      this.peekAhead(1)?.value.toLowerCase() === "archetype";
  }

  private checkIdentifier(name: string): boolean {
    return this.check(TokenType.IDENTIFIER) &&
      this.peek().value.toLowerCase() === name.toLowerCase();
  }

  private parseArchetypeSlotAsComplex(): openehr_am.ARCHETYPE_SLOT {
    if (this.checkIdentifier("allow_archetype")) {
      this.advance();
    } else {
      this.consumeKeyword("allow");
      this.consumeKeyword("archetype");
    }
    const slot = new openehr_am.ARCHETYPE_SLOT();
    const typeId = this.consume(TokenType.IDENTIFIER, "Expected type identifier");
    slot.rm_type_name = typeId.value;
    this.consume(TokenType.LBRACKET, "Expected '['");
    slot.node_id = this.consume(TokenType.ID_CODE, "Expected id code").value;
    this.consume(TokenType.RBRACKET, "Expected ']'");

    if (this.check(TokenType.OCCURRENCES)) {
      this.parseOccurrences(slot);
    }

    if (this.check(TokenType.MATCHES)) {
      this.advance();
      this.consume(TokenType.LBRACE, "Expected '{'");
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        if (this.checkKeyword("include")) {
          this.parseIncludeExclude(slot, "includes");
        } else if (this.checkKeyword("exclude")) {
          this.parseIncludeExclude(slot, "excludes");
        } else {
          throw this.error(`Unexpected token in archetype slot: ${this.peek().value}`);
        }
      }
      this.consume(TokenType.RBRACE, "Expected '}'");
    }

    return slot;
  }

  private skipIncludeExcludeBlock(): void {
    this.advance();
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.IDENTIFIER) && this.checkAhead(TokenType.MATCHES, 1)) {
        this.advance();
        if (this.check(TokenType.MATCHES)) this.advance();
        if (this.check(TokenType.LBRACE)) {
          this.advance();
          while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
            this.advance();
          }
          if (this.check(TokenType.RBRACE)) this.advance();
        }
      } else {
        this.advance();
      }
    }
  }

  private parseIncludeExclude(
    slot: openehr_am.ARCHETYPE_SLOT,
    field: "includes" | "excludes",
  ): void {
    this.advance(); // include | exclude
    const list = (slot as Record<string, openehr_am.ARCHETYPE_ID_CONSTRAINT[]>)[
      field
    ] ?? [];
    while (
      !this.check(TokenType.RBRACE) &&
      !this.checkKeyword("include") &&
      !this.checkKeyword("exclude") &&
      !this.isAtEnd()
    ) {
      const constraint = new openehr_am.ARCHETYPE_ID_CONSTRAINT();
      const str = new openehr_am.C_STRING();
      if (this.check(TokenType.STRING)) {
        str.pattern = this.advance().value;
      } else if (this.check(TokenType.IDENTIFIER)) {
        str.pattern = this.advance().value;
      } else {
        throw this.error("Expected archetype id constraint");
      }
      constraint.constraint = str;
      list.push(constraint);
    }
    (slot as Record<string, openehr_am.ARCHETYPE_ID_CONSTRAINT[]>)[field] =
      list;
  }

  private consumeArchetypeRef(): string {
    const parts: string[] = [];
    while (
      this.check(TokenType.IDENTIFIER) ||
      this.check(TokenType.DOT) ||
      this.check(TokenType.INTEGER)
    ) {
      parts.push(this.advance().value);
    }
    return parts.join("");
  }

  private parseAttribute(): openehr_am.C_ATTRIBUTE | null {
    if (this.check(TokenType.RBRACE)) return null;
    if (!this.check(TokenType.IDENTIFIER)) return null;

    let attributeName = this.advance().value;
    if (this.check(TokenType.SLASH) && this.checkAhead(TokenType.IDENTIFIER, 1)) {
      attributeName += "/" + this.advance().value;
      this.advance(); // second part of path e.g. archetype_id/value
    }
    const hasCardinality = this.check(TokenType.CARDINALITY);
    const attribute: openehr_am.C_ATTRIBUTE = hasCardinality
      ? new openehr_am.C_MULTIPLE_ATTRIBUTE()
      : new openehr_am.C_SINGLE_ATTRIBUTE();
    attribute.rm_attribute_name = attributeName;

    if (this.check(TokenType.EXISTENCE)) {
      const existence = this.parseExistence();
      (attribute as { existence: openehr_base.Multiplicity_interval }).existence =
        existence;
    }

    if (this.check(TokenType.CARDINALITY)) {
      const card = this.parseCardinality();
      if (attribute instanceof openehr_am.C_MULTIPLE_ATTRIBUTE) {
        attribute.cardinality = card;
      }
    }

    if (this.check(TokenType.MATCHES)) {
      this.advance();
      this.consume(TokenType.LBRACE, "Expected '{' after matches in attribute");

      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const stringChild = this.tryParseStringConstraint();
        if (stringChild) {
          if (!(attribute as { children?: openehr_am.C_OBJECT[] }).children) {
            (attribute as { children: openehr_am.C_OBJECT[] }).children = [];
          }
          (attribute as { children: openehr_am.C_OBJECT[] }).children!.push(
            stringChild,
          );
          continue;
        }
        const child = this.parseChildObject();
        if (child) {
          if (!(attribute as { children?: openehr_am.C_OBJECT[] }).children) {
            (attribute as { children: openehr_am.C_OBJECT[] }).children = [];
          }
          (attribute as { children: openehr_am.C_OBJECT[] }).children!.push(
            child,
          );
        }
      }

      this.consume(TokenType.RBRACE, "Expected '}' to close attribute matches");
    }

    return attribute;
  }

  /** `matches { "literal" }` string constraint (BOOK archetype style). */
  private tryParseStringConstraint(): openehr_am.C_PRIMITIVE_OBJECT | null {
    if (!this.check(TokenType.STRING)) return null;
    const prim = new openehr_am.C_PRIMITIVE_OBJECT();
    prim.rm_type_name = "DV_TEXT";
    const str = new openehr_am.C_STRING();
    str.pattern = this.advance().value.replace(/^["']|["']$/g, "");
    prim.item = str;
    while (this.check(TokenType.COMMA)) {
      this.advance();
      if (this.check(TokenType.STRING)) {
        str.pattern += "|" +
          this.advance().value.replace(/^["']|["']$/g, "");
      }
    }
    return prim;
  }

  private parseChildObject(): openehr_am.C_OBJECT | null {
    if (this.check(TokenType.RBRACE)) return null;
    const stringChild = this.tryParseStringConstraint();
    if (stringChild) return stringChild;
    if (this.check(TokenType.REGEX)) {
      const prim = new openehr_am.C_PRIMITIVE_OBJECT();
      prim.rm_type_name = "STRING";
      const str = new openehr_am.C_STRING();
      str.pattern = this.advance().value;
      prim.item = str;
      return prim;
    }
    if (!this.check(TokenType.IDENTIFIER)) {
      throw this.error(`Unexpected token: ${this.peek().value}`);
    }
    if (this.checkKeyword("use") &&
      this.peekAhead(1)?.value.toLowerCase() === "archetype") {
      return this.parseCArchetypeRoot();
    }
    if (this.isAllowArchetype()) {
      return this.parseArchetypeSlotAsComplex();
    }
    if (this.checkKeyword("include") || this.checkKeyword("exclude")) {
      this.skipIncludeExcludeBlock();
      return null;
    }
    if (this.isPrimitiveType(this.peek().value)) {
      return this.parsePrimitiveObject();
    }
    return this.parseComplexObjectBody(new openehr_am.C_COMPLEX_OBJECT());
  }

  private isPrimitiveType(typeName: string): boolean {
    return typeName.startsWith("DV_") || typeName === "CODE_PHRASE";
  }

  private parsePrimitiveObject(): openehr_am.C_PRIMITIVE_OBJECT {
    const prim = new openehr_am.C_PRIMITIVE_OBJECT();
    const typeId = this.consume(TokenType.IDENTIFIER, "Expected primitive type");
    prim.rm_type_name = typeId.value;
    this.consume(TokenType.LBRACKET, "Expected '['");
    prim.node_id = this.peek().type === TokenType.AT_CODE ||
        this.peek().type === TokenType.ID_CODE
      ? this.advance().value
      : this.consume(TokenType.ID_CODE, "Expected node id").value;
    this.consume(TokenType.RBRACKET, "Expected ']'");
    return prim;
  }

  private parseExistence(): openehr_base.Multiplicity_interval {
    this.consume(TokenType.EXISTENCE, "Expected 'existence'");
    this.consume(TokenType.MATCHES, "Expected 'matches'");
    this.consume(TokenType.LBRACE, "Expected '{'");
    const interval = this.parseMultiplicity();
    this.consume(TokenType.RBRACE, "Expected '}'");
    return interval;
  }

  private parseCardinality(): openehr_am.CARDINALITY {
    this.consume(TokenType.CARDINALITY, "Expected 'cardinality'");
    this.consume(TokenType.MATCHES, "Expected 'matches'");
    this.consume(TokenType.LBRACE, "Expected '{'");

    const card = new openehr_am.CARDINALITY();
    const interval = this.parseMultiplicity();
    (card as { interval: openehr_base.Multiplicity_interval }).interval =
      interval;

    while (this.check(TokenType.SEMICOLON)) {
      this.advance();
      if (this.checkKeyword("ordered")) {
        this.advance();
        card.is_ordered = true;
      } else if (this.checkKeyword("unordered")) {
        this.advance();
        card.is_ordered = false;
      } else if (this.checkKeyword("unique")) {
        this.advance();
        (card as { is_unique: boolean }).is_unique = true;
      } else {
        throw this.error(`Unknown cardinality modifier: ${this.peek().value}`);
      }
    }

    this.consume(TokenType.RBRACE, "Expected '}'");
    return card;
  }

  private parseOccurrences(cObject: openehr_am.C_OBJECT): void {
    this.consume(TokenType.OCCURRENCES, "Expected 'occurrences'");
    this.consume(TokenType.MATCHES, "Expected 'matches'");
    this.consume(TokenType.LBRACE, "Expected '{'");
    cObject.occurrences = this.parseMultiplicity();
    this.consume(TokenType.RBRACE, "Expected '}'");
  }

  private parseMultiplicity(): openehr_base.Multiplicity_interval {
    const interval = new openehr_base.Multiplicity_interval();

    if (this.check(TokenType.INTEGER)) {
      const lower = parseInt(this.advance().value, 10);
      if (this.check(TokenType.ELLIPSIS)) {
        this.advance();
        if (this.check(TokenType.STAR)) {
          this.advance();
          interval.lower = lower;
          interval.upper = undefined;
        } else if (this.check(TokenType.INTEGER)) {
          interval.lower = lower;
          interval.upper = parseInt(this.advance().value, 10);
        } else {
          interval.lower = lower;
          interval.upper = undefined;
        }
      } else {
        interval.lower = lower;
        interval.upper = lower;
      }
    } else if (this.check(TokenType.STAR)) {
      this.advance();
      interval.lower = 0;
      interval.upper = undefined;
    } else {
      throw this.error("Expected multiplicity");
    }

    return interval;
  }

  private checkKeyword(word: string): boolean {
    if (!this.check(TokenType.IDENTIFIER)) return false;
    return this.peek().value.toLowerCase() === word.toLowerCase();
  }

  private consumeKeyword(word: string): void {
    if (!this.checkKeyword(word)) {
      throw this.error(`Expected keyword '${word}'`);
    }
    this.advance();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
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

  private peekAhead(offset: number): Token | undefined {
    const idx = this.position + offset;
    if (idx >= this.tokens.length) return undefined;
    return this.tokens[idx];
  }

  private previous(): Token {
    return this.tokens[this.position - 1];
  }

  private isAtEnd(): boolean {
    return (
      this.position >= this.tokens.length ||
      this.peek().type === TokenType.EOF
    );
  }

  private error(message: string): Error {
    const token = this.peek();
    return new Error(
      `cADL parse error at line ${token.line}, column ${token.column}: ${message}`,
    );
  }
}
