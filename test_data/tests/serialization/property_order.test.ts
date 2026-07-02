import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { orderSerializationKeys } from "../../../enhanced/serialization/common/property_order.ts";

const sample = ["items", "archetype_node_id", "name", "language"];

Deno.test("orderSerializationKeys places name first when nameLocation is beginning", () => {
  assertEquals(
    orderSerializationKeys(sample, {
      archetypeNodeIdLocation: "after_name",
      nameLocation: "beginning",
    }),
    ["name", "archetype_node_id", "items", "language"],
  );
});

Deno.test("orderSerializationKeys places archetype_node_id first when configured", () => {
  assertEquals(
    orderSerializationKeys(sample, {
      archetypeNodeIdLocation: "beginning",
      nameLocation: "beginning",
    }),
    ["archetype_node_id", "name", "items", "language"],
  );
});

Deno.test("orderSerializationKeys keeps discovery order by default", () => {
  assertEquals(
    orderSerializationKeys(sample, {
      archetypeNodeIdLocation: "after_name",
      nameLocation: "default",
    }),
    ["items", "name", "archetype_node_id", "language"],
  );
});

Deno.test("orderSerializationKeys places name first without archetype_node_id", () => {
  assertEquals(
    orderSerializationKeys(["items", "name", "language"], {
      nameLocation: "beginning",
    }),
    ["name", "items", "language"],
  );
});
