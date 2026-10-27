import { assertEquals } from "@std/assert";
import {
  opt14NodeIdToAdl2,
  opt14ValueCodeToAdl2,
} from "../../../parser/legacy/opt14_code_mapping.ts";
import { upconvertOpt14ToAdl2 } from "../../../parser/legacy/opt14_upconvert.ts";
import { parseOptXml } from "../../../parser/mod.ts";
import { readOpt14Header } from "../../../parser/legacy/opt14_upconvert.ts";

const OPT14 = new URL("../../opt14/minimal_evaluation.opt", import.meta.url);

Deno.test("adl2CodingSystem at-coded (default) keeps ADL 1.4 node and value codes", () => {
  assertEquals(opt14NodeIdToAdl2("at0000"), "at0000");
  assertEquals(opt14NodeIdToAdl2("at0004"), "at0004");
  assertEquals(opt14ValueCodeToAdl2("at0009"), "at0009");
});

Deno.test("adl2CodingSystem id-coded uses Archie id/value shift", () => {
  const id = { adl2CodingSystem: "id-coded" as const };
  assertEquals(opt14NodeIdToAdl2("at0000", id), "id1");
  assertEquals(opt14ValueCodeToAdl2("at0009", id), "at10");
});

Deno.test("OPT 1.4 up-convert default is at-coded nodes", async () => {
  const xml = await Deno.readTextFile(OPT14);
  const parsed = parseOptXml(xml).operationalTemplate;
  const { operationalTemplate: opt, adl2CodingSystem } = upconvertOpt14ToAdl2(
    parsed,
    readOpt14Header(xml),
  );
  assertEquals(adl2CodingSystem, "at-coded");
  assertEquals(opt.definition?.node_id, "at0000");
});

Deno.test("OPT 1.4 up-convert id-coded option", async () => {
  const xml = await Deno.readTextFile(OPT14);
  const parsed = parseOptXml(xml).operationalTemplate;
  const { operationalTemplate: opt } = upconvertOpt14ToAdl2(
    parsed,
    readOpt14Header(xml),
    { adl2CodingSystem: "id-coded" },
  );
  assertEquals(opt.definition?.node_id, "id1");
});
