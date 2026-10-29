import { assertEquals, assertExists } from "@std/assert";
import { parseTemplateInput } from "../../../../parser/mod.ts";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "../../../../generation/rm_instance_generator.ts";
import { buildWebTemplate } from "../../../../serialization/simplified/web_template_builder.ts";
import {
  deserializeFromFlat,
  serializeToFlat,
} from "../../../../serialization/simplified/mod.ts";
import { deserializeFromFlatWithIssues } from "../../../../serialization/simplified/flat_deserializer.ts";
import { instructionStateRubric } from "../../../../term/openehr_group_rubrics.ts";
import { openehrCodeMeaning } from "../../../../validation/rm_specification_validator.ts";
import { TemplateValidator } from "../../../../validation/template_validator.ts";
import { resolveAllAtWebTemplateNode } from "../../../../serialization/simplified/instance_nav.ts";

const MINIMAL_ACTION_OPT = new URL(
  "../../../veredictum/templates/minimal_action.opt",
  import.meta.url,
);
const CONFORMANCE_OPT = new URL(
  "../../../opt14/conformance_ehrbase.de.v0.opt",
  import.meta.url,
);

async function loadMinimalActionTemplate() {
  const xml = await Deno.readTextFile(MINIMAL_ACTION_OPT);
  const { operationalTemplate } = parseTemplateInput(xml);
  assertExists(operationalTemplate);
  return operationalTemplate;
}

async function loadConformanceTemplate() {
  const xml = await Deno.readTextFile(CONFORMANCE_OPT);
  const { operationalTemplate } = parseOptXml(xml);
  assertExists(operationalTemplate);
  return operationalTemplate;
}

function findActionNode(tree: { children?: Array<{ rmType?: string; children?: unknown[] }> }) {
  if (tree.rmType === "ACTION") return tree;
  for (const child of tree.children ?? []) {
    const found = findActionNode(child as typeof tree);
    if (found) return found;
  }
  return undefined;
}

function actionFlatPrefix(wt: { tree: { id: string; children?: Array<{ rmType?: string; id: string }> } }): string {
  const action = findActionNode(wt.tree) as { id: string } | undefined;
  assertExists(action);
  return `${wt.tree.id}/${action.id}:0`;
}

Deno.test("buildWebTemplate — ACTION ISM_TRANSITION uses RM attribute ids", async () => {
  const opt = await loadMinimalActionTemplate();
  const wt = buildWebTemplate(opt);
  const action = findActionNode(wt.tree);
  assertExists(action);
  const ism = (action.children as Array<{ id: string; rmType: string; children?: Array<{ id: string; min?: number; rmType: string; children?: unknown[] }> }>)
    ?.find((c) => c.id === "ism_transition");
  assertExists(ism);
  assertEquals(ism.rmType, "ISM_TRANSITION");
  const current = ism.children?.find((c) => c.id === "current_state");
  const careflow = ism.children?.find((c) => c.id === "careflow_step");
  assertExists(current);
  assertExists(careflow);
  assertEquals(current.rmType, "DV_CODED_TEXT");
  assertEquals(careflow.rmType, "DV_CODED_TEXT");
  assertEquals(careflow.min, 0);
  assertEquals(current.children, undefined);
  assertEquals(careflow.children, undefined);
  assertEquals(
    ism.children?.some((c) => c.id.startsWith("dv_coded_text")),
    false,
  );
  const currentList = current.inputs?.find((i) => i.suffix === "code")?.list ??
    [];
  assertEquals(currentList.some((i) => i.value === "526" && i.label === "planned"), true);
  const careList = careflow.inputs?.find((i) => i.suffix === "code")?.list ?? [];
  assertEquals(careList.find((i) => i.value === "at0003")?.currentStates, ["526"]);
});

Deno.test("deserializeFromFlat — ACTION ism_transition defaults without ISM keys", async () => {
  const opt = await loadConformanceTemplate();
  const wt = buildWebTemplate(opt);
  const instance = new RMInstanceGenerator({ mode: "example" }).generate(opt);
  const flat = serializeToFlat(instance, wt);
  for (const key of Object.keys(flat)) {
    if (key.includes("ism_transition")) delete flat[key];
  }
  flat["ctx/action_ism_transition_current_state"] = "524";

  const rm = deserializeFromFlat(flat, wt);
  const actionNode = findActionNode(wt.tree);
  assertExists(actionNode);
  const actions = resolveAllAtWebTemplateNode(rm, actionNode as { aqlPath: string; rmType: string });
  assertEquals(actions.length, 1);
  const ism = (actions[0] as Record<string, unknown>).ism_transition as Record<
    string,
    unknown
  >;
  assertExists(ism);
  const current = ism.current_state as Record<string, unknown>;
  assertEquals(
    (current.defining_code as { code_string?: string }).code_string,
    "524",
  );
  assertEquals(current.value, openehrCodeMeaning("524"));

  const validator = new TemplateValidator({ validateUnits: false });
  const result = validator.validate(rm, opt);
  const ismErrors = result.errors.filter((m) =>
    m.path.includes("ism_transition")
  );
  assertEquals(ismErrors, []);
  // ISM_TRANSITION is PATHABLE. The FLAT default still stores the template
  // node id so ism_transition[atNNNN] can be recovered. That key is a warning.
  const ismWarnings = result.warnings.filter((m) =>
    m.path.includes("ism_transition")
  );
  assertEquals(
    ismWarnings.map((m) => m.message),
    [
      "ISM_TRANSITION.archetype_node_id is not an attribute of the reference model",
    ],
  );
});

Deno.test("deserializeFromFlat — careflow_step code-only gets archetype value", async () => {
  const opt = await loadMinimalActionTemplate();
  const wt = buildWebTemplate(opt);
  const actionPath = actionFlatPrefix(wt);
  const flat = {
    "ctx/category|code": "433",
    "ctx/category|value": "event",
    "ctx/category|terminology": "openehr",
    "ctx/composer_name": "Test Composer",
    "ctx/language": "en",
    "ctx/territory": "US",
    [`${actionPath}/time`]: "2026-01-01T12:00:00Z",
    [`${actionPath}/description`]: "Example action",
    [`${actionPath}/ism_transition/careflow_step|code`]: "at0003",
    [`${actionPath}/ism_transition/careflow_step|terminology`]: "local",
  };

  const rm = deserializeFromFlat(flat, wt) as Record<string, unknown>;
  const ism = (rm.content as Array<Record<string, unknown>>)[0]
    .ism_transition as Record<string, unknown>;
  const careflow = ism.careflow_step as Record<string, unknown>;
  assertEquals(
    (careflow.defining_code as { code_string?: string }).code_string,
    "at0003",
  );
  assertEquals(typeof careflow.value, "string");
  assertEquals((careflow.value as string).length > 0, true);
  assertExists(ism.current_state);
  assertEquals(
    (ism.current_state as { defining_code?: { code_string?: string } })
      .defining_code?.code_string,
    "526",
  );
  assertEquals(ism.archetype_node_id, "at0003");
});

Deno.test("FLAT round trip — ism_transition careflow_step survives serialize", async () => {
  const opt = await loadMinimalActionTemplate();
  const wt = buildWebTemplate(opt);
  const actionPath = actionFlatPrefix(wt);
  const flatIn = {
    "ctx/category|code": "433",
    "ctx/category|value": "event",
    "ctx/category|terminology": "openehr",
    "ctx/composer_name": "Test Composer",
    "ctx/language": "en",
    "ctx/territory": "US",
    [`${actionPath}/time`]: "2026-01-01T12:00:00Z",
    [`${actionPath}/description`]: "Example action",
    [`${actionPath}/ism_transition/careflow_step|code`]: "at0003",
    [`${actionPath}/ism_transition/careflow_step|value`]: "Start",
    [`${actionPath}/ism_transition/careflow_step|terminology`]: "local",
  };
  const rm = deserializeFromFlat(flatIn, wt);
  const flatOut = serializeToFlat(rm, wt);
  assertEquals(
    flatOut[`${actionPath}/ism_transition/careflow_step|code`],
    "at0003",
  );
  assertEquals(
    flatOut[`${actionPath}/ism_transition/careflow_step|terminology`],
    "local",
  );
});

const CONFORMANCE_ACTION_PREFIX =
  "conformance-ehrbase.de.v0/conformance_section/conformance_action";

function stripIsmKeys(flat: Record<string, unknown>): void {
  for (const key of Object.keys(flat)) {
    if (key.includes("ism_transition")) delete flat[key];
  }
}

Deno.test("FLAT ISM — four input shapes (conformance action)", async () => {
  const opt = await loadConformanceTemplate();
  const wt = buildWebTemplate(opt);
  const fullFlat = serializeToFlat(
    new RMInstanceGenerator({ mode: "example" }).generate(opt),
    wt,
  );

  // No ISM keys + ctx default
  const noIsm = { ...fullFlat };
  stripIsmKeys(noIsm);
  noIsm["ctx/action_ism_transition_current_state"] = "524";
  const rm1 = deserializeFromFlat(noIsm, wt);
  const ism1 = (resolveAllAtWebTemplateNode(
    rm1,
    findActionNode(wt.tree) as { aqlPath: string; rmType: string },
  )[0] as Record<string, unknown>).ism_transition as Record<string, unknown>;
  const cs1 = ism1.current_state as Record<string, unknown>;
  assertEquals((cs1.defining_code as { code_string?: string }).code_string, "524");
  assertEquals(cs1.value, instructionStateRubric("524"));

  // careflow_step code only
  const careflowOnly = { ...fullFlat };
  stripIsmKeys(careflowOnly);
  careflowOnly[`${CONFORMANCE_ACTION_PREFIX}/ism_transition/careflow_step|code`] =
    "at0005";
  careflowOnly[`${CONFORMANCE_ACTION_PREFIX}/ism_transition/careflow_step|terminology`] =
    "local";
  const rm2 = deserializeFromFlat(careflowOnly, wt);
  const ism2 = (resolveAllAtWebTemplateNode(
    rm2,
    findActionNode(wt.tree) as { aqlPath: string; rmType: string },
  )[0] as Record<string, unknown>).ism_transition as Record<string, unknown>;
  assertEquals(
    (ism2.current_state as { defining_code?: { code_string?: string } })
      .defining_code?.code_string,
    "524",
  );

  // full Better-style keys (unchanged round-trip)
  const rm3 = deserializeFromFlat(fullFlat, wt);
  const validator = new TemplateValidator({ validateUnits: false });
  const ismMsgs = [...validator.validate(rm3, opt).errors].filter((m) =>
    m.path.includes("ism_transition")
  );
  assertEquals(ismMsgs.length, 0);

  // current_state value only (single-code template would use 532 — multi-code uses rubric match)
  const valueOnly = { ...fullFlat };
  stripIsmKeys(valueOnly);
  valueOnly[`${CONFORMANCE_ACTION_PREFIX}/ism_transition/current_state|value`] =
    "initial";
  const { composition: rm4, issues: issues4 } = deserializeFromFlatWithIssues(
    valueOnly,
    wt,
  );
  assertEquals(issues4.length, 0);
  const ism4 = (resolveAllAtWebTemplateNode(
    rm4,
    findActionNode(wt.tree) as { aqlPath: string; rmType: string },
  )[0] as Record<string, unknown>).ism_transition as Record<string, unknown>;
  assertEquals(
    (ism4.current_state as { defining_code?: { code_string?: string } })
      .defining_code?.code_string,
    "524",
  );

  const wrongValue = { ...fullFlat };
  stripIsmKeys(wrongValue);
  wrongValue[`${CONFORMANCE_ACTION_PREFIX}/ism_transition/current_state|value`] =
    "not-a-real-state";
  const { issues: badIssues } = deserializeFromFlatWithIssues(wrongValue, wt);
  assertEquals(badIssues.some((i) => i.severity === "error"), true);
});
