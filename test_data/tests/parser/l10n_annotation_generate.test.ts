/**
 * L10n annotation generation — only L10n.* keys, never the definition tree.
 *
 * @see https://discourse.openehr.org/t/limitation-preventing-multilingual-repeated-parts-in-the-opt-operational-template-export-format/2760
 */

import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  applyL10nWrites,
  proposeL10nWrites,
  type AnnotationDocumentation,
  type L10nSourceNode,
} from "../../../parser/mod.ts";

const repeatedAdhoc: L10nSourceNode[] = [
  {
    path:
      "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']",
    archetypeRef: "openEHR-EHR-SECTION.adhoc.v1",
    localizedNames: {
      en: "Medical equipment at home",
      sv: "Medicinsk utrustning i hemmet",
      fr: "Équipement médical à domicile",
    },
  },
  {
    path:
      "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Social situation']",
    archetypeRef: "openEHR-EHR-SECTION.adhoc.v1",
    localizedNames: {
      en: "Social situation",
      sv: "Social situation",
      fr: "Situation sociale",
    },
  },
  {
    path: "/content[openEHR-EHR-OBSERVATION.blood_pressure.v2]",
    archetypeRef: "openEHR-EHR-OBSERVATION.blood_pressure.v2",
    localizedNames: { en: "Blood pressure", sv: "Blodtryck" },
  },
];

Deno.test("proposeL10nWrites - repeated nodes, copy into every language bag", () => {
  const writes = proposeL10nWrites(undefined, repeatedAdhoc, {
    languageBags: ["en", "sv", "fr"],
  });
  const adds = writes.filter((w) => w.kind === "add");
  // 2 repeated nodes × 3 names × 3 bags; unique BP observation is excluded
  assertEquals(adds.length, 18);
  assertEquals(
    adds.every((w) => w.key.startsWith("L10n.")),
    true,
  );
  assertEquals(
    adds.some((w) =>
      w.path.includes("blood_pressure")
    ),
    false,
  );
  const svInEnBag = adds.find((w) =>
    w.languageBag === "en" && w.key === "L10n.sv" &&
    w.value === "Medicinsk utrustning i hemmet"
  );
  assertEquals(svInEnBag?.path.includes("Medical equipment"), true);
});

Deno.test("applyL10nWrites - does not touch non-L10n keys or definition-shaped data", () => {
  const doc: AnnotationDocumentation = {
    en: {
      "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']":
        {
          "design note": "keep me",
          "L10n.en": "Medical equipment at home",
        },
    },
  };
  const writes = proposeL10nWrites(doc, repeatedAdhoc, {
    languageBags: ["en", "sv"],
  });
  const result = applyL10nWrites(doc, writes, false);
  assertEquals(result.applied > 0, true);
  assertEquals(
    doc.en[
      "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']"
    ]["design note"],
    "keep me",
  );
  assertEquals(
    doc.sv[
      "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']"
    ]["L10n.sv"],
    "Medicinsk utrustning i hemmet",
  );
});

Deno.test("applyL10nWrites - conflicts skip unless overwrite", () => {
  const path =
    "/content[openEHR-EHR-SECTION.adhoc.v1 and name/value='Medical equipment at home']";
  const doc: AnnotationDocumentation = {
    en: {
      [path]: { "L10n.sv": "OLD" },
    },
  };
  const writes = proposeL10nWrites(doc, repeatedAdhoc, {
    languageBags: ["en"],
  });
  const conflict = writes.find((w) =>
    w.kind === "conflict" && w.key === "L10n.sv" && w.languageBag === "en"
  );
  assertEquals(conflict?.existingValue, "OLD");
  assertEquals(conflict?.value, "Medicinsk utrustning i hemmet");

  const skipped = applyL10nWrites(doc, writes, false);
  assertEquals(doc.en[path]["L10n.sv"], "OLD");
  assertEquals(skipped.skippedConflict >= 1, true);

  const overwritten = applyL10nWrites(doc, writes, true);
  assertEquals(doc.en[path]["L10n.sv"], "Medicinsk utrustning i hemmet");
  assertEquals(overwritten.applied >= 1, true);
});

Deno.test("proposeL10nWrites - rejects non-L10n keys even if smuggled on a node", () => {
  const writes = proposeL10nWrites(undefined, repeatedAdhoc, {
    languageBags: ["en"],
    repeatedOccurrencesOnly: true,
  });
  assertEquals(writes.some((w) => !w.key.startsWith("L10n.")), false);
});

Deno.test("applyL10nWrites - skips writes whose key is not L10n.*", () => {
  const doc: AnnotationDocumentation = { en: {} };
  const result = applyL10nWrites(doc, [{
    languageBag: "en",
    path: "/x",
    key: "design note",
    value: "nope",
    kind: "add",
  }]);
  assertEquals(result.skippedNonL10n, 1);
  assertEquals(result.applied, 0);
  assertEquals(doc.en["/x"], undefined);
});
