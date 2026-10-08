/**
 * Better `.t.json` templates nested by template id (issue #95).
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import * as openehr_am from "../../../am/openehr_am.ts";
import { ArchetypeRepository } from "../../../parser/legacy/archetype_repository.ts";

const NESTED_ID = "ChemoQ-fatigue";

function clusterTemplate(): string {
  return JSON.stringify({
    "@type": "TEMPLATE",
    "templateId": NESTED_ID,
    "archetypeId": {
      "@type": "ARCHETYPE_HRID",
      "value": "openEHR-EHR-CLUSTER.symptom_sign.v1",
    },
    "definition": {
      "@type": "C_COMPLEX_OBJECT",
      "rmTypeName": "CLUSTER",
      "nodeId": "at0000",
      "attributes": [{
        "@type": "C_ATTRIBUTE",
        "rmAttributeName": "items",
        "children": [
          element("at0001"),
          element("at0002"),
        ],
      }],
    },
  });
}

function element(nodeId: string): Record<string, string> {
  return {
    "@type": "C_COMPLEX_OBJECT",
    "rmTypeName": "ELEMENT",
    "nodeId": nodeId,
  };
}

function rootTemplate(): string {
  return JSON.stringify({
    "@type": "TEMPLATE",
    "templateId": "ChemoForm",
    "archetypeId": {
      "@type": "ARCHETYPE_HRID",
      "value": "openEHR-EHR-COMPOSITION.chemo_form.v1",
    },
    "definition": {
      "@type": "C_COMPLEX_OBJECT",
      "rmTypeName": "COMPOSITION",
      "nodeId": "at0000",
      "attributes": [{
        "@type": "C_ATTRIBUTE",
        "rmAttributeName": "content",
        "children": [{
          "@type": "C_ARCHETYPE_ROOT",
          "rmTypeName": "CLUSTER",
          "nodeId": "at0001",
          "archetypeRef": NESTED_ID,
        }],
      }],
    },
  });
}

function countRmType(node: unknown, rmType: string): number {
  if (!node || typeof node !== "object") return 0;
  const obj = node as {
    rm_type_name?: string;
    attributes?: Array<{ children?: unknown[] }>;
  };
  let count = obj.rm_type_name === rmType ? 1 : 0;
  for (const attr of obj.attributes ?? []) {
    for (const child of attr.children ?? []) {
      count += countRmType(child, rmType);
    }
  }
  return count;
}

Deno.test("flatten expands a Better template referenced by template id", () => {
  const rootOnly = ArchetypeRepository.fromEntries([
    { path: "ChemoForm.t.json", content: rootTemplate() },
  ]);
  const rootOpt = rootOnly.flattenTemplate(rootOnly.getTemplate("ChemoForm")!);
  assertEquals(countRmType(rootOpt.definition, "ELEMENT"), 0);
  const unexpanded = rootOpt.definition?.attributes?.[0];
  const unexpandedChild = (unexpanded as { children?: openehr_am.C_OBJECT[] })
    ?.children?.[0];
  assert(unexpandedChild instanceof openehr_am.C_ARCHETYPE_ROOT);

  const withNested = ArchetypeRepository.fromEntries([
    { path: "ChemoForm.t.json", content: rootTemplate() },
    { path: "nested/ChemoQ-fatigue.t.json", content: clusterTemplate() },
  ]);
  assertEquals(withNested.listTemplateIds().sort(), [
    "openEHR-EHR-CLUSTER.symptom_sign.v1",
    "openEHR-EHR-COMPOSITION.chemo_form.v1",
  ]);
  assert(withNested.resolve(NESTED_ID) instanceof openehr_am.TEMPLATE);
  assertEquals(
    withNested.resolve(NESTED_ID)?.archetype_id?.value,
    "openEHR-EHR-CLUSTER.symptom_sign.v1",
  );

  const opt = withNested.flattenTemplate(withNested.getTemplate("ChemoForm")!);
  assertEquals(countRmType(opt.definition, "ELEMENT"), 2);
  const inlined = (opt.definition?.attributes?.[0] as {
    children?: openehr_am.C_OBJECT[];
  })?.children?.[0];
  assert(inlined instanceof openehr_am.C_COMPLEX_OBJECT);
  assert(!(inlined instanceof openehr_am.C_ARCHETYPE_ROOT));
});

Deno.test("template lookup accepts the file basename without .t.json", () => {
  const repo = ArchetypeRepository.fromEntries([
    {
      path: "ChemoQ-fatigue.v8.t.json",
      content: clusterTemplate().replace(
        `"templateId":"${NESTED_ID}"`,
        `"templateId":"other-id"`,
      ),
    },
  ]);
  assertEquals(repo.listTemplateIds(), [
    "openEHR-EHR-CLUSTER.symptom_sign.v1",
  ]);
  assert(repo.getTemplate("ChemoQ-fatigue.v8"));
  assert(repo.resolve("ChemoQ-fatigue.v8") instanceof openehr_am.TEMPLATE);
  assert(repo.getTemplate("other-id"));
});
