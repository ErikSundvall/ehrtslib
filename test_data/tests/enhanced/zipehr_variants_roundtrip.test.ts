/**
 * Cross-variant ZipEHR round-trips: canonical JSON ↔ every wire dialect.
 * Guards against silent data loss (e.g. OBJECT_VERSION_ID uid dropped in html5).
 */
import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  serializeCanonicalToHtml5,
  serializeCanonicalToXhtml,
  serializeToJZipehr,
  serializeToYZipehr,
  zipehrHtml5ToCanonical,
  zipehrTextToCanonical,
  zipehrXhtmlToCanonical,
} from "../../enhanced/serialization/zipehr/mod.ts";

const UID_VALUE =
  "573b2f9c-d267-4052-ae09-7b58dcfd6233::regionstockholm_se::1";

/** Minimal composition carrying a technical OBJECT_VERSION_ID uid. */
const COMPOSITION_WITH_UID: Record<string, unknown> = {
  _type: "COMPOSITION",
  name: { _type: "DV_TEXT", value: "Encounter" },
  uid: { _type: "OBJECT_VERSION_ID", value: UID_VALUE },
  archetype_node_id: "openEHR-EHR-COMPOSITION.encounter.v1",
  archetype_details: {
    _type: "ARCHETYPED",
    archetype_id: {
      _type: "ARCHETYPE_ID",
      value: "openEHR-EHR-COMPOSITION.encounter.v1",
    },
    rm_version: "1.1.0",
  },
  language: {
    _type: "CODE_PHRASE",
    terminology_id: { _type: "TERMINOLOGY_ID", value: "ISO_639-1" },
    code_string: "en",
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

function assertUidRestored(restored: Record<string, unknown>): void {
  const uid = restored.uid as Record<string, unknown>;
  assertEquals(uid?._type, "OBJECT_VERSION_ID");
  assertEquals(uid?.value, UID_VALUE);
}

Deno.test("zipehr all variants: OBJECT_VERSION_ID uid ↔ canonical JSON", async () => {
  // zipehr.json
  {
    const text = await serializeToJZipehr(COMPOSITION_WITH_UID);
    assertStringIncludes(text, UID_VALUE);
    assertUidRestored(
      await zipehrTextToCanonical(text) as Record<string, unknown>,
    );
  }

  // zipehr.yaml
  {
    const text = await serializeToYZipehr(COMPOSITION_WITH_UID);
    assertStringIncludes(text, UID_VALUE);
    assertUidRestored(
      await zipehrTextToCanonical(text) as Record<string, unknown>,
    );
  }

  // zipehr.xhtml (title-only for technical ids; property prefix in title)
  {
    const xhtml = await serializeCanonicalToXhtml(COMPOSITION_WITH_UID, {
      propertyMode: "attribute",
    });
    assertStringIncludes(xhtml, `title="uid — ${UID_VALUE}"`);
    assertEquals(xhtml.includes(`>${UID_VALUE}</span>`), false);
    assertUidRestored(
      await zipehrXhtmlToCanonical(xhtml) as Record<string, unknown>,
    );
  }

  // zipehr.html5 short / full / emoji
  for (const dialect of ["short", "full", "emoji"] as const) {
    const html = await serializeCanonicalToHtml5(COMPOSITION_WITH_UID, {
      dialect,
      layout: "oneliner",
      propertyMode: "attribute",
    });
    assertStringIncludes(html, `title="${UID_VALUE}"`);
    assertEquals(html.includes(`>${UID_VALUE}<`), false);
    assertUidRestored(
      zipehrHtml5ToCanonical(html) as Record<string, unknown>,
    );
  }
});
