/**
 * Quick check after each operation, and the build summary (#173, ADR 0008).
 */

import { assert, assertEquals } from "@std/assert";
import {
  bindTemplate,
  type BoundTemplate,
  CDR_INCOMPLETE_PROFILES,
  ContributionBuild,
  type DraftValidationState,
  DraftValidator,
  ROOT_TARGET,
  trackValidation,
} from "../../../contribution_builder/mod.ts";

const OPT = new URL(
  "../../opt14/ehrbase_blood_pressure_simple.de.v0.opt",
  import.meta.url,
);

async function draft() {
  const template: BoundTemplate = await bindTemplate(
    await Deno.readTextFile(OPT),
  );
  const validator = await DraftValidator.create();
  const build = ContributionBuild.create({
    author: { id: "user-1", name: "User" },
  });
  const id = build.newComposition(template, {
    language: "en",
    territory: "SE",
  });
  build.setComposer(id, { _type: "PARTY_SELF" });
  build.trackValidation(trackValidation(validator, [template]));
  return { template, validator, build, id };
}

Deno.test("a bad value is marked invalid and the edit is kept (#173)", async () => {
  const { build, id } = await draft();
  const before = build.validationState<DraftValidationState>(id)!;
  assertEquals(before.canCommitComplete, true);
  assertEquals(before.canCommitIncomplete, true);
  assertEquals(before.authoritative, false);
  assertEquals(before.rev, build.logRev());
  assert(before.cdr.some((c) => c.id === "ehrbase"));
  assert(before.cdr.every((c) => c.canCommitIncomplete));

  const element = build.findNodeKey(id, "at0014") ??
    build.listNodeKeys(id).find((k) => {
      const node = find(build.toCanonicalJson(id), k);
      return node?._type === "ELEMENT";
    });
  assert(element, "an ELEMENT to spoil");
  build.setValue(id, element, "value", { _type: "DV_TEXT", value: "sitting" });
  const after = build.validationState<DraftValidationState>(id)!;
  const mark = after.nodes.find((n) =>
    n.node === element || n.uid?.endsWith(`::${element}`)
  );
  assertEquals(mark?.status, "invalid");
  assert(
    mark?.problems.some((p) =>
      p.constraintType === "type" || p.kind === "invalid"
    ),
  );
  assertEquals(after.canCommitComplete, false);
  assertEquals(after.canCommitIncomplete, false);
  assertEquals(after.cdr.every((c) => c.canCommitIncomplete === false), true);
  // The edit stayed in the draft.
  assert(
    JSON.stringify(build.toCanonicalJson(id)).includes("sitting"),
  );
});

Deno.test("missing template content can commit as incomplete, not to EHRbase (#173)", async () => {
  const { build, id } = await draft();
  const protocol = build.findNodeKey(id, "at0011");
  assert(protocol, "protocol node");
  build.removeInstance(id, protocol);
  const state = build.validationState<DraftValidationState>(id)!;
  assertEquals(state.canCommitComplete, false);
  assertEquals(state.canCommitIncomplete, true);
  assert(state.nodes.some((n) => n.status === "unfinished"));
  assert(!state.nodes.some((n) => n.status === "invalid"));
  const ehrbase = state.cdr.find((c) => c.id === "ehrbase")!;
  const ferro = state.cdr.find((c) => c.id === "ferroehr")!;
  assertEquals(ehrbase.canCommitIncomplete, false);
  assertEquals(ferro.canCommitIncomplete, true);
  assertEquals(ehrbase.rejectsIncompleteWithMissingMandatory, true);
  assertEquals(
    CDR_INCOMPLETE_PROFILES.map((p) => p.id),
    ["ehrbase", "ferroehr"],
  );
  assertEquals(state.rev, build.logRev());
  // Root is not the protocol; the status is derived, not an operation.
  assert(
    !build.exportLog().operations.some((op) =>
      JSON.stringify(op).includes("unfinished")
    ),
  );
  assert(protocol !== ROOT_TARGET);
});

function find(tree: unknown, key: string): Record<string, unknown> | undefined {
  let found: Record<string, unknown> | undefined;
  const walk = (v: unknown) => {
    if (found || !v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(walk);
    const rec = v as Record<string, unknown>;
    const uid = (rec.uid as { value?: string } | undefined)?.value;
    if (uid?.endsWith(`::${key}`)) {
      found = rec;
      return;
    }
    Object.values(rec).forEach(walk);
  };
  walk(tree);
  return found;
}
