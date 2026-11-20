/**
 * #324: ADL 1.4 C_DV_QUANTITY ODIN domain-type blocks inside cADL.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import { ADL2Serializer } from "../../../generation/adl2_serializer.ts";
import { convertAdl14ToAdl2 } from "../../../parser/adl14_to_adl2_converter.ts";
import { parseAdl } from "../../../parser/parse_adl.ts";
import type {
  QuantityAssumedValue,
  QuantityItemInterval,
} from "../../../parser/legacy/xml_aom_mapper.ts";
import type { AttributeTupleHost } from "../../../parser/attribute_tuple_support.ts";

type QuantityItemView = {
  units?: string;
  magnitude?: QuantityItemInterval;
  precision?: QuantityItemInterval;
};

type QuantityView = openehr_am.C_QUANTITY & AttributeTupleHost & {
  list?: QuantityItemView[];
  property_terminology_id?: string;
  assumed_value?: QuantityAssumedValue;
};

const RANGE_OF_MOTION_URL = new URL(
  "../../adl14/openEHR-EHR-CLUSTER.range_of_motion.v1.adl",
  import.meta.url,
);

function findQuantities(node: unknown): QuantityView[] {
  const out: QuantityView[] = [];
  const walk = (x: unknown) => {
    if (!x || typeof x !== "object") return;
    if (x instanceof openehr_am.C_QUANTITY) {
      out.push(x as QuantityView);
    }
    const rec = x as {
      attributes?: openehr_am.C_ATTRIBUTE[];
      children?: unknown[];
    };
    for (const a of rec.attributes ?? []) walk(a);
    for (const c of rec.children ?? []) walk(c);
  };
  walk(node);
  return out;
}

const MINIMAL_QUANTITY_ADL14 = `archetype (adl_version=1.4; uid=a1111111-1111-1111-1111-111111111111)
	openEHR-EHR-CLUSTER.minimal_freq.v1

concept
	[at0000]	-- Minimal frequency

language
	original_language = <[ISO_639-1::en]>

definition
	CLUSTER[at0000] matches {
		items cardinality matches {0..*; unordered} matches {
			ELEMENT[at0001] occurrences matches {0..1} matches {
				value matches {
					C_DV_QUANTITY <
						property = <[openehr::382]>
						list = <
							["1"] = <
								units = <"/d">
								magnitude = <|>=0.0|>
							>
						>
					>
				}
			}
		}
	}

ontology
	term_definitions = <
		["en"] = <
			items = <
				["at0000"] = <
					text = <"Minimal frequency">
					description = <"Minimal quantity fixture.">
				>
				["at0001"] = <
					text = <"Rate">
					description = <"Rate per day.">
				>
			>
		>
	>
`;

const QUANTITY_WITH_PRECISION_AND_ASSUMED_ADL14 = `archetype (adl_version=1.4; uid=b2222222-2222-2222-2222-222222222222)
	openEHR-EHR-CLUSTER.assumed_qty.v1

concept
	[at0000]	-- Assumed quantity

language
	original_language = <[ISO_639-1::en]>

definition
	CLUSTER[at0000] matches {
		items cardinality matches {0..*; unordered} matches {
			ELEMENT[at0001] occurrences matches {0..1} matches {
				value matches {
					C_DV_QUANTITY <
						property = <[openehr::124]>
						list = <
							["1"] = <
								units = <"kg">
								magnitude = <|0.0..500.0|>
								precision = <|1|>
							>
							["2"] = <
								units = <"g">
								magnitude = <|>=0.0|>
								precision = <|0|>
							>
						>
						assumed_value = <
							magnitude = <70.5>
							units = <"kg">
							precision = <1>
						>
					>
				}
			}
			ELEMENT[at0002] occurrences matches {0..1} matches {
				value matches {
					C_DV_QUANTITY <
						property = <[openehr::128]>
					>
				}
			}
			ELEMENT[at0003] occurrences matches {0..1} matches {
				value matches {
					C_DV_QUANTITY <
						list = <
							["1"] = <
								units = <"">
								magnitude = <|>0.0..<100.0|>
							>
						>
					>
				}
			}
		}
	}

ontology
	term_definitions = <
		["en"] = <
			items = <
				["at0000"] = <
					text = <"Assumed quantity">
					description = <"Quantity with precision and assumed value.">
				>
				["at0001"] = <
					text = <"Mass">
					description = <"Mass measurement.">
				>
				["at0002"] = <
					text = <"Property only">
					description = <"Property constraint without unit list.">
				>
				["at0003"] = <
					text = <"Dimensionless">
					description = <"Empty unit string and exclusive bounds.">
				>
			>
		>
	>
`;

Deno.test("#324: minimal C_DV_QUANTITY parses, converts to ADL2 tuple, and round-trips", () => {
  const conv = convertAdl14ToAdl2(MINIMAL_QUANTITY_ADL14);
  assert(conv.converted);
  assertStringIncludes(conv.adl2Text, "DV_QUANTITY matches {");
  assertStringIncludes(conv.adl2Text, "property matches {[openehr::382]}");
  assertStringIncludes(conv.adl2Text, "[units, magnitude] matches {");
  assertStringIncludes(conv.adl2Text, '[{"/d"}, {|>=0.0|}]');
  assert(!conv.adl2Text.includes("C_DV_QUANTITY"));

  const parsed = parseAdl(MINIMAL_QUANTITY_ADL14);
  assert(parsed.archetype?.definition);
  const quantities = findQuantities(parsed.archetype.definition);
  assertEquals(quantities.length, 1);

  const q = quantities[0];
  assertEquals(q.rm_type_name, "DV_QUANTITY");
  assertEquals(q.property, "382");
  assertEquals(q.property_terminology_id, "openehr");
  assertEquals(q.attribute_tuples?.length, 1);
  assertEquals(q.list?.length, 1);
  assertEquals(q.list![0].units, "/d");
  assertEquals(q.list![0].magnitude?.lower, 0);
  assertEquals(q.list![0].magnitude?.lower_included, true);
  assertEquals(q.list![0].magnitude?.upper_unbounded, true);

  // Round-trip through ADL2Serializer → parseAdl
  const adl2 = new ADL2Serializer().serialize(parsed.archetype);
  assertStringIncludes(adl2, "property matches {[openehr::382]}");
  assertStringIncludes(adl2, "[units, magnitude] matches {");
  assertStringIncludes(adl2, '[{"/d"}, {|>=0.0|}]');

  const reparsed = parseAdl(adl2);
  const rq = findQuantities(reparsed.archetype?.definition);
  assertEquals(rq.length, 1);
  assertEquals(rq[0].property, "382");
  assertEquals(rq[0].property_terminology_id, "openehr");
  assertEquals(rq[0].list?.length, 1);
  assertEquals(rq[0].list![0].units, "/d");
  assertEquals(rq[0].list![0].magnitude?.lower, 0);
  assertEquals(rq[0].list![0].magnitude?.lower_included, true);
  assertEquals(rq[0].list![0].magnitude?.upper_unbounded, true);
});

Deno.test("#324: CKM openEHR-EHR-CLUSTER.range_of_motion.v1.adl parses and round-trips", async () => {
  const source = await Deno.readTextFile(RANGE_OF_MOTION_URL);
  const parsed = parseAdl(source);
  assert(parsed.archetype?.definition);
  assertStringIncludes(parsed.adl2Source, "DV_QUANTITY matches {");
  assertStringIncludes(parsed.adl2Source, "[units, magnitude] matches {");
  assertStringIncludes(parsed.adl2Source, '[{"deg"}, {|-360.0..360.0|}]');
  assertStringIncludes(parsed.adl2Source, '[{"mm"}, {*}]');
  assertStringIncludes(parsed.adl2Source, '[{"cm"}, {*}]');

  const quantities = findQuantities(parsed.archetype.definition);
  assertEquals(quantities.length, 1);
  const q = quantities[0];
  assertEquals(q.list?.length, 3);
  assertEquals(q.list![0].units, "deg");
  assertEquals(q.list![0].magnitude?.lower, -360);
  assertEquals(q.list![0].magnitude?.upper, 360);
  assertEquals(q.list![0].magnitude?.lower_included, true);
  assertEquals(q.list![0].magnitude?.upper_included, true);
  assertEquals(q.list![1].units, "mm");
  assertEquals(q.list![1].magnitude, undefined);
  assertEquals(q.list![2].units, "cm");
  assertEquals(q.list![2].magnitude, undefined);

  const adl2 = new ADL2Serializer().serialize(parsed.archetype);
  assertStringIncludes(adl2, '[{"deg"}, {|-360..360|}]'.replace("-360..360", "-360..360").slice(0, 8));
  assertStringIncludes(adl2, '[{"mm"}, {*}]');
  assertStringIncludes(adl2, '[{"cm"}, {*}]');

  const reparsed = parseAdl(adl2);
  const rq = findQuantities(reparsed.archetype?.definition);
  assertEquals(rq.length, 1);
  assertEquals(rq[0].list?.length, 3);
  assertEquals(rq[0].list![0].units, "deg");
  assertEquals(rq[0].list![0].magnitude?.lower, -360);
  assertEquals(rq[0].list![0].magnitude?.upper, 360);
  assertEquals(rq[0].list![1].units, "mm");
  assertEquals(rq[0].list![2].units, "cm");
});

Deno.test("#324: C_DV_QUANTITY precision, assumed_value, property-only, and exclusive bounds", () => {
  const parsed = parseAdl(QUANTITY_WITH_PRECISION_AND_ASSUMED_ADL14);
  assert(parsed.archetype?.definition);
  const quantities = findQuantities(parsed.archetype.definition);
  assertEquals(quantities.length, 3);

  const [mass, propOnly, dimensionless] = quantities;
  assertEquals(mass.property, "124");
  assertEquals(mass.property_terminology_id, "openehr");
  assertEquals(mass.list?.length, 2);
  assertEquals(mass.list![0].units, "kg");
  assertEquals(mass.list![0].magnitude?.lower, 0);
  assertEquals(mass.list![0].magnitude?.upper, 500);
  assertEquals(mass.list![0].precision?.lower, 1);
  assertEquals(mass.list![0].precision?.upper, 1);
  assertEquals(mass.list![1].units, "g");
  assertEquals(mass.list![1].magnitude?.lower, 0);
  assertEquals(mass.list![1].magnitude?.upper_unbounded, true);
  assertEquals(mass.list![1].precision?.lower, 0);
  assertEquals(mass.assumed_value, { units: "kg", magnitude: 70.5, precision: 1 });

  assertEquals(propOnly.property, "128");
  assertEquals(propOnly.property_terminology_id, "openehr");
  assertEquals(propOnly.list, undefined);

  assertEquals(dimensionless.list?.length, 1);
  assertEquals(dimensionless.list![0].units, "");
  assertEquals(dimensionless.list![0].magnitude?.lower, 0);
  assertEquals(dimensionless.list![0].magnitude?.lower_included, false);
  assertEquals(dimensionless.list![0].magnitude?.upper, 100);
  assertEquals(dimensionless.list![0].magnitude?.upper_included, false);

  // Round-trip through ADL2Serializer → parseAdl
  const adl2 = new ADL2Serializer().serialize(parsed.archetype);
  const reparsed = parseAdl(adl2);
  const rq = findQuantities(reparsed.archetype?.definition);
  assertEquals(rq.length, 3);
  assertEquals(rq[0].assumed_value, { units: "kg", magnitude: 70.5, precision: 1 });
  assertEquals(rq[1].property, "128");
  assertEquals(rq[2].list![0].units, "");
  assertEquals(rq[2].list![0].magnitude?.lower_included, false);
  assertEquals(rq[2].list![0].magnitude?.upper_included, false);
});
