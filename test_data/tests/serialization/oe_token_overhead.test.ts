import { assert } from "jsr:@std/assert";
import { countTokens } from "gpt-tokenizer/encoding/o200k_base";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { RMInstanceGenerator } from "../../../generation/rm_instance_generator.ts";
import {
  EMBEDDING_MARKDOWN_CONFIG,
  MarkdownSerializer,
  STRUCTURAL_MARKDOWN_CONFIG,
} from "../../../serialization/markdown/mod.ts";

const LITERAL_OPTS = { disallowedSpecial: new Set<string>() };

Deno.test("sparse structural markdown token overhead vs embedding on same OPT instance", () => {
  const path = new URL("../../opt14/ehrbase_blood_pressure_simple.de.v0.opt", import.meta.url);
  const { operationalTemplate } = parseOptXml(Deno.readTextFileSync(path));
  const generated = new RMInstanceGenerator({ mode: "example" }).generate(operationalTemplate);

  const structural = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(generated);
  const embedding = new MarkdownSerializer(EMBEDDING_MARKDOWN_CONFIG).serialize(generated);

  const nStruct = countTokens(structural, LITERAL_OPTS);
  const nEmb = countTokens(embedding, LITERAL_OPTS);
  const oeCount = (structural.match(/oe:v1:b64:/g) ?? []).length;

  assert(nStruct > nEmb, "embedding must be smaller");
  assert(
    oeCount < 8,
    `sparse annotations: expected few oe payloads, got ${oeCount}`,
  );

  console.log(
    `token overhead: structural=${nStruct} embedding=${nEmb} delta=${nStruct - nEmb} oe_annotations=${oeCount}`,
  );
});
