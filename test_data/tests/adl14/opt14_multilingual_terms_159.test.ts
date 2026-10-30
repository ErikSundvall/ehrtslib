/**
 * OPT 1.4 translations live in `<component_ontologies>` / `<ontology>`,
 * not only in the merged ontology (#159).
 */
import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { availableTemplateLanguages } from "../../../generation/term_codes.ts";
import {
  applyOperationalTemplateTermScopes,
  type OperationalTemplateWithTermScopes,
} from "../../../generation/term_scope.ts";
import { buildWebTemplate } from "../../../serialization/simplified/web_template_builder.ts";
import type { WebTemplateNode } from "../../../serialization/simplified/types.ts";

const OPT_DIR = new URL("../../opt14/", import.meta.url);
const BP = "openEHR-EHR-OBSERVATION.blood_pressure.v2";

function nodesWith(
  node: WebTemplateNode,
  nodeId: string,
  out: WebTemplateNode[] = [],
): WebTemplateNode[] {
  if (node.nodeId === nodeId) out.push(node);
  for (const child of node.children ?? []) nodesWith(child, nodeId, out);
  return out;
}

function identity(
  node: WebTemplateNode,
  out: Array<{ id: string; aqlPath: string; nodeId?: string }> = [],
): Array<{ id: string; aqlPath: string; nodeId?: string }> {
  out.push({ id: node.id, aqlPath: node.aqlPath, nodeId: node.nodeId });
  for (const child of node.children ?? []) identity(child, out);
  return out;
}

Deno.test("#159 OPT 1.4 component ontologies: languages, labels, ids, term scopes", async () => {
  // Make the event repeatable so the Web Template keeps an event node (a
  // single event with max 1 is collapsed, spec "Level Removal").
  const xml = (await Deno.readTextFile(
    new URL("multilingual_en_sv_de.opt", OPT_DIR),
  )).replace(
    "<rm_type_name>POINT_EVENT</rm_type_name>",
    "<rm_type_name>POINT_EVENT</rm_type_name><occurrences><lower_included>true</lower_included><upper_included>false</upper_included><lower_unbounded>false</lower_unbounded><upper_unbounded>true</upper_unbounded><lower>0</lower></occurrences>",
  );
  const { operationalTemplate: opt } = parseOptXml(xml);
  const scoped = opt as OperationalTemplateWithTermScopes;

  assertEquals(
    Object.keys(opt.ontology?.term_definitions ?? {}),
    ["en"],
    "the merged ontology still has only the original language",
  );
  assertEquals(availableTemplateLanguages(opt), ["en", "sv", "de", "qq"]);
  assertEquals(
    scoped.archetype_term_definitions?.[BP]?.sv?.at0004?.text,
    "Systoliskt",
  );

  const english = buildWebTemplate(opt);
  const swedish = buildWebTemplate(opt, { languages: ["sv", "en"] });
  const swedishOnly = buildWebTemplate(opt, { languages: ["sv"] });
  const german = buildWebTemplate(opt, { languages: ["de"] });
  const swedishThenGerman = buildWebTemplate(opt, { languages: ["sv", "de"] });
  const swedishOriginalIds = buildWebTemplate(opt, {
    languages: ["sv", "en"],
    idLanguage: "original",
  });

  assertEquals(english.defaultLanguage, "en");
  assertEquals(
    english.languages,
    ["en"],
    "default includes the original language only",
  );
  assertEquals(swedish.defaultLanguage, "sv");
  assertEquals(swedish.languages, ["sv", "en"]);
  assertEquals(swedishOnly.defaultLanguage, "sv");
  assertEquals(swedishOnly.languages, ["sv"]);
  assertEquals(german.defaultLanguage, "de");
  assertEquals(german.languages, ["de"]);

  const enSys = nodesWith(english.tree, "at0004").find((n) =>
    n.name === "Systolic"
  );
  assertExists(enSys);
  assertEquals(enSys.id, "systolic");
  assertEquals(enSys.localizedNames, { en: "Systolic" });

  const svSys = nodesWith(swedish.tree, "at0004").find((n) =>
    n.aqlPath === enSys.aqlPath
  );
  const svOnlySys = nodesWith(swedishOnly.tree, "at0004").find((n) =>
    n.aqlPath === enSys.aqlPath
  );
  const deSys = nodesWith(german.tree, "at0004").find((n) =>
    n.aqlPath === enSys.aqlPath
  );
  const svOrig = nodesWith(swedishOriginalIds.tree, "at0004").find((n) =>
    n.aqlPath === enSys.aqlPath
  );
  assertExists(svSys);
  assertExists(svOnlySys);
  assertExists(deSys);
  assertExists(svOrig);

  assertEquals(svSys.name, "Systoliskt");
  assertEquals(svSys.localizedName, "Systoliskt");
  assertEquals(svSys.id, "systoliskt");
  assertEquals(svOnlySys.id, "systoliskt");
  assertEquals(svOnlySys.name, "Systoliskt");
  assertEquals(deSys.name, "Systolisch");
  assertEquals(deSys.id, "systolisch");
  assertEquals(svSys.aqlPath, enSys.aqlPath);
  assertEquals(svOrig.name, "Systoliskt");
  assertEquals(svOrig.id, enSys.id);
  assertEquals(svOrig.aqlPath, enSys.aqlPath);

  assertEquals(svSys.localizedNames, {
    sv: "Systoliskt",
    en: "Systolic",
  });
  assertEquals(svOnlySys.localizedNames, { sv: "Systoliskt" });
  assertEquals(svSys.localizedDescriptions, {
    sv: "Systoliskt blodtryck.",
    en: "Peak systemic arterial blood pressure.",
  });
  assertEquals(deSys.localizedDescriptions, {
    de: "Systolischer Blutdruck.",
  });

  const enEvent = nodesWith(english.tree, "at0006").find((n) =>
    n.name === "Any event"
  );
  assertExists(enEvent);
  assertEquals(enEvent.id, "any_event");
  const svEvent = nodesWith(swedish.tree, "at0006").find((n) =>
    n.aqlPath === enEvent.aqlPath
  );
  const chainEvent = nodesWith(swedishThenGerman.tree, "at0006").find((n) =>
    n.aqlPath === enEvent.aqlPath
  );
  const chainSys = nodesWith(swedishThenGerman.tree, "at0004").find((n) =>
    n.aqlPath === enSys.aqlPath
  );
  assertExists(svEvent);
  assertExists(chainEvent);
  assertExists(chainSys);
  assertEquals(
    svEvent.name,
    "Any event",
    "a missing Swedish term falls back to the next listed language, then the original",
  );
  assertEquals(svEvent.localizedNames, { en: "Any event" });
  assertEquals(svEvent.id, "any_event");
  assertEquals(chainSys.name, "Systoliskt");
  assertEquals(chainSys.id, "systoliskt");
  assertEquals(
    chainEvent.name,
    "Beliebiges Ereignis",
    "de is the next listed language and wins over the original English term",
  );
  assertEquals(chainEvent.id, "beliebiges_ereignis");
  assertEquals(chainEvent.localizedNames, { de: "Beliebiges Ereignis" });
  const chainOriginalIds = buildWebTemplate(opt, {
    languages: ["sv", "de"],
    idLanguage: "original",
  });
  const chainEventOriginal = nodesWith(chainOriginalIds.tree, "at0006").find((
    n,
  ) => n.aqlPath === enEvent.aqlPath);
  assertEquals(chainEventOriginal?.name, "Beliebiges Ereignis");
  assertEquals(chainEventOriginal?.id, "any_event");

  const enObs = nodesWith(english.tree, BP)[0];
  const svObs = nodesWith(swedish.tree, BP)[0];
  assertExists(enObs);
  assertExists(svObs);
  assertEquals(enObs.name, "Blood pressure");
  assertEquals(svObs.name, "Blodtryck");
  assertEquals(svObs.id, "blodtryck");
  assertEquals(enObs.aqlPath, svObs.aqlPath);

  const enPosition = nodesWith(english.tree, "at0008")[0];
  const svPosition = nodesWith(swedish.tree, "at0008")[0];
  assertExists(enPosition);
  assertExists(svPosition);
  const enSitting = enPosition.inputs?.find((i) => i.suffix === "code")?.list
    ?.find((item) => item.value === "at1001");
  const svSitting = svPosition.inputs?.find((i) => i.suffix === "code")?.list
    ?.find((item) => item.value === "at1001");
  assertEquals(enSitting?.label, "Sitting");
  assertEquals(enSitting?.localizedLabels, undefined);
  assertEquals(svSitting?.label, "Sittande");
  assertEquals(svSitting?.localizedLabels, {
    sv: "Sittande",
    en: "Sitting",
  });

  applyOperationalTemplateTermScopes(opt, "sv");
  assertEquals(
    scoped.archetype_term_definitions?.[BP]?.sv?.at0004?.text,
    "Systoliskt",
    "inline English terms must not be retagged as sv",
  );
  assertEquals(
    scoped.archetype_term_definitions?.[BP]?.en?.at0004?.text,
    "Systolic",
  );
  assertEquals(
    scoped.archetype_term_definitions?.[BP]?.de?.at0004?.text,
    "Systolisch",
  );
  assertEquals(
    scoped.archetype_term_definitions?.[BP]?.qq?.at0004?.text,
    "Q-Systolic",
  );
  const swedishAgain = buildWebTemplate(opt, { languages: ["sv"] });
  assertEquals(
    nodesWith(swedishAgain.tree, "at0004").find((n) =>
      n.aqlPath === enSys.aqlPath
    )?.name,
    "Systoliskt",
  );
});

Deno.test("#159 single-language OPT ids and names stay on the original language", async () => {
  const xml = await Deno.readTextFile(
    new URL("ehrbase_blood_pressure_simple.de.v0.opt", OPT_DIR),
  );
  const { operationalTemplate: opt } = parseOptXml(xml);
  assertEquals(availableTemplateLanguages(opt), ["en"]);

  const english = buildWebTemplate(opt);
  const requested = buildWebTemplate(opt, { languages: ["sv"] });
  assertEquals(requested.defaultLanguage, "sv");
  assertEquals(requested.languages, ["sv"]);
  assertEquals(identity(requested.tree), identity(english.tree));
  assertEquals(
    nodesWith(requested.tree, "at0004").map((n) => n.name),
    nodesWith(english.tree, "at0004").map((n) => n.name),
  );
  assert(
    nodesWith(english.tree, "at0004").some((n) => n.name === "Systolic"),
    "original systolic label is unchanged",
  );
  const systolic = nodesWith(english.tree, "at0004").find((n) =>
    n.name === "Systolic"
  );
  assertEquals(systolic?.localizedNames, { en: "Systolic" });
  assertEquals(systolic?.id, "systolic");
});

Deno.test("#159 language_test.opt lists ontology languages and builds fi/en/de", async () => {
  const xml = await Deno.readTextFile(new URL("language_test.opt", OPT_DIR));
  const { operationalTemplate: opt } = parseOptXml(xml);

  assertEquals(availableTemplateLanguages(opt), ["de", "en", "ar-sy", "fi"]);

  const german = buildWebTemplate(opt);
  const english = buildWebTemplate(opt, { languages: ["en", "fi"] });
  const finnish = buildWebTemplate(opt, {
    languages: ["fi"],
    idLanguage: "original",
  });

  assertEquals(german.defaultLanguage, "de");
  assertEquals(german.languages, ["de"]);
  const deSys = nodesWith(german.tree, "at0004").find((n) =>
    n.name === "Systolisch"
  );
  assertExists(deSys, "original-language inline term");
  assertEquals(deSys.id, "systolisch");
  const enSys = nodesWith(english.tree, "at0004").find((n) =>
    n.aqlPath === deSys.aqlPath
  );
  const fiSys = nodesWith(finnish.tree, "at0004").find((n) =>
    n.aqlPath === deSys.aqlPath
  );
  assertEquals(enSys?.name, "Systolic");
  assertEquals(enSys?.id, "systolic");
  assertEquals(enSys?.aqlPath, deSys.aqlPath);
  assertEquals(enSys?.localizedNames, {
    en: "Systolic",
    fi: "Systolinen",
  });
  assertEquals(fiSys?.name, "Systolinen");
  assertEquals(fiSys?.id, deSys.id);
  assertEquals(fiSys?.localizedNames, { fi: "Systolinen" });
});
