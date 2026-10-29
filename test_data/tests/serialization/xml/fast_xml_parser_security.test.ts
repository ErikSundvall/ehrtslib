// Regression tests for GHSA-gh4j-gqv2-49f6 (fast-xml-parser XMLBuilder did not
// escape comment / CDATA delimiters; patched range is >= 5.7.0).
// https://github.com/advisories/GHSA-gh4j-gqv2-49f6
import { assert, assertEquals, assertFalse } from "@std/assert";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { XmlSerializer } from "../../../../serialization/xml/xml_serializer.ts";
import { XmlDeserializer } from "../../../../serialization/xml/xml_deserializer.ts";
import { TypeRegistry } from "../../../../serialization/common/type_registry.ts";
import { DV_TEXT } from "../../../../rm/openehr_rm.ts";

Deno.test("GHSA-gh4j-gqv2-49f6: XMLBuilder neutralises comment and CDATA delimiters", () => {
  const builder = new XMLBuilder({
    commentPropName: "#comment",
    cdataPropName: "#cdata",
  });
  const xml = builder.build({
    root: { "#comment": "--><evil/><!--", "#cdata": "x]]><evil/>" },
  });
  const parsed = new XMLParser({
    commentPropName: "#comment",
    cdataPropName: "#cdata",
  })
    .parse(xml);
  assertFalse("evil" in parsed.root, `delimiter injection in ${xml}`);
});

Deno.test("XmlSerializer escapes ']]>' and '-->' in text values and round-trips them", () => {
  TypeRegistry.register("DV_TEXT", DV_TEXT);
  const payload = "a ]]> b --> <evil/> & c";
  const dv = new DV_TEXT();
  dv.value = payload;
  const xml = new XmlSerializer({ includeDeclaration: false }).serialize(dv);
  assertFalse(xml.includes("<evil/>"), xml);
  assert(xml.includes("&lt;evil/&gt;"), xml);
  const back = new XmlDeserializer().deserialize<DV_TEXT>(xml);
  assertEquals(back.value, payload);
});
