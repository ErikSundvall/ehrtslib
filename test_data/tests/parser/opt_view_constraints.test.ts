import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import {
  getOptViewConstraints,
  presentationForPath,
} from "../../../generation/opt_view.ts";
import { flattenOptPathAnnotations } from "../../../generation/opt_l10n.ts";

const IDCR = new URL(
  "../../opt14/IDCR - Problem List.v1.opt",
  import.meta.url,
);
const THUMB = new URL(
  "../../fixtures/ferroehr/thumb-pain-encounter.v2-coded.opt",
  import.meta.url,
);

Deno.test("OPT XML: parse view pass_through constraints", async () => {
  const xml = await Deno.readTextFile(IDCR);
  const { operationalTemplate: opt } = parseOptXml(xml);
  const view = getOptViewConstraints(opt);
  assertEquals(view.length, 2);
  assertEquals(view[0]?.passThrough, true);
});

Deno.test("OPT thumb-pain: clinergy uses hide-on-form annotation", async () => {
  const xml = await Deno.readTextFile(THUMB);
  const { operationalTemplate: opt } = parseOptXml(xml);
  const paths = flattenOptPathAnnotations(opt);
  const clinergy =
    "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='History']/items[openEHR-EHR-OBSERVATION.story.v1]/data[at0001]/events[at0002]/data[at0003]/items[openEHR-EHR-CLUSTER.symptom_sign.v2]/items[openEHR-EHR-CLUSTER.clinergy_descriptor.v0]";
  const pres = presentationForPath(opt, paths, clinergy, undefined, "en");
  assertEquals(pres.annotations["hide-on-form"], "true");
  assertEquals(pres.visibility, undefined);
});