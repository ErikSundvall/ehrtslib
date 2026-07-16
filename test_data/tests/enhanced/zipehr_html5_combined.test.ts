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

Deno.test("zipehr html5: 🆔 + valueless Ⓐ flag (emoji)", async () => {
  const html = await serializeCanonicalToHtml5(ROOT_CLUSTER, {
    dialect: "emoji",
    layout: "oneliner",
  });
  assertStringIncludes(html, '🆔="openEHR-EHR-CLUSTER.organisation.v1"');
  assertStringIncludes(html, " Ⓐ");
  assertStringIncludes(html, '🆔="at0001"');

  const back = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
  assertEquals(back.archetype_node_id, "openEHR-EHR-CLUSTER.organisation.v1");
  assertEquals(
    (back.archetype_details as { archetype_id: { value: string } })
      .archetype_id.value,
    "openEHR-EHR-CLUSTER.organisation.v1",
  );
});

Deno.test("zipehr html5: native lang for COMPOSITION language", async () => {
  const composition: Record<string, unknown> = {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Encounter" },
    archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
    language: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
      code_string: "sv",
    },
    territory: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_3166-1" },
      code_string: "SE",
    },
    category: {
      _type: "DV_CODED_TEXT",
      value: "event",
      defining_code: {
        _type: "CODE_PHRASE",
        terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
        code_string: "433",
      },
    },
    composer: {
      _type: "PARTY_IDENTIFIED",
      name: "Demo",
    },
    content: [],
  };

  for (const dialect of ["short", "full", "emoji"] as const) {
    const html = await serializeCanonicalToHtml5(composition, {
      dialect,
      layout: "oneliner",
    });
    assertStringIncludes(html, 'lang="sv"');
    assertEquals(html.includes("🗪"), false);
    assertEquals(/language="sv"/.test(html), false);

    const back = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
    assertEquals(
      (back.language as { code_string: string }).code_string,
      "sv",
    );
  }
});

Deno.test("zipehr html5: n + valueless a flag (short)", async () => {
  const html = await serializeCanonicalToHtml5(ROOT_CLUSTER, {
    dialect: "short",
    layout: "oneliner",
  });
  assertStringIncludes(html, 'n="openEHR-EHR-CLUSTER.organisation.v1"');
  assertStringIncludes(html, " a ");

  const back = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
  assertEquals(back.archetype_node_id, "openEHR-EHR-CLUSTER.organisation.v1");
});

const UID_VALUE =
  "573b2f9c-d267-4052-ae09-7b58dcfd6233::regionstockholm_se::1";

const COMPOSITION_WITH_UID: Record<string, unknown> = {
  _type: "COMPOSITION",
  name: { _type: "DV_TEXT", value: "Encounter" },
  uid: { _type: "OBJECT_VERSION_ID", value: UID_VALUE },
  archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
  language: {
    _type: "CODE_PHRASE",
    terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
    code_string: "sv",
  },
  territory: {
    _type: "CODE_PHRASE",
    terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_3166-1" },
    code_string: "SE",
  },
  category: {
    _type: "DV_CODED_TEXT",
    value: "event",
    defining_code: {
      _type: "CODE_PHRASE",
      terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
      code_string: "433",
    },
  },
  composer: { _type: "PARTY_IDENTIFIED", name: "Demo" },
  content: [],
};

Deno.test("zipehr html5: OBJECT_VERSION_ID uid round-trips all dialects", async () => {
  for (const dialect of ["short", "full", "emoji"] as const) {
    const html = await serializeCanonicalToHtml5(COMPOSITION_WITH_UID, {
      dialect,
      layout: "oneliner",
      propertyMode: "attribute",
    });
    assertStringIncludes(html, `title="${UID_VALUE}"`);
    // Machine attr only — empty element text (not clinician-visible).
    assertEquals(html.includes(`>${UID_VALUE}<`), false);

    const back = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
    const uid = back.uid as Record<string, unknown>;
    assertEquals(uid._type, "OBJECT_VERSION_ID");
    assertEquals(uid.value, UID_VALUE);
  }
});
