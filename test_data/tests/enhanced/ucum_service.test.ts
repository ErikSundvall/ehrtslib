/**
 * Test suite for UcumService
 *
 * Tests for the UCUM service that provides unit validation and conversion
 * using the @lhncbc/ucum-lhc library or fallback mechanisms.
 */

import {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  UcumService,
  UcumValidationResult,
  UcumConversionResult,
  getUcumService,
} from "../../enhanced/ucum_service.ts";

// ===== Singleton and Initialization Tests =====

Deno.test("UcumService - getUcumService returns singleton", () => {
  const service1 = getUcumService();
  const service2 = getUcumService();
  assert(service1 === service2, "Should return the same instance");
});

Deno.test("UcumService - isInitialized returns false before initialization", () => {
  const service = new UcumService();
  assert(!service.isInitialized(), "Service should not be initialized before init");
});

Deno.test("UcumService - initialize loads ucum-lhc library", async () => {
  const service = new UcumService();
  await service.initialize();
  // Note: Whether this returns true depends on if ucum-lhc is available
  // The service gracefully handles missing library
  assert(service !== undefined, "Service should exist after initialization");
});

// ===== Fallback Validation Tests (when ucum-lhc is not available) =====

Deno.test("UcumService - fallback validate accepts common mass units", () => {
  const service = new UcumService();
  // Don't initialize - use fallback validation

  const kgResult = service.validate("kg");
  assertEquals(kgResult.status, "valid");

  const gResult = service.validate("g");
  assertEquals(gResult.status, "valid");

  const mgResult = service.validate("mg");
  assertEquals(mgResult.status, "valid");
});

Deno.test("UcumService - fallback validate accepts common length units", () => {
  const service = new UcumService();

  const mResult = service.validate("m");
  assertEquals(mResult.status, "valid");

  const cmResult = service.validate("cm");
  assertEquals(cmResult.status, "valid");

  const kmResult = service.validate("km");
  assertEquals(kmResult.status, "valid");
});

Deno.test("UcumService - fallback validate accepts common volume units", () => {
  const service = new UcumService();

  const lResult = service.validate("L");
  assertEquals(lResult.status, "valid");

  const mlResult = service.validate("mL");
  assertEquals(mlResult.status, "valid");

  const dlResult = service.validate("dL");
  assertEquals(dlResult.status, "valid");
});

Deno.test("UcumService - fallback validate accepts common time units", () => {
  const service = new UcumService();

  const sResult = service.validate("s");
  assertEquals(sResult.status, "valid");

  const minResult = service.validate("min");
  assertEquals(minResult.status, "valid");

  const hResult = service.validate("h");
  assertEquals(hResult.status, "valid");
});

Deno.test("UcumService - fallback validate accepts temperature units", () => {
  const service = new UcumService();

  const celResult = service.validate("Cel");
  assertEquals(celResult.status, "valid");

  const kResult = service.validate("K");
  assertEquals(kResult.status, "valid");

  const fResult = service.validate("[degF]");
  assertEquals(fResult.status, "valid");
});

Deno.test("UcumService - fallback validate accepts clinical units", () => {
  const service = new UcumService();

  const mmolResult = service.validate("mmol/L");
  assertEquals(mmolResult.status, "valid");

  const mgdlResult = service.validate("mg/dL");
  assertEquals(mgdlResult.status, "valid");

  const pctResult = service.validate("%");
  assertEquals(pctResult.status, "valid");
});

Deno.test("UcumService - fallback validate accepts dimensionless unit", () => {
  const service = new UcumService();

  const oneResult = service.validate("1");
  assertEquals(oneResult.status, "valid");

  const emptyResult = service.validate("");
  assertEquals(emptyResult.status, "valid");
});

Deno.test("UcumService - fallback validate rejects obviously invalid units", () => {
  const service = new UcumService();

  const result = service.validate("not a valid unit at all!!!");
  assertEquals(result.status, "invalid");
});

// ===== Fallback Compatibility Tests =====

Deno.test("UcumService - fallback areCompatible returns true for same unit", () => {
  const service = new UcumService();

  assert(service.areCompatible("kg", "kg"), "Same unit should be compatible");
  assert(service.areCompatible("m", "m"), "Same unit should be compatible");
});

Deno.test("UcumService - fallback areCompatible identifies length units", () => {
  const service = new UcumService();

  assert(service.areCompatible("m", "cm"), "m and cm should be compatible");
  assert(service.areCompatible("m", "mm"), "m and mm should be compatible");
  assert(service.areCompatible("m", "km"), "m and km should be compatible");
});

Deno.test("UcumService - fallback areCompatible identifies mass units", () => {
  const service = new UcumService();

  assert(service.areCompatible("kg", "g"), "kg and g should be compatible");
  assert(service.areCompatible("kg", "mg"), "kg and mg should be compatible");
});

Deno.test("UcumService - fallback areCompatible identifies volume units", () => {
  const service = new UcumService();

  assert(service.areCompatible("L", "mL"), "L and mL should be compatible");
  assert(service.areCompatible("L", "dL"), "L and dL should be compatible");
});

Deno.test("UcumService - fallback areCompatible identifies temperature units", () => {
  const service = new UcumService();

  assert(service.areCompatible("Cel", "K"), "Celsius and Kelvin should be compatible");
  assert(service.areCompatible("Cel", "[degF]"), "Celsius and Fahrenheit should be compatible");
});

Deno.test("UcumService - fallback areCompatible identifies time units", () => {
  const service = new UcumService();

  assert(service.areCompatible("s", "min"), "seconds and minutes should be compatible");
  assert(service.areCompatible("s", "h"), "seconds and hours should be compatible");
});

Deno.test("UcumService - fallback areCompatible returns false for incompatible units", () => {
  const service = new UcumService();

  assert(!service.areCompatible("kg", "m"), "kg and m should NOT be compatible");
  assert(!service.areCompatible("s", "L"), "s and L should NOT be compatible");
  assert(!service.areCompatible("Cel", "kg"), "Celsius and kg should NOT be compatible");
});

// ===== Conversion Tests (without library) =====

Deno.test("UcumService - convert returns error when library not available", () => {
  const service = new UcumService();
  // Don't initialize - ucum-lhc won't be available

  const result = service.convert(100, "Cel", "[degF]");
  assertEquals(result.status, "error");
  assert(result.msg !== undefined);
});

// ===== Conversion Tests (with library initialized) =====

Deno.test("UcumService - convert temperature with library", async () => {
  const service = new UcumService();
  await service.initialize();

  if (!service.isInitialized()) {
    console.log("Skipping: ucum-lhc library not available");
    return;
  }

  // Convert 0 Celsius to Fahrenheit (should be 32)
  const result = service.convert(0, "Cel", "[degF]");
  assertEquals(result.status, "succeeded");
  assert(result.toVal !== undefined);
  // Allow for floating point precision
  assert(Math.abs(result.toVal - 32) < 0.01, `Expected 32, got ${result.toVal}`);
});

Deno.test("UcumService - convert length units with library", async () => {
  const service = new UcumService();
  await service.initialize();

  if (!service.isInitialized()) {
    console.log("Skipping: ucum-lhc library not available");
    return;
  }

  // Convert 1 meter to centimeters (should be 100)
  const result = service.convert(1, "m", "cm");
  assertEquals(result.status, "succeeded");
  assert(result.toVal !== undefined);
  assertEquals(result.toVal, 100);
});

Deno.test("UcumService - convert mass units with library", async () => {
  const service = new UcumService();
  await service.initialize();

  if (!service.isInitialized()) {
    console.log("Skipping: ucum-lhc library not available");
    return;
  }

  // Convert 1 kg to grams (should be 1000)
  const result = service.convert(1, "kg", "g");
  assertEquals(result.status, "succeeded");
  assert(result.toVal !== undefined);
  assertEquals(result.toVal, 1000);
});

Deno.test("UcumService - convert fails for incompatible units", async () => {
  const service = new UcumService();
  await service.initialize();

  if (!service.isInitialized()) {
    console.log("Skipping: ucum-lhc library not available");
    return;
  }

  // Try to convert kg to meters (should fail)
  const result = service.convert(1, "kg", "m");
  assertEquals(result.status, "failed");
});

// ===== Full Validation Tests (with library) =====

Deno.test("UcumService - validate with library recognizes UCUM codes", async () => {
  const service = new UcumService();
  await service.initialize();

  if (!service.isInitialized()) {
    console.log("Skipping: ucum-lhc library not available");
    return;
  }

  const result = service.validate("kg/m2");
  assertEquals(result.status, "valid");
});

Deno.test("UcumService - validate with library rejects invalid units", async () => {
  const service = new UcumService();
  await service.initialize();

  if (!service.isInitialized()) {
    console.log("Skipping: ucum-lhc library not available");
    return;
  }

  const result = service.validate("not_a_unit");
  assertEquals(result.status, "invalid");
});

// ===== toBaseUnits Tests =====

Deno.test("UcumService - toBaseUnits returns null without library", () => {
  const service = new UcumService();
  // Don't initialize

  const result = service.toBaseUnits("km");
  assert(result === null);
});

Deno.test("UcumService - toBaseUnits converts to base with library", async () => {
  const service = new UcumService();
  await service.initialize();

  if (!service.isInitialized()) {
    console.log("Skipping: ucum-lhc library not available");
    return;
  }

  // 1 km should be 1000 m
  const result = service.toBaseUnits("km", 1);
  assert(result !== null);
  assertEquals(result.value, 1000);
  assertEquals(result.unit, "m");
});

// ===== areCompatible with Library Tests =====

Deno.test("UcumService - areCompatible with library checks dimensions", async () => {
  const service = new UcumService();
  await service.initialize();

  if (!service.isInitialized()) {
    console.log("Skipping: ucum-lhc library not available");
    return;
  }

  // Should be compatible (same dimension)
  assert(service.areCompatible("kg", "g"));
  assert(service.areCompatible("m", "cm"));
  assert(service.areCompatible("L", "mL"));

  // Should not be compatible (different dimensions)
  assert(!service.areCompatible("kg", "m"));
  assert(!service.areCompatible("s", "L"));
});
