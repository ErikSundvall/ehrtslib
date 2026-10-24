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
  const xml = await Deno.readTextFile(
    new URL("multilingual_en_sv_de.opt", OPT_DIR),
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

  const english = buildWebTemplate(opt, { defaultLanguage: "en" });
  const swedish = buildWebTemplate(opt, { language: "sv" });
  const german = buildWebTemplate(opt, { defaultLanguage: "de" });
  const qq = buildWebTemplate(opt, { language: "qq" });

  assertEquals(english.defaultLanguage, "en");
  assertEquals(swedish.defaultLanguage, "en");
  assertEquals(english.languages, ["en", "sv", "de", "qq"]);
  assertEquals(swedish.languages, english.languages);

  const enSys = nodesWith(english.tree, "at0004").find((n) =>
    n.name === "Systolic"
  );
  assertExists(enSys);
  const svSys = nodesWith(swedish.tree, "at0004").find((n) =>
    n.aqlPath === enSys.aqlPath
  );
  const deSys = nodesWith(german.tree, "at0004").find((n) =>
    n.aqlPath === enSys.aqlPath
  );
  const qqSys = nodesWith(qq.tree, "at0004").find((n) =>
    n.aqlPath === enSys.aqlPath
  );
  assertExists(svSys);
  assertExists(deSys);
  assertExists(qqSys);

  assertEquals(svSys.name, "Systoliskt");
  assertEquals(svSys.localizedName, "Systoliskt");
  assertEquals(deSys.name, "Systolisch");
  assertEquals(qqSys.name, "Q-Systolic");
  assertEquals(svSys.id, enSys.id);
  assertEquals(deSys.id, enSys.id);
  assertEquals(qqSys.id, enSys.id);
  assertEquals(svSys.aqlPath, enSys.aqlPath);

  assertEquals(enSys.localizedNames, {
    en: "Systolic",
    sv: "Systoliskt",
    de: "Systolisch",
    qq: "Q-Systolic",
  });
  assertEquals(svSys.localizedNames, enSys.localizedNames);
  assertEquals(enSys.localizedDescriptions?.sv, "Systoliskt blodtryck.");
  assertEquals(deSys.localizedDescriptions?.de, "Systolischer Blutdruck.");

  const enEvent = nodesWith(english.tree, "at0006").find((n) =>
    n.name === "Any event"
  );
  assertExists(enEvent);
  const svEvent = nodesWith(swedish.tree, "at0006").find((n) =>
    n.aqlPath === enEvent.aqlPath
  );
  const deEvent = nodesWith(german.tree, "at0006").find((n) =>
    n.aqlPath === enEvent.aqlPath
  );
  assertExists(svEvent);
  assertExists(deEvent);
  assertEquals(
    svEvent.name,
    "Any event",
    "a missing Swedish term falls back to the original language",
  );
  assertEquals(svEvent.localizedNames?.sv, undefined);
  assertEquals(svEvent.localizedNames?.en, "Any event");
  assertEquals(deEvent.name, "Beliebiges Ereignis");
  assertEquals(svEvent.id, enEvent.id);
  assertEquals(deEvent.id, enEvent.id);

  const enObs = nodesWith(english.tree, BP)[0];
  const svObs = nodesWith(swedish.tree, BP)[0];
  assertExists(enObs);
  assertExists(svObs);
  assertEquals(enObs.name, "Blood pressure");
  assertEquals(svObs.name, "Blodtryck");
  assertEquals(svObs.id, enObs.id);

  const enPosition = nodesWith(english.tree, "at0008")[0];
  const svPosition = nodesWith(swedish.tree, "at0008")[0];
  assertExists(enPosition);
  assertExists(svPosition);
  const enSitting = enPosition.inputs?.find((i) => i.suffix === "code")?.list
    ?.find((item) => item.value === "at1001");
  const svSitting = svPosition.inputs?.find((i) => i.suffix === "code")?.list
    ?.find((item) => item.value === "at1001");
  assertEquals(enSitting?.label, "Sitting");
  assertEquals(svSitting?.label, "Sittande");
  assertEquals(svSitting?.localizedLabels, {
    en: "Sitting",
    sv: "Sittande",
    de: "Sitzend",
  });

  assertEquals(identity(swedish.tree), identity(english.tree));
  assertEquals(identity(german.tree), identity(english.tree));
  assertEquals(identity(qq.tree), identity(english.tree));

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
  const swedishAgain = buildWebTemplate(opt, { language: "sv" });
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
  const requested = buildWebTemplate(opt, { language: "sv" });
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
  const english = buildWebTemplate(opt, { language: "en" });
  const finnish = buildWebTemplate(opt, { defaultLanguage: "fi" });

  const deSys = nodesWith(german.tree, "at0004").find((n) =>
    n.name === "Systolisch"
  );
  assertExists(deSys, "original-language inline term");
  const enSys = nodesWith(english.tree, "at0004").find((n) =>
    n.aqlPath === deSys.aqlPath
  );
  const fiSys = nodesWith(finnish.tree, "at0004").find((n) =>
    n.aqlPath === deSys.aqlPath
  );
  assertEquals(enSys?.name, "Systolic");
  assertEquals(fiSys?.name, "Systolinen");
  assertEquals(enSys?.id, deSys.id);
  assertEquals(fiSys?.id, deSys.id);
  assertEquals(identity(english.tree), identity(german.tree));
  assertEquals(identity(finnish.tree), identity(german.tree));
  assertEquals(fiSys?.localizedNames?.["ar-sy"], "الانقباضي");
  assertEquals(fiSys?.localizedNames?.fi, "Systolinen");
});
