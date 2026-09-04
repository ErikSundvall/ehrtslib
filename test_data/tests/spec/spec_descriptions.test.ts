import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  attributeSpec,
  classSpec,
  hasClassSpec,
  specUrls,
} from "../../../spec/mod.ts";

Deno.test("classSpec returns BMM documentation and development-stream URLs", () => {
  const qty = classSpec("DV_QUANTITY");
  assertEquals(qty?.name, "DV_QUANTITY");
  assertEquals(qty?.component, "RM");
  assertEquals(typeof qty?.documentation, "string");
  assertEquals(
    qty?.specHtmlUrl?.includes(
      "/releases/RM/development/data_types.html#_dv_quantity_class",
    ),
    true,
  );
  assertEquals(
    qty?.specMarkdownUrl?.includes(
      "/releases/RM/development/data_types.md#_dv_quantity_class",
    ),
    true,
  );
  assertEquals(hasClassSpec("DV_QUANTITY"), true);
});

Deno.test("attributeSpec returns BMM attribute documentation", () => {
  const mag = attributeSpec("DV_QUANTITY", "magnitude");
  assertEquals(mag?.name, "magnitude");
  assertEquals(typeof mag?.documentation, "string");
  assertEquals((mag?.documentation?.length ?? 0) > 0, true);
});

Deno.test("specUrls prefers RM when the class name is unique", () => {
  const urls = specUrls("COMPOSITION");
  assertEquals(
    urls?.html?.includes(
      "/releases/RM/development/ehr.html#_composition_class",
    ),
    true,
  );
  assertEquals(
    urls?.markdown?.includes(
      "/releases/RM/development/ehr.md#_composition_class",
    ),
    true,
  );
});

Deno.test("classSpec can disambiguate by component", () => {
  const rm = classSpec("CODE_PHRASE", { component: "RM" });
  const base = classSpec("CODE_PHRASE", { component: "BASE" });
  assertEquals(rm?.component, "RM");
  assertEquals(base?.component, "BASE");
  assertEquals(typeof rm?.documentation, "string");
});

Deno.test("classSpec returns development-stream URLs for AOM 1.4 types missing from AM 2.4 BMM", () => {
  const qty = classSpec("C_QUANTITY", { component: "AM" });
  assertEquals(qty?.name, "C_QUANTITY");
  assertEquals(qty?.component, "AM");
  assertEquals(
    qty?.specHtmlUrl?.includes(
      "/releases/AM/development/AOM1.4.html#_c_quantity_class",
    ),
    true,
  );
  assertEquals(
    qty?.specMarkdownUrl?.includes(
      "/releases/AM/development/AOM1.4.md#_c_quantity_class",
    ),
    true,
  );
});
