/**
 * #312: FLAT keys use the Web Template root id (`tree.id`), and a renamed
 * LOCATABLE is `/_name` (a path), which can be omitted for CDRs that reject it.
 */
import { assert, assertEquals } from "@std/assert";
import {
  deserializeFromFlat,
  serializeToFlat,
  validateFlatPayload,
  type WebTemplate,
} from "../../../../serialization/simplified/mod.ts";

const wt: WebTemplate = {
  templateId: "thumb-pain-encounter.v2",
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
        id: "symptom_sign",
        name: "Symptom/Sign",
        rmType: "CLUSTER",
        nodeId: "at0001",
        min: 0,
        max: 1,
        aqlPath: "/content[openEHR-EHR-SECTION.adhoc.v1]/items[at0001]",
        children: [
          {
            id: "presence",
            name: "Presence",
            rmType: "ELEMENT",
            nodeId: "at0002",
            min: 0,
            max: 1,
            aqlPath:
              "/content[openEHR-EHR-SECTION.adhoc.v1]/items[at0001]/items[at0002]",
            inputs: [{ type: "TEXT" }],
          },
        ],
      },
    ],
  },
};

const composition = {
  _type: "COMPOSITION",
  name: { _type: "DV_TEXT", value: "Thumb pain" },
  archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
  content: [
    {
      _type: "SECTION",
      name: { _type: "DV_TEXT", value: "Ad hoc" },
      archetype_node_id: "openEHR-EHR-SECTION.adhoc.v1",
      items: [
        {
          _type: "CLUSTER",
          name: { _type: "DV_TEXT", value: "Tenderness" },
          archetype_node_id: "at0001",
          items: [
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Present" },
              archetype_node_id: "at0002",
              value: { _type: "DV_TEXT", value: "present" },
            },
          ],
        },
      ],
    },
  ],
};

Deno.test("#312 serializeToFlat uses tree.id, not the template id", () => {
  const flat = serializeToFlat(composition, wt);
  const keys = Object.keys(flat);
  assert(keys.length > 0);
  assert(keys.every((key) => key.startsWith("encounter/")));
  assert(keys.every((key) => !key.startsWith("thumb-pain-encounter.v2")));
  assert("encounter/symptom_sign/presence" in flat);
});

Deno.test("#312 /_name is a path segment and can be omitted", () => {
  const flat = serializeToFlat(composition, wt);
  const nameKeys = Object.keys(flat).filter((key) => key.includes("_name"));
  assert(nameKeys.length > 0, JSON.stringify(flat));
  assert(nameKeys.every((key) => key.includes("/_name")));
  assert(nameKeys.every((key) => !key.includes("|_name")));
  assertEquals(flat["encounter/symptom_sign/_name"], "Tenderness");
  assertEquals(flat["encounter/symptom_sign/presence/_name"], "Present");

  const omitted = serializeToFlat(composition, wt, { locatableName: "omit" });
  assert(Object.keys(omitted).every((key) => !key.includes("_name")));
  assertEquals(omitted["encounter/symptom_sign/presence"], "present");
});

Deno.test("#312 reader accepts tree.id and the template-id alias", () => {
  const nameOnly = Object.fromEntries(
    Object.entries(serializeToFlat(composition, wt)).filter(([key]) =>
      key.endsWith("/_name")
    ),
  );
  const back = deserializeFromFlat(nameOnly, wt) as {
    name?: { value?: string };
    content?: Array<{ items?: Array<{ name?: { value?: string } }> }>;
  };
  assertEquals(back.name?.value, "Thumb pain");
  assertEquals(back.content?.[0]?.items?.[0]?.name?.value, "Tenderness");

  const alias: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(nameOnly)) {
    alias[key.replace(/^encounter\//, "thumb-pain-encounter.v2/")] = value;
  }
  const fromAlias = deserializeFromFlat(alias, wt) as {
    name?: { value?: string };
  };
  assertEquals(fromAlias.name?.value, "Thumb pain");
  assertEquals(validateFlatPayload(nameOnly, wt).errors, []);
  assertEquals(validateFlatPayload(alias, wt).errors, []);
});

Deno.test("#312 ehrtslib tree.id equal to the template id keeps that root", () => {
  const same: WebTemplate = {
    ...wt,
    tree: { ...wt.tree, id: "thumb-pain-encounter.v2" },
  };
  const flat = serializeToFlat(composition, same);
  assert(Object.keys(flat).every((key) => key.startsWith("thumb-pain-encounter.v2/")));
});
