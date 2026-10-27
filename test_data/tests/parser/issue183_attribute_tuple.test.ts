/**
 * #183: general ADL2 attribute tuples (Archie fixtures, DV_ORDINAL, round-trip).
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import { ADL2Serializer } from "../../../generation/adl2_serializer.ts";
import { ADL2Parser } from "../../../parser/adl2_parser.ts";
import { ADL2Tokenizer } from "../../../parser/adl2_tokenizer.ts";
import {
  ordinalListFromTuple,
  tupleColumnNames,
} from "../../../parser/attribute_tuple_support.ts";

const ARCHIE = new URL("../../archie-tests/", import.meta.url);

Deno.test("#183: Archie term_bindings_paths DV_ORDINAL tuple parses to attribute_tuples + list", async () => {
  const adl = await Deno.readTextFile(
    new URL(
      "terminology/openEHR-EHR-OBSERVATION.term_bindings_paths_use_refs.v1.0.0.adls",
      ARCHIE,
    ),
  );
  const archetype = new ADL2Parser(new ADL2Tokenizer(adl).tokenize()).parse()
    .archetype!;
  assertExists(archetype.definition);

  function findOrdinal(node: unknown): openehr_am.C_ORDINAL | undefined {
    if (!node || typeof node !== "object") return undefined;
    if (node instanceof openehr_am.C_ORDINAL) return node;
    const rec = node as {
      attributes?: openehr_am.C_ATTRIBUTE[];
      children?: unknown[];
      attribute_tuples?: openehr_am.C_ATTRIBUTE_TUPLE[];
    };
    for (const t of rec.attribute_tuples ?? []) {
      for (const row of t.tuples ?? []) {
        if (row.members?.length) {
          /* tuple host may still be complex before reify in subtree */
        }
      }
    }
    for (const a of rec.attributes ?? []) {
      for (const c of (a as { children?: unknown[] }).children ?? []) {
        const hit = findOrdinal(c);
        if (hit) return hit;
      }
    }
    return undefined;
  }

  const ordinal = findOrdinal(archetype.definition);
  assert(ordinal, "expected DV_ORDINAL with tuple constraint");
  const tuples = (ordinal as { attribute_tuples?: openehr_am.C_ATTRIBUTE_TUPLE[] })
    .attribute_tuples ?? [];
  assert(tuples.length > 0, "C_ORDINAL should retain attribute_tuples");
  const tuple = tuples[0];
  assertEquals(tupleColumnNames(tuple), ["value", "symbol"]);
  const list = (ordinal as { list?: openehr_am.ORDINAL[] }).list ?? [];
  assert(list.length >= 3, "list should be synced from tuple rows");
  assertEquals(
    list.map((i) => i.value),
    ordinalListFromTuple(tuple).map((i) => i.value),
  );
});

Deno.test("#183: attribute_tuples round-trip through ADL2Serializer", async () => {
  const adl = await Deno.readTextFile(
    new URL(
      "terminology/openEHR-EHR-OBSERVATION.term_bindings_paths_use_refs.v1.0.0.adls",
      ARCHIE,
    ),
  );
  const parsed = new ADL2Parser(new ADL2Tokenizer(adl).tokenize()).parse().archetype!;
  const again = new ADL2Serializer().serialize(parsed);
  const reparsed = new ADL2Parser(new ADL2Tokenizer(again).tokenize()).parse().archetype!;
  assertEquals(
    reparsed.archetype_id?.value,
    parsed.archetype_id?.value,
  );
  assert(
    again.includes("[value, symbol] matches"),
    "serialized ADL should keep ordinal tuple syntax",
  );
});
