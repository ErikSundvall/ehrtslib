/**
 * OPT 1.4 XML → ADL2 operational template with id-codes (#163, ADR 0007).
 */

import { assert, assertEquals, assertNotEquals } from "@std/assert";
import * as openehr_am from "../../../am/openehr_am.ts";
import { parseOptXml } from "../../../parser/mod.ts";
import {
  ARCHETYPE_VALUE_SETS_KEY,
  readOpt14Header,
  upconvertOpt14ToAdl2,
} from "../../../parser/legacy/opt14_upconvert.ts";
import {
  Opt14CodeMinter,
  opt14NodeIdToAdl2,
  opt14PathToAdl2,
  opt14ValueCodeToAdl2,
  opt14ValueSetCodeToAdl2,
} from "../../../parser/legacy/opt14_code_mapping.ts";
import { canonicalTemplateJson } from "../../../contribution_builder/mod.ts";
import { TERM_ARCHETYPE_SCOPE_KEY } from "../../../generation/term_scope.ts";

const OPT14 = new URL("../../opt14/", import.meta.url);
const read = (name: string) => Deno.readTextFile(new URL(name, OPT14));
const ALL_OPT14 = [...Deno.readDirSync(OPT14)]
  .filter((e) => e.name.endsWith(".opt"))
  .map((e) => e.name)
  .sort();

function upconvert(xml: string) {
  return upconvertOpt14ToAdl2(
    parseOptXml(xml).operationalTemplate,
    readOpt14Header(xml),
  );
}

type Visit = (node: openehr_am.C_OBJECT, scope: string) => void;
function walk(node: unknown, visit: Visit, scope = "") {
  if (!node || typeof node !== "object") return;
  const s =
    ((node as Record<string, unknown>)[TERM_ARCHETYPE_SCOPE_KEY] as string) ??
      scope;
  visit(node as openehr_am.C_OBJECT, s);
  for (const attr of ((node as { attributes?: unknown[] }).attributes ?? [])) {
    for (const c of ((attr as { children?: unknown[] }).children ?? [])) {
      walk(c, visit, s);
    }
  }
}

Deno.test("OPT 1.4 code mapping — node ids, value codes, value-set codes, paths", () => {
  assertEquals(opt14NodeIdToAdl2("at0000"), "id1");
  assertEquals(opt14NodeIdToAdl2("at0004"), "id5");
  assertEquals(opt14NodeIdToAdl2("at0004.1"), "id5.1");
  assertEquals(opt14NodeIdToAdl2("at0.1"), "id0.1");
  assertEquals(opt14ValueCodeToAdl2("at0009"), "at10");
  assertEquals(opt14ValueCodeToAdl2("at1000"), "at1001");
  assertEquals(opt14ValueCodeToAdl2("at0.3"), "at0.3");
  assertEquals(opt14ValueSetCodeToAdl2("ac0001"), "ac2");
  assertEquals(opt14ValueSetCodeToAdl2("ac0000"), "ac1");
  assertEquals(
    opt14PathToAdl2(
      "/content[openEHR-EHR-OBSERVATION.x.v1]/data[at0001]/events[at0002 and name/value='x']",
    ),
    "/content[openEHR-EHR-OBSERVATION.x.v1]/data[id2]/events[id3 and name/value='x']",
  );
  const m = new Opt14CodeMinter();
  m.seen("id5");
  m.seen("at12");
  m.seen("ac2");
  m.seen("id7.1");
  assertEquals([m.nextId(), m.nextId(), m.nextAc()], ["id13", "id14", "ac3"]);
});

Deno.test("OPT 1.4 up-conversion — id-coded nodes and terms, input untouched", async () => {
  const xml = await read("minimal_evaluation.opt");
  const parsed = parseOptXml(xml).operationalTemplate;
  const { operationalTemplate: opt } = upconvertOpt14ToAdl2(
    parsed,
    readOpt14Header(xml),
  );
  assertEquals(parsed.definition?.node_id, "at0000");
  assertEquals(opt.definition?.node_id, "id1");
  assertEquals(opt.template_id, "minimal_evaluation.en.v1");
  assert(opt.definition instanceof openehr_am.C_ARCHETYPE_ROOT);
  const keys = Object.keys(
    (opt.ontology as unknown as { term_definitions: Record<string, object> })
      .term_definitions.en,
  );
  assertEquals(keys.sort(), ["id1", "id2", "id3"]);
});

Deno.test("OPT 1.4 up-conversion — every fixture: no at-coded nodes, every object node has an id", async () => {
  for (const name of ALL_OPT14) {
    const { operationalTemplate: opt, mintedIdCodes } = upconvert(
      await read(name),
    );
    let objects = 0;
    walk(opt.definition, (node) => {
      if (node instanceof openehr_am.C_PRIMITIVE_OBJECT) return;
      objects++;
      assert(
        /^id\d+(\.\d+)*$/.test(node.node_id ?? ""),
        `${name}: node id ${node.node_id} on ${node.rm_type_name}`,
      );
    });
    assert(objects > 0, name);
    assert(mintedIdCodes >= 0);
  }
});

Deno.test("OPT 1.4 up-conversion — minted id-codes are unique per archetype scope and never reuse a source code", async () => {
  let minted = 0;
  for (const name of ALL_OPT14) {
    const xml = await read(name);
    const parsed = parseOptXml(xml).operationalTemplate;
    const sourceIds = new Map<string, Set<string>>();
    walk(parsed.definition, (node, scope) => {
      if (node instanceof openehr_am.C_PRIMITIVE_OBJECT || !node.node_id) {
        return;
      }
      if (!sourceIds.has(scope)) sourceIds.set(scope, new Set());
      sourceIds.get(scope)!.add(opt14NodeIdToAdl2(node.node_id));
    });
    const { operationalTemplate: opt, mintedIdCodes } = upconvertOpt14ToAdl2(
      parsed,
      readOpt14Header(xml),
    );
    const seen = new Map<string, Set<string>>();
    walk(opt.definition, (node, scope) => {
      if (node instanceof openehr_am.C_PRIMITIVE_OBJECT) return;
      const id = node.node_id!;
      if (sourceIds.get(scope)?.has(id)) return;
      if (!seen.has(scope)) seen.set(scope, new Set());
      assert(
        !seen.get(scope)!.has(id),
        `${name}: minted ${id} twice in ${scope}`,
      );
      seen.get(scope)!.add(id);
      minted++;
    });
    assertEquals(
      [...seen.values()].reduce((n, s) => n + s.size, 0),
      mintedIdCodes,
      name,
    );
  }
  assert(minted > 0);
});

Deno.test("OPT 1.4 up-conversion — local value codes stay at-codes, code lists get ac value sets", async () => {
  let localCodeNodes = 0;
  let valueSets = 0;
  for (const name of ALL_OPT14) {
    const { operationalTemplate: opt } = upconvert(await read(name));
    const sets = (opt as unknown as Record<
      string,
      Record<string, Record<string, { members: string[] }>>
    >)[
      ARCHETYPE_VALUE_SETS_KEY
    ] ?? {};
    walk(opt.definition, (node, scope) => {
      if (!(node instanceof openehr_am.C_TERMINOLOGY_CODE)) return;
      const tc = node as unknown as {
        terminology_id?: string;
        constraint?: string;
        code_list?: string[];
      };
      if (tc.terminology_id && tc.terminology_id !== "local") return;
      localCodeNodes++;
      for (const code of tc.code_list ?? []) {
        assert(!/^(at|ac)0\d/.test(code), `${name}: zero-padded code ${code}`);
        assert(
          !/^id\d/.test(code),
          `${name}: value code became id-code ${code}`,
        );
      }
      if ((tc.code_list?.length ?? 0) > 1) {
        assert(
          /^ac\d+$/.test(tc.constraint ?? ""),
          `${name}: constraint ${tc.constraint}`,
        );
        assertEquals(sets[scope]?.[tc.constraint!]?.members, tc.code_list);
        valueSets++;
      }
    });
  }
  assert(localCodeNodes > 0);
  assert(valueSets > 0);
});

Deno.test("OPT 1.4 up-conversion — local ordinal symbols use ADL2 value codes", async () => {
  let ordinals = 0;
  for (const name of ALL_OPT14) {
    const { operationalTemplate: opt } = upconvert(await read(name));
    walk(opt.definition, (node) => {
      if (!(node instanceof openehr_am.C_ORDINAL)) return;
      for (
        const ord
          of ((node as unknown as { list?: openehr_am.ORDINAL[] }).list ?? [])
      ) {
        const sym = (ord as unknown as {
          symbol?: {
            code_string?: string;
            terminology_id?: { value?: string };
          };
        }).symbol;
        if ((sym?.terminology_id?.value ?? "local") !== "local") continue;
        ordinals++;
        assert(
          /^at[1-9]\d*(\.\d+)*$/.test(sym?.code_string ?? ""),
          `${name}: ${sym?.code_string}`,
        );
      }
    });
  }
  assert(ordinals > 0);
});

Deno.test("OPT 1.4 up-conversion — deterministic: converting twice gives identical codes", async () => {
  for (const name of ALL_OPT14) {
    const xml = await read(name);
    const a = upconvert(xml);
    const b = upconvert(xml);
    assertEquals(a.mintedIdCodes, b.mintedIdCodes, name);
    assertEquals(
      canonicalTemplateJson(a.operationalTemplate),
      canonicalTemplateJson(b.operationalTemplate),
      name,
    );
  }
});

Deno.test("OPT 1.4 header — template id, uid, sem_ver and MD5-CAM kept as strings", async () => {
  const h = readOpt14Header(await read("conformance_ehrbase.de.v0.opt"));
  assertEquals(h.templateId, "conformance-ehrbase.de.v0");
  assertEquals(h.otherDetails.sem_ver, "1.0.0");
  assertEquals(
    h.otherDetails["MD5-CAM-1.0.1"],
    "176118c3ecd974695df3c0b62d852ea9",
  );
  assertEquals(typeof h.otherDetails["PARENT:MD5-CAM-1.0.1"], "string");
  assert(h.description);
  const none = readOpt14Header(await read("minimal_evaluation.opt"));
  assertEquals(none.otherDetails["MD5-CAM-1.0.1"], undefined);
  assertEquals(none.otherDetails.build_uid, undefined);
  assertNotEquals(none.templateId, undefined);
});
