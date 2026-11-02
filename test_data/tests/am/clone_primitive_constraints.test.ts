/**
 * Flattening clones constraint trees. Primitive constraints (C_TERMINOLOGY_CODE,
 * C_PRIMITIVE_OBJECT with an item) must keep their class and fields, or a
 * DV_CODED_TEXT loses its terminology and code list (#258).
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import * as openehr_am from "../../../am/openehr_am.ts";
import { cloneCObject } from "../../../am/util/aom_clone.ts";
import { ClinicalModelWorkspace } from "../../../parser/mod.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { OptXmlSerializer } from "../../../generation/opt_xml_serializer.ts";
import { RMInstanceGenerator } from "../../../generation/rm_instance_generator.ts";
import {
  buildWebTemplate,
  deserializeFromFlatWithIssues,
  serializeToFlat,
} from "../../../serialization/simplified/mod.ts";

type AnyObj = Record<string, unknown> & {
  attributes?: Array<{ rm_attribute_name?: string; children?: AnyObj[] }>;
};

function codePhraseConstraints(root: AnyObj): AnyObj[] {
  const found: AnyObj[] = [];
  const walk = (o: AnyObj) => {
    if (o.rm_type_name === "CODE_PHRASE") found.push(o);
    for (const a of o.attributes ?? []) {
      for (const c of a.children ?? []) walk(c);
    }
  };
  walk(root);
  return found;
}

Deno.test("cloneCObject keeps C_TERMINOLOGY_CODE class and fields", () => {
  const t = new openehr_am.C_TERMINOLOGY_CODE() as
    & openehr_am.C_TERMINOLOGY_CODE
    & {
      code_list?: string[];
      terminology_id?: string;
    };
  t.rm_type_name = "CODE_PHRASE";
  t.constraint = "at1";
  t.code_list = ["at1", "at2"];
  t.terminology_id = "local";
  const copy = cloneCObject(t) as typeof t;
  assert(copy instanceof openehr_am.C_TERMINOLOGY_CODE);
  assertEquals(copy.constraint, "at1");
  assertEquals(copy.code_list, ["at1", "at2"]);
  assertEquals(copy.terminology_id, "local");
  copy.code_list!.push("at3");
  assertEquals(t.code_list, ["at1", "at2"], "the copy is deep");
});

Deno.test("cloneCObject keeps a C_PRIMITIVE_OBJECT item", () => {
  const prim = new openehr_am.C_PRIMITIVE_OBJECT();
  prim.rm_type_name = "STRING";
  const str = new openehr_am.C_STRING() as openehr_am.C_STRING & {
    list?: string[];
  };
  str.list = ["a", "b"];
  prim.item = str;
  const copy = cloneCObject(prim) as openehr_am.C_PRIMITIVE_OBJECT;
  assert(copy.item instanceof openehr_am.C_STRING);
  assertEquals((copy.item as typeof str).list, ["a", "b"]);
});

Deno.test("a flattened .t.json keeps external coded-text constraints", async () => {
  const ws = new ClinicalModelWorkspace();
  const root = "Care unit v2.t.json";
  ws.addFiles([
    {
      path: root,
      content: await Deno.readTextFile(
        new URL("../../tjson/Care unit v2.t.json", import.meta.url),
      ),
    },
    {
      path: "openEHR-EHR-CLUSTER.organisation.v1.adl",
      content: await Deno.readTextFile(
        new URL(
          "../../adl2/ckm_roundtrip_127/openEHR-EHR-CLUSTER.organisation.v1.adl",
          import.meta.url,
        ),
      ),
    },
  ]);
  ws.setGenerationRootPath(root);
  ws.setActivePath(root);
  const opt = ws.resolveOperational().operationalTemplate as unknown as {
    definition: AnyObj;
  };
  const codes = codePhraseConstraints(opt.definition);
  assertEquals(codes.length, 2);
  for (const c of codes) {
    assert(
      c instanceof openehr_am.C_TERMINOLOGY_CODE,
      String(c.constructor.name),
    );
  }
  assertEquals(
    codes.map((c) => [c.terminology_id, c.code_list]),
    [
      ["http://snomed.info/sct/900000000000207008", ["43741000"]],
      ["http://snomed.info/sct/45991000052106", ["143591000052106"]],
    ],
  );

  // Generated data then has a CODE_PHRASE, and FLAT reads back what it writes.
  const operational = opt as unknown as Parameters<typeof buildWebTemplate>[0];
  const wt = buildWebTemplate(operational);
  const instance = new RMInstanceGenerator({ mode: "maximal" }).generate(
    operational as never,
  ) as Record<string, unknown>;
  const flat = serializeToFlat(instance, wt);
  assertEquals(
    Object.keys(flat).filter((k) => k.includes("_defining_code")),
    [],
  );
  assert(
    Object.keys(flat).some((k) =>
      k.endsWith("|code") && flat[k] === "43741000"
    ),
  );
  // A CLUSTER template is not a COMPOSITION; only key errors matter here.
  const read = deserializeFromFlatWithIssues(flat, wt);
  assertEquals(read.issues.filter((i) => i.kind === "unknown-key"), []);
});

Deno.test("OPT XML: an open CODE_PHRASE written as C_DV_TEXT reads as a terminology code", async () => {
  const source = await Deno.readTextFile(
    new URL("../../opt14/conformance_ehrbase.de.v0.opt", import.meta.url),
  );
  // ehrtslib <= 0.10 wrote a flattened (class-less) CODE_PHRASE constraint like this.
  const legacy = source.replace(
    /<children xsi:type="C_CODE_PHRASE">([\s\S]*?)<\/children>/,
    (_m, body: string) =>
      `<children xsi:type="C_DV_TEXT">${
        body.replace(/<terminology_id>[\s\S]*?<\/terminology_id>/, "")
          .replace(/<code_list>[\s\S]*?<\/code_list>/g, "")
      }</children>`,
  );
  assert(legacy !== source);
  const { operationalTemplate } = parseOptXml(legacy);
  const codes = codePhraseConstraints(
    operationalTemplate!.definition as unknown as AnyObj,
  );
  assert(codes.length > 0);
  for (const c of codes) {
    assert(
      c instanceof openehr_am.C_TERMINOLOGY_CODE,
      String(c.constructor.name),
    );
  }
  const xml = new OptXmlSerializer().serialize(operationalTemplate!);
  assertEquals(
    xml.includes('xsi:type="C_DV_TEXT"><rm_type_name>CODE_PHRASE'),
    false,
  );
});

Deno.test("OPT XML: a class-less CODE_PHRASE constraint is written as C_CODE_PHRASE", () => {
  const prim = new openehr_am.C_PRIMITIVE_OBJECT();
  prim.rm_type_name = "CODE_PHRASE";
  const coded = new openehr_am.C_COMPLEX_OBJECT();
  coded.rm_type_name = "DV_CODED_TEXT";
  const attr = new openehr_am.C_SINGLE_ATTRIBUTE();
  attr.rm_attribute_name = "defining_code";
  attr.children = [prim];
  coded.attributes = [attr];
  const { operationalTemplate } = parseOptXml(
    Deno.readTextFileSync(
      new URL("../../opt14/conformance_ehrbase.de.v0.opt", import.meta.url),
    ),
  );
  const def = operationalTemplate!.definition!;
  const holder = new openehr_am.C_MULTIPLE_ATTRIBUTE();
  holder.rm_attribute_name = "feeder_audit_probe";
  holder.children = [coded];
  def.attributes = [...(def.attributes ?? []), holder];
  const xml = new OptXmlSerializer().serialize(operationalTemplate!);
  const at = xml.indexOf("feeder_audit_probe");
  assert(at > 0);
  const tail = xml.slice(at);
  assert(
    /xsi:type="C_CODE_PHRASE"/.test(
      tail.slice(0, tail.indexOf("</attributes>") + 400),
    ),
  );
});
