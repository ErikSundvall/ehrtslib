import { assert } from "jsr:@std/assert";
import MarkdownIt from "npm:markdown-it@14.1.0";
import { MarkdownSerializer, STRUCTURAL_MARKDOWN_CONFIG } from "../../../serialization/markdown/mod.ts";

Deno.test("CommonMark render hides structural HTML comments and oe annotations", () => {
  const sample = {
    _type: "COMPOSITION",
    name: { _type: "DV_TEXT", value: "Note" },
    content: [{
      _type: "EVALUATION",
      name: { _type: "DV_TEXT", value: "Diagnosis" },
      data: {
        _type: "ITEM_TREE",
        items: [{
          _type: "ELEMENT",
          name: { _type: "DV_TEXT", value: "Problem" },
          value: {
            _type: "DV_CODED_TEXT",
            value: "Type 2 diabetes",
            defining_code: {
              _type: "CODE_PHRASE",
              terminology_id: { _type: "TERMINOLOGY_ID", value: "SNOMED-CT" },
              code_string: "44054006",
            },
          },
        }],
      },
    }],
  };

  const md = new MarkdownSerializer(STRUCTURAL_MARKDOWN_CONFIG).serialize(sample);
  const html = new MarkdownIt({ html: true }).render(md);
  assert(!html.includes("oe:v1:b64:"), "oe payload must not appear in rendered HTML");
  assert(!html.includes("at0001"), "archetype node id comments must not appear in HTML");
  assert(html.includes("Type 2 diabetes") || html.includes("Problem"));
});
