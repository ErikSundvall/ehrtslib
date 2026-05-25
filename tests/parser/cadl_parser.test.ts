/**
 * Tests for cADL Parser
 */

import { assertEquals, assert } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { ADL2Tokenizer } from "../../enhanced/parser/adl2_tokenizer.ts";
import { CadlParser } from "../../enhanced/parser/cadl_parser.ts";
import * as openehr_am from "../../enhanced/openehr_am.ts";

function parseCadl(input: string) {
  const tokenizer = new ADL2Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new CadlParser(tokens);
  return parser.parseComplexObject();
}

Deno.test("cADL - simple complex object", () => {
  const input = "OBSERVATION[id1]";
  const result = parseCadl(input);
  
  assertEquals(result.rm_type_name, "OBSERVATION");
  assertEquals(result.node_id, "id1");
});

Deno.test("cADL - complex object with occurrences", () => {
  const input = "ELEMENT[id5] occurrences matches {0..1}";
  const result = parseCadl(input);
  
  assertEquals(result.rm_type_name, "ELEMENT");
  assertEquals(result.node_id, "id5");
  assert(result.occurrences !== undefined);
  assertEquals(result.occurrences?.lower, 0);
  assertEquals(result.occurrences?.upper, 1);
});

Deno.test("cADL - complex object with unbounded occurrences", () => {
  const input = "EVENT[id3] occurrences matches {1..*}";
  const result = parseCadl(input);
  
  assertEquals(result.rm_type_name, "EVENT");
  assertEquals(result.node_id, "id3");
  assert(result.occurrences !== undefined);
  assertEquals(result.occurrences?.lower, 1);
  assertEquals(result.occurrences?.upper, undefined);
});

Deno.test("cADL - complex object with single attribute", () => {
  const input = `OBSERVATION[id1] matches {
    data matches {
      HISTORY[id2]
    }
  }`;
  const result = parseCadl(input);
  
  assertEquals(result.rm_type_name, "OBSERVATION");
  assertEquals(result.node_id, "id1");
  assert(result.attributes !== undefined);
  assertEquals(result.attributes.length, 1);
  assertEquals(result.attributes[0].rm_attribute_name, "data");
});

Deno.test("cADL - complex object with nested attributes", () => {
  const input = `OBSERVATION[id1] matches {
    data matches {
      HISTORY[id2] matches {
        events matches {
          EVENT[id3]
        }
      }
    }
  }`;
  const result = parseCadl(input);
  
  assertEquals(result.rm_type_name, "OBSERVATION");
  assert(result.attributes !== undefined);
  assertEquals(result.attributes.length, 1);
  
  const dataAttr = result.attributes[0];
  assertEquals(dataAttr.rm_attribute_name, "data");
  assert(dataAttr.children !== undefined);
  assertEquals(dataAttr.children.length, 1);
  
  const historyObj = dataAttr.children[0];
  assertEquals(historyObj.rm_type_name, "HISTORY");
  assertEquals(historyObj.node_id, "id2");
});

Deno.test("cADL - multiple attributes", () => {
  const input = `OBSERVATION[id1] matches {
    data matches {
      HISTORY[id2]
    }
    protocol matches {
      ITEM_TREE[id3]
    }
  }`;
  const result = parseCadl(input);
  
  assertEquals(result.rm_type_name, "OBSERVATION");
  assert(result.attributes !== undefined);
  assertEquals(result.attributes.length, 2);
  assertEquals(result.attributes[0].rm_attribute_name, "data");
  assertEquals(result.attributes[1].rm_attribute_name, "protocol");
});

Deno.test("cADL - at code instead of id code", () => {
  const input = "DV_CODED_TEXT[at0001]";
  const result = parseCadl(input);
  
  assertEquals(result.rm_type_name, "DV_CODED_TEXT");
  assertEquals(result.node_id, "at0001");
});

Deno.test("cADL - existence on attribute", () => {
  const input = `OBSERVATION[id1] matches {
    data existence matches {1..1} matches {
      HISTORY[id2]
    }
  }`;
  const result = parseCadl(input);
  const data = result.attributes?.[0];
  assertEquals(data?.rm_attribute_name, "data");
  const existence = (data as { existence?: { lower?: number; upper?: number } })
    .existence;
  assert(existence !== undefined);
  assertEquals(existence?.lower, 1);
  assertEquals(existence?.upper, 1);
});

Deno.test("cADL - cardinality creates multiple attribute", () => {
  const input = `HISTORY[id2] matches {
    events cardinality matches {1..*} matches {
      EVENT[id3]
    }
  }`;
  const result = parseCadl(input);
  const events = result.attributes?.[0];
  assert(events instanceof openehr_am.C_MULTIPLE_ATTRIBUTE);
  const card = (events as openehr_am.C_MULTIPLE_ATTRIBUTE).cardinality;
  const interval = (card as { interval?: { lower?: number; upper?: number } })
    ?.interval;
  assertEquals(interval?.lower, 1);
  assertEquals(interval?.upper, undefined);
});

Deno.test("cADL - primitive DV_TEXT", () => {
  const input = `ELEMENT[id5] matches {
    value matches {
      DV_TEXT[id6]
    }
  }`;
  const result = parseCadl(input);
  const valueAttr = result.attributes?.[0];
  const child = (valueAttr as { children?: openehr_am.C_OBJECT[] })?.children?.[0];
  assert(child instanceof openehr_am.C_PRIMITIVE_OBJECT);
  assertEquals(child.rm_type_name, "DV_TEXT");
});

console.log("\n✅ cADL Parser tests completed");
