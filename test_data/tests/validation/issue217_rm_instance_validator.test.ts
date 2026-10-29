/**
 * RM checks on plain JSON and deserialized class instances (#217).
 *
 * `simple-diagnose-and-vitals.opt` is not in this repo. The blood-pressure OPT
 * has the same rows: OBSERVATION.subject, EVENT_CONTEXT.setting,
 * DV_QUANTITY.magnitude, local::at1001 rubric "Sitting".
 */

import { assert, assertEquals } from "@std/assert";
import { RMInstanceGenerator } from "../../../generation/rm_instance_generator.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { CANONICAL_JSON_DESERIALIZE_CONFIG } from "../../../serialization/json/json_config.ts";
import { JsonConfigurableDeserializer } from "../../../serialization/json/json_configurable_deserializer.ts";
import { RMSpecificationValidator } from "../../../validation/rm_specification_validator.ts";
import {
  TemplateValidator,
  type ValidationMessage,
} from "../../../validation/template_validator.ts";

const OPT_URL = new URL(
  "../../opt14/ehrbase_blood_pressure_simple.de.v0.opt",
  import.meta.url,
);

const template = parseOptXml(await Deno.readTextFile(OPT_URL))
  .operationalTemplate;
const baseline = new RMInstanceGenerator({ mode: "example" }).generate(
  template,
);
const deserializer = new JsonConfigurableDeserializer({
  ...CANONICAL_JSON_DESERIALIZE_CONFIG,
});

type Form = "plain" | "instance";

function rmTypeOf(node: Record<string, unknown>): string | undefined {
  if (typeof node._type === "string") return node._type;
  const name = node.constructor?.name;
  if (name && name !== "Object" && name !== "Array") return name;
  return undefined;
}

function walkNodes(
  node: unknown,
  visit: (n: Record<string, unknown>) => void,
  seen = new Set<unknown>(),
): void {
  if (!node || typeof node !== "object") return;
  if (seen.has(node)) return;
  seen.add(node);
  if (Array.isArray(node)) {
    for (const item of node) walkNodes(item, visit, seen);
    return;
  }
  const rec = node as Record<string, unknown>;
  visit(rec);
  for (const [key, value] of Object.entries(rec)) {
    if (key === "_parent" || key === "parent") continue;
    if (value && typeof value === "object") walkNodes(value, visit, seen);
  }
}

function findNode(
  root: unknown,
  pred: (node: Record<string, unknown>) => boolean,
): Record<string, unknown> {
  let found: Record<string, unknown> | undefined;
  walkNodes(root, (node) => {
    if (!found && pred(node)) found = node;
  });
  if (!found) throw new Error("node not found");
  return found;
}

function codeOf(node: Record<string, unknown>): string | undefined {
  const defining = node.defining_code;
  if (!defining || typeof defining !== "object") return undefined;
  const code = (defining as { code_string?: unknown }).code_string;
  return typeof code === "string" ? code : undefined;
}

function terminologyOf(node: Record<string, unknown>): string | undefined {
  const defining = node.defining_code;
  if (!defining || typeof defining !== "object") return undefined;
  const tid = (defining as { terminology_id?: { value?: unknown } | string })
    .terminology_id;
  if (typeof tid === "string") return tid;
  return typeof tid?.value === "string" ? tid.value : undefined;
}

function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function materialise(
  mutate: (root: Record<string, unknown>) => void,
): Record<Form, unknown> {
  const plain = clonePlain(baseline) as Record<string, unknown>;
  mutate(plain);
  // Apply the same edit to a deserialized instance. Strict deserialize rewrites
  // some defects (for example subject `{rmType:"PARTY_SELF"}` becomes a
  // PARTY_PROXY), and the validator is what these tests exercise.
  const instance = deserializer.deserialize(
    JSON.stringify(baseline),
  ) as Record<string, unknown>;
  mutate(instance);
  return { plain, instance };
}

async function validator(strict = false): Promise<TemplateValidator> {
  const v = new TemplateValidator({
    failFast: false,
    validateUnits: true,
    validateTerminology: true,
    validateRMSpecification: true,
    validateInvariants: true,
    strict,
  });
  await v.initialize();
  return v;
}

function errorsOf(
  messages: ValidationMessage[],
  pred: (message: ValidationMessage) => boolean,
): ValidationMessage[] {
  return messages.filter((message) =>
    message.severity === "error" && pred(message)
  );
}

Deno.test("#217 generated blood-pressure composition has no RM errors", async () => {
  const v = await validator();
  const result = v.validate(baseline, template);
  const rmErrors = result.errors.filter((message) =>
    message.constraintType === "rm_specification" ||
    message.constraintType === "rm_type" ||
    message.constraintType === "rm_invariant" ||
    message.constraintType === "rm_schema"
  );
  assertEquals(
    rmErrors.map((message) => `${message.path} ${message.message}`),
    [],
  );
});

Deno.test("#217 DV_QUANTITY without magnitude is an error on JSON and instances", async () => {
  const forms = materialise((root) => {
    const qty = findNode(root, (node) => rmTypeOf(node) === "DV_QUANTITY");
    qty.magnitude = undefined;
    delete qty.magnitude;
  });
  const v = await validator();
  const rm = new RMSpecificationValidator();
  for (const form of ["plain", "instance"] as const) {
    const result = v.validate(forms[form], template);
    const direct = rm.validateInstance(forms[form], "COMPOSITION");
    const hit = errorsOf(
      [...result.errors, ...direct],
      (message) =>
        message.path.includes("magnitude") &&
        message.message.includes("DV_QUANTITY.magnitude"),
    );
    assert(hit.length > 0, `${form} did not report missing magnitude`);
    assertEquals(result.valid, false, form);
  }
});

Deno.test("#217 OBSERVATION without subject is an error on JSON and instances", async () => {
  const forms = materialise((root) => {
    const entry = findNode(
      root,
      (node) =>
        rmTypeOf(node) === "OBSERVATION" || rmTypeOf(node) === "EVALUATION",
    );
    entry.subject = undefined;
    delete entry.subject;
  });
  const v = await validator();
  const rm = new RMSpecificationValidator();
  for (const form of ["plain", "instance"] as const) {
    const result = v.validate(forms[form], template);
    const direct = rm.validateInstance(forms[form], "COMPOSITION");
    const hit = errorsOf(
      [...result.errors, ...direct],
      (message) =>
        message.path.includes("subject") &&
        message.message.includes("ENTRY.subject"),
    );
    assert(hit.length > 0, `${form} did not report missing subject`);
    assertEquals(result.valid, false, form);
  }
});

Deno.test("#217 EVENT_CONTEXT without setting is an error on JSON and instances", async () => {
  const forms = materialise((root) => {
    const context = findNode(
      root,
      (node) => rmTypeOf(node) === "EVENT_CONTEXT",
    );
    context.setting = undefined;
    delete context.setting;
  });
  const v = await validator();
  const rm = new RMSpecificationValidator();
  for (const form of ["plain", "instance"] as const) {
    const result = v.validate(forms[form], template);
    const direct = rm.validateInstance(forms[form], "COMPOSITION");
    const hit = errorsOf(
      [...result.errors, ...direct],
      (message) =>
        message.path.includes("setting") &&
        message.message.includes("setting") &&
        message.message.includes("required"),
    );
    assert(hit.length > 0, `${form} did not report missing setting`);
    assertEquals(result.valid, false, form);
  }
});

Deno.test("#217 CODE_PHRASE without code_string is an error on JSON and instances", async () => {
  const forms = materialise((root) => {
    const phrase = findNode(
      root,
      (node) => rmTypeOf(node) === "CODE_PHRASE" && !!node.code_string,
    );
    phrase.code_string = undefined;
    delete phrase.code_string;
    phrase.value = "en";
  });
  const v = await validator();
  const rm = new RMSpecificationValidator();
  for (const form of ["plain", "instance"] as const) {
    const result = v.validate(forms[form], template);
    const direct = rm.validateInstance(forms[form], "COMPOSITION");
    const hit = errorsOf(
      [...result.errors, ...direct],
      (message) =>
        message.path.includes("code_string") &&
        message.message.includes("code_string") &&
        message.message.includes("required"),
    );
    assert(hit.length > 0, `${form} did not report missing code_string`);
    assertEquals(result.valid, false, form);
  }
});

Deno.test("#217 DV_CODED_TEXT without value is an error on JSON and instances", async () => {
  const forms = materialise((root) => {
    const coded = findNode(
      root,
      (node) => rmTypeOf(node) === "DV_CODED_TEXT" && !!node.defining_code,
    );
    coded.value = undefined;
    delete coded.value;
  });
  const v = await validator();
  const rm = new RMSpecificationValidator();
  for (const form of ["plain", "instance"] as const) {
    const result = v.validate(forms[form], template);
    const direct = rm.validateInstance(forms[form], "COMPOSITION");
    const hit = errorsOf(
      [...result.errors, ...direct],
      (message) =>
        message.message.includes("DV_CODED_TEXT.value") ||
        (message.path.endsWith("/value/") &&
          message.message.includes("value") &&
          message.message.includes("required")),
    );
    assert(hit.length > 0, `${form} did not report missing value`);
    assertEquals(result.valid, false, form);
  }
});

Deno.test("#217 ENTRY.language string is a type error on JSON and instances", async () => {
  const forms = materialise((root) => {
    const entry = findNode(
      root,
      (node) =>
        rmTypeOf(node) === "OBSERVATION" || rmTypeOf(node) === "EVALUATION",
    );
    entry.language = "ISO_639-1::en";
  });
  const v = await validator();
  const rm = new RMSpecificationValidator();
  for (const form of ["plain", "instance"] as const) {
    const result = v.validate(forms[form], template);
    const direct = rm.validateInstance(forms[form], "COMPOSITION");
    const hit = errorsOf(
      [...result.errors, ...direct],
      (message) =>
        message.path.includes("language") &&
        message.message.includes("CODE_PHRASE") &&
        message.constraintType === "rm_type",
    );
    assert(hit.length > 0, `${form} did not report language type`);
    assertEquals(result.valid, false, form);
  }
});

Deno.test("#217 subject rmType object is a type error on JSON and instances", async () => {
  const forms = materialise((root) => {
    const entry = findNode(
      root,
      (node) =>
        rmTypeOf(node) === "OBSERVATION" || rmTypeOf(node) === "EVALUATION",
    );
    entry.subject = { rmType: "PARTY_SELF" };
  });
  const v = await validator();
  const rm = new RMSpecificationValidator();
  for (const form of ["plain", "instance"] as const) {
    const result = v.validate(forms[form], template);
    const direct = rm.validateInstance(forms[form], "COMPOSITION");
    const hit = errorsOf(
      [...result.errors, ...direct],
      (message) =>
        message.path.includes("subject") &&
        message.message.includes("PARTY_PROXY") &&
        message.constraintType === "rm_type",
    );
    assert(hit.length > 0, `${form} did not report subject type`);
    assertEquals(result.valid, false, form);
  }
});

Deno.test("#217 EVENT_CONTEXT.name is a warning, or an error when strict", async () => {
  const forms = materialise((root) => {
    const context = findNode(
      root,
      (node) => rmTypeOf(node) === "EVENT_CONTEXT",
    );
    context.name = "not-an-rm-attribute";
  });
  const lenient = await validator(false);
  const strict = await validator(true);
  const lenientRm = new RMSpecificationValidator();
  const strictRm = new RMSpecificationValidator(true, { strict: true });
  for (const form of ["plain", "instance"] as const) {
    const warned = lenient.validate(forms[form], template);
    const warnedDirect = lenientRm.validateInstance(forms[form], "COMPOSITION");
    const warning = [...warned.warnings, ...warnedDirect].find((message) =>
      message.path.includes("name") &&
      message.message.includes("not an attribute")
    );
    assert(warning, `${form} did not warn about EVENT_CONTEXT.name`);
    assertEquals(warning.severity, "warning");
    assertEquals(
      warned.errors.some((message) =>
        message.message.includes("not an attribute")
      ),
      false,
      form,
    );

    const failed = strict.validate(forms[form], template);
    const failedDirect = strictRm.validateInstance(forms[form], "COMPOSITION");
    const error = [...failed.errors, ...failedDirect].find((message) =>
      message.path.includes("name") &&
      message.message.includes("not an attribute") &&
      message.severity === "error"
    );
    assert(error, `${form} did not error about EVENT_CONTEXT.name when strict`);
    assertEquals(failed.valid, false, form);
  }
});

Deno.test("#217 ENTRY.encoding terminology Unicode is an error on JSON and instances", async () => {
  const forms = materialise((root) => {
    const entry = findNode(
      root,
      (node) =>
        (rmTypeOf(node) === "OBSERVATION" ||
          rmTypeOf(node) === "EVALUATION") &&
        !!node.encoding,
    );
    const encoding = entry.encoding as {
      terminology_id?: { value?: string };
    };
    if (!encoding?.terminology_id) throw new Error("encoding missing");
    encoding.terminology_id.value = "Unicode";
  });
  const v = await validator();
  const rm = new RMSpecificationValidator();
  for (const form of ["plain", "instance"] as const) {
    const result = v.validate(forms[form], template);
    const direct = rm.validateInstance(forms[form], "COMPOSITION");
    const hit = errorsOf(
      [...result.errors, ...direct],
      (message) =>
        message.path.includes("encoding") &&
        message.message.includes("IANA_character-sets") &&
        message.message.includes("Unicode"),
    );
    assert(hit.length > 0, `${form} did not report encoding terminology`);
    assertEquals(result.valid, false, form);
  }
});

Deno.test("#217 DV_CODED_TEXT value sitting vs rubric Sitting is a warning", async () => {
  const forms = materialise((root) => {
    const coded = findNode(
      root,
      (node) =>
        rmTypeOf(node) === "DV_CODED_TEXT" && codeOf(node) === "at1001" &&
        terminologyOf(node) === "local",
    );
    coded.value = "sitting";
  });
  const v = await validator();
  for (const form of ["plain", "instance"] as const) {
    const result = v.validate(forms[form], template);
    const warning = result.warnings.find((message) =>
      message.constraintType === "term_rubric" &&
      message.message.includes("sitting") &&
      message.message.includes("Sitting") &&
      message.message.includes("at1001")
    );
    assert(warning, `${form} did not warn about the rubric`);
    assertEquals(warning.severity, "warning");
    assertEquals(
      result.errors.some((message) => message.constraintType === "term_rubric"),
      false,
      form,
    );
  }
});

Deno.test("#217 empty DV_CODED_TEXT still reports missing defining_code", async () => {
  const forms = materialise((root) => {
    const element = findNode(
      root,
      (node) =>
        rmTypeOf(node) === "ELEMENT" &&
        !!node.value &&
        rmTypeOf(node.value as Record<string, unknown>) === "DV_CODED_TEXT",
    );
    element.value = { _type: "DV_CODED_TEXT" };
  });
  const v = await validator();
  for (const form of ["plain", "instance"] as const) {
    const result = v.validate(forms[form], template);
    assert(
      result.errors.some((message) =>
        message.message.includes("Missing defining_code")
      ),
      `${form} lost the defining_code check`,
    );
  }
});

Deno.test("#217 code at9999 is still rejected by the code list", async () => {
  const forms = materialise((root) => {
    const coded = findNode(
      root,
      (node) =>
        rmTypeOf(node) === "DV_CODED_TEXT" && codeOf(node) === "at1001",
    );
    const defining = coded.defining_code as { code_string?: string };
    defining.code_string = "at9999";
  });
  const v = await validator();
  for (const form of ["plain", "instance"] as const) {
    const result = v.validate(forms[form], template);
    assert(
      result.errors.some((message) =>
        message.message.includes(
          'code_string "at9999" is not in C_CODE_PHRASE.code_list',
        )
      ),
      `${form} lost the code list check`,
    );
  }
});
