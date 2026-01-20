/**
 * cADL (Constraint ADL) Parser
 * 
 * Parses the definition section of ADL2 files.
 * Based on cadl.g4 grammar from openEHR/archie.
 * 
 * Grammar rule: c_complex_object: type_id '[' ( ROOT_ID_CODE | ID_CODE ) ']' c_occurrences? ( SYM_MATCHES '{' c_attribute_def+ '}' )? ;
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
   * Parse c_complex_object (root of definition section)
   * Grammar: type_id '[' ( ROOT_ID_CODE | ID_CODE ) ']' c_occurrences? ( SYM_MATCHES '{' c_attribute_def+ '}' )? ;
   */
  parseComplexObject(): openehr_am.C_COMPLEX_OBJECT {
    const cObject = new openehr_am.C_COMPLEX_OBJECT();

    // Parse type_id (e.g., OBSERVATION, ELEMENT, DV_TEXT)
    const typeId = this.consume(TokenType.IDENTIFIER, "Expected type identifier");
    cObject.rm_type_name = typeId.value;

    // Parse node id: '[' ID_CODE ']'
    this.consume(TokenType.LBRACKET, "Expected '[' for node id");
    
    const nodeIdToken = this.peek();
    if (nodeIdToken.type === TokenType.ID_CODE || nodeIdToken.type === TokenType.AT_CODE) {
      cObject.node_id = this.advance().value;
    } else {
      throw this.error("Expected node id code (id1, at0000, etc.)");
    }
    
    this.consume(TokenType.RBRACKET, "Expected ']' after node id");

    // Parse optional occurrences
    if (this.check(TokenType.OCCURRENCES)) {
      this.parseOccurrences(cObject);
    }

    // Parse optional matches block
    if (this.check(TokenType.MATCHES)) {
      this.advance(); // consume 'matches'
      this.consume(TokenType.LBRACE, "Expected '{' after matches");

      // Parse attributes until we hit closing brace
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const attribute = this.parseAttribute();
        if (attribute) {
          if (!cObject.attributes) {
            cObject.attributes = [];
          }
          cObject.attributes.push(attribute);
        }
      }

      this.consume(TokenType.RBRACE, "Expected '}' to close matches block");
    }

    return cObject;
  }

  /**
   * Parse c_attribute
   * Grammar: (ADL_PATH | attribute_id) c_existence? c_cardinality? ( SYM_MATCHES ('{' c_objects '}' | CONTAINED_REGEXP) )? ;
   */
  private parseAttribute(): openehr_am.C_ATTRIBUTE | null {
    // Skip if we hit a closing brace
    if (this.check(TokenType.RBRACE)) {
      return null;
    }

    // Parse attribute name
    if (!this.check(TokenType.IDENTIFIER)) {
      return null;
    }

    const attributeName = this.advance().value;

    // Determine if it's a single or multiple attribute
    // For now, we'll create C_SINGLE_ATTRIBUTE (simplified)
    const attribute = new openehr_am.C_SINGLE_ATTRIBUTE();
    attribute.rm_attribute_name = attributeName;

    // Parse optional existence
    if (this.check(TokenType.EXISTENCE)) {
      // existence: SYM_EXISTENCE SYM_MATCHES '{' existence '}'
      // For now, skip implementation
      this.skipExistence();
    }

    // Parse optional cardinality
    if (this.check(TokenType.CARDINALITY)) {
      // cardinality: SYM_CARDINALITY SYM_MATCHES '{' cardinality '}'
      // For now, skip implementation
      this.skipCardinality();
    }

    // Parse optional matches block
    if (this.check(TokenType.MATCHES)) {
      this.advance(); // consume 'matches'
      this.consume(TokenType.LBRACE, "Expected '{' after matches in attribute");

      // Parse child objects
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        // Check if it's a complex object (starts with type identifier)
        if (this.check(TokenType.IDENTIFIER)) {
          const childObject = this.parseComplexObject();
          if (!attribute.children) {
            attribute.children = [];
          }
          attribute.children.push(childObject);
        } else {
          // Skip unknown tokens
          this.advance();
        }
      }

      this.consume(TokenType.RBRACE, "Expected '}' to close attribute matches block");
    }

    return attribute;
  }

  /**
   * Parse occurrences constraint
   * Grammar: SYM_OCCURRENCES SYM_MATCHES '{' multiplicity '}'
   * multiplicity: INTEGER | '*' | INTEGER SYM_INTERVAL_SEP ( INTEGER | '*' )
   */
  private parseOccurrences(cObject: openehr_am.C_COMPLEX_OBJECT): void {
    this.consume(TokenType.OCCURRENCES, "Expected 'occurrences'");
    this.consume(TokenType.MATCHES, "Expected 'matches' after occurrences");
    this.consume(TokenType.LBRACE, "Expected '{' for occurrences");

    // Parse multiplicity (e.g., 1..*, 0..1, 1, *)
    if (this.check(TokenType.INTEGER)) {
      const lower = parseInt(this.advance().value);
      
      if (this.check(TokenType.ELLIPSIS)) {
        this.advance(); // consume '..'
        
        // Upper bound: INTEGER or '*'
        let upper: number | undefined;
        if (this.check(TokenType.STAR)) {
          this.advance();
          upper = undefined; // unbounded
        } else if (this.check(TokenType.INTEGER)) {
          upper = parseInt(this.advance().value);
        }

        // Create multiplicity interval
        const occurrences = new openehr_base.Multiplicity_interval();
        occurrences.lower = lower;
        occurrences.upper = upper;
        cObject.occurrences = occurrences;
      } else {
        // Single value (e.g., "1" means 1..1)
        const occurrences = new openehr_base.Multiplicity_interval();
        occurrences.lower = lower;
        occurrences.upper = lower;
        cObject.occurrences = occurrences;
      }
    } else if (this.check(TokenType.STAR)) {
      // Unbounded: *
      this.advance();
      const occurrences = new openehr_base.Multiplicity_interval();
      occurrences.lower = 0;
      occurrences.upper = undefined;
      cObject.occurrences = occurrences;
    }

    this.consume(TokenType.RBRACE, "Expected '}' to close occurrences");
  }

  private skipExistence(): void {
    this.advance(); // EXISTENCE
    if (this.check(TokenType.MATCHES)) this.advance();
    if (this.check(TokenType.LBRACE)) this.advance();
    // Skip until closing brace
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.advance();
    }
    if (this.check(TokenType.RBRACE)) this.advance();
  }

  private skipCardinality(): void {
    this.advance(); // CARDINALITY
    if (this.check(TokenType.MATCHES)) this.advance();
    if (this.check(TokenType.LBRACE)) this.advance();
    // Skip until closing brace
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.advance();
    }
    if (this.check(TokenType.RBRACE)) this.advance();
  }

  // Token navigation helpers

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
      `cADL parse error at line ${token.line}, column ${token.column}: ${message}`
    );
  }
}
