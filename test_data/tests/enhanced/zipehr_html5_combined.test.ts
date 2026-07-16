import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  serializeCanonicalToHtml5,
  zipehrHtml5ToCanonical,
} from "../../enhanced/serialization/zipehr/mod.ts";

const ROOT_CLUSTER: Record<string, unknown> = {
  _type: "CLUSTER",
  name: { _type: "DV_TEXT", value: "Vårdenhet" },
  archetype_node_id: "openEHR-EHR-CLUSTER.organisation.v1",
  archetype_details: {
    _type: "ARCHETYPED",
    archetype_id: {
      _type: "ARCHETYPE_ID",
      value: "openEHR-EHR-CLUSTER.organisation.v1",
    },
    rm_version: "1.1.0",
  },
  items: [
    {
      _type: "ELEMENT",
      name: { _type: "DV_TEXT", value: "Namn" },
      archetype_node_id: "at0001",
      value: { _type: "DV_TEXT", value: "Brandbergens vårdcentral" },
    },
  ],
};

Deno.test("zipehr html5: combined archetype-id-node-id attr (emoji)", async () => {
  const html = await serializeCanonicalToHtml5(ROOT_CLUSTER, {
    dialect: "emoji",
    layout: "oneliner",
  });
  assertStringIncludes(html, 'Ⓐ🆔="openEHR-EHR-CLUSTER.organisation.v1"');
  assertEquals(html.includes(' Ⓐ='), false);
  assertStringIncludes(html, '🆔="at0001"');

  const back = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
  assertEquals(back.archetype_node_id, "openEHR-EHR-CLUSTER.organisation.v1");
  assertEquals(
    (back.archetype_details as { archetype_id: { value: string } })
      .archetype_id.value,
    "openEHR-EHR-CLUSTER.organisation.v1",
  );
});

Deno.test("zipehr html5: combined an attr (short)", async () => {
  const html = await serializeCanonicalToHtml5(ROOT_CLUSTER, {
    dialect: "short",
    layout: "oneliner",
  });
  assertStringIncludes(html, 'an="openEHR-EHR-CLUSTER.organisation.v1"');
  assertEquals(html.includes(' n="openEHR-EHR-CLUSTER.organisation.v1"'), false);
  assertEquals(html.includes(' a="openEHR-EHR-CLUSTER.organisation.v1"'), false);

  const back = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
  assertEquals(back.archetype_node_id, "openEHR-EHR-CLUSTER.organisation.v1");
});

Deno.test("zipehr html5: legacy Ⓐ without 🆔 still restores node id", () => {
  const html =
    `<o-📁 fmt="e1" Ⓐ="openEHR-EHR-CLUSTER.organisation.v1" ⚙️="1.1.0">Vårdenhet</o-📁>`;
  const back = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
  assertEquals(back.archetype_node_id, "openEHR-EHR-CLUSTER.organisation.v1");
});
