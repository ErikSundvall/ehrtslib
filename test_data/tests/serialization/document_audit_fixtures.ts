/** Shared composition fixtures for document serialization audit tests. */

export function chemoContextComposition(): Record<string, unknown> {
  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "ChemoForm-MBA.v7" },
    archetype_details: {
      _type: "ARCHETYPED",
      template_id: { _type: "TEMPLATE_ID", value: "ChemoForm-MBA.v7" },
      archetype_id: {
        _type: "ARCHETYPE_ID",
        value: "openEHR-EHR-COMPOSITION.self_reported_data.v1",
      },
    },
    context: {
      _type: "EVENT_CONTEXT",
      start_time: { _type: "DV_DATE_TIME", value: "2023-08-31T18:31:16.004+02:00" },
      setting: {
        _type: "DV_CODED_TEXT",
        value: "other care",
        defining_code: {
          _type: "CODE_PHRASE",
          terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
          code_string: "238",
        },
      },
      other_context: {
        _type: "ITEM_TREE",
        items: [{
          _type: "CLUSTER",
          name: { _type: "DV_TEXT", value: "Vårdenhet" },
          items: [
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Namn" },
              value: { _type: "DV_TEXT", value: "Brandbergens vårdcentral" },
            },
            {
              _type: "ELEMENT",
              name: { _type: "DV_TEXT", value: "Identifierare" },
              value: {
                _type: "DV_IDENTIFIER",
                id: "556677-8899",
                issuer: "HSA-ID",
                assigner: "Stockholm",
                type: "ORG",
              },
            },
            {
              _type: "CLUSTER",
              name: { _type: "DV_TEXT", value: "Vårdgivare" },
              items: [
                {
                  _type: "ELEMENT",
                  name: { _type: "DV_TEXT", value: "Namn" },
                  value: { _type: "DV_TEXT", value: "Stockholms läns sjukvårdsområde" },
                },
                {
                  _type: "ELEMENT",
                  name: { _type: "DV_TEXT", value: "Identifierare" },
                  value: {
                    _type: "DV_IDENTIFIER",
                    id: { _type: "DV_TEXT", value: "2321000057" },
                    issuer: { _type: "DV_TEXT", value: "HSA-ID" },
                  },
                },
              ],
            },
          ],
        }],
      },
    },
    content: [],
  };
}

export function bloodPressureComposition(): Record<string, unknown> {
  return {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Blood Pressure Recording" },
    archetype_details: {
      _type: "ARCHETYPED",
      template_id: { _type: "TEMPLATE_ID", value: "Blood Pressure Template v1" },
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
    content: [{
      _type: "OBSERVATION",
      name: { _type: "DV_TEXT", value: "Blood pressure" },
      data: {
        _type: "HISTORY",
        events: [{
          _type: "POINT_EVENT",
          name: { _type: "DV_TEXT", value: "Any event" },
          time: { _type: "DV_DATE_TIME", value: "2026-04-13T10:30:00Z" },
          data: {
            _type: "ITEM_TREE",
            items: [
              {
                _type: "ELEMENT",
                name: { _type: "DV_TEXT", value: "Systolic" },
                value: { _type: "DV_QUANTITY", magnitude: 145, units: "mm[Hg]" },
              },
              {
                _type: "ELEMENT",
                name: { _type: "DV_TEXT", value: "Diastolic" },
                value: { _type: "DV_QUANTITY", magnitude: 90, units: "mm[Hg]" },
              },
            ],
          },
        }],
      },
    }],
  };
}

export async function loadTemplatedCompositionFixtures(): Promise<
  { id: string; comp: Record<string, unknown> }[]
> {
  const out: { id: string; comp: Record<string, unknown> }[] = [];
  const push = (id: string, comp: Record<string, unknown>) => {
    if (comp._type === "COMPOSITION" && comp.archetype_details) {
      out.push({ id, comp });
    }
  };

  push("chemo-like-cluster", chemoContextComposition());
  push("codec-matrix-blood-pressure", bloodPressureComposition());

  const extraFiles = [
    ["zipehr-example_a", new URL("../../../zipehr/example_a.json", import.meta.url)],
    [
      "chemoform-canonical",
      new URL(
        "../v7_rc1_some_yes-Better_Sandbox-response1693499899288.canonical.json",
        import.meta.url,
      ),
    ],
  ];
  for (const [id, url] of extraFiles) {
    try {
      const comp = JSON.parse(await Deno.readTextFile(url));
      push(id, comp);
    } catch { /* optional */ }
  }

  const veredictumDir = new URL(
    "../../veredictum/compositions",
    import.meta.url,
  ).pathname;
  const skip = /invalid|missing_mandatory|wrong_category|unknown_key|empty_system/;
  for await (const entry of Deno.readDir(veredictumDir)) {
    if (!entry.isFile || !entry.name.endsWith(".json")) continue;
    if (skip.test(entry.name)) continue;
    const comp = JSON.parse(
      await Deno.readTextFile(`${veredictumDir}/${entry.name}`),
    );
    if (comp._type !== "COMPOSITION") continue;
  if (!comp.archetype_details?.template_id) continue;
    push(`veredictum/${entry.name}`, comp);
  }

  return out;
}
