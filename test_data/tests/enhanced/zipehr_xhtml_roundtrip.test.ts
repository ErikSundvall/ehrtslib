import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  convertObjectDirect,
  convertObjectEhrtslib,
  detectInputFormat,
  escapeTitleValue,
  expandZipehrToCanonical,
  formatLocatableTitle,
  loadLetterCodeMap,
  parseLocatableTitle,
  serializeCanonicalToXhtml,
  serializeToXZipehr,
  serializeToYZipehr,
  unescapeTitleValue,
  wrapFhirNarrative,
  zipehrXhtmlToCanonical,
} from "../../enhanced/serialization/zipehr/mod.ts";

const BODY_WEIGHT_FIXTURE: Record<string, unknown> = {
  "_type": "OBSERVATION",
  "name": { "_type": "DV_TEXT", "value": "Body weight" },
  "archetype_node_id": "openEHR-EHR-OBSERVATION.body_weight.v2",
  "archetype_details": {
    "_type": "ARCHETYPED",
    "archetype_id": {
      "_type": "ARCHETYPE_ID",
      "value": "openEHR-EHR-OBSERVATION.body_weight.v2",
    },
  },
  "data": {
    "_type": "HISTORY",
    "events": [
      {
        "_type": "POINT_EVENT",
        "archetype_node_id": "at0003",
        "data": {
          "_type": "ITEM_TREE",
          "archetype_node_id": "at0001",
          "items": [
            {
              "_type": "ELEMENT",
              "name": { "_type": "DV_TEXT", "value": "Weight" },
              "archetype_node_id": "at0004",
              "value": {
                "_type": "DV_QUANTITY",
                "magnitude": 85,
                "units": "kg",
              },
            },
          ],
        },
        "state": {
          "_type": "ITEM_TREE",
          "archetype_node_id": "at0008",
          "items": [
            {
              "_type": "ELEMENT",
              "name": { "_type": "DV_TEXT", "value": "State of dress" },
              "archetype_node_id": "at0009",
              "value": {
                "_type": "DV_CODED_TEXT",
                "value": "Fully clothed, without shoes",
                "defining_code": {
                  "_type": "CODE_PHRASE",
                  "terminology_id": {
                    "_type": "TERMINOLOGY_ID",
                    "value": "local",
                  },
                  "code_string": "at0028",
                },
              },
            },
          ],
        },
      },
    ],
  },
};

const CHEMO_FIXTURE: Record<string, unknown> = {
  "_type": "COMPOSITION",
  "name": { "_type": "DV_TEXT", "value": "ChemoForm-MBA.v7" },
  "archetype_details": {
    "_type": "ARCHETYPED",
    "archetype_id": {
      "_type": "ARCHETYPE_ID",
      "value": "openEHR-EHR-COMPOSITION.self_reported_data.v1",
    },
    "template_id": {
      "_type": "TEMPLATE_ID",
      "value": "ChemoForm-MBA.v7",
    },
    "rm_version": "1.1.0",
  },
  "archetype_node_id": "openEHR-EHR-COMPOSITION.self_reported_data.v1",
  "context": {
    "_type": "EVENT_CONTEXT",
    "other_context": {
      "_type": "ITEM_TREE",
      "name": { "_type": "DV_TEXT", "value": "Item tree" },
      "archetype_node_id": "at0003",
      "items": [
        {
          "_type": "CLUSTER",
          "name": { "_type": "DV_TEXT", "value": "Vårdenhet" },
          "archetype_details": {
            "_type": "ARCHETYPED",
            "archetype_id": {
              "_type": "ARCHETYPE_ID",
              "value": "openEHR-EHR-CLUSTER.organisation.v1",
            },
            "rm_version": "1.1.0",
          },
          "archetype_node_id": "openEHR-EHR-CLUSTER.organisation.v1",
          "items": [
            {
              "_type": "ELEMENT",
              "name": { "_type": "DV_TEXT", "value": "Namn" },
              "archetype_node_id": "at0001",
              "value": {
                "_type": "DV_TEXT",
                "value": "Brandbergens vårdcentral",
              },
            },
          ],
        },
      ],
    },
  },
};

function normalizeWhitespace(text: string): string {
  return text.replace(/>\s+</g, "><").trim();
}

function assertNoEmojiInAttributes(xhtml: string): void {
  const attrMatches = xhtml.match(/[a-zA-Z-]+="[^"]*"/g) ?? [];
  for (const attr of attrMatches) {
    assert(
      !/[^\x00-\x7F]/u.test(attr),
      `Emoji or non-ASCII found in attribute: ${attr}`,
    );
  }
}

function assertFhirSafe(xhtml: string): void {
  assert(!/<script\b/i.test(xhtml));
  assert(!/<link\b/i.test(xhtml));
  assert(!/<iframe\b/i.test(xhtml));
  assert(!/\bon\w+\s*=/i.test(xhtml));
  assert(xhtml.includes('xmlns="http://www.w3.org/1999/xhtml"'));
}

Deno.test("zipehr xhtml: title grammar escapes and parses semicolons", () => {
  const value = "note; with; semicolons";
  const title = formatLocatableTitle({ ar: value });
  assert(title.startsWith("ar: "));
  const parsed = parseLocatableTitle(title);
  assertEquals(parsed.ar, value);
  assertEquals(unescapeTitleValue(escapeTitleValue(value)), value);
});

Deno.test("zipehr xhtml: body weight observation round-trip", async () => {
  const xhtml = await serializeToXZipehr(BODY_WEIGHT_FIXTURE);
  assertFhirSafe(xhtml);
  assertNoEmojiInAttributes(xhtml);
  assert(xhtml.includes('class="OB"'));
  assert(xhtml.includes('title="ar: openEHR-EHR-OBSERVATION.body_weight.v2"'));
  assert(xhtml.includes("<h4>Body weight</h4>"));
  assert(xhtml.includes("<span>Weight</span>"));
  assert(xhtml.includes('class="q" title="85|kg|">85 kg</span>'));
  assert(
    xhtml.includes(
      'class="c" title="local::at0028|Fully clothed, without shoes|"',
    ),
  );

  const restored = await zipehrXhtmlToCanonical(xhtml) as Record<string, unknown>;
  const event = (
    (restored.data as Record<string, unknown>).events as Record<string, unknown>[]
  )[0];
  const weightEl = (
    ((event.data as Record<string, unknown>).items as Record<string, unknown>[])[0]
  );
  const dressEl = (
    ((event.state as Record<string, unknown>).items as Record<string, unknown>[])[0]
  );

  assertEquals((restored.name as { value: string }).value, "Body weight");
  assertEquals(
    (weightEl.value as { magnitude: number; units: string }).magnitude,
    85,
  );
  assertEquals(
    (weightEl.value as { magnitude: number; units: string }).units,
    "kg",
  );
  assertEquals(
    (dressEl.value as { value: string }).value,
    "Fully clothed, without shoes",
  );
  assertEquals(
    ((dressEl.value as Record<string, unknown>).defining_code as {
      code_string: string;
    }).code_string,
    "at0028",
  );
});

Deno.test("zipehr xhtml: chemo composition title round-trip", async () => {
  const xhtml = await serializeToXZipehr(CHEMO_FIXTURE);
  assertFhirSafe(xhtml);
  assert(
    xhtml.includes(
      'title="te: ChemoForm-MBA.v7; ar: openEHR-EHR-COMPOSITION.self_reported_data.v1; rm: 1.1.0"',
    ),
  );
  assert(xhtml.includes("<h2>ChemoForm-MBA.v7</h2>"));

  const restored = await zipehrXhtmlToCanonical(xhtml) as Record<string, unknown>;
  assertEquals((restored.name as { value: string }).value, "ChemoForm-MBA.v7");
  assertEquals(
    (restored.archetype_details as { template_id: { value: string } })
      .template_id.value,
    "ChemoForm-MBA.v7",
  );
  assertEquals(
    (restored.archetype_details as { archetype_id: { value: string } })
      .archetype_id.value,
    "openEHR-EHR-COMPOSITION.self_reported_data.v1",
  );
  assertEquals(
    (restored.archetype_details as { rm_version: string }).rm_version,
    "1.1.0",
  );

  const cluster = (
    (
      (restored.context as Record<string, unknown>).other_context as Record<
        string,
        unknown
      >
    ).items as Record<string, unknown>[]
  )[0];
  assertEquals((cluster.name as { value: string }).value, "Vårdenhet");
  const element = (cluster.items as Record<string, unknown>[])[0];
  assertEquals(
    (element.value as { value: string }).value,
    "Brandbergens vårdcentral",
  );
});

Deno.test("zipehr xhtml: detectInputFormat identifies xhtml variant", async () => {
  const xhtml = await serializeToXZipehr(BODY_WEIGHT_FIXTURE);
  const detected = detectInputFormat(xhtml);
  assertEquals(detected, { kind: "zipehr", variant: "zipehr.xhtml" });
});

Deno.test("zipehr xhtml: cross-variant canonical → xhtml → yaml", async () => {
  const letterMap = await loadLetterCodeMap();
  const xhtml = await serializeCanonicalToXhtml(BODY_WEIGHT_FIXTURE);
  const fromXhtml = await zipehrXhtmlToCanonical(xhtml);
  const yamlObj = convertObjectEhrtslib(fromXhtml, letterMap);
  const fromYaml = expandZipehrToCanonical(yamlObj, letterMap) as Record<
    string,
    unknown
  >;

  assertEquals(
    ((fromYaml.data as Record<string, unknown>).events as Record<string, unknown>[])
      .length,
    1,
  );
  const yamlWeight = (
    (
      (
        (
          (fromYaml.data as Record<string, unknown>).events as Record<
            string,
            unknown
          >[]
        )[0].data as Record<string, unknown>
      ).items as Record<string, unknown>[]
    )[0]
  );
  assertExists(yamlWeight);
});

Deno.test("zipehr xhtml: ar omitted when archetype id equals visible name", async () => {
  const clusterOnly: Record<string, unknown> = {
    "_type": "CLUSTER",
    "name": { "_type": "DV_TEXT", "value": "openEHR-EHR-CLUSTER.organisation.v1" },
    "archetype_node_id": "openEHR-EHR-CLUSTER.organisation.v1",
    "archetype_details": {
      "_type": "ARCHETYPED",
      "archetype_id": {
        "_type": "ARCHETYPE_ID",
        "value": "openEHR-EHR-CLUSTER.organisation.v1",
      },
      "rm_version": "1.1.0",
    },
    "items": [],
  };
  const xhtml = await serializeCanonicalToXhtml(clusterOnly);
  assert(!xhtml.includes("ar: openEHR-EHR-CLUSTER.organisation.v1"));
  assert(xhtml.includes('rm: 1.1.0'));
});

Deno.test("zipehr xhtml: composition uid (OBJECT_VERSION_ID) round-trip", async () => {
  const withUid: Record<string, unknown> = {
    ...CHEMO_FIXTURE,
    uid: {
      "_type": "OBJECT_VERSION_ID",
      "value": "a1b2c3d4-e5f6-7890-abcd-ef1234567890::ehrbase.org::1",
    },
  };
  const xhtml = await serializeCanonicalToXhtml(withUid);
  assert(xhtml.includes('class="OV"'));
  assert(xhtml.includes("a1b2c3d4-e5f6-7890-abcd-ef1234567890::ehrbase.org::1"));
  const restored = await zipehrXhtmlToCanonical(xhtml) as Record<string, unknown>;
  const uid = restored.uid as Record<string, unknown>;
  assertEquals(uid._type, "OBJECT_VERSION_ID");
  assertEquals(
    uid.value,
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890::ehrbase.org::1",
  );
});

Deno.test("zipehr xhtml: wrapFhirNarrative produces JSON-escapable div", async () => {
  const xhtml = await serializeToXZipehr(BODY_WEIGHT_FIXTURE);
  const narrative = wrapFhirNarrative(xhtml);
  assertEquals(narrative.status, "generated");
  const json = JSON.stringify(narrative);
  assert(json.includes('"div"'));
  const parsed = JSON.parse(json);
  assertEquals(parsed.div, xhtml);
});

Deno.test("zipehr xhtml: pretty-printed by default", async () => {
  const xhtml = await serializeToXZipehr(BODY_WEIGHT_FIXTURE);
  assert(xhtml.includes("\n"));
  assert(xhtml.includes('  <div class="OB"'));
});

Deno.test("zipehr xhtml: golden fragment shape (normalized)", async () => {
  const xhtml = normalizeWhitespace(await serializeToXZipehr(BODY_WEIGHT_FIXTURE));
  assert(xhtml.startsWith(
    '<div xmlns="http://www.w3.org/1999/xhtml" lang="en"><div class="OB" title="ar: openEHR-EHR-OBSERVATION.body_weight.v2"><h4>Body weight</h4>',
  ));
});

Deno.test("zipehr xhtml: whitespace-only fragment rejected", async () => {
  let threw = false;
  try {
    await zipehrXhtmlToCanonical(
      '<div xmlns="http://www.w3.org/1999/xhtml" lang="en">   </div>',
    );
  } catch {
    threw = true;
  }
  assert(threw);
});
