/**
 * cADL (Constraint ADL) Parser
 *
 * Parses the definition section of ADL2 files.
 * Based on cadl.g4 grammar from openEHR/archie.
 */

import { Token, TokenType } from "./adl2_tokenizer.ts";
import * as openehr_am from "../am/openehr_am.ts";
import * as openehr_base from "../base/openehr_base.ts";
import type { QuantityItemInterval } from "./legacy/xml_aom_mapper.ts";

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
    const obj = this.isUseArchetype()
      ? this.parseCArchetypeRoot()
      : this.parseComplexObjectBody(new openehr_am.C_COMPLEX_OBJECT());
    this.skipComments();
    if (!this.isAtEnd() && this.peek().type !== TokenType.EOF) {
      throw this.error(
        `Unexpected token after definition: ${this.peek().value}`,
      );
    }
    return obj;
  }

  private parseComplexObjectBody(
    cObject: openehr_am.C_COMPLEX_OBJECT,
  ): openehr_am.C_COMPLEX_OBJECT {
    const typeId = this.consume(TokenType.IDENTIFIER, "Expected type identifier");
    if (!/^[A-Z]/.test(typeId.value)) {
      throw this.error(`Unexpected token: ${typeId.value}`);
    }
    cObject.rm_type_name = typeId.value;

    if (this.check(TokenType.LBRACKET)) {
      this.advance();
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
    }

    if (this.check(TokenType.OCCURRENCES)) {
      this.parseOccurrences(cObject);
    }

    if (this.check(TokenType.MATCHES)) {
      this.advance();
      this.consume(TokenType.LBRACE, "Expected '{' after matches");

      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        this.skipComments();
        if (this.check(TokenType.LBRACKET)) {
          const tupleAttr = this.tryParseQuantityTupleAttribute();
          if (tupleAttr) {
            if (!cObject.attributes) cObject.attributes = [];
            cObject.attributes.push(tupleAttr);
            continue;
          }
          this.skipTupleAttribute();
          continue;
        }
        const posBefore = this.position;
        const attribute = this.parseAttribute();
        if (attribute) {
          if (!cObject.attributes) cObject.attributes = [];
          cObject.attributes.push(attribute);
        } else if (this.position === posBefore) {
          this.rejectUnexpectedInMatches();
        }
      }

      this.consume(TokenType.RBRACE, "Expected '}' to close matches block");
    }

    if (cObject.rm_type_name === "DV_QUANTITY") {
      return this.reifyQuantity(cObject);
    }
    return cObject;
  }

  private parseCArchetypeRoot(): openehr_am.C_ARCHETYPE_ROOT {
    if (this.checkIdentifier("use_archetype")) {
      this.advance();
    } else {
      this.consumeKeyword("use");
      this.consumeKeyword("archetype");
    }
    const root = new openehr_am.C_ARCHETYPE_ROOT();
    return this.parseArchetypeRootTail(root);
  }

  private parseArchetypeRootTail(
    root: openehr_am.C_ARCHETYPE_ROOT,
  ): openehr_am.C_ARCHETYPE_ROOT {
    const typeId = this.consume(TokenType.IDENTIFIER, "Expected type identifier");
    root.rm_type_name = typeId.value;

    this.consume(TokenType.LBRACKET, "Expected '['");
    const nodeIdToken = this.peek();
    if (
      nodeIdToken.type === TokenType.ID_CODE ||
      nodeIdToken.type === TokenType.AT_CODE
    ) {
      root.node_id = this.advance().value;
    } else if (!this.check(TokenType.COMMA) && !this.check(TokenType.RBRACKET)) {
      throw this.error("Expected node id code (id1, at0000, etc.)");
    }

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

  private isKeywordAttributeName(): boolean {
    const v = this.peek()?.value ?? "";
    if (!/^[a-z_][a-z0-9_]*$/.test(v)) return false;
    const next = this.peekAhead(1)?.type;
    return next === TokenType.MATCHES || next === TokenType.EXISTENCE ||
      next === TokenType.CARDINALITY;
  }

  /** ADL2 `use_archetype` (single token) or legacy `use archetype`. */
  private isUseArchetype(): boolean {
    if (this.checkIdentifier("use_archetype")) return true;
    return this.checkKeyword("use") &&
      this.peekAhead(1)?.value.toLowerCase() === "archetype";
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
    if (this.check(TokenType.LBRACKET)) {
      this.advance();
      const nodeIdToken = this.peek();
      if (
        nodeIdToken.type === TokenType.ID_CODE ||
        nodeIdToken.type === TokenType.AT_CODE
      ) {
        slot.node_id = this.advance().value;
      } else if (!this.check(TokenType.RBRACKET)) {
        throw this.error("Expected node id code (id1, at0000, etc.)");
      }
      this.consume(TokenType.RBRACKET, "Expected ']'");
    }

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

  /**
   * A differential-path segment. Section keywords (`description`, `language`)
   * are RM attribute names inside a path; `matches` / `existence` /
   * `cardinality` / `occurrences` end the path.
   */
  private isDifferentialPathToken(): boolean {
    if (
      this.check(TokenType.SLASH) ||
      this.check(TokenType.IDENTIFIER) ||
      this.check(TokenType.LBRACKET) ||
      this.check(TokenType.RBRACKET) ||
      this.check(TokenType.ID_CODE) ||
      this.check(TokenType.AT_CODE) ||
      this.check(TokenType.AC_CODE) ||
      this.check(TokenType.DOT) ||
      this.check(TokenType.INTEGER)
    ) {
      return true;
    }
    const t = this.peek();
    if (
      !t ||
      t.type === TokenType.MATCHES ||
      t.type === TokenType.EXISTENCE ||
      t.type === TokenType.CARDINALITY ||
      t.type === TokenType.OCCURRENCES ||
      t.type === TokenType.EOF
    ) {
      return false;
    }
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(t.value);
  }

  /**
   * Specialised differential path attribute:
   *   /items[id6]/value matches { … }
   *   /activities[id2]/description[id10]/items[id63]/value matches { … }
   * Stored with rm_attribute_name equal to the path string.
   */
  private parsePathAttribute(): openehr_am.C_ATTRIBUTE {
    let path = "";
    while (this.isDifferentialPathToken()) {
      path += this.advance().value;
    }
    let attribute: openehr_am.C_ATTRIBUTE = new openehr_am.C_SINGLE_ATTRIBUTE();
    attribute.rm_attribute_name = path;

    if (this.check(TokenType.EXISTENCE)) {
      const existence = this.parseExistence();
      (attribute as { existence: openehr_base.Multiplicity_interval }).existence =
        existence;
    }
    if (this.check(TokenType.CARDINALITY)) {
      const card = this.parseCardinality();
      if (!(attribute instanceof openehr_am.C_MULTIPLE_ATTRIBUTE)) {
        const multi = new openehr_am.C_MULTIPLE_ATTRIBUTE();
        multi.rm_attribute_name = attribute.rm_attribute_name;
        (multi as { existence?: openehr_base.Multiplicity_interval }).existence =
          (attribute as { existence?: openehr_base.Multiplicity_interval })
            .existence;
        attribute = multi;
      }
      (attribute as openehr_am.C_MULTIPLE_ATTRIBUTE).cardinality = card;
    }
    if (this.check(TokenType.MATCHES)) {
      this.advance();
      this.consume(TokenType.LBRACE, "Expected '{' after matches in path attribute");
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        this.skipComments();
        while (this.check(TokenType.COMMA)) this.advance();
        if (this.check(TokenType.RBRACE)) break;
        const posBefore = this.position;
        const termChild = this.tryParseTerminologyConstraint();
        if (termChild) {
          this.pushAttributeChild(attribute, termChild);
          continue;
        }
        const intervalChild = this.tryParseIntervalConstraint();
        if (intervalChild) {
          this.pushAttributeChild(attribute, intervalChild);
          this.maybeApplyAssumedValueSuffix(intervalChild);
          continue;
        }
        const regexChild = this.tryParseRegexConstraint();
        if (regexChild) {
          this.pushAttributeChild(attribute, regexChild);
          this.maybeApplyAssumedValueSuffix(regexChild);
          continue;
        }
        const stringChild = this.tryParseStringConstraint();
        if (stringChild) {
          this.pushAttributeChild(attribute, stringChild);
          this.maybeApplyAssumedValueSuffix(stringChild);
          continue;
        }
        const numChild = this.tryParseNumericConstraint();
        if (numChild) {
          this.pushAttributeChild(attribute, numChild);
          this.maybeApplyAssumedValueSuffix(numChild);
          continue;
        }
        const literalChild = this.tryParseLiteralPrimitiveConstraint();
        if (literalChild) {
          this.pushAttributeChild(attribute, literalChild);
          this.maybeApplyAssumedValueSuffix(literalChild);
          continue;
        }
        const child = this.parseChildObject();
        if (child) {
          this.pushAttributeChild(attribute, child);
        } else if (this.position === posBefore) {
          this.rejectUnexpectedInMatches();
        }
      }
      this.consume(TokenType.RBRACE, "Expected '}' to close path attribute matches");
    }
    return attribute;
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
      this.skipComments();
      const constraint = new openehr_am.ARCHETYPE_ID_CONSTRAINT();
      const str = new openehr_am.C_STRING();
      // Archie / CKM form:
      //   archetype_id/value matches {/openEHR-EHR-CLUSTER\..+\.v1/}
      if (
        this.check(TokenType.IDENTIFIER) &&
        this.peek().value.toLowerCase() === "archetype_id"
      ) {
        this.advance(); // archetype_id
        if (this.check(TokenType.SLASH)) {
          this.advance();
          if (
            this.check(TokenType.IDENTIFIER) &&
            this.peek().value.toLowerCase() === "value"
          ) {
            this.advance();
          }
        }
        this.consume(TokenType.MATCHES, "Expected 'matches' after archetype_id/value");
        this.consume(TokenType.LBRACE, "Expected '{' after matches");
        if (this.check(TokenType.REGEX)) {
          str.pattern = this.advance().value;
        } else if (this.check(TokenType.STRING)) {
          str.pattern = this.advance().value;
        } else {
          throw this.error(
            "Expected archetype id regex or string constraint",
          );
        }
        this.consume(TokenType.RBRACE, "Expected '}' to close archetype id constraint");
      } else if (this.check(TokenType.REGEX)) {
        str.pattern = this.advance().value;
      } else if (this.check(TokenType.STRING)) {
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
    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      const t = this.peek();
      if (
        t.type === TokenType.IDENTIFIER ||
        t.type === TokenType.DOT ||
        t.type === TokenType.INTEGER ||
        t.type === TokenType.REAL
      ) {
        parts.push(this.advance().value);
      } else {
        break;
      }
    }
    return parts.join("");
  }

  private parseAttribute(): openehr_am.C_ATTRIBUTE | null {
    this.skipComments();
    if (this.check(TokenType.RBRACE)) return null;
    // Specialised overlay paths may start with '/', e.g. /items[id6]/value
    if (this.check(TokenType.SLASH)) {
      return this.parsePathAttribute();
    }
    // `TYPE[id]` child objects are not RM attributes (`data`, `items`, …).
    if (
      this.check(TokenType.IDENTIFIER) &&
      this.checkAhead(TokenType.LBRACKET, 1)
    ) {
      return null;
    }
    // OPT2 / ADL 1.4 down-convert: `DV_CODED_TEXT occurrences matches {…}` (no node id).
    if (
      this.check(TokenType.IDENTIFIER) &&
      /^[A-Z]/.test(this.peek().value) &&
      this.peekAhead(1)?.type === TokenType.OCCURRENCES
    ) {
      return null;
    }
    if (
      this.isUseNode() || this.isUseArchetype() || this.isAllowArchetype()
    ) {
      return null;
    }
    // RM attribute names can collide with ADL section keywords, e.g.
    // ACTIVITY.description or ENTRY.language; accept any word token that is
    // followed by an attribute continuation.
    if (!this.check(TokenType.IDENTIFIER) && !this.isKeywordAttributeName()) {
      return null;
    }

    let attributeName = this.advance().value;
    // ADL path segment, e.g. archetype_id/value
    if (this.check(TokenType.SLASH) && this.checkAhead(TokenType.IDENTIFIER, 1)) {
      this.advance(); // '/'
      attributeName += "/" + this.advance().value;
    }
    let attribute: openehr_am.C_ATTRIBUTE = new openehr_am.C_SINGLE_ATTRIBUTE();
    attribute.rm_attribute_name = attributeName;

    if (this.check(TokenType.EXISTENCE)) {
      const existence = this.parseExistence();
      (attribute as { existence: openehr_base.Multiplicity_interval }).existence =
        existence;
    }

    if (this.check(TokenType.CARDINALITY)) {
      const card = this.parseCardinality();
      if (!(attribute instanceof openehr_am.C_MULTIPLE_ATTRIBUTE)) {
        const multi = new openehr_am.C_MULTIPLE_ATTRIBUTE();
        multi.rm_attribute_name = attribute.rm_attribute_name;
        (multi as { existence?: openehr_base.Multiplicity_interval }).existence =
          (attribute as { existence?: openehr_base.Multiplicity_interval })
            .existence;
        attribute = multi;
      }
      (attribute as openehr_am.C_MULTIPLE_ATTRIBUTE).cardinality = card;
    }

    if (this.check(TokenType.MATCHES)) {
      this.advance();
      this.consume(TokenType.LBRACE, "Expected '{' after matches in attribute");

      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        this.skipComments();
        while (this.check(TokenType.COMMA)) this.advance();
        if (this.check(TokenType.RBRACE)) break;
        const posBefore = this.position;
        const termChild = this.tryParseTerminologyConstraint();
        if (termChild) {
          this.pushAttributeChild(attribute, termChild);
          continue;
        }
        const intervalChild = this.tryParseIntervalConstraint();
        if (intervalChild) {
          this.pushAttributeChild(attribute, intervalChild);
          this.maybeApplyAssumedValueSuffix(intervalChild);
          continue;
        }
        const literalChild = this.tryParseLiteralPrimitiveConstraint();
        if (literalChild) {
          this.pushAttributeChild(attribute, literalChild);
          this.maybeApplyAssumedValueSuffix(literalChild);
          continue;
        }
        const unitListChild = attributeName === "units"
          ? this.tryParseUnitListConstraint()
          : null;
        if (unitListChild) {
          this.pushAttributeChild(attribute, unitListChild);
          continue;
        }
        const regexChild = this.tryParseRegexConstraint();
        if (regexChild) {
          this.pushAttributeChild(attribute, regexChild);
          this.maybeApplyAssumedValueSuffix(regexChild);
          continue;
        }
        const stringChild = this.tryParseStringConstraint();
        if (stringChild) {
          this.pushAttributeChild(attribute, stringChild);
          this.maybeApplyAssumedValueSuffix(stringChild);
          continue;
        }
        const numChild = this.tryParseNumericConstraint();
        if (numChild) {
          this.pushAttributeChild(attribute, numChild);
          this.maybeApplyAssumedValueSuffix(numChild);
          continue;
        }
        const child = this.parseChildObject();
        if (child) {
          this.pushAttributeChild(attribute, child);
        } else if (this.position === posBefore) {
          this.rejectUnexpectedInMatches();
        }
      }

      this.consume(TokenType.RBRACE, "Expected '}' to close attribute matches");
      this.mergeDefiningCodeTerminologyChildren(attribute);
    }

    return attribute;
  }

  /** `matches { "literal" }` string constraint (BOOK archetype style). */
  /** Boolean primitive constraint: `True`, `False`, `True, False`. */
  private tryParseBooleanConstraint(): openehr_am.C_PRIMITIVE_OBJECT | null {
    const isBool = (v?: string) => /^(true|false)$/i.test(v ?? "");
    if (!this.check(TokenType.IDENTIFIER) || !isBool(this.peek().value)) {
      return null;
    }
    const next = this.peekAhead(1);
    if (next && next.type !== TokenType.COMMA && next.type !== TokenType.RBRACE) {
      return null;
    }
    const prim = new openehr_am.C_PRIMITIVE_OBJECT();
    prim.rm_type_name = "BOOLEAN";
    const b = new openehr_am.C_BOOLEAN();
    b.true_valid = false;
    b.false_valid = false;
    for (;;) {
      const v = this.advance().value.toLowerCase();
      if (v === "true") b.true_valid = true;
      else b.false_valid = true;
      if (
        this.check(TokenType.COMMA) && isBool(this.peekAhead(1)?.value)
      ) {
        this.advance();
        continue;
      }
      break;
    }
    prim.item = b;
    return prim;
  }

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

  /** `units matches {"mg", "kg"}` — do not collapse to a pipe-separated pattern. */
  private tryParseUnitListConstraint(): openehr_am.C_PRIMITIVE_OBJECT | null {
    if (!this.check(TokenType.STRING)) return null;
    const strip = (raw: string) => raw.replace(/^["']|["']$/g, "");
    const list = [strip(this.advance().value)];
    while (this.check(TokenType.COMMA) && this.checkAhead(TokenType.STRING, 1)) {
      this.advance();
      list.push(strip(this.advance().value));
    }
    if (list.length < 2) return null;
    const prim = new openehr_am.C_PRIMITIVE_OBJECT();
    prim.rm_type_name = "STRING";
    const str = new openehr_am.C_STRING() as openehr_am.C_STRING & {
      list?: string[];
    };
    str.list = list;
    prim.item = str;
    return prim;
  }

  private parseChildObject(): openehr_am.C_OBJECT | null {
    if (this.check(TokenType.RBRACE)) return null;
    if (this.isUseNode()) {
      return this.parseUseNode();
    }
    const termChild = this.tryParseTerminologyConstraint();
    if (termChild) return termChild;
    const stringChild = this.tryParseStringConstraint();
    if (stringChild) return stringChild;
    const boolChild = this.tryParseBooleanConstraint();
    if (boolChild) {
      this.maybeApplyAssumedValueSuffix(boolChild);
      return boolChild;
    }
    const numChild = this.tryParseNumericConstraint();
    if (numChild) {
      this.maybeApplyAssumedValueSuffix(numChild);
      return numChild;
    }
    if (this.check(TokenType.REGEX)) {
      const prim = this.tryParseRegexConstraint();
      if (prim) {
        this.maybeApplyAssumedValueSuffix(prim);
        return prim;
      }
    }
    if (!this.check(TokenType.IDENTIFIER)) {
      throw this.error(`Unexpected token: ${this.peek().value}`);
    }
    if (this.isUseArchetype()) {
      return this.parseCArchetypeRoot();
    }
    if (this.isAllowArchetype()) {
      return this.parseArchetypeSlotAsComplex();
    }
    if (this.checkKeyword("include") || this.checkKeyword("exclude")) {
      this.skipIncludeExcludeBlock();
      return null;
    }
    // DV_* / CODE_PHRASE with optional matches { … } are C_COMPLEX_OBJECT in
    // Archie-serialised ADL2 (e.g. DV_CODED_TEXT[id] matches { defining_code … }).
    // Leaf RM types without a following matches block still parse as complex
    // objects with no attributes.
    return this.parseComplexObjectBody(new openehr_am.C_COMPLEX_OBJECT());
  }

  /**
   * `[ac1]` / `[at0001]` / `[id1]` terminology constraints inside attribute
   * matches blocks (defining_code matches {[ac1]}).
   */
  /**
   * Primitive interval constraint: `{|>0|}`, `{|0..10|}`, `{|0..<100|}`.
   */
  /** Tuple cell: `{|0..10|}` or exact `{1}` / `{1.5}`. */
  private tryParseTupleNumericCell(): openehr_am.C_PRIMITIVE_OBJECT | null {
    const interval = this.tryParseIntervalConstraint();
    if (interval) return interval;
    if (
      !this.check(TokenType.INTEGER) && !this.check(TokenType.REAL) &&
      !this.check(TokenType.MINUS)
    ) {
      return null;
    }
    let expr = "";
    if (this.check(TokenType.MINUS)) expr += this.advance().value;
    if (this.check(TokenType.INTEGER) || this.check(TokenType.REAL)) {
      expr += this.advance().value;
    }
    if (!expr) return null;
    const prim = new openehr_am.C_PRIMITIVE_OBJECT();
    prim.rm_type_name = expr.includes(".") ? "Real" : "Integer";
    const str = new openehr_am.C_STRING();
    str.pattern = expr;
    prim.item = str;
    return prim;
  }

  private tryParseIntervalConstraint(): openehr_am.C_PRIMITIVE_OBJECT | null {
    if (!this.check(TokenType.PIPE)) return null;
    const prev = this.previous();
    if (prev?.type === TokenType.SLASH) return null;
    this.advance(); // opening |
    let expr = "";
    while (!this.check(TokenType.PIPE) && !this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      expr += this.advance().value;
    }
    if (this.check(TokenType.PIPE)) this.advance(); // closing |
    const prim = new openehr_am.C_PRIMITIVE_OBJECT();
    prim.rm_type_name = /\./.test(expr) ? "Real" : "Integer";
    const str = new openehr_am.C_STRING();
    str.pattern = expr;
    prim.item = str;
    return prim;
  }

  private tryParseTerminologyConstraint(): openehr_am.C_TERMINOLOGY_CODE | null {
    const first = this.parseOneTerminologyConstraint();
    if (!first) return null;
    const runtime = first as openehr_am.C_TERMINOLOGY_CODE & {
      code_list?: string[];
      terminology_id?: string;
    };
    const codes = runtime.code_list?.length
      ? [...runtime.code_list]
      : first.constraint
      ? [first.constraint]
      : [];
    while (this.check(TokenType.COMMA)) {
      this.advance();
      const next = this.parseOneTerminologyConstraint();
      if (!next) break;
      const nextRuntime = next as openehr_am.C_TERMINOLOGY_CODE & {
        code_list?: string[];
        terminology_id?: string;
      };
      const tid = runtime.terminology_id ?? nextRuntime.terminology_id;
      if (
        nextRuntime.terminology_id &&
        runtime.terminology_id &&
        nextRuntime.terminology_id !== runtime.terminology_id
      ) {
        break;
      }
      if (nextRuntime.terminology_id) runtime.terminology_id = nextRuntime.terminology_id;
      const add = nextRuntime.code_list?.length
        ? nextRuntime.code_list
        : next.constraint
        ? [next.constraint]
        : [];
      codes.push(...add);
    }
    if (codes.length > 1) {
      runtime.code_list = codes;
      runtime.constraint = undefined;
    } else if (codes.length === 1) {
      runtime.constraint = codes[0];
      runtime.code_list = undefined;
    }
    return first;
  }

  private parseOneTerminologyConstraint(): openehr_am.C_TERMINOLOGY_CODE | null {
    if (!this.check(TokenType.LBRACKET)) return null;
    const next = this.peekAhead(1);
    if (!next) return null;
    if (
      next.type === TokenType.AC_CODE ||
      next.type === TokenType.AT_CODE ||
      next.type === TokenType.ID_CODE
    ) {
      this.advance(); // '['
      const codes: string[] = [this.advance().value];
      while (this.check(TokenType.SEMICOLON)) {
        this.advance();
        const codeToken = this.peek();
        if (
          codeToken.type !== TokenType.AC_CODE &&
          codeToken.type !== TokenType.AT_CODE &&
          codeToken.type !== TokenType.ID_CODE
        ) {
          break;
        }
        codes.push(this.advance().value);
      }
      this.consume(TokenType.RBRACKET, "Expected ']' after terminology code");
      const term = new openehr_am.C_TERMINOLOGY_CODE();
      term.rm_type_name = "CODE_PHRASE";
      const runtime = term as openehr_am.C_TERMINOLOGY_CODE & {
        code_list?: string[];
        assumed_value?: string;
      };
      if (codes.length > 1) {
        runtime.constraint = codes[0];
        runtime.assumed_value = codes[codes.length - 1];
        runtime.code_list = codes;
      } else {
        term.constraint = codes[0];
      }
      return term;
    }
    if (next.type === TokenType.IDENTIFIER) {
      this.advance(); // '['
      let terminologyId = "";
      while (
        !this.check(TokenType.DOUBLE_COLON) &&
        !this.check(TokenType.RBRACKET) &&
        !this.isAtEnd()
      ) {
        const part = this.advance().value;
        terminologyId += (terminologyId ? " " : "") + part;
      }
      if (!this.check(TokenType.DOUBLE_COLON)) return null;
      this.advance(); // '::'
      let code = "";
      while (
        !this.check(TokenType.RBRACKET) &&
        !this.check(TokenType.PIPE) &&
        !this.isAtEnd()
      ) {
        code += this.advance().value;
      }
      if (this.check(TokenType.PIPE)) {
        this.advance();
        while (!this.check(TokenType.PIPE) && !this.isAtEnd()) this.advance();
        if (this.check(TokenType.PIPE)) this.advance();
      }
      this.consume(TokenType.RBRACKET, "Expected ']' after terminology code");
      const term = new openehr_am.C_TERMINOLOGY_CODE() as
        & openehr_am.C_TERMINOLOGY_CODE
        & { terminology_id?: string };
      term.rm_type_name = "CODE_PHRASE";
      term.terminology_id = terminologyId;
      term.constraint = code;
      return term;
    }
    return null;
  }

  private mergeDefiningCodeTerminologyChildren(
    attribute: openehr_am.C_ATTRIBUTE,
  ): void {
    if (attribute.rm_attribute_name !== "defining_code") return;
    const children = (attribute as { children?: openehr_am.C_OBJECT[] }).children;
    if (!children || children.length < 2) return;
    if (!children.every((c) => c instanceof openehr_am.C_TERMINOLOGY_CODE)) {
      return;
    }
    const terms = children as Array<
      openehr_am.C_TERMINOLOGY_CODE & { terminology_id?: string; code_list?: string[] }
    >;
    const tid = terms.find((t) => t.terminology_id)?.terminology_id;
    const codes: string[] = [];
    for (const t of terms) {
      if (t.code_list?.length) codes.push(...t.code_list);
      else if (t.constraint) codes.push(t.constraint);
    }
    const merged = new openehr_am.C_TERMINOLOGY_CODE() as
      & openehr_am.C_TERMINOLOGY_CODE
      & { terminology_id?: string; code_list?: string[] };
    merged.rm_type_name = "CODE_PHRASE";
    if (tid) merged.terminology_id = tid;
    if (codes.length > 1) merged.code_list = codes;
    else if (codes.length === 1) merged.constraint = codes[0];
    (attribute as { children: openehr_am.C_OBJECT[] }).children = [merged];
  }

  private reifyQuantity(
    obj: openehr_am.C_COMPLEX_OBJECT,
  ): openehr_am.C_QUANTITY {
    const q = new openehr_am.C_QUANTITY();
    q.rm_type_name = obj.rm_type_name ?? "DV_QUANTITY";
    q.node_id = obj.node_id;
    q.occurrences = obj.occurrences;
    const items: openehr_am.C_QUANTITY_ITEM[] = [];
    const tupleAttr = obj.attributes?.find((a) =>
      a.rm_attribute_name.startsWith("[")
    );
    if (tupleAttr) {
      for (const row of (tupleAttr as { children?: openehr_am.C_OBJECT[] })
        .children ?? []) {
        const item = this.quantityItemFromTupleRow(row);
        if (item) items.push(item);
      }
    } else {
      const unitsAttr = obj.attributes?.find((a) =>
        a.rm_attribute_name === "units"
      );
      const magnitudeAttr = obj.attributes?.find((a) =>
        a.rm_attribute_name === "magnitude"
      );
      const precisionAttr = obj.attributes?.find((a) =>
        a.rm_attribute_name === "precision"
      );
      const units = this.readUnitsConstraint(unitsAttr);
      const magnitude = this.readIntervalConstraint(magnitudeAttr);
      const precision = this.readIntervalConstraint(precisionAttr);
      if (units.length) {
        for (const unit of units) {
          const item = new openehr_am.C_QUANTITY_ITEM();
          item.units = unit;
          if (magnitude) item.magnitude = magnitude;
          if (precision) item.precision = precision;
          items.push(item);
        }
      } else if (magnitude || precision) {
        const item = new openehr_am.C_QUANTITY_ITEM();
        if (magnitude) item.magnitude = magnitude;
        if (precision) item.precision = precision;
        items.push(item);
      }
    }
    const propertyAttr = obj.attributes?.find((a) =>
      a.rm_attribute_name === "property"
    );
    const propertyChild = (propertyAttr as { children?: openehr_am.C_OBJECT[] })
      ?.children?.[0];
    if (propertyChild instanceof openehr_am.C_TERMINOLOGY_CODE) {
      const runtime = propertyChild as openehr_am.C_TERMINOLOGY_CODE & {
        terminology_id?: string;
      };
      q.property = runtime.constraint ?? runtime.code_list?.[0];
      if (runtime.terminology_id) {
        (q as { property_terminology_id?: string }).property_terminology_id =
          runtime.terminology_id;
      }
    }
    if (items.length) (q as { list?: openehr_am.C_QUANTITY_ITEM[] }).list = items;
    return q;
  }

  private readUnitsConstraint(
    attr?: openehr_am.C_ATTRIBUTE,
  ): string[] {
    const child = (attr as { children?: openehr_am.C_OBJECT[] })?.children?.[0];
    if (!(child instanceof openehr_am.C_PRIMITIVE_OBJECT)) return [];
    const str = child.item;
    if (!(str instanceof openehr_am.C_STRING)) return [];
    const list = (str as { list?: string[] }).list;
    if (list?.length) return list;
    if (!str.pattern) return [];
    if (str.pattern.includes("|")) {
      return str.pattern.split("|").filter(Boolean);
    }
    return [str.pattern];
  }

  private readIntervalConstraint(
    attr?: openehr_am.C_ATTRIBUTE,
  ): QuantityItemInterval | undefined {
    const child = (attr as { children?: openehr_am.C_OBJECT[] })?.children?.[0];
    if (!(child instanceof openehr_am.C_PRIMITIVE_OBJECT)) return undefined;
    const str = child.item;
    if (!(str instanceof openehr_am.C_STRING) || !str.pattern) return undefined;
    return parseCadlIntervalPattern(str.pattern);
  }

  private quantityItemFromTupleRow(
    row: openehr_am.C_OBJECT,
  ): openehr_am.C_QUANTITY_ITEM | undefined {
    if (!(row instanceof openehr_am.C_COMPLEX_OBJECT)) return undefined;
    const item = new openehr_am.C_QUANTITY_ITEM();
    for (const attr of row.attributes ?? []) {
      const child = (attr as { children?: openehr_am.C_OBJECT[] }).children?.[0];
      if (attr.rm_attribute_name === "units") {
        const units = this.readUnitsConstraint(attr);
        if (units[0]) item.units = units[0];
      } else if (attr.rm_attribute_name === "magnitude") {
        item.magnitude = this.readIntervalConstraint(attr);
      } else if (attr.rm_attribute_name === "precision") {
        item.precision = this.readIntervalConstraint(attr);
      } else if (child instanceof openehr_am.C_PRIMITIVE_OBJECT) {
        const body = child.item;
        if (body instanceof openehr_am.C_STRING && body.pattern) {
          if (attr.rm_attribute_name === "units") item.units = body.pattern;
          else if (attr.rm_attribute_name === "magnitude") {
            item.magnitude = this.readIntervalConstraint(attr);
          } else if (attr.rm_attribute_name === "precision") {
            item.precision = this.readIntervalConstraint(attr);
          }
        }
      }
    }
    return item.units || item.magnitude || item.precision ? item : undefined;
  }

  private tryParseQuantityTupleAttribute(): openehr_am.C_ATTRIBUTE | null {
    if (!this.check(TokenType.LBRACKET)) return null;
    const start = this.position;
    this.advance();
    const columns: string[] = [];
    while (
      this.check(TokenType.IDENTIFIER) &&
      !this.check(TokenType.RBRACKET)
    ) {
      columns.push(this.advance().value);
      if (this.check(TokenType.COMMA)) this.advance();
    }
    if (!columns.length || !this.check(TokenType.RBRACKET)) {
      this.position = start;
      return null;
    }
    const quantityTupleColumns = new Set(["units", "magnitude", "precision"]);
    if (!columns.every((c) => quantityTupleColumns.has(c))) {
      this.position = start;
      return null;
    }
    this.advance();
    if (!this.check(TokenType.MATCHES)) {
      this.position = start;
      return null;
    }
    this.advance();
    if (!this.check(TokenType.LBRACE)) {
      this.position = start;
      return null;
    }
    this.advance();
    const attr = new openehr_am.C_MULTIPLE_ATTRIBUTE();
    attr.rm_attribute_name = `[${columns.join(", ")}]`;
    const children: openehr_am.C_OBJECT[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.skipComments();
      while (this.check(TokenType.COMMA)) this.advance();
      if (this.check(TokenType.LBRACKET)) {
        const row = this.parseQuantityTupleRow(columns);
        if (row) children.push(row);
        continue;
      }
      if (this.check(TokenType.RBRACE)) break;
      this.advance();
    }
    this.consume(TokenType.RBRACE, "Expected '}' to close quantity tuple");
    if (!children.length) {
      this.position = start;
      return null;
    }
    (attr as { children: openehr_am.C_OBJECT[] }).children = children;
    return attr;
  }

  private parseQuantityTupleRow(
    columns: string[],
  ): openehr_am.C_COMPLEX_OBJECT | null {
    if (!this.check(TokenType.LBRACKET)) return null;
    this.advance();
    const cells: Record<string, openehr_am.C_OBJECT> = {};
    for (let i = 0; i < columns.length; i++) {
      if (!this.check(TokenType.LBRACE)) return null;
      this.advance();
      const col = columns[i];
      if (col === "units") {
        const prim = new openehr_am.C_PRIMITIVE_OBJECT();
        prim.rm_type_name = "STRING";
        const str = new openehr_am.C_STRING();
        if (this.check(TokenType.STRING)) {
          str.pattern = this.advance().value.replace(/^["']|["']$/g, "");
        } else if (this.check(TokenType.STAR)) {
          this.advance();
          str.pattern = "*";
        }
        prim.item = str;
        cells[col] = prim;
      } else if (col === "magnitude" || col === "precision") {
        const interval = this.tryParseTupleNumericCell();
        if (interval) cells[col] = interval;
      }
      this.consume(TokenType.RBRACE, "Expected '}' in quantity tuple cell");
      if (this.check(TokenType.COMMA)) this.advance();
    }
    this.consume(TokenType.RBRACKET, "Expected ']' to close quantity tuple row");
    const row = new openehr_am.C_COMPLEX_OBJECT();
    row.attributes = columns
      .filter((c) => cells[c])
      .map((c) => {
        const a = new openehr_am.C_SINGLE_ATTRIBUTE();
        a.rm_attribute_name = c;
        (a as { children: openehr_am.C_OBJECT[] }).children = [cells[c]];
        return a;
      });
    return row.attributes?.length ? row : null;
  }

  /** `[units, magnitude] matches { … }` — kept in the text, not reified. */
  private skipTupleAttribute(): void {
    this.skipDelimited(TokenType.LBRACKET, TokenType.RBRACKET);
    if (this.check(TokenType.MATCHES)) {
      this.advance();
      if (this.check(TokenType.LBRACE)) {
        this.skipDelimited(TokenType.LBRACE, TokenType.RBRACE);
      }
    }
  }

  private skipDelimited(open: TokenType, close: TokenType): void {
    if (!this.check(open)) return;
    this.advance();
    let depth = 1;
    while (!this.isAtEnd() && depth > 0) {
      if (this.check(TokenType.STRING) || this.check(TokenType.REGEX)) {
        this.advance();
        continue;
      }
      if (this.check(open)) depth++;
      else if (this.check(close)) depth--;
      this.advance();
    }
  }

  private pushAttributeChild(
    attribute: openehr_am.C_ATTRIBUTE,
    child: openehr_am.C_OBJECT,
  ): void {
    if (!(attribute as { children?: openehr_am.C_OBJECT[] }).children) {
      (attribute as { children: openehr_am.C_OBJECT[] }).children = [];
    }
    (attribute as { children: openehr_am.C_OBJECT[] }).children!.push(child);
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

  private isRmTypeIdentifier(value: string): boolean {
    if (!/^[A-Z]/.test(value)) return false;
    if (value.includes("_")) return true;
    return /^(HISTORY|COMPOSITION|OBSERVATION|EVALUATION|INSTRUCTION|ACTION|CLUSTER|EVENT|ELEMENT|ITEM|ACTIVITY|SECTION|ENTRY|ADMIN|DV|CODE|ISM|PARTY|LOCATABLE|ARCHETYPE|SLOT)/i
      .test(value);
  }

  private rejectUnexpectedInMatches(): void {
    if (this.check(TokenType.RBRACE)) return;
    throw this.error(`Unexpected token: ${this.peek().value}`);
  }

  private isUseNode(): boolean {
    return this.checkIdentifier("use_node");
  }

  private parseUseNode(): openehr_am.C_COMPLEX_OBJECT_PROXY {
    this.advance(); // use_node
    const proxy = new openehr_am.C_COMPLEX_OBJECT_PROXY();
    if (
      this.check(TokenType.IDENTIFIER) &&
      !this.checkAhead(TokenType.SLASH, 1)
    ) {
      proxy.rm_type_name = this.advance().value;
      if (this.check(TokenType.LBRACKET)) {
        this.advance();
        const nodeIdToken = this.peek();
        if (
          nodeIdToken.type === TokenType.ID_CODE ||
          nodeIdToken.type === TokenType.AT_CODE
        ) {
          proxy.node_id = this.advance().value;
        }
        this.consume(TokenType.RBRACKET, "Expected ']' after use_node id");
      }
    }
    proxy.target_path = this.consumeArchetypePath();
    return proxy;
  }

  private consumeArchetypePath(): string {
    let path = "";
    while (!this.isAtEnd()) {
      const t = this.peek();
      if (t.type === TokenType.SLASH || t.type === TokenType.IDENTIFIER) {
        path += this.advance().value;
      } else if (t.type === TokenType.LBRACKET) {
        path += this.advance().value;
        while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
          path += this.advance().value;
        }
        if (this.check(TokenType.RBRACKET)) path += this.advance().value;
      } else {
        break;
      }
    }
    if (!path) throw this.error("Expected archetype path after use_node");
    return path;
  }

  private tryParseRegexConstraint(): openehr_am.C_PRIMITIVE_OBJECT | null {
    if (!this.check(TokenType.REGEX)) return null;
    const prim = new openehr_am.C_PRIMITIVE_OBJECT();
    prim.rm_type_name = "STRING";
    const str = new openehr_am.C_STRING();
    str.pattern = this.advance().value;
    prim.item = str;
    while (this.check(TokenType.COMMA) && this.checkAhead(TokenType.REGEX, 1)) {
      this.advance();
      str.pattern += "|" + this.advance().value;
    }
    return prim;
  }

  private tryParseLiteralPrimitiveConstraint():
    openehr_am.C_PRIMITIVE_OBJECT | null {
    const start = this.position;
    const next = this.peekAhead(1);
    if (
      this.check(TokenType.IDENTIFIER) &&
      (next?.type === TokenType.LBRACKET ||
        this.isUseNode() ||
        this.isUseArchetype() ||
        this.isAllowArchetype())
    ) {
      return null;
    }
    const isoDateTail = next?.type === TokenType.INTEGER &&
      String(next.value).startsWith("-");
    if (this.check(TokenType.IDENTIFIER)) {
      const v = this.peek().value;
      // RM type names and bare lowercase words are not pattern literals.
      if (this.isRmTypeIdentifier(v)) return null;
      const isPattern =
        /^pt/i.test(v) ||
        v.includes("-") ||
        v.includes("?") ||
        this.checkAhead(TokenType.COLON, 1);
      if (/^[a-z][a-z0-9_]*$/.test(v) && !isPattern) {
        return null;
      }
    }
    const canStart =
      this.check(TokenType.IDENTIFIER) ||
      (this.check(TokenType.INTEGER) &&
        (this.checkAhead(TokenType.COLON, 1) || isoDateTail));
    if (!canStart) return null;
    const parts: string[] = [];
    while (!this.isAtEnd()) {
      const t = this.peek();
      if (t.type === TokenType.RBRACE || t.type === TokenType.SEMICOLON) break;
      if (t.type === TokenType.COMMA) {
        const n = this.peekAhead(1);
        if (
          n?.type === TokenType.INTEGER || n?.type === TokenType.REAL ||
          n?.type === TokenType.STRING || n?.type === TokenType.REGEX ||
          n?.type === TokenType.IDENTIFIER
        ) {
          break;
        }
      }
      if (t.type === TokenType.PIPE) {
        parts.push(this.advance().value);
        while (!this.check(TokenType.PIPE) && !this.isAtEnd()) {
          parts.push(this.advance().value);
        }
        if (this.check(TokenType.PIPE)) parts.push(this.advance().value);
        continue;
      }
      if (
        t.type === TokenType.IDENTIFIER ||
        t.type === TokenType.INTEGER ||
        t.type === TokenType.REAL ||
        t.type === TokenType.COLON ||
        t.type === TokenType.COMMA ||
        t.type === TokenType.DOT ||
        t.type === TokenType.SLASH
      ) {
        const v = this.advance().value;
        if (
          t.type === TokenType.INTEGER && String(v).startsWith("-") &&
          parts.length > 0
        ) {
          parts[parts.length - 1] += v;
        } else {
          parts.push(v);
        }
        continue;
      }
      break;
    }
    if (!parts.length) {
      this.position = start;
      return null;
    }
    const prim = new openehr_am.C_PRIMITIVE_OBJECT();
    prim.rm_type_name = "STRING";
    const str = new openehr_am.C_STRING();
    str.pattern = parts.join("");
    prim.item = str;
    return prim;
  }

  private tryParseNumericConstraint(): openehr_am.C_PRIMITIVE_OBJECT | null {
    if (!this.check(TokenType.INTEGER) && !this.check(TokenType.REAL)) {
      return null;
    }
    const next = this.peekAhead(1);
    if (
      next &&
      next.type !== TokenType.COMMA &&
      next.type !== TokenType.RBRACE &&
      next.type !== TokenType.SEMICOLON
    ) {
      return null;
    }
    const prim = new openehr_am.C_PRIMITIVE_OBJECT();
    const isReal = this.check(TokenType.REAL);
    prim.rm_type_name = isReal ? "Real" : "Integer";
    const item = isReal ? new openehr_am.C_REAL() : new openehr_am.C_INTEGER();
    const values: number[] = [];
    for (;;) {
      const raw = this.advance().value;
      values.push(Number(raw));
      if (
        this.check(TokenType.COMMA) &&
        (this.checkAhead(TokenType.INTEGER, 1) ||
          this.checkAhead(TokenType.REAL, 1))
      ) {
        this.advance();
        continue;
      }
      break;
    }
    (item as { list?: number[] }).list = values;
    prim.item = item;
    return prim;
  }

  private maybeApplyAssumedValueSuffix(
    prim: openehr_am.C_PRIMITIVE_OBJECT,
  ): void {
    if (!this.check(TokenType.SEMICOLON)) return;
    this.advance();
    const item = prim.item;
    if (!item) return;
    const assumed = this.parseAssumedValueLiteral();
    if (assumed !== undefined) {
      (item as { assumed_value?: unknown }).assumed_value = assumed;
    }
  }

  private parseAssumedValueLiteral(): unknown {
    if (this.check(TokenType.STRING)) {
      return this.advance().value.replace(/^["']|["']$/g, "");
    }
    if (this.check(TokenType.REGEX)) {
      return this.advance().value;
    }
    if (
      this.check(TokenType.IDENTIFIER) &&
      /^(true|false)$/i.test(this.peek().value)
    ) {
      return this.advance().value.toLowerCase() === "true";
    }
    if (this.check(TokenType.PIPE)) {
      const intervalChild = this.tryParseIntervalConstraint();
      if (intervalChild?.item) {
        return (intervalChild.item as openehr_am.C_STRING).pattern;
      }
      return undefined;
    }
    if (
      this.check(TokenType.INTEGER) || this.check(TokenType.REAL) ||
      this.check(TokenType.IDENTIFIER)
    ) {
      const parts: string[] = [];
      while (!this.isAtEnd()) {
        const t = this.peek();
        if (t.type === TokenType.RBRACE || t.type === TokenType.COMMA) break;
        if (
          t.type === TokenType.IDENTIFIER ||
          t.type === TokenType.INTEGER ||
          t.type === TokenType.REAL ||
          t.type === TokenType.COLON ||
          t.type === TokenType.COMMA ||
          t.type === TokenType.DOT ||
          t.type === TokenType.SLASH
        ) {
          const v = this.advance().value;
          if (
            t.type === TokenType.INTEGER && String(v).startsWith("-") &&
            parts.length > 0
          ) {
            parts[parts.length - 1] += v;
          } else {
            parts.push(v);
          }
          continue;
        }
        break;
      }
      if (!parts.length) return undefined;
      const joined = parts.join("");
      if (/^-?\d+(\.\d+)?$/.test(joined)) return Number(joined);
      return joined;
    }
    return undefined;
  }

  private skipComments(): void {
    while (this.check(TokenType.COMMENT)) this.advance();
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

  private checkAhead(type: TokenType, offset: number = 1): boolean {
    const pos = this.position + offset;
    if (pos >= this.tokens.length) return false;
    return this.tokens[pos].type === type;
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

/** Inverse of `formatInterval` in `generation/adl2_serializer.ts`. */
function parseCadlIntervalPattern(expr: string): QuantityItemInterval | undefined {
  const t = expr.trim();
  if (!t) return undefined;
  const interval: QuantityItemInterval = {};
  const range = /^(.+)\.\.(<)?(.+)$/.exec(t);
  if (range) {
    const lowerPart = range[1];
    const exclusiveUpper = range[2] === "<";
    const upperPart = range[3];
    if (lowerPart.startsWith(">")) {
      interval.lower_included = false;
      interval.lower = parseFloat(lowerPart.slice(1));
    } else {
      interval.lower_included = true;
      interval.lower = parseFloat(lowerPart);
    }
    if (exclusiveUpper || upperPart.startsWith("<")) {
      interval.upper_included = false;
      interval.upper = parseFloat(
        exclusiveUpper ? upperPart : upperPart.slice(1),
      );
    } else {
      interval.upper_included = true;
      interval.upper = parseFloat(upperPart);
    }
    return interval;
  }
  const ge = /^>=(.+)$/.exec(t);
  if (ge) {
    interval.lower = parseFloat(ge[1]);
    interval.lower_included = true;
    interval.upper_unbounded = true;
    return interval;
  }
  const gt = /^>(.+)$/.exec(t);
  if (gt) {
    interval.lower = parseFloat(gt[1]);
    interval.lower_included = false;
    interval.upper_unbounded = true;
    return interval;
  }
  const le = /^<=(.+)$/.exec(t);
  if (le) {
    interval.upper = parseFloat(le[1]);
    interval.upper_included = true;
    interval.lower_unbounded = true;
    return interval;
  }
  const lt = /^<(.+)$/.exec(t);
  if (lt) {
    interval.upper = parseFloat(lt[1]);
    interval.upper_included = false;
    interval.lower_unbounded = true;
    return interval;
  }
  const exact = /^-?\d+(?:\.\d+)?$/.exec(t);
  if (exact) {
    const n = parseFloat(exact[0]);
    interval.lower = n;
    interval.upper = n;
    interval.lower_included = true;
    interval.upper_included = true;
    return interval;
  }
  return undefined;
}
