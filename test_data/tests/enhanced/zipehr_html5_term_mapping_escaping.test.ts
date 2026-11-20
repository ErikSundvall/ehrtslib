/**
 * ZipEHR html5 `tm` wire escaping (issue #325).
 */
import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  serializeCanonicalToHtml5,
  zipehrHtml5ToCanonical,
} from "../../../serialization/zipehr/mod.ts";
import { escapeWireField, unescapeWireField } from "../../../serialization/zipehr/shared.ts";

const EXPRESSION =
  "404684003 |Clinical finding| : 363698007 |Finding site| = 39607008 |Lung structure|";

function mapping(code: string, match = "=", purpose?: { code: string; value: string }) {
  return {
    _type: "TERM_MAPPING",
    match,
    target: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "SNOMED-CT" },
      code_string: code,
    },
    ...(purpose
      ? {
        purpose: {
          _type: "DV_CODED_TEXT",
          value: purpose.value,
          defining_code: {
            _type: "CODE_PHRASE",
            terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
            code_string: purpose.code,
          },
        },
      }
      : {}),
  };
}

function element(value: Record<string, unknown>): Record<string, unknown> {
  return {
    _type: "ELEMENT",
    name: { _type: "DV_TEXT", value: "Description" },
    archetype_node_id: "at0001",
    value,
  };
}

async function roundTrip(node: Record<string, unknown>, dialect: "short" | "full" | "emoji") {
  const html = await serializeCanonicalToHtml5(node, { dialect });
  return { html, back: zipehrHtml5ToCanonical(html) as Record<string, unknown> };
}

for (const dialect of ["short", "full", "emoji"] as const) {
  Deno.test(`html5 ${dialect}: DV_TEXT mappings with |, ; and % codes round-trip`, async () => {
    const node = element({
      _type: "DV_TEXT",
      value: "Finding in lung.",
      mappings: [
        mapping(EXPRESSION),
        mapping("A;B", ">"),
        mapping("100%|x", "<", { code: "671", value: "research study; a|b" }),
      ],
    });
    const { html, back } = await roundTrip(node, dialect);
    assertEquals(html.includes("%7CClinical finding%7C"), true, html);
    assertEquals(back.value, node.value);
  });

  Deno.test(`html5 ${dialect}: DV_CODED_TEXT mapping with a postcoordinated expression round-trips`, async () => {
    const node = element({
      _type: "DV_CODED_TEXT",
      value: "Finding in lung",
      defining_code: {
        _type: "CODE_PHRASE",
        terminology_id: { _type: "TERMINOLOGY_ID", value: "local" },
        code_string: "at0002",
      },
      mappings: [mapping(EXPRESSION, ">")],
    });
    const { back } = await roundTrip(node, dialect);
    assertEquals(back.value, node.value);
  });
}

Deno.test("tm wire fields: escape and unescape are inverse; legacy unescaped wire still reads", () => {
  for (const value of [EXPRESSION, "a;b", "100%", "%7C literal", ""]) {
    assertEquals(unescapeWireField(escapeWireField(value)), value);
  }
  assertEquals(escapeWireField("a|b;c%"), "a%7Cb%3Bc%25");
  const legacy = `<o-e n="at0001">Description<o-x p="value" tm="=|SNOMED-CT::44054006;&gt;|ICD10::E11.9">Text</o-x></o-e>`;
  const back = zipehrHtml5ToCanonical(legacy) as { value: { mappings: unknown[] } };
  assertEquals(back.value.mappings, [
    { ...mapping("44054006") },
    {
      ...mapping("E11.9", ">"),
      target: {
        _type: "CODE_PHRASE",
        terminology_id: { _type: "TERMINOLOGY_ID", value: "ICD10" },
        code_string: "E11.9",
      },
    },
  ]);
});
