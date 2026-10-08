/**
 * Test suite for OpenEHRTerminologyService
 *
 * Tests for the terminology service that provides access to openEHR's
 * internal terminologies and code sets loaded from the official XML files.
 *
 * Official terminology XML is parsed without a DOM/CSS engine. These tests
 * require the files under terminology_data/ and run from the repository root.
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import { OpenEHRTerminologyService } from "../../../term/terminology_service.ts";

// ===== Singleton Tests =====

Deno.test("OpenEHRTerminologyService - getInstance returns singleton", () => {
  const service1 = OpenEHRTerminologyService.getInstance();
  const service2 = OpenEHRTerminologyService.getInstance();
  assert(service1 === service2, "Should return the same instance");
});

// ===== Initialization Tests =====

Deno.test("OpenEHRTerminologyService - initialize completes without error", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  // Initialize should complete without throwing, even if XML parsing fails
  await service.initialize();
  assert(service !== undefined);
});

// ===== hasTerminology Tests =====

Deno.test("OpenEHRTerminologyService - hasTerminology returns true for openehr", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  // hasTerminology just checks if name is "openehr" (case insensitive)
  assert(service.hasTerminology("openehr"));
  assert(service.hasTerminology("OpenEHR")); // Case insensitive
  assert(service.hasTerminology("OPENEHR")); // Case insensitive
});

Deno.test("OpenEHRTerminologyService - hasTerminology returns false for unknown", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  assert(!service.hasTerminology("snomed"));
  assert(!service.hasTerminology("icd10"));
  assert(!service.hasTerminology("unknown"));
});

// ===== Code Set Tests =====
// Note: These tests handle the case where XML parsing fails and data is empty

Deno.test("OpenEHRTerminologyService - getCodeSet returns undefined for unknown code set", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  const result = service.getCodeSet("unknown_code_set");
  assert(result === undefined);
});

Deno.test("OpenEHRTerminologyService - hasCodeSet returns false for unknown", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  assert(!service.hasCodeSet("nonexistent_code_set"));
});

Deno.test("OpenEHRTerminologyService - getCodeSetIdentifiers returns array", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  const identifiers = service.getCodeSetIdentifiers();
  assert(Array.isArray(identifiers));
  assert(identifiers.includes("compression_algorithms"));
  assert(identifiers.includes("countries"));
});

Deno.test("OpenEHRTerminologyService - getAllCodes returns empty array for unknown", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  const codes = service.getAllCodes("unknown_code_set");
  assert(Array.isArray(codes));
  assertEquals(codes.length, 0);
});

// ===== Terminology Group Tests =====

Deno.test("OpenEHRTerminologyService - getGroup returns undefined for unknown", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  const result = service.getGroup("nonexistent_group");
  assert(result === undefined);
});

Deno.test("OpenEHRTerminologyService - hasGroup returns false for unknown", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  assert(!service.hasGroup("nonexistent_group"));
});

Deno.test("OpenEHRTerminologyService - getGroupIdentifiers returns array", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  const identifiers = service.getGroupIdentifiers();
  assert(Array.isArray(identifiers));
  assert(identifiers.includes("null_flavours"));
});

// ===== Concept Tests =====

Deno.test("OpenEHRTerminologyService - getConceptRubric returns undefined for unknown", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  const result = service.getConceptRubric("unknown_group", "99999");
  assert(result === undefined);
});

Deno.test("OpenEHRTerminologyService - getCodesForGroup returns empty array for unknown", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  const codes = service.getCodesForGroup("nonexistent_group");
  assert(Array.isArray(codes));
  assertEquals(codes.length, 0);
});

// ===== Rubric Lookup Tests =====

Deno.test("OpenEHRTerminologyService - getRubricForCode returns undefined for unknown code", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  const result = service.getRubricForCode("99999999");
  assert(result === undefined);
});

// ===== Group ID By Name Tests =====

Deno.test("OpenEHRTerminologyService - getGroupIdByName returns undefined for unknown", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  const result = service.getGroupIdByName("nonexistent group name");
  assert(result === undefined);
});

Deno.test("OpenEHRTerminologyService - loads code sets from official XML", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  const compression = service.getCodeSet("compression_algorithms");
  assert(compression !== undefined);
  assertEquals(compression.issuer, "openehr");
  assertEquals(compression.name, "compression algorithms");
  assert(compression.codes.some((code) => code.code === "gzip"));

  const countries = service.getCodeSet("countries");
  assert(countries !== undefined);
  const cote = countries.codes.find((code) => code.code === "CI");
  assertEquals(cote?.description, "CÔTE D'IVOIRE");
});

Deno.test("OpenEHRTerminologyService - loads groups and decodes rubric entities", async () => {
  const service = OpenEHRTerminologyService.getInstance();
  await service.initialize();

  const nullFlavours = service.getGroup("null_flavours");
  assert(nullFlavours !== undefined);
  assertEquals(nullFlavours.name, "null flavours");
  assertEquals(
    service.getConceptRubric("null_flavours", "271"),
    "no information",
  );
  assertEquals(service.getRubricForCode("271"), "no information");
  assertEquals(service.getGroupIdByName("null flavours"), "null_flavours");

  const property = service.getGroup("property");
  assert(property !== undefined);
  assertEquals(property.concepts.get("118"), "<not set>");

  const codes = service.getCodesForGroup("null_flavours");
  assert(codes.includes("271"));
  assert(service.getAllCodes("compression_algorithms").includes("deflate"));
});
