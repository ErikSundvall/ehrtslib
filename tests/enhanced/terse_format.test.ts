/**
 * Tests for Terse Format Parsing and Serialization
 * 
 * Tests the terse format functions for CODE_PHRASE and DV_CODED_TEXT.
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import {
  parseTerseCodePhrase,
  toTerseCodePhrase,
  parseTerseDvCodedText,
  toTerseDvCodedText,
  isTerseCodePhrase,
  isTerseDvCodedText,
} from "../../enhanced/terse_format.ts";
import { TERMINOLOGY_ID } from "../../enhanced/openehr_base.ts";
import { CODE_PHRASE, DV_CODED_TEXT } from "../../enhanced/openehr_rm.ts";

// ============================================================================
// CODE_PHRASE Tests
// ============================================================================

Deno.test("parseTerseCodePhrase: valid ISO_639-1 language code", () => {
  const result = parseTerseCodePhrase("ISO_639-1::en");
  
  assertExists(result);
  assertEquals(result?.terminology_id?.value, "ISO_639-1");
  assertEquals(result?.code_string, "en");
});

Deno.test("parseTerseCodePhrase: valid ISO_3166-1 country code", () => {
  const result = parseTerseCodePhrase("ISO_3166-1::GB");
  
  assertExists(result);
  assertEquals(result?.terminology_id?.value, "ISO_3166-1");
  assertEquals(result?.code_string, "GB");
});

Deno.test("parseTerseCodePhrase: valid openEHR code", () => {
  const result = parseTerseCodePhrase("openehr::433");
  
  assertExists(result);
  assertEquals(result?.terminology_id?.value, "openehr");
  assertEquals(result?.code_string, "433");
});

Deno.test("parseTerseCodePhrase: valid SNOMED-CT code", () => {
  const result = parseTerseCodePhrase("SNOMED-CT::12345");
  
  assertExists(result);
  assertEquals(result?.terminology_id?.value, "SNOMED-CT");
  assertEquals(result?.code_string, "12345");
});

Deno.test("parseTerseCodePhrase: with spaces (trimmed)", () => {
  const result = parseTerseCodePhrase(" ISO_639-1 :: en ");
  
  assertExists(result);
  assertEquals(result?.terminology_id?.value, "ISO_639-1");
  assertEquals(result?.code_string, "en");
});

Deno.test("parseTerseCodePhrase: invalid - contains pipe (DV_CODED_TEXT format)", () => {
  const result = parseTerseCodePhrase("openehr::433|event|");
  
  assertEquals(result, null);
});

Deno.test("parseTerseCodePhrase: invalid - missing double colon", () => {
  const result = parseTerseCodePhrase("openehr:433");
  
  assertEquals(result, null);
});

Deno.test("parseTerseCodePhrase: invalid - empty string", () => {
  const result = parseTerseCodePhrase("");
  
  assertEquals(result, null);
});

Deno.test("parseTerseCodePhrase: invalid - null", () => {
  const result = parseTerseCodePhrase(null as any);
  
  assertEquals(result, null);
});

Deno.test("parseTerseCodePhrase: invalid - undefined", () => {
  const result = parseTerseCodePhrase(undefined as any);
  
  assertEquals(result, null);
});

Deno.test("parseTerseCodePhrase: invalid - only terminology", () => {
  const result = parseTerseCodePhrase("openehr::");
  
  assertEquals(result, null);
});

Deno.test("parseTerseCodePhrase: invalid - only code", () => {
  const result = parseTerseCodePhrase("::433");
  
  assertEquals(result, null);
});

Deno.test("toTerseCodePhrase: valid CODE_PHRASE", () => {
  const cp = new CODE_PHRASE();
  cp.terminology_id = new TERMINOLOGY_ID();
  cp.terminology_id.value = "ISO_639-1";
  cp.code_string = "en";
  
  const result = toTerseCodePhrase(cp);
  
  assertEquals(result, "ISO_639-1::en");
});

Deno.test("toTerseCodePhrase: with empty values", () => {
  const cp = new CODE_PHRASE();
  
  const result = toTerseCodePhrase(cp);
  
  assertEquals(result, "::");
});

Deno.test("toTerseCodePhrase: roundtrip test", () => {
  const original = "SNOMED-CT::12345";
  const parsed = parseTerseCodePhrase(original);
  assertExists(parsed);
  
  const serialized = toTerseCodePhrase(parsed!);
  
  assertEquals(serialized, original);
});

// ============================================================================
// DV_CODED_TEXT Tests
// ============================================================================

Deno.test("parseTerseDvCodedText: valid openEHR category", () => {
  const result = parseTerseDvCodedText("openehr::433|event|");
  
  assertExists(result);
  assertEquals(result?.value, "event");
  assertEquals(result?.defining_code?.terminology_id?.value, "openehr");
  assertEquals(result?.defining_code?.code_string, "433");
});

Deno.test("parseTerseDvCodedText: valid SNOMED-CT diagnosis", () => {
  const result = parseTerseDvCodedText("SNOMED-CT::73211009|diabetes mellitus|");
  
  assertExists(result);
  assertEquals(result?.value, "diabetes mellitus");
  assertEquals(result?.defining_code?.terminology_id?.value, "SNOMED-CT");
  assertEquals(result?.defining_code?.code_string, "73211009");
});

Deno.test("parseTerseDvCodedText: with empty value", () => {
  const result = parseTerseDvCodedText("openehr::433||");
  
  assertExists(result);
  assertEquals(result?.value, "");
  assertEquals(result?.defining_code?.code_string, "433");
});

Deno.test("parseTerseDvCodedText: with spaces (trimmed)", () => {
  const result = parseTerseDvCodedText(" openehr :: 433 |event|");
  
  assertExists(result);
  assertEquals(result?.value, "event");
  assertEquals(result?.defining_code?.terminology_id?.value, "openehr");
  assertEquals(result?.defining_code?.code_string, "433");
});

Deno.test("parseTerseDvCodedText: with special characters in value", () => {
  const result = parseTerseDvCodedText("local::at0001|Patient's observation|");
  
  assertExists(result);
  assertEquals(result?.value, "Patient's observation");
  assertEquals(result?.defining_code?.code_string, "at0001");
});

Deno.test("parseTerseDvCodedText: invalid - missing trailing pipe", () => {
  const result = parseTerseDvCodedText("openehr::433|event");
  
  assertEquals(result, null);
});

Deno.test("parseTerseDvCodedText: invalid - CODE_PHRASE format (no pipes)", () => {
  const result = parseTerseDvCodedText("ISO_639-1::en");
  
  assertEquals(result, null);
});

Deno.test("parseTerseDvCodedText: invalid - empty string", () => {
  const result = parseTerseDvCodedText("");
  
  assertEquals(result, null);
});

Deno.test("parseTerseDvCodedText: invalid - null", () => {
  const result = parseTerseDvCodedText(null as any);
  
  assertEquals(result, null);
});

Deno.test("parseTerseDvCodedText: invalid - undefined", () => {
  const result = parseTerseDvCodedText(undefined as any);
  
  assertEquals(result, null);
});

Deno.test("toTerseDvCodedText: valid DV_CODED_TEXT", () => {
  const dct = new DV_CODED_TEXT();
  dct.value = "event";
  const dc = new CODE_PHRASE();
  dc.terminology_id = new TERMINOLOGY_ID();
  dc.terminology_id.value = "openehr";
  dc.code_string = "433";
  dct.defining_code = dc;
  
  const result = toTerseDvCodedText(dct);
  
  assertEquals(result, "openehr::433|event|");
});

Deno.test("toTerseDvCodedText: with empty values", () => {
  const dct = new DV_CODED_TEXT();
  
  const result = toTerseDvCodedText(dct);
  
  assertEquals(result, "::||");
});

Deno.test("toTerseDvCodedText: roundtrip test", () => {
  const original = "SNOMED-CT::73211009|diabetes mellitus|";
  const parsed = parseTerseDvCodedText(original);
  assertExists(parsed);
  
  const serialized = toTerseDvCodedText(parsed!);
  
  assertEquals(serialized, original);
});

// ============================================================================
// Pattern Detection Tests
// ============================================================================

Deno.test("isTerseCodePhrase: recognizes CODE_PHRASE format", () => {
  assertEquals(isTerseCodePhrase("ISO_639-1::en"), true);
  assertEquals(isTerseCodePhrase("openehr::433"), true);
});

Deno.test("isTerseCodePhrase: rejects DV_CODED_TEXT format", () => {
  assertEquals(isTerseCodePhrase("openehr::433|event|"), false);
});

Deno.test("isTerseCodePhrase: rejects invalid formats", () => {
  assertEquals(isTerseCodePhrase(""), false);
  assertEquals(isTerseCodePhrase("no-colons"), false);
  assertEquals(isTerseCodePhrase("single:colon"), false);
  assertEquals(isTerseCodePhrase(null as any), false);
  assertEquals(isTerseCodePhrase(undefined as any), false);
});

Deno.test("isTerseDvCodedText: recognizes DV_CODED_TEXT format", () => {
  assertEquals(isTerseDvCodedText("openehr::433|event|"), true);
  assertEquals(isTerseDvCodedText("SNOMED-CT::12345||"), true);
});

Deno.test("isTerseDvCodedText: rejects CODE_PHRASE format", () => {
  assertEquals(isTerseDvCodedText("ISO_639-1::en"), false);
});

Deno.test("isTerseDvCodedText: rejects invalid formats", () => {
  assertEquals(isTerseDvCodedText(""), false);
  assertEquals(isTerseDvCodedText("no-format"), false);
  assertEquals(isTerseDvCodedText("openehr::433|missing-pipe"), false);
  assertEquals(isTerseDvCodedText(null as any), false);
  assertEquals(isTerseDvCodedText(undefined as any), false);
});

// ============================================================================
// Edge Cases
// ============================================================================

Deno.test("parseTerseCodePhrase: code with hyphens and underscores", () => {
  const result = parseTerseCodePhrase("my-terminology_v2::code-123_abc");
  
  assertExists(result);
  assertEquals(result?.terminology_id?.value, "my-terminology_v2");
  assertEquals(result?.code_string, "code-123_abc");
});

Deno.test("parseTerseDvCodedText: value with pipes not at boundaries", () => {
  // The value itself cannot contain pipes based on the format spec
  // This should fail or the value should be truncated
  const result = parseTerseDvCodedText("local::at0001|val|ue|");
  
  // With our regex, this will fail because it expects exactly one pipe before the final pipe
  assertEquals(result, null);
});

Deno.test("parseTerseDvCodedText: multiline value (newlines)", () => {
  // Note: The openEHR terse format specification does not explicitly forbid newlines
  // in values. This test verifies that newlines are preserved when present.
  // However, in practice, multiline values in terse format may be rare and 
  // consideration should be given to readability and data exchange compatibility.
  const result = parseTerseDvCodedText("local::at0001|Line 1\nLine 2|");
  
  assertExists(result);
  assertEquals(result?.value, "Line 1\nLine 2");
});
