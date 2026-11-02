/**
 * An ELEMENT with no value constraint lists the 16 `<type>_value` children
 * EHRbase and FerroEHR both list (#267). DV_INTERVAL stays unlisted.
 * `webTemplateToOpt` does not turn the list into a value choice.
 */
import { assert, assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import {
  isUnconstrainedElement,
  UNCONSTRAINED_ELEMENT_VALUE_TYPES,
  valueChoiceId,
} from "../../../../serialization/simplified/element_value_choice.ts";
import {
  buildWebTemplate,
  webTemplateToOpt,
} from "../../../../serialization/simplified/mod.ts";
import type { WebTemplateNode } from "../../../../serialization/simplified/types.ts";

const EXPECTED = [
  "text_value",
  "coded_text_value",
  "multimedia_value",
  "parsable_value",
  "boolean_value",
  "identifier_value",
  "uri_value",
  "ehr_uri_value",
  "duration_value",
  "quantity_value",
  "count_value",
  "proportion_value",
  "date_time_value",
  "time_value",
  "ordinal_value",
  "date_value",
];

function findAny(node: WebTemplateNode): WebTemplateNode | undefined {
  if (node.rmType === "ELEMENT" && node.id === "any") return node;
  for (const child of node.children ?? []) {
    const found = findAny(child);
    if (found) return found;
  }
  return undefined;
}

Deno.test("unconstrained ELEMENT lists the 16 shared <type>_value children (#267)", () => {
  const opt = parseOptXml(
    Deno.readTextFileSync(
      new URL("../../../opt14/conformance_ehrbase.de.v0.opt", import.meta.url),
    ),
  ).operationalTemplate!;
  const any = findAny(buildWebTemplate(opt).tree);
  assert(any, "conformance any ELEMENT");
  assertEquals(any.children?.map((c) => c.id), EXPECTED);
  assertEquals(
    EXPECTED,
    UNCONSTRAINED_ELEMENT_VALUE_TYPES.map(valueChoiceId),
  );
  assertEquals(isUnconstrainedElement(any), true);
  for (const child of any.children ?? []) {
    assertEquals(child.aqlPath, `${any.aqlPath}/value`);
    assertEquals(child.min, 0);
    assertEquals(child.max, 1);
    assert(child.inputs?.length, child.id);
  }
  assertEquals(any.children?.some((c) => c.id === "state_value"), false);
  assertEquals(any.children?.some((c) => c.id === "scale_value"), false);
  const quantity = any.children?.find((c) => c.id === "quantity_value");
  assertEquals(quantity?.rmType, "DV_QUANTITY");
  assert(quantity?.inputs?.some((i) => i.suffix === "magnitude"));
});

Deno.test("webTemplateToOpt collapses the expansion back to no value constraint (#267)", () => {
  const opt = parseOptXml(
    Deno.readTextFileSync(
      new URL("../../../opt14/conformance_ehrbase.de.v0.opt", import.meta.url),
    ),
  ).operationalTemplate!;
  const first = buildWebTemplate(opt);
  const again = buildWebTemplate(webTemplateToOpt(first));
  const any = findAny(again.tree);
  assert(any);
  assertEquals(any.children?.map((c) => c.id), EXPECTED);
  assertEquals(isUnconstrainedElement(any), true);
});
