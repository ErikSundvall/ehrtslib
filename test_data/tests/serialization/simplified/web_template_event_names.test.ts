/**
 * Two EVENTs with one node id and different name constraints (RIPPLE pulse:
 * at0003 "First event" and "Second event") get `name/value` predicates in
 * their AQL paths, as other renamed siblings do, so their paths differ and
 * OPT → WT → OPT → WT keeps both.
 */
import { assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import {
  buildWebTemplate,
  webTemplateToOpt,
} from "../../../../serialization/simplified/mod.ts";
import type { WebTemplateNode } from "../../../../serialization/simplified/types.ts";

const wt = buildWebTemplate(
  parseOptXml(
    Deno.readTextFileSync(
      new URL("../../../opt14/RIPPLE-Conformance Test.opt", import.meta.url),
    ),
  ).operationalTemplate!,
);

function events(tree: WebTemplateNode): string[] {
  const out: string[] = [];
  const walk = (n: WebTemplateNode) => {
    if (/EVENT$/.test(n.rmType) && n.aqlPath.includes("OBSERVATION.pulse")) {
      out.push(`${n.id} ${n.aqlPath.slice(n.aqlPath.indexOf("/data["))}`);
    }
    (n.children ?? []).forEach(walk);
  };
  walk(tree);
  return out;
}

Deno.test("Web Template: renamed EVENTs with one node id get name predicates", () => {
  assertEquals(events(wt.tree), [
    "first_event /data[at0002]/events[at0003 and name/value='First event']",
    "second_event /data[at0002]/events[at0003 and name/value='Second event']",
    "maximum /data[at0002]/events[at1036]",
  ]);
});

Deno.test("webTemplateToOpt keeps both renamed EVENTs", () => {
  assertEquals(
    events(buildWebTemplate(webTemplateToOpt(wt)).tree),
    events(wt.tree),
  );
});
