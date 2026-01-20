/**
 * Tests for ADL2 Tokenizer
 */

import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Tokenizer, TokenType } from "../../enhanced/parser/adl2_tokenizer.ts";

Deno.test("Tokenizer - basic keywords", () => {
  const input = "archetype language description definition terminology";
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  
  assertEquals(tokens[0].type, TokenType.ARCHETYPE);
  assertEquals(tokens[1].type, TokenType.LANGUAGE);
  assertEquals(tokens[2].type, TokenType.DESCRIPTION);
  assertEquals(tokens[3].type, TokenType.DEFINITION);
  assertEquals(tokens[4].type, TokenType.TERMINOLOGY);
  assertEquals(tokens[5].type, TokenType.EOF);
});

Deno.test("Tokenizer - identifiers", () => {
  const input = "OBSERVATION HISTORY EVENT DV_TEXT";
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  
  assertEquals(tokens[0].type, TokenType.IDENTIFIER);
  assertEquals(tokens[0].value, "OBSERVATION");
  assertEquals(tokens[1].type, TokenType.IDENTIFIER);
  assertEquals(tokens[1].value, "HISTORY");
});

Deno.test("Tokenizer - node codes", () => {
  const input = "id1 id10 id100 at0000 at0001 ac0000";
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  
  assertEquals(tokens[0].type, TokenType.ID_CODE);
  assertEquals(tokens[0].value, "id1");
  assertEquals(tokens[1].type, TokenType.ID_CODE);
  assertEquals(tokens[1].value, "id10");
  assertEquals(tokens[2].type, TokenType.ID_CODE);
  assertEquals(tokens[2].value, "id100");
  assertEquals(tokens[3].type, TokenType.AT_CODE);
  assertEquals(tokens[3].value, "at0000");
  assertEquals(tokens[4].type, TokenType.AT_CODE);
  assertEquals(tokens[4].value, "at0001");
  assertEquals(tokens[5].type, TokenType.AC_CODE);
  assertEquals(tokens[5].value, "ac0000");
});

Deno.test("Tokenizer - delimiters", () => {
  const input = "()[]{}< >";
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  
  assertEquals(tokens[0].type, TokenType.LPAREN);
  assertEquals(tokens[1].type, TokenType.RPAREN);
  assertEquals(tokens[2].type, TokenType.LBRACKET);
  assertEquals(tokens[3].type, TokenType.RBRACKET);
  assertEquals(tokens[4].type, TokenType.LBRACE);
  assertEquals(tokens[5].type, TokenType.RBRACE);
  assertEquals(tokens[6].type, TokenType.LANGLE);
  assertEquals(tokens[7].type, TokenType.RANGLE);
});

Deno.test("Tokenizer - operators", () => {
  const input = ". , ; : :: = | .. *";
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  
  assertEquals(tokens[0].type, TokenType.DOT);
  assertEquals(tokens[1].type, TokenType.COMMA);
  assertEquals(tokens[2].type, TokenType.SEMICOLON);
  assertEquals(tokens[3].type, TokenType.COLON);
  assertEquals(tokens[4].type, TokenType.DOUBLE_COLON);
  assertEquals(tokens[5].type, TokenType.EQUALS);
  assertEquals(tokens[6].type, TokenType.PIPE);
  assertEquals(tokens[7].type, TokenType.ELLIPSIS);
  assertEquals(tokens[8].type, TokenType.STAR);
});

Deno.test("Tokenizer - strings", () => {
  const input = `"simple string" "with \\"quotes\\"" "with\\nnewline"`;
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  
  assertEquals(tokens[0].type, TokenType.STRING);
  assertEquals(tokens[0].value, "simple string");
  assertEquals(tokens[1].type, TokenType.STRING);
  assertEquals(tokens[1].value, 'with "quotes"');
  assertEquals(tokens[2].type, TokenType.STRING);
  assertEquals(tokens[2].value, "with\nnewline");
});

Deno.test("Tokenizer - numbers", () => {
  const input = "42 3.14 -10 -5.5";
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  
  assertEquals(tokens[0].type, TokenType.INTEGER);
  assertEquals(tokens[0].value, "42");
  assertEquals(tokens[1].type, TokenType.REAL);
  assertEquals(tokens[1].value, "3.14");
  assertEquals(tokens[2].type, TokenType.INTEGER);
  assertEquals(tokens[2].value, "-10");
  assertEquals(tokens[3].type, TokenType.REAL);
  assertEquals(tokens[3].value, "-5.5");
});

Deno.test("Tokenizer - comments", () => {
  const input = `archetype -- this is a comment
  definition -- another comment
  matches`;
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  
  assertEquals(tokens[0].type, TokenType.ARCHETYPE);
  assertEquals(tokens[1].type, TokenType.DEFINITION);
  assertEquals(tokens[2].type, TokenType.MATCHES);
  assertEquals(tokens[3].type, TokenType.EOF);
});

Deno.test("Tokenizer - simple ADL2 header", () => {
  const input = "archetype (adl_version=2.0.5; rm_release=1.0.2)";
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  
  assertEquals(tokens[0].type, TokenType.ARCHETYPE);
  assertEquals(tokens[1].type, TokenType.LPAREN);
  assertEquals(tokens[2].type, TokenType.IDENTIFIER);
  assertEquals(tokens[2].value, "adl_version");
  assertEquals(tokens[3].type, TokenType.EQUALS);
  assertEquals(tokens[4].type, TokenType.REAL);
  assertEquals(tokens[4].value, "2.0.5");
});

Deno.test("Tokenizer - archetype ID", () => {
  const input = "openEHR-EHR-OBSERVATION.blood_pressure.v1.0.0";
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  
  // Archetype ID will be tokenized as single identifier with hyphens, then dots, then another identifier
  assertEquals(tokens[0].type, TokenType.IDENTIFIER);
  assertEquals(tokens[0].value, "openEHR-EHR-OBSERVATION");
  assertEquals(tokens[1].type, TokenType.DOT);
  assertEquals(tokens[2].type, TokenType.IDENTIFIER);
  assertEquals(tokens[2].value, "blood_pressure");
});

Deno.test("Tokenizer - line and column tracking", () => {
  const input = "archetype\n  definition";
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  
  assertEquals(tokens[0].line, 1);
  assertEquals(tokens[0].column, 1);
  assertEquals(tokens[1].line, 2);
  assertEquals(tokens[1].column, 3);
});

console.log("\n✅ ADL2 Tokenizer tests completed");
