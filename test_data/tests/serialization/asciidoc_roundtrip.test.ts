import { assert, assertThrows } from "jsr:@std/assert";
import {
  AsciidocDeserializer,
  AsciidocSerializer,
  EMBEDDING_ASCIIDOC_CONFIG,
  LOSSLESS_ASCIIDOC_CONFIG,
} from "../../../serialization/asciidoc/mod.ts";
import { InvalidFormatError } from "../../../serialization/common/errors.ts";
import { rmTreesSemanticallyEqual } from "../../../serialization/documents_common/semantic_compare.ts";

const observation = {
  _type: "OBSERVATION",
  name: { _type: "DV_TEXT", value: "Blood pressure" },
  archetype_node_id: "openEHR-EHR-OBSERVATION.blood_pressure.v2",
  data: {
    _type: "HISTORY",
    origin: { _type: "DV_DATE_TIME", value: "2026-04-13T10:30:00Z" },
    events: [{
      _type: "POINT_EVENT",
      name: { _type: "DV_TEXT", value: "Any event" },
      archetype_node_id: "at0006",
      time: { _type: "DV_DATE_TIME", value: "2026-04-13T10:30:00Z" },
      data: {
        _type: "ITEM_TREE",
        items: [{
          _type: "ELEMENT",
          name: { _type: "DV_TEXT", value: "Systolic" },
          archetype_node_id: "at0004",
          value: { _type: "DV_QUANTITY", magnitude: 145, units: "mm[Hg]" },
        }],
      },
    }],
  },
};

Deno.test("AsciiDoc lossless round-trip: OBSERVATION", () => {
  const adoc = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG).serialize(observation);
  const parsed = new AsciidocDeserializer().deserialize(adoc);
  assert(rmTreesSemanticallyEqual(observation, parsed));
});

Deno.test("Embedding AsciiDoc is rejected for lossless parse", () => {
  const adoc = new AsciidocSerializer(EMBEDDING_ASCIIDOC_CONFIG).serialize(observation);
  assertThrows(() => new AsciidocDeserializer().deserialize(adoc), InvalidFormatError);
});
