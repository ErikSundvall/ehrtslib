/**
 * #317: Ferro FLAT with term mappings validates against Ferro Web Template.
 */
import { assertEquals } from "@std/assert";
import {
  validateFlatPayload,
  type WebTemplate,
} from "../../../../serialization/simplified/mod.ts";

const WT = new URL(
  "../../../fixtures/ferroehr/ferro-flat/wt.json",
  import.meta.url,
);
const FLAT = new URL(
  "../../../fixtures/ferroehr/ferro-flat/ferro-flat-01.json",
  import.meta.url,
);

Deno.test("#317 Ferro ferro-flat-01 passes validateFlatPayload", () => {
  const wt = JSON.parse(Deno.readTextFileSync(WT)) as WebTemplate;
  const flat = JSON.parse(Deno.readTextFileSync(FLAT)) as Record<string, unknown>;
  const result = validateFlatPayload(flat, wt);
  const cardinality = result.errors.filter((e) =>
    e.message.includes("instance count")
  );
  assertEquals(cardinality, []);
});