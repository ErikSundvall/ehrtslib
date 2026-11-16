/**
 * #317: `_mapping:N` must not count as extra instances of the parent node.
 */
import { assertEquals } from "@std/assert";
import {
  validateFlatPayload,
  type WebTemplate,
} from "../../../../serialization/simplified/mod.ts";

const wt: WebTemplate = {
  templateId: "demo",
  defaultLanguage: "en",
  tree: {
    id: "encounter",
    name: "Encounter",
    rmType: "COMPOSITION",
    min: 1,
    max: 1,
    aqlPath: "/",
    children: [
      {
        id: "body_site_name",
        name: "Body site name",
        rmType: "DV_CODED_TEXT",
        min: 0,
        max: 1,
        aqlPath: "/content[at0001]/items[at0002]",
        inputs: [{ type: "TEXT", suffix: "code" }],
      },
    ],
  },
};

Deno.test("#317 validateFlatPayload: two _mapping keys do not exceed max 1", () => {
  const flat = {
    "encounter/body_site_name|code": "at0003",
    "encounter/body_site_name|terminology": "local",
    "encounter/body_site_name/_mapping:0|match": "=",
    "encounter/body_site_name/_mapping:0/target|code": "271765009",
    "encounter/body_site_name/_mapping:0/target|terminology": "SNOMED-CT",
    "encounter/body_site_name/_mapping:1|match": "=",
    "encounter/body_site_name/_mapping:1/target|code": "7771000",
    "encounter/body_site_name/_mapping:1/target|terminology": "SNOMED-CT",
  };
  const result = validateFlatPayload(flat, wt);
  const cardinality = result.errors.filter((e) =>
    e.message.includes("instance count")
  );
  assertEquals(cardinality, []);
  assertEquals(result.valid, true);
});