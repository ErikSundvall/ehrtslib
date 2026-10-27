/**
 * Regression tests for #174 (TemplateValidator UCUM paths, template units, DV_TEXT value).
 */

import { assert, assertEquals } from "@std/assert";
import { RMInstanceGenerator } from "../../../generation/rm_instance_generator.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { RMSpecificationValidator } from "../../../validation/rm_specification_validator.ts";
import { TemplateValidator } from "../../../validation/template_validator.ts";

const OPT_DIR = new URL("../../opt14/", import.meta.url);
const BP_OPT = "ehrbase_blood_pressure_simple.de.v0.opt";

async function loadBloodPressureTemplate() {
  const xml = await Deno.readTextFile(new URL(BP_OPT, OPT_DIR));
  return parseOptXml(xml).operationalTemplate;
}

Deno.test("#174 validateUnits reports each DV_QUANTITY once with bracketed paths", async () => {
  const template = await loadBloodPressureTemplate();
  const instance = new RMInstanceGenerator({ mode: "example" }).generate(
    template,
  );
  const validator = new TemplateValidator({ validateUnits: true });
  await validator.initialize();
  const result = validator.validate(instance, template);
  const ucum = [...result.errors, ...result.warnings].filter(
    (m) => m.constraintType === "ucum",
  );
  assertEquals(
    ucum.length,
    1,
    `expected one UCUM message, got ${ucum.length}: ${
      ucum.map((m) => m.path).join(", ")
    }`,
  );
  assert(
    /\/content\[\d+\]\//.test(ucum[0].path),
    `path should use canonical brackets: ${ucum[0].path}`,
  );
  assert(
    !ucum[0].path.includes("/content/0/"),
    `path should not mix slash indices: ${ucum[0].path}`,
  );
});

Deno.test("#174 template C_DV_QUANTITY unit ° is warning not error under validateUnits", async () => {
  const template = await loadBloodPressureTemplate();
  const instance = new RMInstanceGenerator({ mode: "example" }).generate(
    template,
  );
  const validator = new TemplateValidator({ validateUnits: true });
  await validator.initialize();
  const result = validator.validate(instance, template);
  const ucum = [...result.errors, ...result.warnings].filter(
    (m) => m.constraintType === "ucum",
  );
  assertEquals(ucum.length, 1);
  assertEquals(ucum[0].severity, "warning");
  assertEquals(result.valid, true);
  assert(ucum[0].message.includes("°"));
});

Deno.test("#174 RMSpecificationValidator requires DV_TEXT and DV_CODED_TEXT value", () => {
  const rm = new RMSpecificationValidator();
  const coded = rm.validateInstance(
    {
      _type: "DV_CODED_TEXT",
      defining_code: {
        terminology_id: { value: "local" },
        code_string: "at0001",
      },
    },
    "DV_CODED_TEXT",
    "/",
  );
  assertEquals(coded.length, 1);
  assert(coded[0].message.includes("DV_CODED_TEXT.value"));
  assert(coded.every((m) => m.constraintType === "rm_invariant"));
  assert(
    !coded.some((m) => m.message.includes("DV_TEXT.value")),
    "inherited DV_TEXT.value should not be reported separately",
  );

  const text = rm.validateInstance({ _type: "DV_TEXT" }, "DV_TEXT", "/");
  assertEquals(text.length, 1);
  assert(text[0].message.includes("DV_TEXT.value"));
});

Deno.test("#174 standalone RM instance gets strict UCUM errors without template unit list", async () => {
  const validator = new TemplateValidator({
    validateUnits: true,
    validateRMSpecification: false,
    validateTerminology: false,
    validateIntervals: false,
    validateInvariants: false,
  });
  await validator.initialize();
  const template = await loadBloodPressureTemplate();
  const result = validator.validate(
    {
      _type: "COMPOSITION",
      content: [
        {
          _type: "OBSERVATION",
          data: {
            _type: "HISTORY",
            events: [
              {
                _type: "POINT_EVENT",
                data: {
                  _type: "ITEM_TREE",
                  items: [
                    {
                      _type: "ELEMENT",
                      value: {
                        _type: "DV_QUANTITY",
                        magnitude: 1,
                        units: "not-a-unit",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
    template,
  );
  const ucumErrors = result.errors.filter((m) => m.constraintType === "ucum");
  assertEquals(ucumErrors.length, 1);
  assertEquals(ucumErrors[0].severity, "error");
});

Deno.test("#174 RMInstanceGenerator minimal fills DV_CODED_TEXT value for blood pressure", async () => {
  const template = await loadBloodPressureTemplate();
  const instance = new RMInstanceGenerator({ mode: "minimal" }).generate(
    template,
  );
  const missing: string[] = [];
  const walk = (node: unknown, path: string) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    const rec = node as Record<string, unknown>;
    const type = rec._type;
    if (type === "DV_TEXT" || type === "DV_CODED_TEXT") {
      const value = rec.value;
      if (typeof value !== "string" || value.length === 0) {
        missing.push(`${path} (${type})`);
      }
    }
    for (const [k, v] of Object.entries(rec)) {
      if (v && typeof v === "object") walk(v, `${path}.${k}`);
    }
  };
  walk(instance, "composition");
  assertEquals(missing, []);
});
