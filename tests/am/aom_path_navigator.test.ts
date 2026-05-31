/**
 * AOM path navigator tests.
 */

import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseAdl } from "../../enhanced/parser/mod.ts";
import { resolveAomPath } from "../../enhanced/am/aom_path_navigator.ts";

const TEST_DATA = new URL("../../test_data/", import.meta.url);

Deno.test("resolveAomPath - simple_observation element", async () => {
  const adl = await Deno.readTextFile(new URL("adl2/simple_observation.adl", TEST_DATA));
  const { archetype } = parseAdl(adl);
  const def = archetype!.definition!;
  const match = resolveAomPath(
    def,
    "/data[at0002]/events[at0003]/data[at0004]/items[at0005]",
  );
  assertEquals(match?.object.rm_type_name, "ELEMENT");
  assertEquals(match?.object.node_id, "id5");
});
