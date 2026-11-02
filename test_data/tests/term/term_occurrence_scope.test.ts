/**
 * An OPT that uses one archetype twice with different terms (two
 * SECTION.adhoc.v1 roots, at0000 "Measurements" and "Behavior") keeps both
 * term tables: the first under the archetype id, the other under an
 * occurrence scope (`<id>#2`) that `termScopeOf` returns for its nodes.
 */
import { assert, assertEquals } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import { parseTemplateInput } from "../../../parser/legacy/parse_template_input.ts";
import {
  applyOperationalTemplateTermScopes,
  archetypeTermBagsForLanguage,
  type OperationalTemplateWithTermScopes,
  termScopeOf,
} from "../../../generation/term_scope.ts";
import { buildWebTemplate } from "../../../serialization/simplified/mod.ts";

const ADHOC = "openEHR-EHR-SECTION.adhoc.v1";

function load():
  & openehr_am.OPERATIONAL_TEMPLATE
  & OperationalTemplateWithTermScopes {
  const parsed = parseTemplateInput(
    Deno.readTextFileSync(
      new URL("../../opt14/aql_example.opt", import.meta.url),
    ),
  ) as unknown as { operationalTemplate?: unknown };
  return (parsed.operationalTemplate ?? parsed) as
    & openehr_am.OPERATIONAL_TEMPLATE
    & OperationalTemplateWithTermScopes;
}

function sections(
  opt: openehr_am.OPERATIONAL_TEMPLATE,
): openehr_am.C_ARCHETYPE_ROOT[] {
  const content = opt.definition!.attributes!.find((a) =>
    a.rm_attribute_name === "content"
  )!;
  return (content.children ?? []).filter((
    c,
  ): c is openehr_am.C_ARCHETYPE_ROOT =>
    c instanceof openehr_am.C_ARCHETYPE_ROOT && c.archetype_ref === ADHOC
  );
}

Deno.test("term scopes: each occurrence of an archetype keeps its own terms", () => {
  const opt = load();
  applyOperationalTemplateTermScopes(opt, "en");
  const bags = archetypeTermBagsForLanguage(opt, "en");
  const [first, second] = sections(opt);
  assertEquals(termScopeOf(first), ADHOC);
  assertEquals(termScopeOf(second), `${ADHOC}#2`);
  assertEquals(bags[termScopeOf(first)!].at0000.text, "Measurements");
  assertEquals(bags[termScopeOf(second)!].at0000.text, "Behavior");
  // Descendants of the second occurrence share its scope.
  const child = second.attributes!.find((a) => a.rm_attribute_name === "items")!
    .children![0];
  assert(child instanceof openehr_am.C_ARCHETYPE_ROOT);
  assertEquals(termScopeOf(child), child.archetype_ref);
  // Applying twice gives the same result.
  applyOperationalTemplateTermScopes(opt, "en");
  assertEquals(termScopeOf(second), `${ADHOC}#2`);
  assertEquals(
    archetypeTermBagsForLanguage(opt, "en")[`${ADHOC}#2`].at0000.text,
    "Behavior",
  );
});

Deno.test("term scopes: Web Template labels come from the occurrence's terms", () => {
  const opt = load();
  // Without the name constraints only the terms tell the sections apart.
  for (const section of sections(opt)) {
    section.attributes = section.attributes!.filter((a) =>
      a.rm_attribute_name !== "name"
    );
  }
  applyOperationalTemplateTermScopes(opt, "en");
  const wt = buildWebTemplate(opt);
  assertEquals(
    wt.tree.children!.filter((c) => c.rmType === "SECTION").map((c) => c.name),
    ["Measurements", "Behavior"],
  );
});

Deno.test("term scopes: ADL2 up-conversion keeps occurrence terms", async () => {
  const { upconvertOpt14ToAdl2 } = await import(
    "../../../parser/legacy/opt14_upconvert.ts"
  );
  const source = load();
  applyOperationalTemplateTermScopes(source, "en");
  const opt = upconvertOpt14ToAdl2(source).operationalTemplate as
    & openehr_am.OPERATIONAL_TEMPLATE
    & OperationalTemplateWithTermScopes;
  const [, second] = sections(opt);
  assertEquals(termScopeOf(second), `${ADHOC}#2`);
  const bags = archetypeTermBagsForLanguage(opt, "en");
  assertEquals(bags[ADHOC][second.node_id].text, "Measurements");
  assertEquals(bags[`${ADHOC}#2`][second.node_id].text, "Behavior");
});
