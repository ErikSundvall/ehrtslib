/**
 * OPT-generated instances must pass TemplateValidator after Markdown/AsciiDoc round trips.
 */
import { assert } from "jsr:@std/assert";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "../../../generation/rm_instance_generator.ts";
import {
  MarkdownDeserializer,
  MarkdownSerializer,
  STRUCTURAL_MARKDOWN_CONFIG,
} from "../../../serialization/markdown/mod.ts";
import {
  AsciidocDeserializer,
  AsciidocSerializer,
  LOSSLESS_ASCIIDOC_CONFIG,
} from "../../../serialization/asciidoc/mod.ts";
import { validateDeserializedInstance } from "../../../serialization/common/post_deserialize_validation.ts";
const OPT_FIXTURES = [
  "ehrbase_blood_pressure_simple.de.v0.opt",
  "minimal_evaluation.opt",
] as const;

function roundTripAndValidate(
  operationalTemplate: unknown,
  generated: Record<string, unknown>,
): { markdownValid: boolean; asciidocValid: boolean } {
  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(generated);
  const parsedMd = new MarkdownDeserializer().deserialize(md) as Record<string, unknown>;
  const vm = validateDeserializedInstance(parsedMd, {
    validateAgainstTemplate: operationalTemplate,
  });

  const ad = new AsciidocSerializer(LOSSLESS_ASCIIDOC_CONFIG).serialize(generated);
  const parsedAd = new AsciidocDeserializer().deserialize(ad) as Record<string, unknown>;
  const va = validateDeserializedInstance(parsedAd, {
    validateAgainstTemplate: operationalTemplate,
  });

  assert(vm?.valid, `Markdown round-trip failed template validation: ${vm?.summary}`);
  assert(va?.valid, `AsciiDoc round-trip failed template validation: ${va?.summary}`);

  return { markdownValid: !!vm?.valid, asciidocValid: !!va?.valid };
}

for (const name of OPT_FIXTURES) {
  Deno.test(`OPT ${name} example instance: Markdown + AsciiDoc template-valid round-trip`, () => {
    const path = new URL(`../../opt14/${name}`, import.meta.url);
    const { operationalTemplate } = parseOptXml(Deno.readTextFileSync(path));
    const generated = new RMInstanceGenerator({ mode: "example" }).generate(
      operationalTemplate,
    ) as Record<string, unknown>;
    const pre = validateDeserializedInstance(generated, {
      validateAgainstTemplate: operationalTemplate,
    });
    assert(pre?.valid, "fixture generator output should be template-valid");

    roundTripAndValidate(operationalTemplate, generated);
  });
}
