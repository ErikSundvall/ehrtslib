/**
 * ADL2 Parser
 * 
 * Main parser for ADL2 archetype files.
 * Parses complete archetype/template files into AOM (Archetype Object Model) instances.
 */

import { Token, TokenType } from "./adl2_tokenizer.ts";
import { OdinParser, OdinValue, OdinObject } from "./odin_parser.ts";
import { CadlParser } from "./cadl_parser.ts";
import * as openehr_am from "../openehr_am.ts";
import * as openehr_base from "../openehr_base.ts";

/**
 * ADL2 Parser result
 */
export interface ADL2ParseResult {
  archetype: openehr_am.ARCHETYPE;
  warnings: string[];
}

/**
 * ADL2 Parser
 */
export class ADL2Parser {
  private tokens: Token[];
  private position: number = 0;
  private warnings: string[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /**
   * Parse ADL2 text from tokens
   */
  parse(): ADL2ParseResult {
    const archetype = this.parseArchetype();
    return {
      archetype,
      warnings: this.warnings,
    };
  }

  private parseArchetype(): openehr_am.ARCHETYPE {
    // Parse archetype header
    this.consumeKeyword(TokenType.ARCHETYPE, "Expected 'archetype' keyword");

    // Parse metadata (in parentheses)
    const metadata = this.parseMetadata();

    // Parse archetype ID
    const archetypeId = this.parseArchetypeId();

    // Check for specialization
    let parentId: string | undefined;
    if (this.check(TokenType.SPECIALIZE)) {
      this.advance();
      parentId = this.parseArchetypeId();
    }

    // Create archetype object
    const archetype = new openehr_am.ARCHETYPE();

    // Set basic properties
    archetype.archetype_id = new openehr_base.ARCHETYPE_ID();
    archetype.archetype_id.value = archetypeId;

    if (metadata.adl_version) {
      archetype.adl_version = metadata.adl_version;
    }

    if (metadata.rm_release) {
      archetype.rm_release = metadata.rm_release;
    }

    if (parentId) {
      archetype.parent_archetype_id = new openehr_base.ARCHETYPE_ID();
      archetype.parent_archetype_id.value = parentId;
    }

    // Parse sections
    while (!this.isAtEnd()) {
      if (this.check(TokenType.LANGUAGE)) {
        this.parseLanguageSection(archetype);
      } else if (this.check(TokenType.DESCRIPTION)) {
        this.parseDescriptionSection(archetype);
      } else if (this.check(TokenType.DEFINITION)) {
        this.parseDefinitionSection(archetype);
      } else if (this.check(TokenType.RULES)) {
        this.parseRulesSection(archetype);
      } else if (this.check(TokenType.TERMINOLOGY)) {
        this.parseTerminologySection(archetype);
      } else if (this.check(TokenType.ANNOTATIONS)) {
        this.parseAnnotationsSection(archetype);
      } else {
        // Unknown section or end of file
        break;
      }
    }

    return archetype;
  }

  private parseMetadata(): { [key: string]: string } {
    const metadata: { [key: string]: string } = {};

    if (!this.check(TokenType.LPAREN)) {
      return metadata;
    }

    this.consume(TokenType.LPAREN, "Expected '(' for metadata");

    while (!this.check(TokenType.RPAREN) && !this.isAtEnd()) {
      // Parse key = value pairs
      const key = this.consume(TokenType.IDENTIFIER, "Expected metadata key");
      this.consume(TokenType.EQUALS, "Expected '=' after metadata key");

      // Value can be a string, number, or identifier
      let value: string;
      if (this.check(TokenType.STRING)) {
        value = this.advance().value;
      } else if (this.check(TokenType.REAL)) {
        value = this.advance().value;
      } else if (this.check(TokenType.INTEGER)) {
        value = this.advance().value;
      } else if (this.check(TokenType.IDENTIFIER)) {
        value = this.advance().value;
      } else {
        throw this.error("Expected metadata value");
      }

      metadata[key.value] = value;

      // Optional semicolon or comma
      if (this.check(TokenType.SEMICOLON) || this.check(TokenType.COMMA)) {
        this.advance();
      }
    }

    this.consume(TokenType.RPAREN, "Expected ')' to close metadata");

    return metadata;
  }

  private parseArchetypeId(): string {
    // Archetype ID format: openEHR-EHR-OBSERVATION.blood_pressure.v1.0.0
    // Can be one identifier with hyphens and dots, or multiple parts

    let id = "";

    // Collect all parts of the archetype ID
    while (!this.isAtEnd()) {
      if (this.check(TokenType.IDENTIFIER)) {
        id += this.advance().value;
      } else if (this.check(TokenType.DOT)) {
        id += this.advance().value;
      } else if (this.check(TokenType.REAL)) {
        // Version number like v1.0.0
        id += this.advance().value;
      } else {
        break;
      }
    }

    if (!id) {
      throw this.error("Expected archetype ID");
    }

    return id;
  }

  private parseLanguageSection(archetype: openehr_am.ARCHETYPE): void {
    this.consumeKeyword(TokenType.LANGUAGE, "Expected 'language' keyword");

    // Parse ODIN content
    const odinTokens = this.collectOdinTokens();
    const odinParser = new OdinParser(odinTokens);
    const languageData = odinParser.parse() as OdinObject;

    // Convert to archetype properties
    if (languageData.original_language) {
      // Store language as a string for now
      // In a complete implementation, would convert to proper CODE_PHRASE
      this.warnings.push(
        "Language section parsed but not fully converted to AOM objects"
      );
    }
  }

  private parseDescriptionSection(archetype: openehr_am.ARCHETYPE): void {
    this.consumeKeyword(TokenType.DESCRIPTION, "Expected 'description' keyword");

    // Parse ODIN content
    const odinTokens = this.collectOdinTokens();
    const odinParser = new OdinParser(odinTokens);
    const descriptionData = odinParser.parse() as OdinObject;

    // Convert to archetype properties
    // In a complete implementation, would convert to RESOURCE_DESCRIPTION
    this.warnings.push(
      "Description section parsed but not fully converted to AOM objects"
    );
  }

  private parseDefinitionSection(archetype: openehr_am.ARCHETYPE): void {
    this.consumeKeyword(TokenType.DEFINITION, "Expected 'definition' keyword");

    // Collect tokens for the definition section (until next section keyword)
    const defTokens = this.collectDefinitionTokens();
    
    // Parse using cADL parser
    const cadlParser = new CadlParser(defTokens);
    try {
      const definition = cadlParser.parseComplexObject();
      archetype.definition = definition;
    } catch (e) {
      this.warnings.push(`Definition section parsing error: ${e.message}`);
      // Create minimal definition as fallback
      const definition = new openehr_am.C_COMPLEX_OBJECT();
      archetype.definition = definition;
    }
  }

  private collectDefinitionTokens(): Token[] {
    const defTokens: Token[] = [];
    let depth = 0;

    // Collect tokens until we reach the next section keyword or EOF
    while (!this.isAtEnd()) {
      const token = this.peek();

      // Track depth of braces
      if (token.type === TokenType.LBRACE) {
        depth++;
      } else if (token.type === TokenType.RBRACE) {
        depth--;
      }

      // If we're at depth 0 and hit a section keyword, stop
      if (
        depth === 0 &&
        (token.type === TokenType.LANGUAGE ||
          token.type === TokenType.DESCRIPTION ||
          token.type === TokenType.RULES ||
          token.type === TokenType.TERMINOLOGY ||
          token.type === TokenType.ANNOTATIONS)
      ) {
        break;
      }

      defTokens.push(this.advance());

      // Stop when depth returns to 0 after collecting content
      if (depth === 0 && defTokens.length > 1) {
        break;
      }
    }

    // Add EOF token
    defTokens.push({
      type: TokenType.EOF,
      value: "",
      line: this.peek().line,
      column: this.peek().column,
    });

    return defTokens;
  }

  private parseRulesSection(archetype: openehr_am.ARCHETYPE): void {
    this.consumeKeyword(TokenType.RULES, "Expected 'rules' keyword");

    // Parse rules (expression language)
    // For now, skip
    this.warnings.push("Rules section not yet implemented");
    this.skipToNextSection();
  }

  private parseTerminologySection(archetype: openehr_am.ARCHETYPE): void {
    this.consumeKeyword(
      TokenType.TERMINOLOGY,
      "Expected 'terminology' keyword"
    );

    // Parse ODIN content
    const odinTokens = this.collectOdinTokens();
    const odinParser = new OdinParser(odinTokens);
    const terminologyData = odinParser.parse() as OdinObject;

    // Create terminology object
    const terminology = new openehr_am.ARCHETYPE_ONTOLOGY();
    archetype.ontology = terminology;

    // Parse term_definitions
    if (terminologyData.term_definitions) {
      // term_definitions is a map of language -> term map
      // For now, just record that we parsed it
      this.warnings.push(
        "Terminology section parsed but not fully converted to AOM objects"
      );
    }
  }

  private parseAnnotationsSection(archetype: openehr_am.ARCHETYPE): void {
    this.consumeKeyword(
      TokenType.ANNOTATIONS,
      "Expected 'annotations' keyword"
    );

    // Parse ODIN content
    this.collectOdinTokens();

    this.warnings.push("Annotations section not yet implemented");
  }

  private collectOdinTokens(): Token[] {
    const odinTokens: Token[] = [];
    let depth = 0;
    let hasContent = false;

    // Collect tokens until we reach the next section keyword or EOF
    while (!this.isAtEnd()) {
      const token = this.peek();

      // Track depth of angle brackets
      if (token.type === TokenType.LANGLE) {
        depth++;
        hasContent = true;
      } else if (token.type === TokenType.RANGLE) {
        depth--;
      }

      // If we're at depth 0 and hit a section keyword (and we've collected content), stop
      if (
        depth === 0 &&
        hasContent &&
        (token.type === TokenType.LANGUAGE ||
          token.type === TokenType.DESCRIPTION ||
          token.type === TokenType.DEFINITION ||
          token.type === TokenType.RULES ||
          token.type === TokenType.TERMINOLOGY ||
          token.type === TokenType.ANNOTATIONS)
      ) {
        break;
      }

      odinTokens.push(this.advance());

      // Stop when depth returns to 0 after collecting at least one opening bracket
      if (depth === 0 && hasContent && odinTokens.length > 1) {
        break;
      }
    }

    // Add EOF token
    odinTokens.push({
      type: TokenType.EOF,
      value: "",
      line: this.peek().line,
      column: this.peek().column,
    });

    return odinTokens;
  }

  private skipToNextSection(): void {
    let depth = 0;
    
    while (!this.isAtEnd()) {
      const token = this.peek();

      // Track depth
      if (token.type === TokenType.LBRACE) {
        depth++;
      } else if (token.type === TokenType.RBRACE) {
        depth--;
      }

      // If we're at depth 0 and hit a section keyword, stop
      if (
        depth === 0 &&
        (token.type === TokenType.LANGUAGE ||
          token.type === TokenType.DESCRIPTION ||
          token.type === TokenType.DEFINITION ||
          token.type === TokenType.RULES ||
          token.type === TokenType.TERMINOLOGY ||
          token.type === TokenType.ANNOTATIONS)
      ) {
        break;
      }

      this.advance();
    }
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

  private consumeKeyword(type: TokenType, message: string): Token {
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
      `Parse error at line ${token.line}, column ${token.column}: ${message}`
    );
  }
}
