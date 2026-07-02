import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { lookupTermInBag, resolveLocatableLabel } from "../../../enhanced/generation/term_scope.ts";

Deno.test("lookupTermInBag resolves dotted suffix within one archetype bag", () => {
  const bag = {
    "at0003.1": { text: "HSAID signeringsansvarig" },
    "at0001.1": { text: "Överföringsformat" },
  };
  assertEquals(lookupTermInBag(bag, "at0003"), "HSAID signeringsansvarig");
  assertEquals(lookupTermInBag(bag, "at0001"), "Överföringsformat");
});

Deno.test("resolveLocatableLabel prefers archetype scope over flat template terms", () => {
  const templateTerms = { at0001: { text: "Wrong from merge collision" } };
  const archetypeTerms = {
    "openEHR-EHR-CLUSTER.foo.v1": {
      at0001: { text: "Correct cluster root" },
    },
  };
  assertEquals(
    resolveLocatableLabel(
      "at0001",
      undefined,
      templateTerms,
      archetypeTerms,
      "openEHR-EHR-CLUSTER.foo.v1",
    ),
    "Correct cluster root",
  );
});

Deno.test("resolveLocatableLabel uses name fallback for template slot ids", () => {
  const archetypeTerms = {
    "openEHR-EHR-SECTION.review.v1": {
      at0001: { text: "Mötesanteckningar" },
    },
  };
  assertEquals(
    resolveLocatableLabel(
      "at0.2",
      "at0001",
      {},
      archetypeTerms,
      "openEHR-EHR-SECTION.review.v1",
    ),
    "Mötesanteckningar",
  );
});

Deno.test("template slot ids do not collide with merged archetype at-codes", () => {
  const templateTerms = {
    "at0002.1": { text: "ICD-10" },
    "at0004.2": { text: "Komorbiditet" },
  };
  assertEquals(resolveLocatableLabel("at0.2", undefined, templateTerms, {}, undefined), undefined);
  assertEquals(resolveLocatableLabel("at0.4", undefined, templateTerms, {}, undefined), undefined);
  assertEquals(
    resolveLocatableLabel("at0002.1", undefined, templateTerms, {}, undefined),
    "ICD-10",
  );
});

Deno.test("lookupTermInBag does not borrow sibling specialised code names", () => {
  const bag = {
    "at0002.1": { text: "ICD-10" },
    "at0002.2": { text: "SNOMED CT" },
  };
  assertEquals(lookupTermInBag(bag, "at0002"), undefined);
});

Deno.test("lookupTermInBag does not name history events from a single data child", () => {
  const bag = { "at0002.1": { text: "ICD-10" } };
  assertEquals(lookupTermInBag(bag, "at0002"), undefined);
  assertEquals(lookupTermInBag(bag, "at0002.1"), "ICD-10");
});
