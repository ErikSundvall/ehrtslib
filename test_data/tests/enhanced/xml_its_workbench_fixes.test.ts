/**
 * ITS-XML fixes aligned with penpad-clinergy-workbench vendor bundle (#322).
 * @see workbench docs/zipehr-roundtrip-gaps.md and vendor/ehrtslib/README.md
 */
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { XmlDeserializer } from "../../../serialization/xml/xml_deserializer.ts";
import { XmlSerializer } from "../../../serialization/xml/xml_serializer.ts";
import { TypeRegistry } from "../../../serialization/common/type_registry.ts";
import { CLUSTER, DV_BOOLEAN, ELEMENT, ITEM_TREE } from "../../../rm/openehr_rm.ts";
import { DV_TEXT } from "../../../rm/openehr_rm.ts";

TypeRegistry.register("ELEMENT", ELEMENT);
TypeRegistry.register("CLUSTER", CLUSTER);
TypeRegistry.register("ITEM_TREE", ITEM_TREE);
TypeRegistry.register("DV_TEXT", DV_TEXT);
TypeRegistry.register("DV_BOOLEAN", DV_BOOLEAN);

Deno.test("ITS-XML deserialize: repeating <items> siblings stay ordered array", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<item_tree xmlns="http://schemas.openehr.org/v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="ITEM_TREE">
  <items xsi:type="CLUSTER" archetype_node_id="at_a">
    <name xsi:type="DV_TEXT"><value>Cluster A</value></name>
  </items>
  <items xsi:type="ELEMENT" archetype_node_id="at_b">
    <name xsi:type="DV_TEXT"><value>Element B</value></name>
  </items>
</item_tree>`;
  const des = new XmlDeserializer({ strict: false });
  const tree = des.deserialize<ITEM_TREE>(xml);
  assert(Array.isArray(tree.items));
  assertEquals(tree.items.length, 2);
  assertEquals(tree.items[0].archetype_node_id, "at_a");
  assertEquals(tree.items[1].archetype_node_id, "at_b");
});

Deno.test("ITS-XML deserialize: single <items> still becomes one-element array", () => {
  const xml = `<item_tree xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="ITEM_TREE">
  <items xsi:type="ELEMENT" archetype_node_id="only">
    <name xsi:type="DV_TEXT"><value>X</value></name>
  </items>
</item_tree>`;
  const des = new XmlDeserializer({ strict: false });
  const tree = des.deserialize<ITEM_TREE>(xml);
  assertEquals(tree.items?.length, 1);
  assertEquals(tree.items?.[0]?.archetype_node_id, "only");
});

Deno.test("ITS-XML: ELEMENT DV_BOOLEAN value uses text (no nested value)", () => {
  const el = new ELEMENT();
  el.archetype_node_id = "at0001";
  const name = new DV_TEXT();
  name.value = "Flag";
  el.name = name;
  const b = new DV_BOOLEAN();
  b.value = true;
  el.value = b;

  const ser = new XmlSerializer({
    includeDeclaration: false,
    prettyPrint: false,
    useNamespaces: true,
  });
  const xml = ser.serialize(el);
  assertStringIncludes(xml, '<value xsi:type="DV_BOOLEAN">true</value>');
  assertEquals(xml.includes("<value><value>true</value></value>"), false);
  assertEquals(xml.includes("<value>\n    <value>true</value>"), false);

  const des = new XmlDeserializer({ strict: false });
  const back = des.deserialize<ELEMENT>(xml);
  const val = back.value as DV_BOOLEAN;
  assertEquals(val?.constructor?.name, "DV_BOOLEAN");
  assertEquals(val?.value, true);
});