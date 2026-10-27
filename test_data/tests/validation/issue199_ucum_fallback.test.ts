/**
 * #199 UCUM fallback accepts common clinical rate units without initialize().
 */

import { assert, assertEquals } from "@std/assert";
import { UcumService } from "../../../term/ucum_service.ts";
import { TemplateValidator } from "../../../validation/template_validator.ts";
import * as openehr_am from "../../../am/openehr_am.ts";
import { CadlParser } from "../../../parser/cadl_parser.ts";
import { ADL2Tokenizer } from "../../../parser/adl2_tokenizer.ts";

const RATE_UNITS = ["/min", "1/min", "{beats}/min", "/h", "/s"];

Deno.test("#199 UcumService fallback accepts rate and annotation units", () => {
  const ucum = new UcumService();
  assertEquals(ucum.isInitialized(), false);
  for (const unit of RATE_UNITS) {
    const r = ucum.validate(unit);
    assertEquals(r.status, "valid", unit);
  }
});

Deno.test("#199 TemplateValidator without initialize: /min is not invalid UCUM", () => {
  const qty = new CadlParser(
    new ADL2Tokenizer(`DV_QUANTITY matches {
      magnitude matches {|0..300|}
      units matches {"/min"}
    }`).tokenize(),
  ).parseComplexObject() as openehr_am.C_QUANTITY;
  const archetype = new openehr_am.ARCHETYPE();
  archetype.definition = new openehr_am.C_COMPLEX_OBJECT();
  archetype.definition.rm_type_name = "ELEMENT";
  const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
  attr.rm_attribute_name = "value";
  attr.children = [qty];
  archetype.definition.attributes = [attr];

  const validator = new TemplateValidator({
    validateUnits: true,
    validateRMSpecification: false,
    validateTerminology: false,
    validateIntervals: false,
    validateInvariants: false,
  });
  const result = validator.validate(
    { value: { magnitude: 72, units: "/min" } },
    archetype,
  );
  const ucum = [...result.errors, ...result.warnings].filter(
    (m) => m.constraintType === "ucum",
  );
  assertEquals(ucum.length, 0, ucum.map((m) => m.message).join("; "));
});

Deno.test("#199 TemplateValidator after initialize: /min still valid", async () => {
  const ucum = new UcumService();
  await ucum.initialize();
  assertEquals(ucum.validate("/min").status, "valid");
});
