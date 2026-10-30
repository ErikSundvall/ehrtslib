/**
 * FLAT → RM completion of partial DV_CODED_TEXT (#218). Matching is exact by
 * default; the case-insensitive option is covered in issue231_*.test.ts.
 *
 * The reported template is simple-diagnose-and-vitals.opt. This repo does not
 * carry that file; ehrbase_blood_pressure_simple.de.v0.opt has the same local
 * position value set (at1001 / Sitting) on a DV_CODED_TEXT leaf.
 */

import { assert, assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import { buildWebTemplate } from "../../../../serialization/simplified/web_template_builder.ts";
import {
  deserializeFromFlat,
  deserializeFromFlatWithIssues,
} from "../../../../serialization/simplified/flat_deserializer.ts";
import { serializeToFlatJson } from "../../../../serialization/simplified/flat_serializer.ts";
import { buildDvValue } from "../../../../serialization/simplified/dv_field_maps.ts";
import { buildRmValue } from "../../../../serialization/simplified/value_build.ts";
import type {
  WebTemplate,
  WebTemplateNode,
} from "../../../../serialization/simplified/types.ts";

const OPT = new URL(
  "../../../opt14/ehrbase_blood_pressure_simple.de.v0.opt",
  import.meta.url,
);

const baseFlat = {
  "ctx/language": "en",
  "ctx/territory": "DE",
  "ctx/composer_name": "Tester",
};

interface CodedSnapshot {
  type?: unknown;
  value?: unknown;
  code?: string;
  terminology?: string;
}

function findChain(
  node: WebTemplateNode,
  pred: (candidate: WebTemplateNode) => boolean,
  acc: WebTemplateNode[] = [],
): WebTemplateNode[] | undefined {
  if (pred(node)) return acc;
  for (const child of node.children ?? []) {
    const found = findChain(child, pred, [...acc, child]);
    if (found) return found;
  }
  return undefined;
}

function snapshot(value: Record<string, unknown> | undefined): CodedSnapshot {
  const defining = value?.defining_code as {
    code_string?: string;
    terminology_id?: { value?: string };
  } | undefined;
  return {
    type: value?._type,
    value: value?.value,
    code: defining?.code_string,
    terminology: defining?.terminology_id?.value,
  };
}

function positionValue(
  composition: unknown,
): Record<string, unknown> | undefined {
  const walk = (node: unknown): Record<string, unknown> | undefined => {
    if (!node || typeof node !== "object") return undefined;
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item);
        if (found) return found;
      }
      return undefined;
    }
    const record = node as Record<string, unknown>;
    if (record._type === "ELEMENT" && record.archetype_node_id === "at0008") {
      return record.value as Record<string, unknown>;
    }
    for (const child of Object.values(record)) {
      const found = walk(child);
      if (found) return found;
    }
    return undefined;
  };
  return walk(composition);
}

async function loadPosition(): Promise<{
  wt: WebTemplate;
  key: string;
  node: WebTemplateNode;
}> {
  const xml = await Deno.readTextFile(OPT);
  const { operationalTemplate } = parseOptXml(xml);
  const wt = buildWebTemplate(operationalTemplate!);
  const chain = findChain(
    wt.tree,
    (node) =>
      node.id === "position" &&
      node.rmType === "DV_CODED_TEXT" &&
      !!node.inputs?.some((input) =>
        input.list?.some((item) =>
          item.value === "at1001" && item.label === "Sitting"
        )
      ),
  );
  assert(chain, "expected position DV_CODED_TEXT");
  const node = chain[chain.length - 1];
  return {
    wt,
    node,
    key: `${wt.tree.id}/${chain.map((part) => part.id).join("/")}`,
  };
}

function assertRoundTrip(
  wt: WebTemplate,
  flat: Record<string, unknown>,
  expected: CodedSnapshot,
): void {
  const rm = deserializeFromFlat(flat, wt);
  assertEquals(snapshot(positionValue(rm)), expected);
  const flatOut = JSON.parse(serializeToFlatJson(rm, wt)) as Record<
    string,
    unknown
  >;
  const positionKeys = Object.keys(flatOut).filter((key) =>
    key.includes("/position|") || key.endsWith("/position")
  );
  assert(
    positionKeys.some((key) => key.endsWith("|code") && flatOut[key] === "at1001"),
    `round trip missing position|code: ${JSON.stringify(flatOut)}`,
  );
  assert(
    positionKeys.some((key) =>
      key.endsWith("|value") && flatOut[key] === "Sitting"
    ),
  );
  assert(
    positionKeys.some((key) =>
      key.endsWith("|terminology") && flatOut[key] === "local"
    ),
  );
  const again = deserializeFromFlat(flatOut, wt);
  assertEquals(snapshot(positionValue(again)), expected);
}

Deno.test("#218 full code, value, and terminology stay correct", async () => {
  const { wt, key, node } = await loadPosition();
  const flat = {
    ...baseFlat,
    [`${key}|code`]: "at1001",
    [`${key}|value`]: "Sitting",
    [`${key}|terminology`]: "local",
  };
  const expected: CodedSnapshot = {
    type: "DV_CODED_TEXT",
    value: "Sitting",
    code: "at1001",
    terminology: "local",
  };
  assertRoundTrip(wt, flat, expected);
  assertEquals(
    buildRmValue("DV_CODED_TEXT", {
      code: "at1001",
      value: "Sitting",
      terminology: "local",
    }, { node, language: "en" }),
    {
      _type: "DV_CODED_TEXT",
      value: "Sitting",
      defining_code: {
        _type: "CODE_PHRASE",
        code_string: "at1001",
        terminology_id: { _type: "TERMINOLOGY_ID", value: "local" },
      },
    },
  );
});

Deno.test("#218 code-only DV_CODED_TEXT fills the template rubric", async () => {
  const { wt, key, node } = await loadPosition();
  const expected: CodedSnapshot = {
    type: "DV_CODED_TEXT",
    value: "Sitting",
    code: "at1001",
    terminology: "local",
  };
  assertRoundTrip(wt, { ...baseFlat, [`${key}|code`]: "at1001" }, expected);
  assertEquals(
    snapshot(buildRmValue("DV_CODED_TEXT", { code: "at1001" }, {
      node,
      language: "en",
    }) as Record<string, unknown>),
    expected,
  );
});

Deno.test("#218 value-only DV_CODED_TEXT fills defining_code from one rubric", async () => {
  const { wt, key, node } = await loadPosition();
  const expected: CodedSnapshot = {
    type: "DV_CODED_TEXT",
    value: "Sitting",
    code: "at1001",
    terminology: "local",
  };
  assertRoundTrip(wt, { ...baseFlat, [`${key}|value`]: "Sitting" }, expected);
  assertEquals(
    snapshot(buildRmValue("DV_CODED_TEXT", { value: "Sitting" }, {
      node,
      language: "en",
    }) as Record<string, unknown>),
    expected,
  );
});

Deno.test("#218 bare key matching a code is read as |code", async () => {
  const { wt, key, node } = await loadPosition();
  const expected: CodedSnapshot = {
    type: "DV_CODED_TEXT",
    value: "Sitting",
    code: "at1001",
    terminology: "local",
  };
  assertRoundTrip(wt, { ...baseFlat, [key]: "at1001" }, expected);
  assertEquals(
    snapshot(buildDvValue("DV_CODED_TEXT", { "": "at1001" }, {
      node,
      language: "en",
    }) as Record<string, unknown>),
    expected,
  );
});

Deno.test("#218 bare key matching a rubric is read as |value", async () => {
  const { wt, key } = await loadPosition();
  const expected: CodedSnapshot = {
    type: "DV_CODED_TEXT",
    value: "Sitting",
    code: "at1001",
    terminology: "local",
  };
  assertRoundTrip(wt, { ...baseFlat, [key]: "Sitting" }, expected);
  assertEquals(
    snapshot(buildRmValue("DV_CODED_TEXT", { "": "Sitting" }, {
      codes: [
        { value: "at1000", label: "Standing" },
        { value: "at1001", label: "Sitting" },
      ],
      terminology: "local",
      language: "en",
    }) as Record<string, unknown>),
    expected,
  );
});

Deno.test("#218 bare key with no code or rubric is reported, not dropped", async () => {
  const { wt, key } = await loadPosition();
  const flat = { ...baseFlat, [key]: "Not a position" };
  const { composition, issues } = deserializeFromFlatWithIssues(flat, wt);
  assertEquals(snapshot(positionValue(composition)), {
    type: "DV_CODED_TEXT",
    value: "Not a position",
    code: undefined,
    terminology: undefined,
  });
  assertEquals(issues.length > 0, true);
  assertEquals(issues.some((issue) => issue.severity === "error"), true);
  assert(
    issues.some((issue) => issue.message.includes("Not a position")),
    JSON.stringify(issues),
  );
});

Deno.test("#218 buildRmValue without a code list does not invent codes", () => {
  assertEquals(buildRmValue("DV_CODED_TEXT", { "": "at1001" }), {
    _type: "DV_CODED_TEXT",
  });
  assertEquals(buildDvValue("DV_CODED_TEXT", { "": "Sitting" }), {
    _type: "DV_CODED_TEXT",
  });
  assertEquals(
    buildRmValue("DV_CODED_TEXT", { code: "at1001", terminology: "local" }),
    {
      _type: "DV_CODED_TEXT",
      defining_code: {
        _type: "CODE_PHRASE",
        code_string: "at1001",
        terminology_id: { _type: "TERMINOLOGY_ID", value: "local" },
      },
    },
  );
});

Deno.test("#218 external terminology is not completed from the code list", () => {
  const node: WebTemplateNode = {
    id: "finding",
    rmType: "DV_CODED_TEXT",
    min: 0,
    max: 1,
    aqlPath: "/finding",
    inputs: [{
      type: "CODED_TEXT",
      suffix: "code",
      terminology: "SNOMED-CT",
      list: [{ value: "123456", label: "Example finding" }],
    }],
  };
  const issues: Array<{ severity: string; message: string }> = [];
  assertEquals(
    buildRmValue("DV_CODED_TEXT", {
      code: "123456",
      terminology: "SNOMED-CT",
    }, { node, issues }),
    {
      _type: "DV_CODED_TEXT",
      defining_code: {
        _type: "CODE_PHRASE",
        code_string: "123456",
        terminology_id: { _type: "TERMINOLOGY_ID", value: "SNOMED-CT" },
      },
    },
  );
  assertEquals(
    buildRmValue("DV_CODED_TEXT", { value: "Example finding" }, {
      node,
      issues,
    }),
    { _type: "DV_CODED_TEXT", value: "Example finding" },
  );
  assertEquals(issues, []);
});
