/**
 * Tests for ODIN Parser
 */

import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Tokenizer, TokenType } from "../../../parser/adl2_tokenizer.ts";
import { OdinParser } from "../../../parser/odin_parser.ts";
import { parseAdl } from "../../../parser/mod.ts";

function parseOdin(input: string) {
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new OdinParser(tokens);
  return parser.parse();
}

Deno.test("ODIN - simple string value", () => {
  const result = parseOdin('<"simple string">');
  assertEquals(result, "simple string");
});

Deno.test("ODIN - string list", () => {
  const result = parseOdin('<"one", "two", "three">');
  assertEquals(result, ["one", "two", "three"]);
});

Deno.test("ODIN - ADL 1.4 open primitive list marker", () => {
  const result = parseOdin('<"organisation", "provider", ...>');
  assertEquals(result, ["organisation", "provider"]);
});

Deno.test("ODIN - integer value", () => {
  const result = parseOdin("<42>");
  assertEquals(result, 42);
});

Deno.test("ODIN - real value", () => {
  const result = parseOdin("<3.14>");
  assertEquals(result, 3.14);
});

Deno.test("ODIN - boolean values", () => {
  const result1 = parseOdin("<True>");
  assertEquals(result1, true);

  const result2 = parseOdin("<False>");
  assertEquals(result2, false);
});

Deno.test("ODIN - simple attribute-value pair", () => {
  const result = parseOdin('<name = "Test">');
  assertEquals(result, { name: "Test" });
});

Deno.test("ODIN - multiple attribute-value pairs", () => {
  const input = `<
    name = "Test"
    value = 42
    enabled = True
  >`;
  const result = parseOdin(input);
  assertEquals(result, {
    name: "Test",
    value: 42,
    enabled: true,
  });
});

Deno.test("ODIN - nested object", () => {
  const input = `<
    outer = <
      inner = "value"
    >
  >`;
  const result = parseOdin(input);
  assertEquals(result, {
    outer: {
      inner: "value",
    },
  });
});

Deno.test("ODIN - keyed objects", () => {
  const input = `<
    ["en"] = <"English">
    ["de"] = <"German">
  >`;
  const result = parseOdin(input);
  assertEquals(result, {
    en: "English",
    de: "German",
  });
});

Deno.test("ODIN - language section example", () => {
  const input = `<
    original_language = <"ISO_639-1::en">
  >`;
  const result = parseOdin(input);
  assertEquals(result, {
    original_language: "ISO_639-1::en",
  });
});

Deno.test("ODIN - term definition example", () => {
  const input = `<
    text = <"Blood pressure">
    description = <"Blood pressure measurement">
  >`;
  const result = parseOdin(input);
  assertEquals(result, {
    text: "Blood pressure",
    description: "Blood pressure measurement",
  });
});

Deno.test("ODIN - complex nested structure", () => {
  const input = `<
    details = <
      ["en"] = <
        language = <"ISO_639-1::en">
        purpose = <"A simple test">
        keywords = <"test", "example">
      >
    >
  >`;
  const result = parseOdin(input);

  // Verify structure
  assertEquals(typeof result, "object");
  assertEquals("details" in result, true);
});

Deno.test("ODIN - hierarchical URI is one value, including fragment, query, and percent-encoding", () => {
  const fragment =
    "http://hl7.org/fhir/uv/genomics-reporting/CodeSystem/genomic-study-type-cs#alt-splc";
  const query = "http://some.service.org?some%20query%20etc";
  const both = "https://example.org/path?q=1&x=a+b#frag";
  const tilde = "http://example.org/~user";
  for (const uri of [fragment, query, both, tilde]) {
    const tokens = new ADL2Tokenizer(`<${uri}>`).tokenize();
    assertEquals(tokens[0].type, TokenType.URI);
    assertEquals(tokens[0].value, uri);
    assertEquals(tokens[1].type, TokenType.EOF);
    assertEquals(parseOdin(`<${uri}>`), uri);
  }
});

Deno.test("ODIN - term_bindings keep URI fragments (#133)", () => {
  const uri =
    "http://hl7.org/fhir/uv/genomics-reporting/CodeSystem/genomic-study-type-cs#alt-splc";
  const adl = `archetype (adl_version=2.0.6; rm_release=1.1.0)
    openEHR-EHR-CLUSTER.uri_probe.v1.0.0

language
    original_language = <[ISO_639-1::en]>

definition
    CLUSTER[id1] matches {
        items matches {
            ELEMENT[id2] matches {
                value matches {
                    DV_TEXT
                }
            }
        }
    }

terminology
    term_definitions = <
        ["en"] = <
            ["id1"] = <text = <"Probe"> description = <"Probe">>
            ["id2"] = <text = <"Item"> description = <"Item">>
        >
    >
    term_bindings = <
        ["HL7"] = <
            ["at0.10"] = <${uri}>
        >
    >
`;
  // deno-lint-ignore no-explicit-any
  const parsed: any = parseAdl(adl);
  assertEquals(parsed.archetype.ontology.term_bindings.HL7["at0.10"], uri);
});

Deno.test("ODIN - a quoted string may contain an angle-bracket URI", () => {
  const result = parseOdin(
    `<"openEHR Foundation <http://www.openEHR.org/id/1#x>">`,
  );
  assertEquals(result, "openEHR Foundation <http://www.openEHR.org/id/1#x>");
});

console.log("\n✅ ODIN Parser tests completed");
