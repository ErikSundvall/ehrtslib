/**
 * #338: createTemplateLabelResolver leaked terms from an unrelated language
 * (and archetype) onto elided intermediate RM nodes.
 *
 * When an isolated `wt:*` / archetype scope exists in en/sv but has no table
 * in a tertiary fallback language (zh), `hasScopedBag` used to look only at
 * that language's bags and fall through to the flat root ontology — e.g.
 * Chinese "问题/诊断名字" from problem_diagnosis on an EDD ITEM_TREE at0002.
 */

import { assertEquals } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import type * as openehr_base from "../../../base/openehr_base.ts";
import {
  createTemplateLabelResolver,
  type OperationalTemplateWithTermScopes,
  TERM_ARCHETYPE_SCOPE_KEY,
  type TermScopeMeta,
} from "../../../generation/mod.ts";

const EDD_SCOPE = "wt:/content[at0.21]/items[at0.8]/items[at0.2]";
const ZH_PROBLEM_NAME = "问题/诊断名字";
const ZH_SEVERITY = "严重性";

function makeNode(
  rmType: string,
  nodeId: string,
  meta?: TermScopeMeta,
): openehr_am.C_COMPLEX_OBJECT {
  const obj = new openehr_am.C_COMPLEX_OBJECT();
  obj.rm_type_name = rmType;
  obj.node_id = nodeId;
  if (meta) Object.assign(obj, meta);
  return obj;
}

function leakReproOpt(): OperationalTemplateWithTermScopes {
  const opt = new openehr_am.OPERATIONAL_TEMPLATE() as
    & openehr_am.OPERATIONAL_TEMPLATE
    & OperationalTemplateWithTermScopes;
  opt.original_language = "en" as unknown as openehr_base.Terminology_code;
  const ontology = new openehr_am.ARCHETYPE_ONTOLOGY();
  ontology.term_definitions = {
    en: {
      at0000: { text: "Prenatal visit" },
    },
    sv: {
      at0000: { text: "Mödravårdsbesök" },
    },
    // Unrelated problem_diagnosis terms at the flat template root. The EDD
    // ITEM_TREE / HISTORY nodes reuse at0002 / at0003 but are not this archetype.
    zh: {
      at0002: { text: ZH_PROBLEM_NAME },
      at0003: { text: ZH_SEVERITY },
    },
  };
  opt.ontology = ontology;
  // Isolated EDD subtree scope: present in en/sv, no zh translation, and no
  // term for the elided ITEM_TREE (at0002) or HISTORY (at0003) node ids.
  opt.archetype_term_definitions = {
    [EDD_SCOPE]: {
      en: {
        at0000: { text: "Estimated Date of Delivery" },
        at0010: { text: "Estimated date" },
      },
      sv: {
        at0000: { text: "Beräknat förlossningsdatum" },
        at0010: { text: "Beräknat datum" },
      },
    },
  };
  return opt;
}

Deno.test("#338: isolated wt:* scope does not leak zh root ontology onto elided ITEM_TREE", () => {
  const opt = leakReproOpt();
  const resolver = createTemplateLabelResolver(opt, {
    language: "en",
    languages: ["en", "sv"],
  });
  const itemTree = makeNode("ITEM_TREE", "at0002", {
    [TERM_ARCHETYPE_SCOPE_KEY]: EDD_SCOPE,
  });

  assertEquals(resolver.resolveNodeTermInLanguage(itemTree, "en"), {});
  assertEquals(resolver.resolveNodeTermInLanguage(itemTree, "sv"), {});
  assertEquals(resolver.resolveNodeTermInLanguage(itemTree, "zh"), {});

  const resolved = resolver.resolveNode(itemTree);
  assertEquals(resolved.primaryName, undefined);
  assertEquals(resolved.label, undefined);
  assertEquals(resolved.localizedNames, undefined);

  const withHint = resolver.resolveNode(itemTree, undefined, {
    fallbackHint: "Item tree",
  });
  assertEquals(withHint.primaryName, undefined);
  assertEquals(withHint.label, "Item tree");
});

Deno.test("#338: isolated scope does not leak zh root ontology onto elided HISTORY", () => {
  const opt = leakReproOpt();
  const resolver = createTemplateLabelResolver(opt, {
    language: "sv",
    languages: ["sv", "en"],
  });
  const history = makeNode("HISTORY", "at0003", {
    [TERM_ARCHETYPE_SCOPE_KEY]: EDD_SCOPE,
  });

  assertEquals(resolver.resolveNodeTermInLanguage(history, "en"), {});
  assertEquals(resolver.resolveNodeTermInLanguage(history, "sv"), {});
  assertEquals(resolver.resolveNode(history).primaryName, undefined);
});

Deno.test("#338: codes that live in the isolated scope still resolve from that scope", () => {
  const opt = leakReproOpt();
  const resolver = createTemplateLabelResolver(opt, {
    language: "en",
    languages: ["en", "sv"],
  });
  const dated = makeNode("ELEMENT", "at0010", {
    [TERM_ARCHETYPE_SCOPE_KEY]: EDD_SCOPE,
  });
  const resolved = resolver.resolveNode(dated);
  assertEquals(resolved.primaryName, "Estimated date");
  assertEquals(resolved.localizedNames, {
    en: "Estimated date",
    sv: "Beräknat datum",
  });
});

Deno.test("#338: unscoped nodes may still use the flat template ontology, including zh fallback", () => {
  const opt = leakReproOpt();
  const resolver = createTemplateLabelResolver(opt, {
    language: "en",
    languages: ["en", "sv"],
  });
  const unscoped = makeNode("ELEMENT", "at0002");
  const resolved = resolver.resolveNode(unscoped);
  assertEquals(resolved.primaryName, ZH_PROBLEM_NAME);
  assertEquals(
    resolver.resolveNodeTermInLanguage(unscoped, "zh").text,
    ZH_PROBLEM_NAME,
  );
});

Deno.test("#338: resolveCode with an isolated scope does not leak zh root ontology", () => {
  const opt = leakReproOpt();
  const resolver = createTemplateLabelResolver(opt, {
    language: "en",
    languages: ["en", "sv"],
  });
  assertEquals(resolver.resolveCode("at0002", EDD_SCOPE).label, undefined);
  assertEquals(
    resolver.resolveCodeInLanguage("at0002", "zh", EDD_SCOPE),
    undefined,
  );
  assertEquals(
    resolver.resolveCode("at0010", EDD_SCOPE).label,
    "Estimated date",
  );
  assertEquals(resolver.resolveCode("at0002").label, ZH_PROBLEM_NAME);
});
