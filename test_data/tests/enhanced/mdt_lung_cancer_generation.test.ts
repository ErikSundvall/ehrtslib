import { assert, assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import * as openehr_am from "../../../enhanced/openehr_am.ts";
import { ClinicalModelWorkspace } from "../../../enhanced/parser/clinical_model_workspace.ts";
import {
  assertTemplateInstanceCoverage,
  RMInstanceGenerator,
} from "../../../enhanced/generation/mod.ts";

const BLOB_URL =
  "https://github.com/regionstockholm/CKM-mirror-via-modellbibliotek/blob/MultiDiciplinery_Tumor_meetings/local/Diagnostic_MDT_Lung_cancer.t.json";

Deno.test({
  name: "Diagnostic_MDT_Lung_cancer uses Swedish labels and all content sections",
  permissions: { net: true },
  async fn() {
    const ws = new ClinicalModelWorkspace();
    await ws.loadFromGitHubTemplateUrl(BLOB_URL, { maxFiles: 120 });
    const { operationalTemplate } = ws.resolveOperational();

    const contentAttr = operationalTemplate.definition?.attributes?.find(
      (a) => a.rm_attribute_name === "content",
    );
    assert(contentAttr instanceof openehr_am.C_MULTIPLE_ATTRIBUTE);
    assert(
      (contentAttr.children?.length ?? 0) >= 8,
      "expected all template content sections",
    );

    const svTerms =
      (operationalTemplate.ontology?.term_definitions as Record<string, Record<string, { text?: string }>> | undefined)
        ?.sv ?? {};
    assert(
      Object.keys(svTerms).length > 10,
      "expected merged Swedish terminology from archetypes",
    );

    const instance = new RMInstanceGenerator({ mode: "example" }).generate(
      operationalTemplate,
    );
    assertTemplateInstanceCoverage(instance, operationalTemplate, "example");

    assertEquals(instance.name?.value, "Granskning");
    assertEquals(instance.content?.length, 8);

    function collectNames(obj: unknown, out: string[] = []): string[] {
      if (!obj || typeof obj !== "object") return out;
      if (Array.isArray(obj)) {
        for (const item of obj) collectNames(item, out);
        return out;
      }
      const rec = obj as Record<string, unknown>;
      const name = (rec.name as { value?: string } | undefined)?.value;
      if (name && typeof rec.archetype_node_id === "string") {
        out.push(`${rec.archetype_node_id}:${name}`);
      }
      for (const v of Object.values(rec)) collectNames(v, out);
      return out;
    }

    const names = collectNames(instance);
    const joined = names.join("\n");
    assert(joined.includes("Granskning"));
    assert(joined.includes("signeringsansvarig") || joined.includes("HSAID"));
    assert(joined.includes("Journaltext") || joined.includes("Överföringsformat"));
    const genericCount = names.filter((n) =>
      /:(Cluster|Section|Admin Entry|Item Tree)$/.test(n)
    ).length;
    assert(
      genericCount < names.length / 2,
      `too many generic RM labels (${genericCount}/${names.length}): ${joined}`,
    );
  },
});
