/**
 * #198 absent optional attributes; #200 EVENT.offset as RM method.
 */

import { assert, assertEquals } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import * as openehr_rm from "../../../openehr_rm.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { TemplateValidator } from "../../../validation/template_validator.ts";

const OPT_DIR = new URL("../../opt14/", import.meta.url);
const BP_OPT = "ehrbase_blood_pressure_simple.de.v0.opt";

async function loadBloodPressureTemplate() {
  const xml = await Deno.readTextFile(new URL(BP_OPT, OPT_DIR));
  return parseOptXml(xml).operationalTemplate!;
}

function findComplex(
  node: openehr_am.C_OBJECT | undefined,
  rmType: string,
  nodeId?: string,
): openehr_am.C_COMPLEX_OBJECT | undefined {
  if (!node) return undefined;
  if (
    node instanceof openehr_am.C_COMPLEX_OBJECT ||
    node instanceof openehr_am.C_ARCHETYPE_ROOT
  ) {
    if (node.rm_type_name === rmType && (!nodeId || node.node_id === nodeId)) {
      return node;
    }
    for (const attr of node.attributes ?? []) {
      for (const child of attr.children ?? []) {
        const hit = findComplex(child, rmType, nodeId);
        if (hit) return hit;
      }
    }
  }
  return undefined;
}

function validatorOpts(): ConstructorParameters<typeof TemplateValidator>[0] {
  return {
    validateUnits: false,
    validateRMSpecification: false,
    validateInvariants: false,
    validateTerminology: false,
    validateIntervals: false,
  };
}

function offsetMessages(errors: { path: string; message: string }[]): string[] {
  return errors
    .filter((m) => m.path.includes("offset") || m.message.includes("offset"))
    .map((m) => `${m.path}: ${m.message}`);
}

Deno.test("#198 omitted optional state/protocol/context: no child min-1 errors", async () => {
  const template = await loadBloodPressureTemplate();
  const pe = findComplex(template.definition, "POINT_EVENT", "at0002");
  assert(pe, "POINT_EVENT at0002");
  const v = new TemplateValidator(validatorOpts());
  const result = v.validate({ _type: "POINT_EVENT" }, {
    definition: pe,
  } as openehr_am.ARCHETYPE);
  const state = result.errors.filter((m) => m.path.includes("/state/"));
  assertEquals(state, [], state.map((m) => m.message).join("; "));
});

Deno.test("#200 POINT_EVENT class instance without stored offset validates", async () => {
  const template = await loadBloodPressureTemplate();
  const pe = findComplex(template.definition, "POINT_EVENT", "at0002");
  assert(pe);
  const event = new openehr_rm.POINT_EVENT();
  event.data = new openehr_rm.ITEM_TREE();
  const v = new TemplateValidator(validatorOpts());
  const result = v.validate(event, { definition: pe } as openehr_am.ARCHETYPE);
  assertEquals(offsetMessages(result.errors), []);
});

Deno.test("#200 plain JSON POINT_EVENT without offset validates", async () => {
  const template = await loadBloodPressureTemplate();
  const pe = findComplex(template.definition, "POINT_EVENT", "at0002");
  assert(pe);
  const v = new TemplateValidator(validatorOpts());
  const result = v.validate(
    {
      _type: "POINT_EVENT",
      data: {
        _type: "ITEM_TREE",
        items: [
          {
            _type: "ELEMENT",
            archetype_node_id: "at0003",
            value: { _type: "DV_QUANTITY", magnitude: 120, units: "mm[Hg]" },
          },
        ],
      },
    },
    { definition: pe } as openehr_am.ARCHETYPE,
  );
  assertEquals(offsetMessages(result.errors), []);
});
