/**
 * ADL2 Parser
 * 
 * Main parser for ADL2 archetype files.
 * Parses complete archetype/template files into AOM (Archetype Object Model) instances.
 */

import { Token, TokenType } from "./adl2_tokenizer.ts";
import { OdinParser, OdinObject, OdinValue } from "./odin_parser.ts";
import {
  applyTerminologyOdin,
  mapDescription,
  mapOriginalLanguage,
} from "./odin_aom_mapper.ts";
import { CadlParser } from "./cadl_parser.ts";
import { RulesParser } from "./rules_parser.ts";
import {
  applyAnnotationsOdin,
  applyRmOverlayOdin,
} from "./aom_odin_sections.ts";
import * as openehr_am from "../openehr_am.ts";
import * as openehr_base from "../openehr_base.ts";

/**
 * ADL2 Parser result
 */
export interface ADL2ParseResult {
  kind: "archetype" | "template" | "operational_template";
  archetype?: openehr_am.ARCHETYPE;
  template?: openehr_am.TEMPLATE;
  operationalTemplate?: openehr_am.OPERATIONAL_TEMPLATE;
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
    if (this.isAtEnd()) {
      throw this.error("Empty ADL2 input");
    }

    const keyword = this.peek().type;
    if (keyword === TokenType.TEMPLATE) {
      const template = this.parseTemplate();
      return { kind: "template", template, warnings: this.warnings };
    }
    if (keyword === TokenType.OPERATIONAL_TEMPLATE) {
      const operationalTemplate = this.parseOperationalTemplate();
      return {
        kind: "operational_template",
        operationalTemplate,
        warnings: this.warnings,
      };
    }
    if (keyword === TokenType.ARCHETYPE) {
      const archetype = this.parseArchetype();
      return { kind: "archetype", archetype, warnings: this.warnings };
    }

    throw this.error(
      `Expected 'archetype', 'template', or 'operational_template', got ${this.peek().value}`
    );
  }

  private parseTemplate(): openehr_am.TEMPLATE {
    this.consumeKeyword(TokenType.TEMPLATE, "Expected 'template' keyword");
    return this.parseAuthoredArchetype(new openehr_am.TEMPLATE());
  }

  private parseOperationalTemplate(): openehr_am.OPERATIONAL_TEMPLATE {
    this.consumeKeyword(
      TokenType.OPERATIONAL_TEMPLATE,
      "Expected 'operational_template' keyword"
    );
    return this.parseAuthoredArchetype(new openehr_am.OPERATIONAL_TEMPLATE());
  }

  private parseArchetype(): openehr_am.ARCHETYPE {
    this.consumeKeyword(TokenType.ARCHETYPE, "Expected 'archetype' keyword");
    return this.parseAuthoredArchetype(new openehr_am.ARCHETYPE());
  }

  private parseAuthoredArchetype<T extends openehr_am.ARCHETYPE>(archetype: T): T {

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
      } else if (this.check(TokenType.TERMINOLOGY) || this.check(TokenType.ONTOLOGY)) {
        this.parseTerminologySection(archetype);
      } else if (this.check(TokenType.ANNOTATIONS)) {
        this.parseAnnotationsSection(archetype);
      } else if (this.check(TokenType.RM_OVERLAY)) {
        this.parseRmOverlaySection(archetype);
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

      let value: string;
      if (this.check(TokenType.EQUALS)) {
        this.advance();
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
      } else {
        value = "true";
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

    const lang = mapOriginalLanguage(languageData);
    if (lang) archetype.original_language = lang;
  }

  private parseDescriptionSection(archetype: openehr_am.ARCHETYPE): void {
    this.consumeKeyword(TokenType.DESCRIPTION, "Expected 'description' keyword");

    // Parse ODIN content
    const odinTokens = this.collectOdinTokens();
    const odinParser = new OdinParser(odinTokens);
    const descriptionData = odinParser.parse() as OdinObject;

    if (Object.keys(descriptionData).length > 0) {
      archetype.description = mapDescription(descriptionData);
    }
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
          token.type === TokenType.ONTOLOGY ||
          token.type === TokenType.ANNOTATIONS ||
          token.type === TokenType.RM_OVERLAY)
      ) {
        break;
      }

      defTokens.push(this.advance());
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

    const rulesTokens = this.collectRulesTokens();
    const { assertions, warnings } = new RulesParser(rulesTokens).parse();
    archetype.invariants = assertions.length > 0 ? assertions : undefined;
    this.warnings.push(...warnings);
  }

  private collectRulesTokens(): Token[] {
    const out: Token[] = [];
    while (!this.isAtEnd()) {
      const token = this.peek();
      if (
        token.type === TokenType.TERMINOLOGY ||
        token.type === TokenType.ANNOTATIONS ||
        token.type === TokenType.RM_OVERLAY
      ) {
        break;
      }
      out.push(this.advance());
    }
    out.push({
      type: TokenType.EOF,
      value: "",
      line: this.peek().line,
      column: this.peek().column,
    });
    return out;
  }

  private parseTerminologySection(archetype: openehr_am.ARCHETYPE): void {
    if (this.check(TokenType.ONTOLOGY)) {
      this.advance();
    } else {
      this.consumeKeyword(
        TokenType.TERMINOLOGY,
        "Expected 'terminology' keyword",
      );
    }

    // Parse ODIN content
    const odinTokens = this.collectOdinTokens();
    try {
      const odinParser = new OdinParser(odinTokens);
      const terminologyData = odinParser.parse() as OdinObject;
      applyTerminologyOdin(archetype, terminologyData);
    } catch (e) {
      this.warnings.push(
        `Terminology section parse error: ${e instanceof Error ? e.message : String(e)}`,
      );
      archetype.ontology = archetype.ontology ?? new openehr_am.ARCHETYPE_ONTOLOGY();
    }
  }

  private parseAnnotationsSection(archetype: openehr_am.ARCHETYPE): void {
    this.consumeKeyword(
      TokenType.ANNOTATIONS,
      "Expected 'annotations' keyword"
    );

    const odinTokens = this.collectOdinTokens();
    try {
      const odinParser = new OdinParser(odinTokens);
      const data = odinParser.parse() as OdinObject;
      applyAnnotationsOdin(archetype, data);
    } catch (e) {
      this.warnings.push(
        `Annotations section parse error: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  private parseRmOverlaySection(archetype: openehr_am.ARCHETYPE): void {
    this.consumeKeyword(
      TokenType.RM_OVERLAY,
      "Expected 'rm_overlay' keyword",
    );

    const odinTokens = this.collectOdinTokens();
    try {
      const odinParser = new OdinParser(odinTokens);
      const data = odinParser.parse() as OdinObject;
      applyRmOverlayOdin(archetype, data);
    } catch (e) {
      this.warnings.push(
        `rm_overlay section parse error: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
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
          token.type === TokenType.ONTOLOGY ||
          token.type === TokenType.ANNOTATIONS ||
          token.type === TokenType.RM_OVERLAY)
      ) {
        break;
      }

      odinTokens.push(this.advance());
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
