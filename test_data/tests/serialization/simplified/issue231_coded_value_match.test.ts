/**
 * FLAT coded text: exact, case-sensitive `|value` and bare-key matching by
 * default; case-insensitive matching as an opt-in (#231).
 */

import { assert, assertEquals } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import { buildWebTemplate } from "../../../../serialization/simplified/web_template_builder.ts";
import {
  deserializeFromFlat,
  deserializeFromFlatWithIssues,
} from "../../../../serialization/simplified/flat_deserializer.ts";
import { buildDvValue } from "../../../../serialization/simplified/dv_field_maps.ts";
import { buildRmValue } from "../../../../serialization/simplified/value_build.ts";
import type { FlatRmDefaultIssue } from "../../../../serialization/simplified/flat_rm_defaults.ts";
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

const SITTING: CodedSnapshot = {
  type: "DV_CODED_TEXT",
  value: "Sitting",
  code: "at1001",
  terminology: "local",
};

const HINT = 'enable codedValueMatch: "case-insensitive" to accept';

function assertHint(
  issues: FlatRmDefaultIssue[],
  input: string,
  target: string,
): void {
  assert(
    issues.some((issue) =>
      issue.severity === "error" &&
      issue.message.includes(`"${input}"`) &&
      issue.message.includes(`"${target}" ignoring case`) &&
      issue.message.includes(HINT)
    ),
    JSON.stringify(issues),
  );
}

function unmatched(value: string): CodedSnapshot {
  return {
    type: "DV_CODED_TEXT",
    value,
    code: undefined,
    terminology: undefined,
  };
}

Deno.test("#231 exact |value match completes defining_code by default", async () => {
  const { wt, key, node } = await loadPosition();
  const { composition, issues } = deserializeFromFlatWithIssues(
    { ...baseFlat, [`${key}|value`]: "Sitting" },
    wt,
  );
  assertEquals(snapshot(positionValue(composition)), SITTING);
  assertEquals(issues, []);
  assertEquals(
    snapshot(buildRmValue("DV_CODED_TEXT", { value: "Sitting" }, { node })),
    SITTING,
  );
});

Deno.test("#231 case-only |value mismatch is kept and reported with a hint", async () => {
  const { wt, key, node } = await loadPosition();
  const { composition, issues } = deserializeFromFlatWithIssues(
    { ...baseFlat, [`${key}|value`]: "sitting" },
    wt,
  );
  assertEquals(snapshot(positionValue(composition)), unmatched("sitting"));
  assertHint(issues, "sitting", "Sitting");

  const buildIssues: FlatRmDefaultIssue[] = [];
  assertEquals(
    snapshot(buildRmValue("DV_CODED_TEXT", { value: "sITTING" }, {
      node,
      issues: buildIssues,
    })),
    unmatched("sITTING"),
  );
  assertHint(buildIssues, "sITTING", "Sitting");
});

Deno.test("#231 a value that matches nothing gets no case hint", async () => {
  const { wt, key } = await loadPosition();
  const { issues } = deserializeFromFlatWithIssues(
    { ...baseFlat, [`${key}|value`]: "Kneeling" },
    wt,
  );
  assert(issues.some((issue) => issue.message.includes('"Kneeling"')));
  assert(!issues.some((issue) => issue.message.includes(HINT)));
});

Deno.test("#231 codedValueMatch case-insensitive accepts and stores the rubric", async () => {
  const { wt, key, node } = await loadPosition();
  const options = { codedValueMatch: "case-insensitive" as const };
  const { composition, issues } = deserializeFromFlatWithIssues(
    { ...baseFlat, [`${key}|value`]: "sITTING" },
    wt,
    options,
  );
  assertEquals(snapshot(positionValue(composition)), SITTING);
  assertEquals(issues, []);
  assertEquals(
    snapshot(positionValue(deserializeFromFlat(
      { ...baseFlat, [`${key}|value`]: "sitting" },
      wt,
      options,
    ))),
    SITTING,
  );
  assertEquals(
    snapshot(buildRmValue("DV_CODED_TEXT", { value: "sitting" }, {
      node,
      ...options,
    })),
    SITTING,
  );
});

Deno.test("#231 code-only completion is the same in both modes", async () => {
  const { wt, key, node } = await loadPosition();
  for (const codedValueMatch of ["exact", "case-insensitive"] as const) {
    const { composition, issues } = deserializeFromFlatWithIssues(
      { ...baseFlat, [`${key}|code`]: "at1001" },
      wt,
      { codedValueMatch },
    );
    assertEquals(snapshot(positionValue(composition)), SITTING);
    assertEquals(issues, []);
    assertEquals(
      snapshot(buildRmValue("DV_CODED_TEXT", { code: "AT1001" }, {
        node,
        codedValueMatch,
      })),
      SITTING,
    );
  }
});

Deno.test("#231 bare keys match codes and rubrics exactly by default", async () => {
  const { wt, key, node } = await loadPosition();
  for (const bare of ["at1001", "Sitting"]) {
    const { composition, issues } = deserializeFromFlatWithIssues(
      { ...baseFlat, [key]: bare },
      wt,
    );
    assertEquals(snapshot(positionValue(composition)), SITTING, bare);
    assertEquals(issues, []);
  }

  const rubricCase = deserializeFromFlatWithIssues(
    { ...baseFlat, [key]: "sitting" },
    wt,
  );
  assertEquals(
    snapshot(positionValue(rubricCase.composition)),
    unmatched("sitting"),
  );
  assertHint(rubricCase.issues, "sitting", "Sitting");

  const codeIssues: FlatRmDefaultIssue[] = [];
  assertEquals(
    snapshot(buildDvValue("DV_CODED_TEXT", { "": "AT1001" }, {
      node,
      issues: codeIssues,
    })),
    unmatched("AT1001"),
  );
  assert(
    codeIssues.some((issue) =>
      issue.message.includes('code "at1001" ignoring case') &&
      issue.message.includes(HINT)
    ),
    JSON.stringify(codeIssues),
  );
});

Deno.test("#231 bare keys ignore case with codedValueMatch case-insensitive", async () => {
  const { wt, key, node } = await loadPosition();
  for (const bare of ["AT1001", "sitting"]) {
    const { composition, issues } = deserializeFromFlatWithIssues(
      { ...baseFlat, [key]: bare },
      wt,
      { codedValueMatch: "case-insensitive" },
    );
    assertEquals(snapshot(positionValue(composition)), SITTING, bare);
    assertEquals(issues, []);
    assertEquals(
      snapshot(buildDvValue("DV_CODED_TEXT", { "": bare }, {
        node,
        codedValueMatch: "case-insensitive",
      })),
      SITTING,
      bare,
    );
  }
});

Deno.test("#231 single-code list: case-only value is reported unless opted in", () => {
  const codes = [{ value: "at1001", label: "Sitting" }];
  const issues: FlatRmDefaultIssue[] = [];
  assertEquals(
    snapshot(buildRmValue("DV_CODED_TEXT", { value: "SITTING" }, {
      codes,
      terminology: "local",
      issues,
    })),
    unmatched("SITTING"),
  );
  assertHint(issues, "SITTING", "Sitting");
  assertEquals(
    snapshot(buildRmValue("DV_CODED_TEXT", { value: "SITTING" }, {
      codes,
      terminology: "local",
      codedValueMatch: "case-insensitive",
    })),
    SITTING,
  );
});

Deno.test("#231 openEHR rubric with a code: case-only value is reported unless opted in", () => {
  const codes = [{ value: "245" }, { value: "532" }];
  const issues: FlatRmDefaultIssue[] = [];
  const exact = buildRmValue("DV_CODED_TEXT", {
    code: "532",
    value: "Completed",
    terminology: "openehr",
  }, { codes, terminology: "openehr", issues });
  assertEquals(exact.value, "Completed");
  assertHint(issues, "Completed", "completed");

  const folded = buildRmValue("DV_CODED_TEXT", {
    code: "532",
    value: "Completed",
    terminology: "openehr",
  }, { codes, terminology: "openehr", codedValueMatch: "case-insensitive" });
  assertEquals(folded.value, "completed");
});
