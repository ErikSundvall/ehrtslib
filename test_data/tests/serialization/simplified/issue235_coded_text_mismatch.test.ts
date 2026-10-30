/**
 * FLAT coded text: `codedTextMismatch` ("reject" | "keep" | "correct") for
 * `|value`, bare keys, and `|code` without an exact template match, and for
 * code/value conflicts and other-language rubrics (#235, replacing #231's
 * `codedValueMatch`). A valid `|code` with an unlisted `|value` is display text.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { parseOptXml } from "../../../../parser/legacy/opt_xml_parser.ts";
import { buildWebTemplate } from "../../../../serialization/simplified/web_template_builder.ts";
import {
  CodedTextMismatchError,
  deserializeFromFlat,
  deserializeFromFlatWithIssues,
} from "../../../../serialization/simplified/flat_deserializer.ts";
import { buildDvValue } from "../../../../serialization/simplified/dv_field_maps.ts";
import { buildRmValue } from "../../../../serialization/simplified/value_build.ts";
import type {
  CodedTextMismatch,
  FlatRmDefaultIssue,
} from "../../../../serialization/simplified/flat_rm_defaults.ts";
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

function sent(value?: string, code?: string): CodedSnapshot {
  return {
    type: "DV_CODED_TEXT",
    value,
    code,
    terminology: code ? "local" : undefined,
  };
}

type Outcome = "error" | "kept" | "corrected";

interface MismatchCase {
  name: string;
  /** Suffix ("" = bare key) → value. */
  fields: Record<string, string>;
  caseOnly: boolean;
  kept: CodedSnapshot;
}

const CASES: MismatchCase[] = [
  {
    name: "|value case-only",
    fields: { value: "sitting" },
    caseOnly: true,
    kept: sent("sitting"),
  },
  {
    name: "|value no match",
    fields: { value: "Kneeling" },
    caseOnly: false,
    kept: sent("Kneeling"),
  },
  {
    name: "bare rubric case-only",
    fields: { "": "sitting" },
    caseOnly: true,
    kept: sent("sitting"),
  },
  {
    name: "bare code case-only",
    fields: { "": "AT1001" },
    caseOnly: true,
    kept: sent(undefined, "AT1001"),
  },
  {
    name: "bare no match",
    fields: { "": "Kneeling" },
    caseOnly: false,
    kept: sent("Kneeling"),
  },
  {
    name: "|code case-only",
    fields: { code: "AT1001" },
    caseOnly: true,
    kept: sent(undefined, "AT1001"),
  },
  {
    name: "|code no match",
    fields: { code: "at9999" },
    caseOnly: false,
    kept: sent(undefined, "at9999"),
  },
  {
    name: "|code case-only + |value",
    fields: { code: "AT1001", value: "Sitting" },
    caseOnly: true,
    kept: sent("Sitting", "AT1001"),
  },
  {
    name: "|code no match + |value",
    fields: { code: "at9999", value: "Sitting" },
    caseOnly: false,
    kept: sent("Sitting", "at9999"),
  },
  {
    name: "|code + |value case-only",
    fields: { code: "at1001", value: "sitting" },
    caseOnly: true,
    kept: sent("sitting", "at1001"),
  },
];

function outcome(mode: CodedTextMismatch, caseOnly: boolean): Outcome {
  if (mode === "keep") return "kept";
  if (mode === "correct" && caseOnly) return "corrected";
  return "error";
}

function flatFor(key: string, fields: Record<string, string>) {
  const flat: Record<string, string> = { ...baseFlat };
  for (const [suffix, value] of Object.entries(fields)) {
    flat[suffix ? `${key}|${suffix}` : key] = value;
  }
  return flat;
}

function mismatchIssues(issues: FlatRmDefaultIssue[]): FlatRmDefaultIssue[] {
  return issues.filter((issue) => issue.kind === "coded-text-mismatch");
}

function assertOutcome(
  label: string,
  expected: Outcome,
  snap: CodedSnapshot,
  kept: CodedSnapshot,
  issues: FlatRmDefaultIssue[],
): void {
  const found = mismatchIssues(issues);
  assertEquals(found.length, 1, `${label}: ${JSON.stringify(issues)}`);
  const [issue] = found;
  assert(issue.message.includes("codedTextMismatch"), label);
  if (expected === "error") {
    assertEquals(issue.severity, "error", label);
    return;
  }
  assertEquals(issue.severity, "warning", label);
  assertEquals(snap, expected === "kept" ? kept : SITTING, label);
}

for (const mode of ["reject", "keep", "correct"] as const) {
  Deno.test(`#235 FLAT ${mode}: case-only and no-match input`, async () => {
    const { wt, key } = await loadPosition();
    for (const c of CASES) {
      const label = `${mode} ${c.name}`;
      const expected = outcome(mode, c.caseOnly);
      const flat = flatFor(key, c.fields);
      const { composition, issues } = deserializeFromFlatWithIssues(flat, wt, {
        codedTextMismatch: mode,
      });
      assertOutcome(
        label,
        expected,
        snapshot(positionValue(composition)),
        c.kept,
        issues,
      );
      if (expected === "error") {
        assertThrows(
          () => deserializeFromFlat(flat, wt, { codedTextMismatch: mode }),
          CodedTextMismatchError,
          undefined,
          label,
        );
      } else {
        deserializeFromFlat(flat, wt, { codedTextMismatch: mode });
      }
    }
  });

  Deno.test(`#235 buildRmValue / buildDvValue ${mode}: case-only and no-match input`, async () => {
    const { node } = await loadPosition();
    for (const c of CASES) {
      const label = `${mode} ${c.name}`;
      const expected = outcome(mode, c.caseOnly);
      const issues: FlatRmDefaultIssue[] = [];
      const built = buildDvValue("DV_CODED_TEXT", c.fields, {
        node,
        issues,
        codedTextMismatch: mode,
      });
      assertOutcome(label, expected, snapshot(built), c.kept, issues);
      if (expected === "error") {
        assertThrows(
          () =>
            buildRmValue("DV_CODED_TEXT", c.fields, {
              node,
              codedTextMismatch: mode,
            }),
          CodedTextMismatchError,
          undefined,
          label,
        );
      } else {
        assertEquals(
          snapshot(
            buildRmValue("DV_CODED_TEXT", c.fields, {
              node,
              codedTextMismatch: mode,
            }),
          ),
          snapshot(built),
          label,
        );
      }
    }
  });
}

Deno.test("#235 reject is the default", async () => {
  const { wt, key, node } = await loadPosition();
  const flat = flatFor(key, { value: "sitting" });
  const { issues } = deserializeFromFlatWithIssues(flat, wt);
  const [issue] = mismatchIssues(issues);
  assertEquals(issue.severity, "error");
  assert(
    issue.message.includes(
      'matches template rubric "Sitting" only when case is ignored',
    ),
  );
  assert(issue.message.includes('codedTextMismatch: "correct"'));
  assert(issue.message.includes('"keep"'));
  assertThrows(() => deserializeFromFlat(flat, wt), CodedTextMismatchError);
  assertThrows(
    () => buildRmValue("DV_CODED_TEXT", { code: "AT1001" }, { node }),
    CodedTextMismatchError,
  );
});

Deno.test("#235 code/value conflict in each mode", async () => {
  const { wt, key, node } = await loadPosition();
  const fields = { code: "at1001", value: "Standing" };
  const flat = flatFor(key, fields);

  const rejected = deserializeFromFlatWithIssues(flat, wt);
  const [error] = mismatchIssues(rejected.issues);
  assertEquals(error.severity, "error");
  assert(error.message.includes("at1000"), error.message);
  assertThrows(() => deserializeFromFlat(flat, wt), CodedTextMismatchError);
  assertThrows(
    () => buildRmValue("DV_CODED_TEXT", fields, { node }),
    CodedTextMismatchError,
  );

  const kept = deserializeFromFlatWithIssues(flat, wt, {
    codedTextMismatch: "keep",
  });
  assertEquals(
    snapshot(positionValue(kept.composition)),
    sent("Standing", "at1001"),
  );
  assertEquals(mismatchIssues(kept.issues).map((i) => i.severity), ["warning"]);

  const corrected = deserializeFromFlatWithIssues(flat, wt, {
    codedTextMismatch: "correct",
  });
  assertEquals(snapshot(positionValue(corrected.composition)), SITTING);
  assertEquals(mismatchIssues(corrected.issues).map((i) => i.severity), [
    "warning",
  ]);
  assertEquals(
    snapshot(
      buildRmValue("DV_CODED_TEXT", fields, {
        node,
        codedTextMismatch: "correct",
      }),
    ),
    SITTING,
  );
});

Deno.test("#235 exact input and code-only completion are the same in every mode", async () => {
  const { wt, key, node } = await loadPosition();
  for (const mode of ["reject", "keep", "correct"] as const) {
    for (
      const fields of <Record<string, string>[]> [
        { value: "Sitting" },
        { "": "Sitting" },
        { "": "at1001" },
        { code: "at1001" },
        { code: "at1001", value: "Sitting" },
      ]
    ) {
      const { composition, issues } = deserializeFromFlatWithIssues(
        flatFor(key, fields),
        wt,
        { codedTextMismatch: mode },
      );
      assertEquals(
        snapshot(positionValue(composition)),
        SITTING,
        `${mode} ${JSON.stringify(fields)}`,
      );
      assertEquals(issues, []);
      assertEquals(
        snapshot(
          buildDvValue("DV_CODED_TEXT", fields, {
            node,
            codedTextMismatch: mode,
          }),
        ),
        SITTING,
      );
    }
  }
});

Deno.test("#235 openEHR rubric: case-only value and conflict follow the mode", () => {
  const codes = [{ value: "245" }, { value: "532" }];
  const ctx = { codes, terminology: "openehr" };
  const caseOnly = { code: "532", value: "Completed", terminology: "openehr" };
  assertThrows(
    () => buildRmValue("DV_CODED_TEXT", caseOnly, ctx),
    CodedTextMismatchError,
  );
  assertEquals(
    buildRmValue("DV_CODED_TEXT", caseOnly, {
      ...ctx,
      codedTextMismatch: "keep",
    }).value,
    "Completed",
  );
  assertEquals(
    buildRmValue("DV_CODED_TEXT", caseOnly, {
      ...ctx,
      codedTextMismatch: "correct",
    }).value,
    "completed",
  );

  const conflict = { code: "532", value: "active", terminology: "openehr" };
  assertThrows(
    () => buildRmValue("DV_CODED_TEXT", conflict, ctx),
    CodedTextMismatchError,
  );
  assertEquals(
    buildRmValue("DV_CODED_TEXT", conflict, {
      ...ctx,
      codedTextMismatch: "keep",
    }).value,
    "active",
  );
  assertEquals(
    buildRmValue("DV_CODED_TEXT", conflict, {
      ...ctx,
      codedTextMismatch: "correct",
    }).value,
    "completed",
  );
});

const MODES = ["reject", "keep", "correct"] as const;

const DISPLAY = "Seated, legs crossed";

function preferredTerm(value: Record<string, unknown> | undefined): unknown {
  return (value?.defining_code as { preferred_term?: string } | undefined)
    ?.preferred_term;
}

Deno.test("#235 display text: codedTextDisplayValue modes, with and without |preferred_term", async () => {
  const { wt, key, node } = await loadPosition();
  const expectations = {
    // [value, preferred_term without |preferred_term, with |preferred_term "Seated"]
    "keep": [DISPLAY, undefined, "Seated"],
    "keep-and-set-preferred-term": [DISPLAY, "Sitting", "Seated"],
    "replace-with-rubric": ["Sitting", undefined, "Seated"],
  } as const;
  for (const [display, [value, noPt, withPt]] of Object.entries(expectations)) {
    for (const mismatch of MODES) {
      const options = {
        codedTextMismatch: mismatch,
        codedTextDisplayValue: display as keyof typeof expectations,
      };
      const label = `${display} / ${mismatch}`;
      for (const sentPt of [undefined, "Seated"]) {
        const fields: Record<string, string> = {
          code: "at1001",
          value: DISPLAY,
        };
        if (sentPt) fields.preferred_term = sentPt;
        const { composition, issues } = deserializeFromFlatWithIssues(
          flatFor(key, fields),
          wt,
          options,
        );
        const position = positionValue(composition);
        assertEquals(position?.value, value, label);
        assertEquals(preferredTerm(position), sentPt ? withPt : noPt, label);
        assertEquals(mismatchIssues(issues), [], label);
        if (display === "replace-with-rubric") {
          assertEquals(issues.length, 1, label);
          assertEquals(issues[0].severity, "warning");
          assert(issues[0].message.includes(`"${DISPLAY}"`), issues[0].message);
          assert(
            issues[0].message.includes("compatibility"),
            issues[0].message,
          );
        } else {
          assertEquals(issues, [], label);
        }
        const built = buildRmValue("DV_CODED_TEXT", fields, {
          node,
          ...options,
        });
        assertEquals(built.value, value, label);
        assertEquals(preferredTerm(built), sentPt ? withPt : noPt, label);
      }
    }
  }
  // Default is "keep": no preferred_term from the template.
  const plain = deserializeFromFlat(
    flatFor(key, { code: "at1001", value: DISPLAY }),
    wt,
  );
  assertEquals(positionValue(plain)?.value, DISPLAY);
  assertEquals(preferredTerm(positionValue(plain)), undefined);
});

Deno.test("#235 keep-and-set-preferred-term also applies to values kept by codedTextMismatch keep", async () => {
  const { wt, key } = await loadPosition();
  for (
    const fields of [
      { code: "at1001", value: "sitting" }, // case-only
      { code: "at1001", value: "Standing" }, // conflict
    ]
  ) {
    const { composition } = deserializeFromFlatWithIssues(
      flatFor(key, fields),
      wt,
      {
        codedTextMismatch: "keep",
        codedTextDisplayValue: "keep-and-set-preferred-term",
      },
    );
    assertEquals(positionValue(composition)?.value, fields.value);
    assertEquals(preferredTerm(positionValue(composition)), "Sitting");
    const plain = deserializeFromFlatWithIssues(flatFor(key, fields), wt, {
      codedTextMismatch: "keep",
    });
    assertEquals(preferredTerm(positionValue(plain.composition)), undefined);
  }
});

const BILINGUAL = {
  codes: [
    {
      value: "at1000",
      label: "Standing",
      localizedLabels: { en: "Standing", de: "Stehend" },
    },
    {
      value: "at1001",
      label: "Sitting",
      localizedLabels: { en: "Sitting", de: "Sitzend" },
    },
  ],
  terminology: "local",
  language: "en",
};

Deno.test("#235 |code with its rubric in another template language follows the mode", () => {
  const fields = { code: "at1001", value: "Sitzend" };
  const issues: FlatRmDefaultIssue[] = [];
  buildRmValue("DV_CODED_TEXT", fields, { ...BILINGUAL, issues });
  const [error] = mismatchIssues(issues);
  assertEquals(error.severity, "error");
  assert(error.message.includes("another template language"), error.message);
  assertThrows(
    () => buildRmValue("DV_CODED_TEXT", fields, BILINGUAL),
    CodedTextMismatchError,
  );

  const keepIssues: FlatRmDefaultIssue[] = [];
  const kept = buildRmValue("DV_CODED_TEXT", fields, {
    ...BILINGUAL,
    issues: keepIssues,
    codedTextMismatch: "keep",
  });
  assertEquals(kept.value, "Sitzend");
  assertEquals(mismatchIssues(keepIssues).map((i) => i.severity), ["warning"]);

  const correctIssues: FlatRmDefaultIssue[] = [];
  const corrected = buildRmValue("DV_CODED_TEXT", fields, {
    ...BILINGUAL,
    issues: correctIssues,
    codedTextMismatch: "correct",
  });
  assertEquals(corrected.value, "Sitting");
  assertEquals(mismatchIssues(correctIssues).map((i) => i.severity), [
    "warning",
  ]);

  // Value-only input in another template language still completes the code.
  for (const mode of MODES) {
    const valueOnly: FlatRmDefaultIssue[] = [];
    const built = buildRmValue("DV_CODED_TEXT", { value: "Sitzend" }, {
      ...BILINGUAL,
      issues: valueOnly,
      codedTextMismatch: mode,
    });
    assertEquals(snapshot(built), SITTING, mode);
    assertEquals(valueOnly, [], mode);
  }
});

Deno.test("#235 openEHR instruction state: unlisted value with a code follows the mode", () => {
  const ctx = {
    codes: [{ value: "245" }, { value: "532" }],
    terminology: "openehr",
  };
  const fields = { code: "532", value: "done", terminology: "openehr" };
  assertThrows(
    () => buildRmValue("DV_CODED_TEXT", fields, ctx),
    CodedTextMismatchError,
  );
  assertEquals(
    buildRmValue("DV_CODED_TEXT", fields, { ...ctx, codedTextMismatch: "keep" })
      .value,
    "done",
  );
  assertThrows(
    () =>
      buildRmValue("DV_CODED_TEXT", fields, {
        ...ctx,
        codedTextMismatch: "correct",
      }),
    CodedTextMismatchError,
  );
});
