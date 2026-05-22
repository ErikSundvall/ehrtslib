/**
 * ADL2 Tokenizer
 * 
 * Hand-written tokenizer for ADL2 syntax following the hybrid approach.
 * Converts ADL2 text into a stream of tokens for the parser.
 */

export enum TokenType {
  // Keywords
  ARCHETYPE = "ARCHETYPE",
  TEMPLATE = "TEMPLATE",
  OPERATIONAL_TEMPLATE = "OPERATIONAL_TEMPLATE",
  TEMPLATE_OVERLAY = "TEMPLATE_OVERLAY",
  LANGUAGE = "LANGUAGE",
  DESCRIPTION = "DESCRIPTION",
  DEFINITION = "DEFINITION",
  RULES = "RULES",
  TERMINOLOGY = "TERMINOLOGY",
  ANNOTATIONS = "ANNOTATIONS",
  RM_OVERLAY = "RM_OVERLAY",
  MATCHES = "MATCHES",
  OCCURRENCES = "OCCURRENCES",
  CARDINALITY = "CARDINALITY",
  EXISTENCE = "EXISTENCE",
  SPECIALIZE = "SPECIALIZE",
  /** Rules / expression keywords */
  FOR_ALL = "FOR_ALL",
  THERE_EXISTS = "THERE_EXISTS",
  EXISTS = "EXISTS",
  IMPLIES = "IMPLIES",
  AND = "AND",
  OR = "OR",
  XOR = "XOR",
  NOT = "NOT",
  TRUE = "TRUE",
  FALSE = "FALSE",
  IN = "IN",

  // Literals
  VARIABLE = "VARIABLE",
  IDENTIFIER = "IDENTIFIER",
  STRING = "STRING",
  INTEGER = "INTEGER",
  REAL = "REAL",
  
  // Delimiters
  LPAREN = "LPAREN",          // (
  RPAREN = "RPAREN",          // )
  LBRACKET = "LBRACKET",      // [
  RBRACKET = "RBRACKET",      // ]
  LBRACE = "LBRACE",          // {
  RBRACE = "RBRACE",          // }
  LANGLE = "LANGLE",          // <
  RANGLE = "RANGLE",          // >
  
  // Operators
  DOT = "DOT",                // .
  COMMA = "COMMA",            // ,
  SEMICOLON = "SEMICOLON",    // ;
  COLON = "COLON",            // :
  DOUBLE_COLON = "DOUBLE_COLON", // ::
  EQUALS = "EQUALS",          // =
  ASSIGN = "ASSIGN",          // :=
  NOT_EQUALS = "NOT_EQUALS",  // /=
  PIPE = "PIPE",              // |
  ELLIPSIS = "ELLIPSIS",      // ..
  STAR = "STAR",              // *
  SLASH = "SLASH",            // /
  
  // Special
  AT_CODE = "AT_CODE",        // at0000
  ID_CODE = "ID_CODE",        // id1
  AC_CODE = "AC_CODE",        // ac0000
  REGEX = "REGEX",            // /pattern/
  
  // Control
  NEWLINE = "NEWLINE",
  WHITESPACE = "WHITESPACE",
  COMMENT = "COMMENT",
  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export class ADL2Tokenizer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  
  constructor(input: string) {
    this.input = input;
  }
  
  /**
   * Tokenize the input ADL2 text
   */
  tokenize(): Token[] {
    this.tokens = [];
    // UTF-8 BOM (e.g. Archie whitespace fixture)
    if (this.input.charCodeAt(0) === 0xfeff) {
      this.position = 1;
      this.column = 2;
    }

    while (!this.isAtEnd()) {
      this.skipWhitespaceAndComments();
      if (this.isAtEnd()) break;
      
      const token = this.nextToken();
      if (token) {
        this.tokens.push(token);
      }
    }
    
    // Add EOF token
    this.tokens.push({
      type: TokenType.EOF,
      value: "",
      line: this.line,
      column: this.column,
    });
    
    return this.tokens;
  }
  
  private nextToken(): Token | null {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    
    const char = this.peek();
    
    // Single character tokens
    switch (char) {
      case "(":
        this.advance();
        return this.makeToken(TokenType.LPAREN, "(", startLine, startColumn);
      case ")":
        this.advance();
        return this.makeToken(TokenType.RPAREN, ")", startLine, startColumn);
      case "[":
        this.advance();
        return this.makeToken(TokenType.LBRACKET, "[", startLine, startColumn);
      case "]":
        this.advance();
        return this.makeToken(TokenType.RBRACKET, "]", startLine, startColumn);
      case "{":
        this.advance();
        return this.makeToken(TokenType.LBRACE, "{", startLine, startColumn);
      case "}":
        this.advance();
        return this.makeToken(TokenType.RBRACE, "}", startLine, startColumn);
      case "<": {
        if (this.previousCharsMatch(2, "..")) {
          this.advance();
          if (this.peek() === "=") {
            this.advance();
            return this.makeToken(TokenType.IDENTIFIER, "<=", startLine, startColumn);
          }
          if (this.isDigit(this.peek())) {
            return this.makeToken(TokenType.IDENTIFIER, "<", startLine, startColumn);
          }
        }
        this.advance();
        return this.makeToken(TokenType.LANGLE, "<", startLine, startColumn);
      }
      case ">": {
        const before = this.charBefore();
        if (before === "|" || before === "{") {
          this.advance();
          if (this.peek() === "=") {
            this.advance();
            return this.makeToken(TokenType.IDENTIFIER, ">=", startLine, startColumn);
          }
          if (this.isDigit(this.peek())) {
            return this.makeToken(TokenType.IDENTIFIER, ">", startLine, startColumn);
          }
        }
        this.advance();
        return this.makeToken(TokenType.RANGLE, ">", startLine, startColumn);
      }
      case ",":
        this.advance();
        return this.makeToken(TokenType.COMMA, ",", startLine, startColumn);
      case ";":
        this.advance();
        return this.makeToken(TokenType.SEMICOLON, ";", startLine, startColumn);
      case "=":
        this.advance();
        return this.makeToken(TokenType.EQUALS, "=", startLine, startColumn);
      case "!":
        this.advance();
        if (this.peek() === "=") {
          this.advance();
          return this.makeToken(TokenType.NOT_EQUALS, "!=", startLine, startColumn);
        }
        return this.makeToken(TokenType.NOT, "!", startLine, startColumn);
      case "$": {
        this.advance();
        let varName = "$";
        while (!this.isAtEnd() && this.isIdentifierPart(this.peek())) {
          varName += this.peek();
          this.advance();
        }
        return this.makeToken(TokenType.VARIABLE, varName, startLine, startColumn);
      }
      case "*":
        this.advance();
        return this.makeToken(TokenType.STAR, "*", startLine, startColumn);
      case "/": {
        if (this.charBefore() === "{") {
          return this.scanRegex(startLine, startColumn);
        }
        this.advance();
        if (this.peek() === "=") {
          this.advance();
          return this.makeToken(TokenType.NOT_EQUALS, "/=", startLine, startColumn);
        }
        return this.makeToken(TokenType.SLASH, "/", startLine, startColumn);
      }
      case "|":
        this.advance();
        return this.makeToken(TokenType.PIPE, "|", startLine, startColumn);
    }
    
    // Multi-character tokens
    if (char === ".") {
      this.advance();
      if (this.peek() === ".") {
        this.advance();
        return this.makeToken(TokenType.ELLIPSIS, "..", startLine, startColumn);
      }
      return this.makeToken(TokenType.DOT, ".", startLine, startColumn);
    }
    
    if (char === ":") {
      this.advance();
      if (this.peek() === "=") {
        this.advance();
        return this.makeToken(TokenType.ASSIGN, ":=", startLine, startColumn);
      }
      if (this.peek() === ":") {
        this.advance();
        return this.makeToken(TokenType.DOUBLE_COLON, "::", startLine, startColumn);
      }
      return this.makeToken(TokenType.COLON, ":", startLine, startColumn);
    }
    
    // String literals
    if (char === '"') {
      return this.scanString(startLine, startColumn);
    }
    
    // Numbers
    if (this.isDigit(char) || (char === "-" && this.isDigit(this.peekNext()))) {
      return this.scanNumber(startLine, startColumn);
    }
    
    // Identifiers and keywords (including Unicode letters in ADL text)
    if (this.isIdentifierStart(char)) {
      return this.scanIdentifierOrKeyword(startLine, startColumn);
    }

    // cADL pattern punctuation (e.g. yyyy-??-??, hh:mm:??)
    if (char === "?" || char === "X") {
      this.advance();
      return this.makeToken(TokenType.IDENTIFIER, char, startLine, startColumn);
    }
    
    // Escaped character outside strings (e.g. regex \. in cADL)
    if (char === "\\" && !this.isAtEnd()) {
      this.advance();
      const escaped = this.advance();
      return this.makeToken(TokenType.IDENTIFIER, `\\${escaped}`, startLine, startColumn);
    }

    throw new Error(
      `Unexpected character '${char}' at line ${this.line}, column ${this.column}`
    );
  }
  
  private scanRegex(startLine: number, startColumn: number): Token {
    this.advance(); // opening /
    let value = "";
    while (!this.isAtEnd()) {
      if (this.peek() === "/") {
        const next = this.peekNext();
        if (
          next === "}" || next === ")" || next === "," || next === ";" ||
          next === "\n" || next === "\r"
        ) {
          break;
        }
      }
      if (this.peek() === "\\") {
        this.advance();
        value += "\\" + this.peek();
      } else {
        value += this.peek();
      }
      this.advance();
    }
    if (this.isAtEnd() || this.peek() !== "/") {
      throw new Error(
        `Unterminated regex at line ${startLine}, column ${startColumn}`
      );
    }
    this.advance(); // closing /
    return this.makeToken(TokenType.REGEX, value, startLine, startColumn);
  }

  private scanString(startLine: number, startColumn: number): Token {
    this.advance(); // consume opening quote
    let value = "";
    
    while (!this.isAtEnd() && this.peek() !== '"') {
      if (this.peek() === "\\") {
        this.advance();
        // Handle escape sequences
        const next = this.peek();
        switch (next) {
          case "n":
            value += "\n";
            break;
          case "t":
            value += "\t";
            break;
          case "r":
            value += "\r";
            break;
          case "\\":
            value += "\\";
            break;
          case '"':
            value += '"';
            break;
          default:
            value += next;
        }
        this.advance();
      } else {
        value += this.peek();
        this.advance();
      }
    }
    
    if (this.isAtEnd()) {
      throw new Error(
        `Unterminated string at line ${startLine}, column ${startColumn}`
      );
    }
    
    this.advance(); // consume closing quote
    return this.makeToken(TokenType.STRING, value, startLine, startColumn);
  }
  
  private scanNumber(startLine: number, startColumn: number): Token {
    let value = "";
    let hasDecimal = false;
    
    // Handle negative sign
    if (this.peek() === "-") {
      value += this.peek();
      this.advance();
    }
    
    // Scan digits - allow multiple dots for version numbers like 2.0.5
    while (!this.isAtEnd() && (this.isDigit(this.peek()) || this.peek() === ".")) {
      if (this.peek() === ".") {
        if (!this.isDigit(this.peekNext())) break; // Not followed by digit, stop
        hasDecimal = true;
      }
      value += this.peek();
      this.advance();
    }
    
    return this.makeToken(
      hasDecimal ? TokenType.REAL : TokenType.INTEGER,
      value,
      startLine,
      startColumn
    );
  }
  
  private scanIdentifierOrKeyword(startLine: number, startColumn: number): Token {
    let value = "";
    
    // Check for special codes (at0000, id1, ac0000)
    if (this.peek() === "a") {
      const next = this.peekNext();
      if (next === "t" || next === "c") {
        // Could be at code or ac code
        const prefix = this.peek() + this.peekNext();
        const tempPos = this.position;
        this.position += 2;
        
        if (!this.isAtEnd() && this.isDigit(this.peek())) {
          // It's a code
          let code = prefix;
          while (!this.isAtEnd() && this.isDigit(this.peek())) {
            code += this.peek();
            this.advance();
          }
          return this.makeToken(
            next === "t" ? TokenType.AT_CODE : TokenType.AC_CODE,
            code,
            startLine,
            startColumn
          );
        }
        
        // Not a code, restore position
        this.position = tempPos;
      }
    }
    
    // Check for id code
    if (this.peek() === "i" && this.peekNext() === "d") {
      const tempPos = this.position;
      this.position += 2;
      
      if (!this.isAtEnd() && this.isDigit(this.peek())) {
        let code = "id";
        while (!this.isAtEnd() && this.isDigit(this.peek())) {
          code += this.peek();
          this.advance();
        }
        return this.makeToken(TokenType.ID_CODE, code, startLine, startColumn);
      }
      
      // Not an id code, restore position
      this.position = tempPos;
    }
    
    // Regular identifier (hyphens for HRIDs; ?/X for cADL date/time patterns)
    while (!this.isAtEnd() && this.isIdentifierPart(this.peek())) {
      value += this.peek();
      this.advance();
    }
    
    // Check if it's a keyword
    const type = this.getKeywordType(value);
    return this.makeToken(type, value, startLine, startColumn);
  }
  
  private getKeywordType(value: string): TokenType {
    const lower = value.toLowerCase();
    switch (lower) {
      case "for_all":
        return TokenType.FOR_ALL;
      case "there_exists":
        return TokenType.THERE_EXISTS;
      case "exists":
        return TokenType.EXISTS;
      case "implies":
        return TokenType.IMPLIES;
      case "and":
        return TokenType.AND;
      case "or":
        return TokenType.OR;
      case "xor":
        return TokenType.XOR;
      case "not":
        return TokenType.NOT;
      case "in":
        return TokenType.IN;
      default:
        break;
    }
    const upper = value.toUpperCase();
    switch (upper) {
      case "ARCHETYPE":
        return TokenType.ARCHETYPE;
      case "TEMPLATE":
        return TokenType.TEMPLATE;
      case "OPERATIONAL_TEMPLATE":
        return TokenType.OPERATIONAL_TEMPLATE;
      case "TEMPLATE_OVERLAY":
        return TokenType.TEMPLATE_OVERLAY;
      case "LANGUAGE":
        return TokenType.LANGUAGE;
      case "DESCRIPTION":
        return TokenType.DESCRIPTION;
      case "DEFINITION":
        return TokenType.DEFINITION;
      case "RULES":
        return TokenType.RULES;
      case "TERMINOLOGY":
        return TokenType.TERMINOLOGY;
      case "ANNOTATIONS":
        return TokenType.ANNOTATIONS;
      case "RM_OVERLAY":
        return TokenType.RM_OVERLAY;
      case "MATCHES":
        return TokenType.MATCHES;
      case "OCCURRENCES":
        return TokenType.OCCURRENCES;
      case "CARDINALITY":
        return TokenType.CARDINALITY;
      case "EXISTENCE":
        return TokenType.EXISTENCE;
      case "SPECIALIZE":
        return TokenType.SPECIALIZE;
      case "USE_ARCHETYPE":
      case "USE":
        return TokenType.IDENTIFIER;
      case "ALLOW_ARCHETYPE":
        return TokenType.IDENTIFIER;
      case "INCLUDE":
      case "EXCLUDE":
      case "ORDERED":
      case "UNORDERED":
      case "UNIQUE":
        return TokenType.IDENTIFIER;
      default:
        return TokenType.IDENTIFIER;
    }
  }
  
  private skipWhitespaceAndComments(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();
      
      // Skip whitespace
      if (char === " " || char === "\t" || char === "\r") {
        this.advance();
        continue;
      }
      
      if (char === "\n") {
        this.advance();
        this.line++;
        this.column = 1;
        continue;
      }
      
      // Skip comments
      if (char === "-" && this.peekNext() === "-") {
        // Line comment
        while (!this.isAtEnd() && this.peek() !== "\n") {
          this.advance();
        }
        continue;
      }
      
      break;
    }
  }
  
  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  private charBefore(): string {
    if (this.position <= 0) return "";
    return this.input[this.position - 1];
  }

  private previousCharsMatch(length: number, text: string): boolean {
    const start = this.position - length;
    if (start < 0) return false;
    return this.input.slice(start, this.position) === text;
  }
  
  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.input[this.position];
  }
  
  private peekNext(): string {
    if (this.position + 1 >= this.input.length) return "\0";
    return this.input[this.position + 1];
  }
  
  private advance(): string {
    const char = this.input[this.position];
    this.position++;
    this.column++;
    return char;
  }
  
  private isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
  }
  
  private isAlpha(char: string): boolean {
    return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
  }
  
  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private isUnicodeLetter(char: string): boolean {
    return char.length === 1 && /\p{L}/u.test(char);
  }

  private isIdentifierStart(char: string): boolean {
    return this.isAlpha(char) || char === "_" || this.isUnicodeLetter(char);
  }

  private isIdentifierPart(char: string): boolean {
    return (
      this.isAlphaNumeric(char) ||
      char === "_" ||
      char === "-" ||
      char === "?" ||
      char === "X" ||
      this.isUnicodeLetter(char)
    );
  }

  private makeToken(
    type: TokenType,
    value: string,
    line: number,
    column: number
  ): Token {
    return { type, value, line, column };
  }
}
