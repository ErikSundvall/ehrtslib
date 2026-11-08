import { assert, assertThrows } from "jsr:@std/assert";
import { InvalidFormatError } from "../../../serialization/common/errors.ts";
import { MarkdownSerializer } from "../../../serialization/markdown/mod.ts";
import { MarkdownDeserializer } from "../../../serialization/markdown/mod.ts";
import {
  EMBEDDING_MARKDOWN_CONFIG,
  STRUCTURAL_MARKDOWN_CONFIG,
} from "../../../serialization/markdown/mod.ts";
import { rmTreesSemanticallyEqual } from "../../../serialization/documents_common/semantic_compare.ts";
import * as rm from "../../../rm/openehr_rm.ts";
import * as base from "../../../base/openehr_base.ts";
import { TypeRegistry } from "../../../serialization/common/type_registry.ts";

TypeRegistry.registerModule(rm);
TypeRegistry.registerModule(base);

function sampleObservation(): rm.OBSERVATION {
  const obs = new rm.OBSERVATION();
  obs.name = new rm.DV_TEXT();
  obs.name.value = "Blood pressure";
  obs.archetype_node_id = "openEHR-EHR-OBSERVATION.blood_pressure.v2";
  obs.data = {
    _type: "HISTORY",
    origin: { _type: "DV_DATE_TIME", value: "2026-04-13T10:30:00Z" },
    events: [{
      _type: "POINT_EVENT",
      name: { _type: "DV_TEXT", value: "Any event" },
      archetype_node_id: "at0006",
      time: { _type: "DV_DATE_TIME", value: "2026-04-13T10:30:00Z" },
      data: {
        _type: "ITEM_TREE",
        items: [
          {
            _type: "ELEMENT",
            name: { _type: "DV_TEXT", value: "Systolic" },
            archetype_node_id: "at0004",
            value: { _type: "DV_QUANTITY", magnitude: 145, units: "mm[Hg]" },
          },
          {
            _type: "ELEMENT",
            name: { _type: "DV_TEXT", value: "Diastolic" },
            archetype_node_id: "at0005",
            value: { _type: "DV_QUANTITY", magnitude: 90, units: "mm[Hg]" },
          },
        ],
      },
    }],
  } as unknown as rm.HISTORY;
  return obs;
}

Deno.test("Markdown structural round-trip: OBSERVATION", () => {
  const original = sampleObservation();
  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(original);
  const parsed = new MarkdownDeserializer().deserialize(md);
  assert(rmTreesSemanticallyEqual(original, parsed));
});

Deno.test("Markdown structural parse → serialize → parse", () => {
  const original = sampleObservation();
  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(original);
  const once = new MarkdownDeserializer().deserialize(md);
  const md2 = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(once);
  const twice = new MarkdownDeserializer().deserialize(md2);
  assert(rmTreesSemanticallyEqual(once, twice));
});

Deno.test("Embedding markdown is rejected for lossless parse", () => {
  const md = new MarkdownSerializer(EMBEDDING_MARKDOWN_CONFIG).serialize(sampleObservation());
  assertThrows(
    () => new MarkdownDeserializer().deserialize(md),
    InvalidFormatError,
  );
});
