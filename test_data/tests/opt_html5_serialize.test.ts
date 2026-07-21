/**
 * Smoke tests for OPT HTML5 serialize (AOM2 OPERATIONAL_TEMPLATE → a-* markup).
 */
import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseOptXml } from "../../enhanced/parser/legacy/opt_xml_parser.ts";
import {
  optTagForType,
  serializeOperationalTemplateToHtml5,
  serializeToOptHtml5Variant,
} from "../../enhanced/serialization/zipehr/opt_html5_serialize.ts";
import { resolveOptTag } from "../../enhanced/serialization/zipehr/opt_html5_deserialize.ts";

const OPT_PATH =
  new URL("../../test_data/opt14/ehrbase_blood_pressure_simple.de.v0.opt", import.meta.url);

Deno.test("optTagForType compounds AM+RM emoji", () => {
  assertEquals(
    optTagForType("C_COMPLEX_OBJECT", "emoji", "OBSERVATION"),
    "a-🔐⬡👀",
  );
  assertEquals(optTagForType("C_COMPLEX_OBJECT", "short"), "a-cc");
  assertEquals(
    optTagForType("C_COMPLEX_OBJECT", "full"),
    "a-c-complex-object",
  );
});

Deno.test("optTagForType uses 🔐 + foundation for C_* primitives", () => {
  assertEquals(optTagForType("C_BOOLEAN", "emoji"), "a-🔐✓");
  assertEquals(optTagForType("C_INTEGER", "emoji"), "a-🔐𝕫");
  assertEquals(optTagForType("C_REAL", "emoji"), "a-🔐𝕣");
  assertEquals(optTagForType("C_STRING", "emoji"), "a-🔐📝");
});

Deno.test("resolveOptTag peels compound emoji", () => {
  const r = resolveOptTag("a-🔐⬡👀");
  assertEquals(r.amType, "C_COMPLEX_OBJECT");
  assertEquals(r.rmType, "OBSERVATION");
  assertEquals(r.dialect, "emoji");
});

Deno.test("resolveOptTag peels 🔐 foundation compounds", () => {
  assertEquals(resolveOptTag("a-🔐✓").amType, "C_BOOLEAN");
  assertEquals(resolveOptTag("a-🔐𝕫").amType, "C_INTEGER");
  assertEquals(resolveOptTag("a-🔐📝").amType, "C_STRING");
});

Deno.test("serialize OPT XML to opt.html5 dialects", async () => {
  const xml = await Deno.readTextFile(OPT_PATH);
  const { operationalTemplate } = parseOptXml(xml);

  const short = serializeToOptHtml5Variant(
    operationalTemplate,
    "opt.html5.short",
    { layout: "linesaving" },
  );
  assertStringIncludes(short, 'fmt="os1"');
  assertStringIncludes(short, "<a-ot");
  assertStringIncludes(short, "<a-cc");

  const full = serializeOperationalTemplateToHtml5(operationalTemplate, {
    dialect: "full",
    layout: "fluffy",
  });
  assertStringIncludes(full, 'fmt="of1"');
  assertStringIncludes(full, "<a-operational-template");
  assertStringIncludes(full, "<a-c-complex-object");

  const emoji = serializeOperationalTemplateToHtml5(operationalTemplate, {
    dialect: "emoji",
    layout: "linesaving",
  });
  assertStringIncludes(emoji, 'fmt="oe1"');
  assertStringIncludes(emoji, "<a-🗂");
  // Should include at least one compound AM+RM tag for a known RM type
  assertEquals(/a-🔐⬡/.test(emoji) || /a-🔐◆/.test(emoji) || /a-🔐√/.test(emoji), true);
});
