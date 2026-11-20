/**
 * #323: ZipEHR HTML5 display label localization from template L10n,
 * archetype translations, and openEHR terminology — with lossless round-trip.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { Window } from "npm:happy-dom@21.0.4";
import { parseOptXml } from "../../../parser/legacy/opt_xml_parser.ts";
import { ArchetypeRepository } from "../../../parser/legacy/archetype_repository.ts";
import { setOptPathAnnotationItems } from "../../../generation/opt_l10n.ts";
import { buildWebTemplate } from "../../../serialization/simplified/mod.ts";
import {
  buildZipehrPreviewDocument,
  composeQuietStructureCss,
  serializeToHtml5Variant,
  ZIP_QUIET_PREVIEW_SCRIPT,
  ZIP_QUIET_STRUCTURE_CSS,
  zipehrHtml5ToCanonical,
} from "../../../serialization/zipehr/mod.ts";

const repo = new URL("../../../", import.meta.url);

const GP_VISIT_SV = JSON.parse(
  await Deno.readTextFile(
    new URL("test_data/fixtures/workbench-ferro/gp-visit-full-sv.json", repo),
  ),
) as Record<string, unknown>;

const FERRO_OPT_XML = await Deno.readTextFile(
  new URL("test_data/fixtures/ferroehr/thumb-pain-encounter.v2-coded.opt", repo),
);

const ANATOMICAL_LOCATION_SV_ADL = `archetype (adl_version=1.4; uid=c3333333-3333-3333-3333-333333333333)
	openEHR-EHR-CLUSTER.anatomical_location.v1

concept
	[at0000]	-- Anatomical location

language
	original_language = <[ISO_639-1::en]>
	translations = <
		["sv"] = <
			language = <[ISO_639-1::sv]>
		>
	>

definition
	CLUSTER[at0000] matches {
		items cardinality matches {0..*; unordered} matches {
			ELEMENT[at0002] occurrences matches {0..1} matches {
				value matches {
					DV_CODED_TEXT matches {
						defining_code matches {
							[local::
							at0003,
							at0004]
						}
					}
				}
			}
		}
	}

ontology
	term_definitions = <
		["en"] = <
			items = <
				["at0000"] = <
					text = <"Anatomical location">
					description = <"Anatomical site.">
				>
				["at0002"] = <
					text = <"Laterality">
					description = <"Side of body.">
				>
				["at0003"] = <
					text = <"Left">
					description = <"Left side.">
				>
				["at0004"] = <
					text = <"Right">
					description = <"Right side.">
				>
			>
		>
		["sv"] = <
			items = <
				["at0000"] = <
					text = <"Anatomisk lokalisation">
					description = <"Anatomisk lokalisation.">
				>
				["at0002"] = <
					text = <"Sida">
					description = <"Kroppssida.">
				>
				["at0003"] = <
					text = <"Vänster">
					description = <"Vänster sida.">
				>
				["at0004"] = <
					text = <"Höger">
					description = <"Höger sida.">
				>
			>
		>
	>
`;

const SYMPTOM_SIGN_SV_ADL = `archetype (adl_version=1.4; uid=d4444444-4444-4444-4444-444444444444)
	openEHR-EHR-CLUSTER.symptom_sign.v2

concept
	[at0000]	-- Symptom/Sign

language
	original_language = <[ISO_639-1::en]>
	translations = <
		["sv"] = <
			language = <[ISO_639-1::sv]>
		>
	>

definition
	CLUSTER[at0000] matches {
		items cardinality matches {0..*; unordered} matches {
			ELEMENT[at0021] occurrences matches {0..1} matches {
				value matches {
					DV_CODED_TEXT matches {
						defining_code matches {
							[local::
							at0023,
							at0024,
							at0025]
						}
					}
				}
			}
		}
	}

ontology
	term_definitions = <
		["en"] = <
			items = <
				["at0000"] = <
					text = <"Symptom/Sign">
					description = <"Symptom or sign.">
				>
				["at0021"] = <
					text = <"Severity category">
					description = <"Severity.">
				>
				["at0023"] = <
					text = <"Mild">
					description = <"Mild.">
				>
				["at0024"] = <
					text = <"Moderate">
					description = <"Moderate.">
				>
				["at0025"] = <
					text = <"Severe">
					description = <"Severe.">
				>
			>
		>
		["sv"] = <
			items = <
				["at0000"] = <
					text = <"Symtom/fynd">
					description = <"Symtom eller fynd.">
				>
				["at0021"] = <
					text = <"Allvarlighetsgrad">
					description = <"Allvarlighetsgrad.">
				>
				["at0023"] = <
					text = <"Lindrig">
					description = <"Lindrig.">
				>
				["at0024"] = <
					text = <"Måttlig">
					description = <"Måttlig.">
				>
				["at0025"] = <
					text = <"Svår">
					description = <"Svår.">
				>
			>
		>
	>
`;

Deno.test("#323: composition header and category rendered from template L10n in sv", async () => {
  const { operationalTemplate: opt } = parseOptXml(FERRO_OPT_XML);
  setOptPathAnnotationItems(opt, "/", { "L10n.sv": "Vårdkontakt" });
  setOptPathAnnotationItems(opt, "/category", { "L10n.sv": "Besökshändelse" });
  const wt = buildWebTemplate(opt);

  const html = await serializeToHtml5Variant(
    GP_VISIT_SV,
    "zipehr.html5.short",
    {
      layout: "linesaving",
      propertyMode: "comment",
      template: { operationalTemplate: opt, webTemplate: wt },
      templateRenderLang: "sv",
    },
  );

  // Composition root has data-antn-l10n-sv and localized display span
  assertStringIncludes(html, 'data-antn-l10n-sv="Vårdkontakt"');
  assertStringIncludes(html, '<span class="zs-canonical-value">Encounter</span>');
  assertStringIncludes(html, '<span class="zs-display-value">Vårdkontakt</span>');

  // Category has data-antn-l10n-sv and template L10n takes priority over openEHR terminology
  assertStringIncludes(html, 'data-antn-l10n-sv="Besökshändelse"');
  assert(
    /<o-c\b[^>]*data-antn-l10n-sv="Besökshändelse"[^>]*dc="openehr::433"[^>]*>\s*<span class="zs-canonical-value">event<\/span>\s*<span class="zs-display-value">Besökshändelse<\/span>\s*<\/o-c>/
      .test(html),
    "expected category to render template L10n 'Besökshändelse'",
  );

  // Round-trip stays lossless: canonical RM values untouched
  const back = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
  assertEquals(back, GP_VISIT_SV);
});

Deno.test("#323: openehr::228 setting rendered as Swedish rubric and round-trips losslessly", async () => {
  const { operationalTemplate: opt } = parseOptXml(FERRO_OPT_XML);
  const wt = buildWebTemplate(opt);

  const html = await serializeToHtml5Variant(
    GP_VISIT_SV,
    "zipehr.html5.short",
    {
      layout: "linesaving",
      propertyMode: "comment",
      template: { operationalTemplate: opt, webTemplate: wt },
      templateRenderLang: "sv",
    },
  );

  assert(
    /<o-c\b[^>]*dc="openehr::228"[^>]*>\s*<span class="zs-canonical-value">primary medical care<\/span>\s*<span class="zs-display-value">primärvård<\/span>\s*<\/o-c>/
      .test(html),
    "expected openehr::228 setting to render Swedish rubric 'primärvård'",
  );
  // Category without template L10n falls back to openEHR Swedish rubric
  assert(
    /<o-c\b[^>]*dc="openehr::433"[^>]*>\s*<span class="zs-canonical-value">event<\/span>\s*<span class="zs-display-value">händelse<\/span>\s*<\/o-c>/
      .test(html),
    "expected openehr::433 category to render Swedish rubric 'händelse'",
  );

  const back = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
  assertEquals(back, GP_VISIT_SV);
});

Deno.test("#323: local::atNNNN coded values rendered from archetype sv translations (repository & OPT)", async () => {
  const { operationalTemplate: opt } = parseOptXml(FERRO_OPT_XML);
  // Also embed sv translation directly in OPT archetype_term_definitions
  const scoped = (opt as unknown as {
    archetype_term_definitions?: Record<
      string,
      Record<string, Record<string, { text?: string }>>
    >;
  }).archetype_term_definitions ??= {};
  scoped["openEHR-EHR-EVALUATION.problem_diagnosis.v1"] ??= {};
  scoped["openEHR-EHR-EVALUATION.problem_diagnosis.v1"].sv = {
    at0074: { text: "Misstänkt" },
  };
  const wt = buildWebTemplate(opt);
  const archRepo = ArchetypeRepository.fromEntries([
    {
      path: "openEHR-EHR-CLUSTER.anatomical_location.v1.adl",
      content: ANATOMICAL_LOCATION_SV_ADL,
    },
    {
      path: "openEHR-EHR-CLUSTER.symptom_sign.v2.adl",
      content: SYMPTOM_SIGN_SV_ADL,
    },
  ]);

  const html = await serializeToHtml5Variant(
    GP_VISIT_SV,
    "zipehr.html5.short",
    {
      layout: "linesaving",
      propertyMode: "comment",
      template: { operationalTemplate: opt, webTemplate: wt },
      templateRenderLang: "sv",
      archetypeRepository: archRepo,
    },
  );

  // local::at0003 ("Left") and local::at0004 ("Right") from archetypeRepository sv translation
  assert(
    /<o-c\b[^>]*dc="local::at0003"[^>]*>\s*<span class="zs-canonical-value">Left<\/span>\s*<span class="zs-display-value">Vänster<\/span>\s*<\/o-c>/
      .test(html),
    "expected local::at0003 ('Left') to render Swedish display label 'Vänster'",
  );
  assert(
    /<o-c\b[^>]*dc="local::at0004"[^>]*>\s*<span class="zs-canonical-value">Right<\/span>\s*<span class="zs-display-value">Höger<\/span>\s*<\/o-c>/
      .test(html),
    "expected local::at0004 ('Right') to render Swedish display label 'Höger'",
  );
  // local::at0074 ("Suspected") from OPT archetype_term_definitions sv translation
  assert(
    /<o-c\b[^>]*dc="local::at0074"[^>]*>\s*<span class="zs-canonical-value">Suspected<\/span>\s*<span class="zs-display-value">Misstänkt<\/span>\s*<\/o-c>/
      .test(html),
    "expected local::at0074 ('Suspected') to render Swedish display label 'Misstänkt'",
  );
  // Archetype element label ("Laterality" → "Sida") also localized
  assertStringIncludes(html, '<span class="zs-canonical-value">Laterality</span>');
  assertStringIncludes(html, '<span class="zs-display-value">Sida</span>');

  // Quiet CSS hides canonical spans and displays localized spans
  const baseCss = await Deno.readTextFile(
    new URL("serialization/zipehr/css/zipehr-html5-short.css", repo),
  );
  const quietCss = await Deno.readTextFile(
    new URL(`serialization/zipehr/css/${ZIP_QUIET_STRUCTURE_CSS}`, repo),
  );
  const doc = buildZipehrPreviewDocument(
    html,
    composeQuietStructureCss(baseCss, quietCss),
    { quietStructureTooltips: false },
  );
  const win = new Window({ url: "http://127.0.0.1/" });
  win.document.write(doc);
  win.eval(ZIP_QUIET_PREVIEW_SCRIPT);

  const settingEl = win.document.querySelector('o-c[dc="openehr::228"]');
  assert(settingEl, "setting element expected");
  const settingCanonical = settingEl!.querySelector(".zs-canonical-value")!;
  const settingDisplay = settingEl!.querySelector(".zs-display-value")!;
  assertEquals(win.getComputedStyle(settingCanonical).display, "none");
  assertEquals(win.getComputedStyle(settingDisplay).display, "inline");
  assertEquals(settingDisplay.textContent, "primärvård");

  // Round-trip stays lossless
  const back = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
  assertEquals(back, GP_VISIT_SV);
});

Deno.test("#323: fallback to RM value without error when translation is missing", async () => {
  const { operationalTemplate: opt } = parseOptXml(FERRO_OPT_XML);
  const wt = buildWebTemplate(opt);

  // Language with no template L10n, no archetype translations, no embedded openEHR table
  const html = await serializeToHtml5Variant(
    GP_VISIT_SV,
    "zipehr.html5.short",
    {
      layout: "linesaving",
      propertyMode: "comment",
      template: { operationalTemplate: opt, webTemplate: wt },
      templateRenderLang: "fi",
    },
  );

  // RM values emitted directly without display spans for untranslated coded texts
  assert(
    /<o-c\b[^>]*dc="openehr::228"[^>]*>primary medical care<\/o-c>/.test(html),
    "expected untranslated openehr::228 to fall back to RM value",
  );
  assert(
    /<o-c\b[^>]*dc="local::at0004"[^>]*>Right<\/o-c>/.test(html),
    "expected untranslated local::at0004 to fall back to RM value",
  );
  assertStringIncludes(html, ">Encounter");

  const back = zipehrHtml5ToCanonical(html) as Record<string, unknown>;
  assertEquals(back, GP_VISIT_SV);
});
