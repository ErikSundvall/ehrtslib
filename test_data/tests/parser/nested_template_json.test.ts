/**
 * Better `.t.json` templates nested by template id (issue #95).
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import * as openehr_am from "../../../am/openehr_am.ts";
import { ArchetypeRepository } from "../../../parser/legacy/archetype_repository.ts";
import { buildDefinitionTree } from "../../../parser/clinical_model_annotations.ts";
import { OptXmlSerializer } from "../../../generation/opt_xml_serializer.ts";
import {
  TERM_ARCHETYPE_SCOPE_KEY,
  TERM_NAME_FALLBACK_NODE_ID_KEY,
  type TermScopeMeta,
} from "../../../generation/term_scope.ts";
import {
  buildWebTemplate,
  type WebTemplateNode,
} from "../../../serialization/simplified/web_template_builder.ts";

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

const SHARED_ARCHETYPE_ID = "openEHR-EHR-CLUSTER.symptom_sign.v1";
const QUESTION_NODE_ID = "at0005.1";

function chemoFormStyleRoot(
  slots: Array<{ nodeId: string; templateId: string }>,
): string {
  return JSON.stringify({
    "@type": "TEMPLATE",
    "templateId": "ChemoForm-MBA.v8",
    "archetypeId": {
      "@type": "ARCHETYPE_HRID",
      "value": "openEHR-EHR-COMPOSITION.t_self_reported_data.v1",
    },
    "definition": {
      "@type": "C_COMPLEX_OBJECT",
      "rmTypeName": "COMPOSITION",
      "nodeId": "at0000",
      "attributes": [{
        "@type": "C_ATTRIBUTE",
        "rmAttributeName": "content",
        "children": slots.map((slot) => ({
          "@type": "C_ARCHETYPE_ROOT",
          "rmTypeName": "CLUSTER",
          "occurrences": "0..1",
          "nodeId": slot.nodeId,
          "archetypeRef": slot.templateId,
          "referenceType": "templateId",
        })),
      }],
    },
  });
}

function symptomTemplate(
  templateId: string,
  labels: {
    enConcept: string;
    enQuestion: string;
    svConcept: string;
    svQuestion: string;
  },
): string {
  return JSON.stringify({
    "@type": "TEMPLATE",
    "templateId": templateId,
    "archetypeId": {
      "@type": "ARCHETYPE_HRID",
      "value": SHARED_ARCHETYPE_ID,
    },
    "definition": {
      "@type": "C_COMPLEX_OBJECT",
      "rmTypeName": "CLUSTER",
      "nodeId": "at0000.1",
      "attributes": [{
        "@type": "C_ATTRIBUTE",
        "rmAttributeName": "items",
        "children": [{
          "@type": "C_COMPLEX_OBJECT",
          "rmTypeName": "ELEMENT",
          "nodeId": QUESTION_NODE_ID,
        }],
      }],
    },
    "terminology": {
      "@type": "ARCHETYPE_TERMINOLOGY",
      "termDefinitions": {
        "en": {
          "at0000.1": { "text": labels.enConcept, "code": "at0000.1" },
          [QUESTION_NODE_ID]: {
            "text": labels.enQuestion,
            "code": QUESTION_NODE_ID,
          },
        },
        "sv": {
          "at0000.1": { "text": labels.svConcept, "code": "at0000.1" },
          [QUESTION_NODE_ID]: {
            "text": labels.svQuestion,
            "code": QUESTION_NODE_ID,
          },
        },
      },
    },
  });
}

function webNodes(node: WebTemplateNode, nodeId: string): WebTemplateNode[] {
  const found: WebTemplateNode[] = [];
  const walk = (current: WebTemplateNode) => {
    if (current.nodeId === nodeId) found.push(current);
    for (const child of current.children ?? []) walk(child);
  };
  walk(node);
  return found;
}

Deno.test("shared archetype id keeps a terminology bag per Better template id", () => {
  const fatigue = symptomTemplate("ChemoQ-fatigue", {
    enConcept: "Fatigue",
    enQuestion: "Do you experience fatigue that affects your daily life?",
    svConcept: "Trötthet",
    svQuestion: "Upplever du trötthet som påverkar ditt dagliga liv?",
  });
  const weight = symptomTemplate("ChemoQ-weight", {
    enConcept: "Weight",
    enQuestion: "Have your weight changed in recent weeks?",
    svConcept: "Vikt",
    svQuestion: "Har din vikt förändrats de senaste veckorna?",
  });
  const root = chemoFormStyleRoot([
    { nodeId: "at0039.1", templateId: "ChemoQ-fatigue" },
    { nodeId: "at0039.2", templateId: "ChemoQ-weight" },
  ]);
  const repo = ArchetypeRepository.fromEntries([
    { path: "ChemoForm-MBA.v8.t.json", content: root },
    { path: "ChemoQ-fatigue.t.json", content: fatigue },
    { path: "ChemoQ-weight.t.json", content: weight },
  ]);
  const source = repo.getTemplate("ChemoForm-MBA.v8")!;
  const opt = repo.flattenTemplate(source);
  assertEquals(opt.template_id, "ChemoForm-MBA.v8");

  const index = (opt as {
    archetype_term_definitions?: Record<
      string,
      Record<string, Record<string, { text?: string }>>
    >;
  }).archetype_term_definitions ?? {};
  assertEquals(
    index["ChemoQ-fatigue"]?.en?.[QUESTION_NODE_ID]?.text,
    "Do you experience fatigue that affects your daily life?",
  );
  assertEquals(
    index["ChemoQ-weight"]?.en?.[QUESTION_NODE_ID]?.text,
    "Have your weight changed in recent weeks?",
  );
  assertEquals(
    index["ChemoQ-fatigue"]?.sv?.["at0000.1"]?.text,
    "Trötthet",
  );

  const content = (opt.definition?.attributes?.[0] as {
    children?: openehr_am.C_OBJECT[];
  })?.children ?? [];
  const fatigueNode = content[0] as TermScopeMeta & openehr_am.C_OBJECT;
  const weightNode = content[1] as TermScopeMeta & openehr_am.C_OBJECT;
  assertEquals(fatigueNode[TERM_ARCHETYPE_SCOPE_KEY], "ChemoQ-fatigue");
  assertEquals(fatigueNode[TERM_NAME_FALLBACK_NODE_ID_KEY], "at0000.1");
  assertEquals(weightNode[TERM_ARCHETYPE_SCOPE_KEY], "ChemoQ-weight");
  assertEquals(weightNode.node_id, "at0039.2");

  const english = buildWebTemplate(opt, { defaultLanguage: "en" });
  assertEquals(english.templateId, "ChemoForm-MBA.v8");
  const fatigueCluster = webNodes(english.tree, "at0039.1").find((node) =>
    node.rmType === "CLUSTER"
  );
  const weightCluster = webNodes(english.tree, "at0039.2").find((node) =>
    node.rmType === "CLUSTER"
  );
  assertEquals(fatigueCluster?.name, "Fatigue");
  assertEquals(
    fatigueCluster?.children?.find((node) => node.nodeId === QUESTION_NODE_ID)
      ?.name,
    "Do you experience fatigue that affects your daily life?",
  );
  assertEquals(weightCluster?.name, "Weight");
  assertEquals(
    weightCluster?.children?.find((node) => node.nodeId === QUESTION_NODE_ID)
      ?.name,
    "Have your weight changed in recent weeks?",
  );

  const swedish = buildWebTemplate(opt, { defaultLanguage: "sv" });
  assertEquals(
    webNodes(swedish.tree, "at0039.1").find((node) => node.rmType === "CLUSTER")
      ?.name,
    "Trötthet",
  );
  assertEquals(
    webNodes(swedish.tree, "at0039.2").find((node) => node.rmType === "CLUSTER")
      ?.children?.find((node) => node.nodeId === QUESTION_NODE_ID)?.name,
    "Har din vikt förändrats de senaste veckorna?",
  );

  const xml = new OptXmlSerializer().serialize(opt);
  assert(xml.includes("<template_id>"));
  assert(xml.includes("<value>ChemoForm-MBA.v8</value>"));

  const tree = buildDefinitionTree(source, {
    resolveArchetype: (id) => repo.resolve(id),
    language: "en",
  });
  const flat: Array<{ label: string; nodeId?: string; rmType?: string }> = [];
  const walk = (
    node: {
      label: string;
      nodeId?: string;
      rmType?: string;
      children: typeof flat;
    },
  ) => {
    flat.push(node);
    for (const child of node.children) walk(child);
  };
  walk(tree!);
  assertEquals(
    flat.find((node) => node.nodeId === "at0039.1" && node.rmType === "CLUSTER")
      ?.label,
    "Fatigue",
  );
  assertEquals(
    flat.find((node) =>
      node.nodeId === QUESTION_NODE_ID && node.label.includes("fatigue")
    )?.label,
    "Do you experience fatigue that affects your daily life?",
  );
  assertEquals(
    flat.find((node) => node.nodeId === "at0039.2")?.label,
    "Weight",
  );
});

Deno.test("template basename used as archetypeRef is a term-index key", () => {
  const nested = symptomTemplate("ChemoQ-fatigue", {
    enConcept: "Fatigue",
    enQuestion: "Do you experience fatigue that affects your daily life?",
    svConcept: "Trötthet",
    svQuestion: "Upplever du trötthet som påverkar ditt dagliga liv?",
  });
  const root = chemoFormStyleRoot([
    { nodeId: "at0039.1", templateId: "ChemoQ-fatigue.v8" },
  ]);
  const repo = ArchetypeRepository.fromEntries([
    { path: "ChemoForm-MBA.v8.t.json", content: root },
    { path: "local/ChemoQ-fatigue.v8.t.json", content: nested },
  ]);
  const opt = repo.flattenTemplate(repo.getTemplate("ChemoForm-MBA.v8")!);
  const index = (opt as {
    archetype_term_definitions?: Record<
      string,
      Record<string, Record<string, { text?: string }>>
    >;
  }).archetype_term_definitions ?? {};
  assertEquals(
    index["ChemoQ-fatigue.v8"]?.en?.[QUESTION_NODE_ID]?.text,
    "Do you experience fatigue that affects your daily life?",
  );
  assertEquals(
    index["ChemoQ-fatigue"]?.en?.["at0000.1"]?.text,
    "Fatigue",
  );
  const inlined = (opt.definition?.attributes?.[0] as {
    children?: Array<TermScopeMeta & openehr_am.C_OBJECT>;
  })?.children?.[0];
  assertEquals(inlined?.[TERM_ARCHETYPE_SCOPE_KEY], "ChemoQ-fatigue.v8");
  assertEquals(
    buildWebTemplate(opt).tree.children?.find((node) =>
      node.nodeId === "at0039.1"
    )
      ?.name,
    "Fatigue",
  );
});
