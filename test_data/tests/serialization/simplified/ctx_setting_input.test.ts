/**
 * ITS-REST simplified formats: bare ctx/setting may be rubric or code.
 * Input-flavour serializer prefers code (Ferro ferro-flat-0N.json pattern).
 */
import { assertEquals } from "@std/assert";
import { deserializeFromFlat, serializeToFlat } from "../../../../serialization/simplified/mod.ts";
import { inputContextFields } from "../../../../serialization/simplified/flavor.ts";
import type { WebTemplate } from "../../../../serialization/simplified/types.ts";

const wt: WebTemplate = {
  templateId: "test",
  defaultLanguage: "en",
  tree: { id: "encounter", name: "Encounter", rmType: "COMPOSITION", aqlPath: "/" },
};

Deno.test("input ctx/setting uses openEHR code when available", () => {
  const instance = {
    _type: "COMPOSITION",
    context: {
      _type: "EVENT_CONTEXT",
      setting: {
        _type: "DV_CODED_TEXT",
        value: "primary medical care",
        defining_code: {
          _type: "CODE_PHRASE",
          terminology_id: { _type: "TERMINOLOGY_ID", value: "openehr" },
          code_string: "228",
        },
      },
    },
  };
  const ctx = inputContextFields(instance);
  assertEquals(ctx["ctx/setting"], "228");
  assertEquals(ctx["ctx/setting|code"], undefined);
  assertEquals(ctx["ctx/setting|value"], undefined);

  const flat = serializeToFlat(instance, wt, { flavor: "input" });
  assertEquals(flat["ctx/setting"], "228");
  const back = deserializeFromFlat(flat, wt, {
    contextDefaults: "apply",
    clock: () => "2021-01-01T00:00:00Z",
  }) as { context?: { setting?: { defining_code?: { code_string?: string } } } };
  assertEquals(back.context?.setting?.defining_code?.code_string, "228");
});